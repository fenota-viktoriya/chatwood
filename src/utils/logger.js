// src/utils/logger.js
import { config } from "../config/index.js";

// Colors for console logging
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Get configured log level
const LEVEL = config.logging.level || "info";

// Check if the log should be printed
const shouldLog = (level) => LOG_LEVELS[level] <= LOG_LEVELS[LEVEL];

// Get timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message
const formatMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  let color;

  switch (level) {
    case "error":
      color = colors.red;
      break;
    case "warn":
      color = colors.yellow;
      break;
    case "info":
      color = colors.green;
      break;
    case "http":
      color = colors.magenta;
      break;
    case "debug":
      color = colors.cyan;
      break;
    default:
      color = colors.reset;
  }

  const levelUppercase = level.toUpperCase().padEnd(5, " ");

  // Convert meta to string if needed
  let metaStr = "";
  if (Object.keys(meta).length > 0) {
    try {
      metaStr = JSON.stringify(meta);
    } catch (e) {
      metaStr = "[Unable to stringify metadata]";
    }
  }

  console.log(
    `${color}[${timestamp}] [${levelUppercase}]${colors.reset} ${message} ${colors.gray}${metaStr}${colors.reset}`
  );

  // If in production and file logging is configured, log to file as well
  // This is a placeholder - a real implementation would use a logging library
  if (config.logging.file && !config.isDevelopment) {
    // Log to file (simplified implementation)
    // In a real app, use a proper logging library like winston
  }
};

// Logger implementation
const logger = {
  error: (message, meta = {}) => {
    if (shouldLog("error")) {
      if (message instanceof Error) {
        formatMessage("error", message.message, {
          ...meta,
          stack: message.stack,
          name: message.name,
        });
      } else {
        formatMessage("error", message, meta);
      }
    }
  },

  warn: (message, meta = {}) => {
    if (shouldLog("warn")) {
      formatMessage("warn", message, meta);
    }
  },

  info: (message, meta = {}) => {
    if (shouldLog("info")) {
      formatMessage("info", message, meta);
    }
  },

  http: (message, meta = {}) => {
    if (shouldLog("http")) {
      formatMessage("http", message, meta);
    }
  },

  debug: (message, meta = {}) => {
    if (shouldLog("debug")) {
      formatMessage("debug", message, meta);
    }
  },
};

export default logger;
