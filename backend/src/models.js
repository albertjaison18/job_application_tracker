import mongoose from "mongoose";
import { JOB_TYPES, STATUSES, TRANSITIONS, canDelete } from "./rules.js";

const applicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, required: true, immutable: true },
    // Keep the originating company key even when its display name is edited.
    sequenceCompany: {
      type: String,
      required: true,
      immutable: true,
      select: false,
    },
    sequence: { type: Number, required: true, immutable: true, select: false },
    companyName: { type: String, required: true, maxlength: 120 },
    jobRole: { type: String, required: true, maxlength: 160 },
    companyKey: { type: String, required: true, select: false },
    roleKey: { type: String, required: true, select: false },
    active: { type: Boolean, required: true, select: false },
    jobType: { type: String, enum: JOB_TYPES, required: true },
    appliedDate: { type: Date, required: true, immutable: true },
    followUpDate: { type: Date, required: true, immutable: true },
    expectedSalary: { type: Number, min: 0, default: null },
    notes: { type: String, maxlength: 5000, default: "" },
    status: {
      type: String,
      enum: STATUSES,
      default: "Applied",
      required: true,
    },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: STATUSES, required: true },
        changedAt: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true },
);

applicationSchema.index(
  { companyKey: 1, roleKey: 1 },
  {
    unique: true,
    partialFilterExpression: { active: true },
    name: "unique_active_company_role",
  },
);
// Companies sharing their first three letters can share a display ID;
// MongoDB _id remains the unique resource identifier specified by the frontend.
applicationSchema.index({ sequenceCompany: 1, sequence: 1 }, { unique: true });
applicationSchema.index({ status: 1, createdAt: -1 });

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    value: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);

export const Application = mongoose.model("Application", applicationSchema);
export const CompanyCounter = mongoose.model("CompanyCounter", counterSchema);

export function presentApplication(document, currentDay) {
  const value = document.toObject ? document.toObject() : { ...document };
  for (const field of [
    "__v",
    "companyKey",
    "roleKey",
    "active",
    "sequence",
    "sequenceCompany",
  ])
    delete value[field];
  return {
    ...value,
    allowedNextStatuses: TRANSITIONS[value.status],
    canDelete: canDelete(value.status),
    isOverdue:
      value.status === "Applied" &&
      currentDay > new Date(value.followUpDate).toISOString().slice(0, 10),
  };
}
