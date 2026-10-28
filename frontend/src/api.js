const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Unable to reach the server. Check that the backend is running and try again.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The API is unavailable. Check the backend and MongoDB connection.",
    );
  }
  if (!response.ok || !result.success) {
    const error = new Error(
      result.message || "Something went wrong. Please try again.",
    );
    error.errors = result.errors || {};
    error.status = response.status;
    throw error;
  }
  return result.data;
}

export const STATUSES = [
  "Applied",
  "Interview",
  "Offer",
  "Accepted",
  "Declined",
  "Rejected",
];
export const JOB_TYPES = ["Full-time", "Internship", "Contract"];
export const dateLabel = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
export function localDay() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
