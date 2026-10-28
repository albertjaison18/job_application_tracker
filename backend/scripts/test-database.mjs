import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";

export function startTestDatabase() {
  // An explicit cache keeps root and backend npm scripts on the same binary.
  return MongoMemoryServer.create({
    binary: {
      downloadDir: fileURLToPath(
        new URL(
          "../node_modules/.cache/mongodb-memory-server",
          import.meta.url,
        ),
      ),
    },
  });
}
