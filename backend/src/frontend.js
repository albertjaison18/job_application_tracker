import express from "express";
import { existsSync } from "node:fs";
import { join } from "node:path";

export function attachFrontend(app, directory) {
  const index = join(directory, "index.html");
  if (!existsSync(index)) {
    throw new Error(
      "Production frontend bundle is missing. Run npm run build before npm start.",
    );
  }
  app.use(express.static(directory, { index: false }));
  app.use((req, res, next) => {
    const isApi =
      req.path === "/api" ||
      req.path.startsWith("/api/") ||
      req.path === "/health";
    // Browser navigation must reach React, including /applications/:id deep links.
    // JSON API clients can still use the legacy /applications API prefix.
    if (
      req.method === "GET" &&
      !isApi &&
      req.get("Accept")?.includes("text/html")
    ) {
      return res.sendFile(index, { headers: { "Cache-Control": "no-cache" } });
    }
    next();
  });
}
