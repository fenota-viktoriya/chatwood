// src/services/ai/embeddings.js
import OpenAI from "openai";
import axios from "axios";
import { config } from "../../config/index.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../../middleware/errorHandler.js";

// Check for API key
if (!config.openai.apiKey) {
  throw new Error("Missing OpenAI API key. Add it to config.js or .env file.");
}

// Initialize OpenAI SDK
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Get text vector embedding through OpenAI API
 * @param {string} text - Text for vectorization
 * @param {string} model - Embedding model
 * @returns {Promise<Array<number>>} Embedding vector
 */
export async function getTextEmbedding(
  text,
  model = config.openai.embeddingModel
) {
  try {
    if (!text || typeof text !== "string" || text.trim() === "") {
      throw new Error("Text for vectorization cannot be empty");
    }

    logger.debug("Request to get vector", {
      textLength: text.length,
      model,
    });

    // Using SDK
    const response = await openai.embeddings.create({
      input: text,
      model,
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Received incorrect embedding format");
    }

    logger.debug("Vector successfully obtained", {
      vectorLength: embedding.length,
    });

    return embedding;
  } catch (error) {
    logger.error("Error getting vector", { error });

    // Fallback option using axios in case of SDK problems
    if (
      error.message.includes("Unexpected token") ||
      error.message.includes("JSON")
    ) {
      try {
        logger.info("Attempting to get vector through direct API request");

        const axiosResponse = await axios.post(
          "https://api.openai.com/v1/embeddings",
          {
            input: text,
            model,
          },
          {
            headers: {
              Authorization: `Bearer ${config.openai.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        const embedding = axiosResponse.data.data[0]?.embedding;

        if (!embedding || !Array.isArray(embedding)) {
          throw new Error(
            "Received incorrect embedding format from API request"
          );
        }

        logger.debug("Vector successfully obtained via API request", {
          vectorLength: embedding.length,
        });

        return embedding;
      } catch (axiosError) {
        logger.error("Error in fallback vector retrieval method", {
          axiosError,
        });
        throw new AppError(`Fallback method error: ${axiosError.message}`, 500);
      }
    }

    // Handling typical errors
    if (error.message.includes("401")) {
      throw new AppError("Invalid OpenAI API key", 401);
    } else if (error.message.includes("429")) {
      throw new AppError("Request limit to OpenAI exceeded", 429);
    } else if (error.message.includes("500")) {
      throw new AppError("OpenAI server error", 500);
    }

    throw new AppError(`Error retrieving vector: ${error.message}`, 500);
  }
}

export default {
  getTextEmbedding,
};
