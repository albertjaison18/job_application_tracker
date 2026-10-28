// Explicit local QA only: a temporary MongoDB process and API-created fixtures.
// Normal `npm start` never runs this script or inserts sample records.
import mongoose from "mongoose";
import { startTestDatabase } from "./test-database.mjs";
import { createApp } from "../src/app.js";
import { Application, CompanyCounter } from "../src/models.js";

process.env.APP_TIMEZONE = "Asia/Kolkata";
const mongo = await startTestDatabase();
await mongoose.connect(mongo.getUri(), { dbName: "trackr_local_qa" });
await Promise.all([Application.init(), CompanyCounter.init()]);
const server = createApp().listen(5010, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const rows = [
  ["Linear", "Frontend Developer", "Full-time", 12, []],
  ["Stripe", "Product Designer", "Full-time", 9, ["Interview"]],
  ["Notion", "Software Engineer", "Full-time", 8, ["Interview", "Offer"]],
  ["Figma", "Design Engineer", "Contract", 4, ["Interview"]],
  ["Spotify", "Frontend Intern", "Internship", 2, []],
  [
    "Infosys",
    "React Developer",
    "Full-time",
    15,
    ["Interview", "Offer", "Accepted"],
  ],
  ["Acme Studio", "UI Developer", "Contract", 6, ["Rejected"]],
  [
    "Orbit Labs",
    "Web Developer",
    "Full-time",
    11,
    ["Interview", "Offer", "Declined"],
  ],
];
async function send(path, method, body) {
  const response = await fetch(`http://127.0.0.1:5010${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  return result.data;
}
for (const [companyName, jobRole, jobType, daysAgo, statuses] of rows) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  const doc = await send("/applications", "POST", {
    companyName,
    jobRole,
    jobType,
    appliedDate: date.toISOString().slice(0, 10),
    expectedSalary: 850000,
    notes:
      "Local QA fixture. Recruiter conversation and portfolio review are the next steps. Prepare a short walkthrough of recent React projects.",
  });
  for (const status of statuses)
    await send(`/applications/${doc._id}/status`, "PATCH", { status });
}
console.log(
  "LOCAL QA API: http://127.0.0.1:5010 — temporary MongoDB with test fixtures; NOT Atlas. Data is discarded on exit.",
);
async function shutdown() {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
