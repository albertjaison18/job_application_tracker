import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { startTestDatabase } from "../scripts/test-database.mjs";
import request from "supertest";
import { createApp } from "../src/app.js";
import {
  Application,
  CompanyCounter,
  presentApplication,
} from "../src/models.js";
import { STATUSES, TRANSITIONS, today } from "../src/rules.js";
import { connectionUri } from "../src/config.js";

let mongo;
const testServer = createApp().listen(0, "127.0.0.1");
const api = request(testServer);
const input = (overrides = {}) => ({
  companyName: "Infosys",
  jobRole: "Developer",
  jobType: "Full-time",
  appliedDate: "2024-01-01",
  ...overrides,
});
async function create(overrides = {}) {
  const result = await api
    .post("/applications")
    .send(input(overrides))
    .expect(201);
  return result.body.data;
}
async function move(id, status) {
  return api.patch(`/applications/${id}/status`).send({ status }).expect(200);
}

before(async () => {
  // A real temporary MongoDB process; never connects to the user's Atlas database.
  mongo = await startTestDatabase();
  await mongoose.connect(mongo.getUri(), { dbName: "trackr_api_tests" });
  await Promise.all([Application.init(), CompanyCounter.init()]);
});
beforeEach(async () => {
  await Promise.all([
    Application.deleteMany({}),
    CompanyCounter.deleteMany({}),
  ]);
});
after(async () => {
  await new Promise((resolve) => testServer.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("creation generates ID, initial history, follow-up and derived permissions", async () => {
  const doc = await create();
  assert.equal(doc.applicationId, "JA-INF-001");
  assert.equal(doc.status, "Applied");
  assert.equal(doc.followUpDate, "2024-01-08T00:00:00.000Z");
  assert.equal(doc.isOverdue, true);
  assert.equal(doc.canDelete, true);
  assert.deepEqual(doc.allowedNextStatuses, ["Interview", "Rejected"]);
  assert.equal(doc.statusHistory[0].status, "Applied");
  assert.ok(Number.isFinite(Date.parse(doc.statusHistory[0].changedAt)));
  assert.equal(doc.companyKey, undefined);
});

test("required fields, invalid dates, future dates and unsupported job types are rejected", async () => {
  for (const body of [
    {},
    input({ appliedDate: "2999-01-01" }),
    input({ appliedDate: "2024-02-30" }),
    input({ jobType: "Remote" }),
    input({ expectedSalary: -1 }),
    input({ companyName: { $ne: "" } }),
  ]) {
    const result = await api.post("/applications").send(body).expect(400);
    assert.equal(result.body.success, false);
    assert.equal(result.body.data, null);
  }
  const doc = await create({ appliedDate: today() });
  assert.equal(doc.isOverdue, false);
});

test("clients cannot set server-controlled creation fields", async () => {
  for (const value of [
    { applicationId: "JA-FAKE-999" },
    { status: "Accepted" },
    { followUpDate: "2024-01-02" },
    { active: false },
    { statusHistory: [] },
  ]) {
    await api.post("/applications").send(input(value)).expect(400);
  }
});

test("company counters are case insensitive, independent, and survive deletion", async () => {
  const first = await create();
  const second = await create({
    companyName: " infosys ",
    jobRole: "Designer",
  });
  const other = await create({ companyName: "Acme" });
  assert.equal(second.applicationId, "JA-INF-002");
  assert.equal(other.applicationId, "JA-ACM-001");
  await api.delete(`/applications/${first._id}`).expect(200);
  assert.equal((await create()).applicationId, "JA-INF-003");
});

test("concurrent requests receive different company sequence numbers", async () => {
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      api.post("/applications").send(input({ jobRole: `Role ${index}` })),
    ),
  );
  assert.ok(results.every((result) => result.status === 201));
  assert.equal(
    new Set(results.map((result) => result.body.data.applicationId)).size,
    10,
  );
});

test("active duplicates return 409, including simultaneous submissions", async () => {
  const results = await Promise.all(
    Array.from({ length: 5 }, () => api.post("/applications").send(input())),
  );
  assert.equal(results.filter((result) => result.status === 201).length, 1);
  assert.equal(results.filter((result) => result.status === 409).length, 4);
  const first = results.find((result) => result.status === 201).body.data;
  await api
    .post("/applications")
    .send(input({ companyName: "  INFOSYS ", jobRole: " developer " }))
    .expect(409);
  await move(first._id, "Interview");
  await api.post("/applications").send(input()).expect(409);
  await move(first._id, "Offer");
  await api.post("/applications").send(input()).expect(409);
  await move(first._id, "Accepted");
  await create();
});

test("every permitted and forbidden workflow edge is enforced and history is persisted", async () => {
  const paths = {
    Applied: [],
    Interview: ["Interview"],
    Offer: ["Interview", "Offer"],
    Rejected: ["Rejected"],
    Accepted: ["Interview", "Offer", "Accepted"],
    Declined: ["Interview", "Offer", "Declined"],
  };
  let index = 0;
  for (const from of STATUSES) {
    for (const to of STATUSES) {
      const doc = await create({ jobRole: `Workflow ${index++}` });
      for (const status of paths[from]) await move(doc._id, status);
      const allowed = TRANSITIONS[from].includes(to);
      const result = await api
        .put(`/applications/${doc._id}`)
        .send({ status: to })
        .expect(allowed ? 200 : 400);
      if (allowed) {
        assert.equal(result.body.data.status, to);
        assert.equal(
          result.body.data.statusHistory.length,
          paths[from].length + 2,
        );
        assert.equal(result.body.data.isOverdue, false);
      }
      const saved = (await api.get(`/applications/${doc._id}`).expect(200)).body
        .data;
      assert.equal(
        saved.statusHistory.length,
        paths[from].length + (allowed ? 2 : 1),
      );
    }
  }
});

test("editing preserves application ID and date, and rejects duplicate target identities", async () => {
  const original = await create();
  await create({ companyName: "Acme", jobRole: "Engineer" });
  await api
    .put(`/applications/${original._id}`)
    .send({ companyName: " ACME ", jobRole: "engineer" })
    .expect(409);
  const result = await api
    .put(`/applications/${original._id}`)
    .send({
      companyName: "Renamed",
      jobRole: "Senior Developer",
      jobType: "Contract",
      expectedSalary: 75000,
      notes: "Call recruiter",
    })
    .expect(200);
  assert.equal(result.body.data.applicationId, original.applicationId);
  assert.equal(result.body.data.appliedDate, original.appliedDate);
  assert.equal(result.body.data.notes, "Call recruiter");
  for (const body of [
    { applicationId: "JA-NEW-111" },
    { appliedDate: "2024-01-02" },
    { statusHistory: [] },
    { companyKey: "override" },
  ]) {
    await api.put(`/applications/${original._id}`).send(body).expect(400);
  }
});

test("backend search escapes regex characters and combines company and status", async () => {
  const first = await create({ companyName: "A+B" });
  await create({ companyName: "AAAB" });
  await move(first._id, "Interview");
  const results = await api
    .get("/applications")
    .query({ company: "a+b", status: "Interview" })
    .expect(200);
  assert.equal(results.body.data.length, 1);
  assert.equal(results.body.data[0]._id, first._id);
  await api.get("/applications").query({ status: "unknown" }).expect(400);
  const stats = await api.get("/applications/stats").expect(200);
  assert.equal(stats.body.data.Interview, 1);
  assert.equal(stats.body.data.Applied, 1);
  assert.equal(stats.body.data.Accepted, 0);
});

test("delete is blocked in Interview and Offer, allowed in Applied and every final status", async () => {
  const paths = {
    Applied: [],
    Interview: ["Interview"],
    Offer: ["Interview", "Offer"],
    Rejected: ["Rejected"],
    Accepted: ["Interview", "Offer", "Accepted"],
    Declined: ["Interview", "Offer", "Declined"],
  };
  for (const status of STATUSES) {
    const doc = await create({ jobRole: `Delete ${status}` });
    for (const next of paths[status]) await move(doc._id, next);
    const allowed = !["Interview", "Offer"].includes(status);
    const details = await api.get(`/applications/${doc._id}`).expect(200);
    assert.equal(details.body.data.canDelete, allowed);
    await api.delete(`/applications/${doc._id}`).expect(allowed ? 200 : 400);
    await api.get(`/applications/${doc._id}`).expect(allowed ? 404 : 200);
  }
});

test("concurrent status changes do not overwrite history or violate workflow", async () => {
  const doc = await create();
  const results = await Promise.all(
    ["Interview", "Rejected"].map((status) =>
      api.put(`/applications/${doc._id}`).send({ status }),
    ),
  );
  assert.ok(results.every((result) => [200, 400, 409].includes(result.status)));
  const saved = (await api.get(`/applications/${doc._id}`).expect(200)).body
    .data;
  const history = saved.statusHistory.map((entry) => entry.status);
  for (let index = 1; index < history.length; index++)
    assert.ok(TRANSITIONS[history[index - 1]].includes(history[index]));
  assert.equal(
    history.length,
    1 + results.filter((result) => result.status === 200).length,
  );
});

test("malformed JSON, bad IDs, unknown resources and CORS use the JSON envelope", async () => {
  for (const response of [
    await api
      .post("/applications")
      .set("Content-Type", "application/json")
      .send("{broken")
      .expect(400),
    await api.get("/applications/not-an-id").expect(400),
    await api.get(`/applications/${new mongoose.Types.ObjectId()}`).expect(404),
    await api.get("/unknown").expect(404),
    await api
      .get("/applications")
      .set("Origin", "https://unknown.example")
      .expect(400),
  ]) {
    assert.equal(response.body.success, false);
    assert.equal(response.body.data, null);
    assert.equal(typeof response.body.message, "string");
  }
  await api.get("/api/applications").expect(200);
  await api.get("/health").expect(200);
  await api
    .post("/applications")
    .set("Origin", "http://127.0.0.1:5178")
    .send(input())
    .expect(201);
});

test("overdue starts after the follow-up calendar day and disappears outside Applied", async () => {
  const doc = await create();
  assert.equal(presentApplication(doc, "2024-01-08").isOverdue, false);
  assert.equal(presentApplication(doc, "2024-01-09").isOverdue, true);
  assert.equal(
    presentApplication({ ...doc, status: "Interview" }, "2024-01-09").isOverdue,
    false,
  );
});

test("separate database passwords are URL-encoded and placeholders are rejected", () => {
  const rawPassword = "test@:/?#%";
  const env = {
    MONGODB_URI:
      "mongodb+srv://exam@cluster.example.net/job_application_tracker",
    MONGODB_PASSWORD: rawPassword,
  };
  const uri = new URL(connectionUri(env));
  assert.equal(decodeURIComponent(uri.password), rawPassword);
  assert.equal(uri.hostname, "cluster.example.net");
  const multiHost =
    "mongodb://exam@first.example.net:27017,second.example.net:27017/job_application_tracker?ssl=true&authSource=admin";
  assert.equal(
    connectionUri({ ...env, MONGODB_URI: multiHost }),
    multiHost.replace("exam@", `exam:${encodeURIComponent(rawPassword)}@`),
  );
  assert.throws(
    () =>
      connectionUri({ ...env, MONGODB_PASSWORD: "PASTE_TEST_PASSWORD_HERE" }),
    /Set MONGODB_PASSWORD/,
  );
});
