// src/services/ai/openai.js
import OpenAI from "openai";
import { config } from "../../config/index.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../middleware/errorHandler.js";

// Check for API key
if (!config.openai.apiKey) {
  throw new Error("Missing OpenAI API key. Add it to config.js or .env file.");
}

// Initialize OpenAI SDK
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Generate response using OpenAI
 * @param {string} userQuery - User query
 * @param {string} context - Context from knowledge base
 * @param {Object} options - Additional parameters
 * @returns {Promise<string>} Response from AI
 */
export async function generateCompletion(userQuery, context, options = {}) {
  const {
    model = config.openai.completionModel,
    temperature = config.openai.temperature,
    maxTokens = config.openai.maxTokens,
  } = options;

  logger.debug("Request to OpenAI", { userQuery, model, temperature });

  try {
    if (!userQuery || userQuery.trim() === "") {
      return "Please enter your question.";
    }

    const systemPrompt = `
    You are an intelligent assistant who helps users get answers to their questions.
    Use the provided information from the knowledge base for your response, but if it doesn't contain 
    the necessary data, provide a useful general answer.

    📌 **Context from knowledge base:** 
    "${context || "Context is missing"}"

    🎯 **Your response should be:** 
    - Clear and logical.
    - Use information from the context if it contains relevant data.
    - If the information doesn't contain the answer, explain the topic in general.
    - Don't make up answers if you don't have enough information.

    ℹ️ Respond in Ukrainian language, be concise and to the point.
    `;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const response =
      completion.choices[0]?.message?.content || "Response not received";

    logger.debug("Response from OpenAI", {
      responseLength: response.length,
      model,
    });

    return response;
  } catch (error) {
    logger.error("Error interacting with OpenAI", { error });

    if (error.response) {
      logger.error("OpenAI error details", {
        status: error.response.status,
        data: error.response.data,
      });
    }

    // Handle common errors
    if (error.message.includes("401")) {
      throw new AppError("Invalid OpenAI API key", 401);
    } else if (error.message.includes("429")) {
      throw new AppError("Request limit to OpenAI exceeded", 429);
    } else if (error.message.includes("500")) {
      throw new AppError("OpenAI server error", 500);
    }

    throw new AppError(`Error generating text: ${error.message}`, 500);
  }
}

export default {
  generateCompletion,
};
