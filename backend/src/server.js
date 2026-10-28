import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { Application, CompanyCounter } from "./models.js";
import { connectionUri } from "./config.js";

dotenv.config({
  path: fileURLToPath(new URL("../.env.local", import.meta.url)),
  quiet: true,
});
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});

async function start() {
  const uri = connectionUri();
  // Validate the configured timezone before accepting requests.
  new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  }).format();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([Application.init(), CompanyCounter.init()]);
  const server = createApp().listen(Number(process.env.PORT || 5010), () =>
    console.log(`Trackr API listening on port ${process.env.PORT || 5010}`),
  );
  const shutdown = () =>
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

start().catch(async (error) => {
  // Do not print a URI, credentials, or raw connection errors.
  console.error(
    error.message.startsWith("Set MONGODB_")
      ? error.message
      : `Backend startup failed (${error.name}). Check your Atlas URI, database user and network access settings.`,
  );
  await mongoose.disconnect();
  process.exitCode = 1;
});
