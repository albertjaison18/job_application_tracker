import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import { attachFrontend } from "./frontend.js";
import { Application, CompanyCounter, presentApplication } from "./models.js";
import {
  ApiError,
  STATUSES,
  TRANSITIONS,
  canDelete,
  isActive,
  normalize,
  today,
  validateInput,
} from "./rules.js";

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data });
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const duplicateMessage =
  "An active application already exists for this company and job role.";

async function nextSequence(companyKey) {
  // Atomic increments protect sequences across concurrent requests and servers.
  // Retry the rare first-upsert collision on the counter's unique _id.
  try {
    return (
      await CompanyCounter.findOneAndUpdate(
        { _id: companyKey },
        { $inc: { value: 1 } },
        { upsert: true, returnDocument: "after" },
      )
    ).value;
  } catch (error) {
    if (error.code !== 11000) throw error;
    return (
      await CompanyCounter.findOneAndUpdate(
        { _id: companyKey },
        { $inc: { value: 1 } },
        { returnDocument: "after" },
      )
    ).value;
  }
}

export function createApp({
  serveFrontend = process.env.NODE_ENV === "production",
  frontendDirectory = fileURLToPath(
    new URL("../../frontend/dist/", import.meta.url),
  ),
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  const origins = [
    ...(
      process.env.CLIENT_ORIGIN || "http://localhost:5178,http://127.0.0.1:5178"
    ).split(","),
    process.env.RENDER_EXTERNAL_URL,
    process.env.PUBLIC_APP_URL,
  ]
    .filter(Boolean)
    .map((origin) => origin.trim().replace(/\/$/, ""));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.includes(origin)) return callback(null, true);
        callback(
          new ApiError(
            400,
            "This frontend origin is not allowed. Configure CLIENT_ORIGIN on the backend.",
          ),
        );
      },
    }),
  );
  app.use(express.json({ limit: "64kb" }));
  app.get("/health", (req, res) =>
    respond(
      res,
      mongoose.connection.readyState === 1 ? 200 : 503,
      mongoose.connection.readyState === 1
        ? "API and MongoDB are ready."
        : "MongoDB is unavailable.",
      { databaseConnected: mongoose.connection.readyState === 1 },
    ),
  );

  const router = express.Router();
  router.get("/stats", async (req, res) => {
    const rows = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
    for (const row of rows) counts[row._id] = row.count;
    respond(res, 200, "Application counts loaded.", counts);
  });
  router.get("/", async (req, res) => {
    const query = {};
    if (req.query.status) {
      if (
        typeof req.query.status !== "string" ||
        !STATUSES.includes(req.query.status)
      )
        throw new ApiError(400, "Invalid status filter.");
      query.status = req.query.status;
    }
    if (req.query.company) {
      if (
        typeof req.query.company !== "string" ||
        req.query.company.length > 120
      )
        throw new ApiError(
          400,
          "Company search must be text of at most 120 characters.",
        );
      query.companyName = {
        $regex: escapeRegex(req.query.company.trim()),
        $options: "i",
      };
    }
    const applications = await Application.find(query).sort({
      createdAt: -1,
      _id: -1,
    });
    const day = today();
    respond(
      res,
      200,
      "Applications loaded.",
      applications.map((doc) => presentApplication(doc, day)),
    );
  });
  router.post("/", async (req, res) => {
    const values = validateInput(req.body, { creating: true });
    const companyKey = normalize(values.companyName);
    const roleKey = normalize(values.jobRole);
    if (await Application.exists({ companyKey, roleKey, active: true }))
      throw new ApiError(409, duplicateMessage);
    const sequence = await nextSequence(companyKey);
    const prefix = values.companyName
      .replace(/\s/g, "")
      .slice(0, 3)
      .toUpperCase();
    const followUpDate = new Date(values.appliedDate);
    followUpDate.setUTCDate(followUpDate.getUTCDate() + 7);
    const doc = await Application.create({
      ...values,
      companyKey,
      roleKey,
      active: true,
      applicationId: `JA-${prefix}-${String(sequence).padStart(3, "0")}`,
      sequenceCompany: companyKey,
      sequence,
      followUpDate,
      status: "Applied",
      statusHistory: [{ status: "Applied", changedAt: new Date() }],
    });
    respond(res, 201, "Application created.", presentApplication(doc, today()));
  });
  router.param("id", (req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id))
      return next(new ApiError(400, "Invalid application ID."));
    next();
  });
  router.get("/:id", async (req, res) => {
    const doc = await Application.findById(req.params.id);
    if (!doc) throw new ApiError(404, "Application not found.");
    respond(res, 200, "Application loaded.", presentApplication(doc, today()));
  });
  const update = async (req, res) => {
    const values = validateInput(req.body);
    if (
      req.method === "PATCH" &&
      Object.keys(values).some((key) => key !== "status")
    )
      throw new ApiError(400, "The status endpoint accepts only status.");
    const current = await Application.findById(req.params.id);
    if (!current) throw new ApiError(404, "Application not found.");
    const changes = { ...values };
    const mutation = { $set: changes, $inc: { __v: 1 } };
    if (values.status !== undefined) {
      if (!TRANSITIONS[current.status].includes(values.status)) {
        const options = TRANSITIONS[current.status];
        throw new ApiError(
          400,
          options.length
            ? `Cannot change ${current.status} to ${values.status}. Allowed next statuses: ${options.join(", ")}.`
            : `${current.status} is a final status and cannot be changed.`,
          { status: "Invalid status transition." },
        );
      }
      changes.active = isActive(values.status);
      mutation.$push = {
        statusHistory: { status: values.status, changedAt: new Date() },
      };
    }
    if (values.companyName !== undefined)
      changes.companyKey = normalize(values.companyName);
    if (values.jobRole !== undefined)
      changes.roleKey = normalize(values.jobRole);
    // A version check prevents edits/status changes overwriting concurrent work.
    const doc = await Application.findOneAndUpdate(
      { _id: current._id, __v: current.__v },
      mutation,
      { returnDocument: "after", runValidators: true },
    );
    if (!doc)
      throw new ApiError(
        409,
        "This application changed while you were editing. Refresh and try again.",
      );
    respond(res, 200, "Application updated.", presentApplication(doc, today()));
  };
  router.put("/:id", update);
  router.patch("/:id/status", update);
  router.delete("/:id", async (req, res) => {
    const current = await Application.findById(req.params.id);
    if (!current) throw new ApiError(404, "Application not found.");
    if (!canDelete(current.status))
      throw new ApiError(
        400,
        `Cannot delete an application in ${current.status} status.`,
      );
    const result = await Application.deleteOne({
      _id: current._id,
      __v: current.__v,
    });
    if (!result.deletedCount)
      throw new ApiError(
        409,
        "This application changed. Refresh before deleting.",
      );
    respond(res, 200, "Application deleted.");
  });
  if (serveFrontend) attachFrontend(app, frontendDirectory);
  app.use("/applications", router);
  app.use("/api/applications", router);
  app.use((req, res) => respond(res, 404, "API endpoint not found."));
  app.use((error, req, res, next) => {
    if (error.code === 11000) return respond(res, 409, duplicateMessage);
    if (error.type === "entity.parse.failed")
      return respond(res, 400, "Request body must be valid JSON.");
    if (error.type === "entity.too.large")
      return respond(res, 400, "Request body is too large.");
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        data: null,
        errors: Object.fromEntries(
          Object.entries(error.errors).map(([key, value]) => [
            key,
            value.message,
          ]),
        ),
      });
    }
    const status = error.status || 500;
    if (status >= 500) console.error("API request failed:", error.name);
    res.status(status).json({
      success: false,
      message:
        status >= 500
          ? "Unexpected server error. Please try again."
          : error.message,
      data: null,
      ...(error.errors ? { errors: error.errors } : {}),
    });
  });
  return app;
}
