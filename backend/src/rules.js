export const TRANSITIONS = Object.freeze({
  Applied: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Accepted", "Declined"],
  Rejected: [],
  Accepted: [],
  Declined: [],
});
export const STATUSES = Object.keys(TRANSITIONS);
export const FINAL_STATUSES = ["Rejected", "Accepted", "Declined"];
export const JOB_TYPES = ["Full-time", "Internship", "Contract"];
export const isActive = (status) => !FINAL_STATUSES.includes(status);
export const canDelete = (status) => status === "Applied" || !isActive(status);
export const normalize = (value) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

export function today(timezone = process.env.APP_TIMEZONE || "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (name) => parts.find((p) => p.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function validateInput(body, { creating = false } = {}) {
  if (!body || Array.isArray(body) || typeof body !== "object") {
    throw new ApiError(400, "Send a JSON object.");
  }
  const allowed = [
    "companyName",
    "jobRole",
    "jobType",
    "expectedSalary",
    "notes",
    creating ? "appliedDate" : "status",
  ];
  const errors = {};
  for (const field of Object.keys(body)) {
    if (!allowed.includes(field))
      errors[field] = `${field} cannot be set or edited.`;
  }
  const values = {};
  for (const [field, limit] of [
    ["companyName", 120],
    ["jobRole", 160],
    ["notes", 5000],
  ]) {
    const value = body[field];
    const required = field !== "notes";
    if (value === undefined && (!creating || !required)) continue;
    if (
      typeof value !== "string" ||
      (required && !value.trim()) ||
      value.trim().length > limit
    ) {
      errors[field] =
        `${field} must be ${required ? "non-empty text" : "text"} of at most ${limit} characters.`;
    } else
      values[field] =
        field === "notes" ? value.trim() : value.trim().replace(/\s+/g, " ");
  }
  if (creating || body.jobType !== undefined) {
    if (!JOB_TYPES.includes(body.jobType))
      errors.jobType = `Choose ${JOB_TYPES.join(", ")}.`;
    else values.jobType = body.jobType;
  }
  if (body.expectedSalary !== undefined) {
    const salary = body.expectedSalary;
    if (salary === null || salary === "") values.expectedSalary = null;
    else if (
      typeof salary !== "number" ||
      !Number.isFinite(salary) ||
      salary < 0
    )
      errors.expectedSalary = "Expected salary must be a non-negative number.";
    else values.expectedSalary = salary;
  }
  if (creating) {
    const value = body.appliedDate;
    const date =
      typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00.000Z`)
        : new Date(NaN);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    )
      errors.appliedDate = "Enter a valid applied date (YYYY-MM-DD).";
    else if (value > today())
      errors.appliedDate = "Applied date cannot be in the future.";
    else values.appliedDate = date;
  }
  if (!creating && body.status !== undefined) {
    if (!STATUSES.includes(body.status))
      errors.status = "Choose a valid application status.";
    else values.status = body.status;
  }
  if (Object.keys(errors).length)
    throw new ApiError(400, "Please correct the highlighted fields.", errors);
  if (!creating && !Object.keys(values).length)
    throw new ApiError(400, "Provide at least one editable field.");
  return values;
}
