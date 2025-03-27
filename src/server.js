// src/server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import webhookRoutes from "./routes/webhook.js";
import errorHandler from "../middleware/errorHandler.js";
import logger from "./utils/logger.js";
import { config } from "./config/index.js";

// Get dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyProjectDocuments() {
  const docsDirectory = path.join(__dirname, "../docs");
  try {
    await fs.mkdir(docsDirectory, { recursive: true });

    const filesToCopy = [
      "README.md",
      "copyOfLogs.txt",
      "copyOfPublisherGuideForAdmins.txt",
      "copyOfRTB.txt",
      "profileSetup.txt",
    ];

    for (const file of filesToCopy) {
      const sourceFilePath = path.join(__dirname, "..", file);
      const targetFilePath = path.join(docsDirectory, file);

      try {
        await fs.access(sourceFilePath);
      } catch (err) {
        logger.warn(`Source file ${file} does not exist, skipping`);
        continue;
      }

      try {
        await fs.access(targetFilePath);
        logger.info(`File ${file} already exists in docs directory, skipping`);
      } catch (err) {
        try {
          await fs.copyFile(sourceFilePath, targetFilePath);
          logger.info(`Copied ${file} to docs directory`);
        } catch (copyErr) {
          logger.error(`Error copying ${file}: ${copyErr.message}`);
        }
      }
    }

    logger.info("Document copying process completed");
  } catch (error) {
    logger.error(`Error preparing document directory: ${error.message}`);
  }
}

// Initialize express app
const app = express();
const PORT = config.serverPort || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve all static files except index.html
app.use(
  express.static(path.join(__dirname, "../public"), {
    index: false,
  })
);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api", webhookRoutes);

// Main route for web interface
app.get("/", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../public", "index.html");
    let html = await fs.readFile(filePath, "utf-8");

    const { widgetToken, baseUrl } = config.chatwoot;

    if (!widgetToken || !baseUrl) {
      logger.error("Chatwoot token or base URL is missing in config");
      return res.status(500).send("Chatwoot configuration missing");
    }

    html = html
      .replaceAll("{{CHATWOOT_WIDGET_TOKEN}}", widgetToken)
      .replaceAll("{{CHATWOOT_BASE_URL}}", baseUrl);

    res.send(html);
  } catch (err) {
    logger.error(`Error loading index.html: ${err.message}`);
    res.status(500).send("Internal Server Error");
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Error handling middleware
app.use(errorHandler);

// Start the server after copying the documents
async function startServer() {
  try {
    // Copy documents before starting the server
    await copyProjectDocuments();

    // start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Access the application at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// start server
startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled Rejection:", error);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  // Give the logger time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

export default app;
