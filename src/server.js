// src/server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import webhookRoutes from "./routes/webhook.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import { config } from "./config/index.js";

// Get dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функція копіювання документів з проекту в папку docs
async function copyProjectDocuments() {
  const docsDirectory = path.join(__dirname, "../docs");
  try {
    // Створюємо директорію docs, якщо вона не існує
    await fs.mkdir(docsDirectory, { recursive: true });

    // Файли, які треба скопіювати
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

      // Перевіряємо чи існує файл у вихідній директорії
      try {
        await fs.access(sourceFilePath);
      } catch (err) {
        logger.warn(`Source file ${file} does not exist, skipping`);
        continue;
      }

      // Перевіряємо чи існує вже файл у цільовій директорії
      try {
        await fs.access(targetFilePath);
        logger.info(`File ${file} already exists in docs directory, skipping`);
      } catch (err) {
        // Файл не існує, можна копіювати
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
app.use(express.static(path.join(__dirname, "../public")));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api", webhookRoutes);

// Main route for web interface
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Error handling middleware
app.use(errorHandler);

// Запускаємо сервер після копіювання документів
async function startServer() {
  try {
    // Копіюємо документи перед запуском сервера
    await copyProjectDocuments();

    // Запускаємо сервер
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Access the application at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Запускаємо сервер
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
