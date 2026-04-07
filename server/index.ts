import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Determine static file path - try multiple locations
  let staticPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(staticPath)) {
    staticPath = path.resolve(__dirname, "..", "dist", "public");
  }
  if (!fs.existsSync(staticPath)) {
    staticPath = path.resolve(__dirname, "..");
  }

  // Serve static files with proper MIME types
  app.use(
    express.static(staticPath, {
      maxAge: "1y",
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript");
        } else if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        }
      },
    })
  );

  // Return 404 for asset requests that weren't found by static middleware
  app.use("/assets", (_req, res) => {
    res.status(404).send("Asset not found");
  });

  // Handle client-side routing - serve index.html for all non-asset routes
  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send("index.html not found");
    }
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Serving static files from: ${staticPath}`);
  });
}

startServer().catch(console.error);
