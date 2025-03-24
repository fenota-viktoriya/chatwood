// middleware/errorHandler.js
import logger from "../src/utils/logger.js";
import { config } from "../src/config/index.js";

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error classifier
 * @param {Error} err - Error object
 * @returns {boolean} - True if error is operational
 */
const isOperationalError = (err) => {
  if (err instanceof AppError) {
    return err.isOperational;
  }

  // Consider some other errors as operational
  const operationalErrorTypes = ["SyntaxError", "ReferenceError", "TypeError"];

  return operationalErrorTypes.includes(err.name);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(err);

  // Set default status code
  const statusCode = err.statusCode || 500;

  // Prepare error response
  const errorResponse = {
    status: "error",
    message: err.message || "Internal Server Error",
  };

  // Add stack trace in development
  if (config.isDevelopment) {
    errorResponse.stack = err.stack;
  }

  // Send response
  res.status(statusCode).json(errorResponse);

  // If error is not operational, exit process (consider using process manager)
  if (!isOperationalError(err) && !config.isDevelopment) {
    // Give some time for logging
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

export default errorHandler;
