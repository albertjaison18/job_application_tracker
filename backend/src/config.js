export function connectionUri(env = process.env) {
  const configured = env.MONGODB_URI;
  if (
    !configured ||
    configured.includes("YOUR_TEST_CLUSTER") ||
    configured.includes("dummy_password")
  ) {
    throw new Error(
      "Set MONGODB_URI to your test Atlas connection in backend/.env.local (or the submission .env).",
    );
  }
  // The WHATWG URL parser cannot parse standard MongoDB multi-host URIs.
  // Replace only the user-info section and leave the driver-specific hosts intact.
  const credentials = configured.match(/^(mongodb(?:\+srv)?:\/\/)([^/@]+)@/);
  if (!credentials) {
    throw new Error(
      "Set MONGODB_URI to an Atlas URI containing the database username.",
    );
  }
  if (env.MONGODB_PASSWORD) {
    if (env.MONGODB_PASSWORD === "PASTE_TEST_PASSWORD_HERE") {
      throw new Error(
        "Set MONGODB_PASSWORD in backend/.env.local to the test database password you created.",
      );
    }
    const username = credentials[2].split(":")[0];
    return `${credentials[1]}${username}:${encodeURIComponent(env.MONGODB_PASSWORD)}@${configured.slice(credentials[0].length)}`;
  }
  if (!credentials[2].includes(":") || credentials[2].endsWith(":")) {
    throw new Error(
      "Set MONGODB_PASSWORD in backend/.env.local, or include a URL-encoded password in MONGODB_URI.",
    );
  }
  return configured;
}
