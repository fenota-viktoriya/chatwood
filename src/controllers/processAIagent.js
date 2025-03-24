// src/controllers/processAIagent.js
import { getTextEmbedding } from "../services/ai/embeddings.js";
import { generateCompletion } from "../services/ai/openai.js";
import { searchSimilarDocuments } from "../services/chroma/search.js";
import logger from "../utils/logger.js";
import { AppError } from "../../middleware/errorHandler.js";

/**
 * Process user request through AI
 * @param {string} userQuery - User request
 * @param {Object} options - Additional parameters
 * @returns {Promise<string>} Response from AI
 */
export async function processAIagent(userQuery, options = {}) {
  try {
    logger.info("Received user request", {
      query: userQuery,
      options,
    });

    if (!userQuery || userQuery.trim() === "") {
      return "Please enter your question.";
    }

    // Get query vector
    logger.debug("Generating vector for user query");
    const queryEmbedding = await getTextEmbedding(userQuery);

    // Search for relevant documents
    logger.debug("Searching for relevant documents");
    const relevantDocs = await searchSimilarDocuments(
      userQuery,
      queryEmbedding
    );

    if (!relevantDocs || relevantDocs === "Sorry, no relevant results found.") {
      logger.info("No relevant documents found, generating general response");
      return await generateCompletion(userQuery, "");
    }

    // Generate response with context
    logger.debug("Generating response with context");
    const aiResponse = await generateCompletion(
      userQuery,
      relevantDocs,
      options
    );

    return aiResponse;
  } catch (error) {
    logger.error("Error processing AI request", { error });

    // Providing understandable response to the user
    if (error instanceof AppError) {
      if (error.statusCode === 401) {
        return "There was a problem with AI service authentication. Please contact the administrator.";
      } else if (error.statusCode === 429) {
        return "The AI service request limit has been exceeded. Please try again later.";
      }
    }

    return `Sorry, an error occurred while processing your request. ${error.message}`;
  }
}

/**
 * Process user text message
 * @param {string} message - User message
 * @returns {Promise<string>} Processing result
 */
export async function processUserMessage(message) {
  try {
    if (!message || message.trim() === "") {
      return "Please enter your question.";
    }

    // Get vector
    const queryEmbedding = await getTextEmbedding(message);

    // Search for relevant documents
    const results = await searchSimilarDocuments(message, queryEmbedding);

    return results;
  } catch (error) {
    logger.error("Error processing user message", { error });
    return "An error occurred during the search.";
  }
}

export default {
  processAIagent,
  processUserMessage,
};
