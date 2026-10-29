import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiHandler from "./api/index.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse json and url-encoded payloads
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Route any requests starting with /api to our Vercel-style handler inside api/index.ts
  app.all("/api/*", async (req, res) => {
    try {
      // Direct integration with the API handler
      await apiHandler(req as any, res as any);
    } catch (err: any) {
      console.error("API Error in Express proxy handler:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error in API proxy" });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve index.html or build artifacts
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
