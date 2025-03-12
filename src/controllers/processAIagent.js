// src/controllers/processAIagent.js
import { getTextEmbedding } from "../services/ai/embeddings.js";
import { generateCompletion } from "../services/ai/openai.js";
import { searchSimilarDocuments } from "../services/chroma/search.js";
import logger from "../utils/logger.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Обробка запиту користувача через AI
 * @param {string} userQuery - Запит користувача
 * @param {Object} options - Додаткові параметри
 * @returns {Promise<string>} Відповідь від AI
 */
export async function processAIagent(userQuery, options = {}) {
  try {
    logger.info("Отримано запит користувача", {
      query: userQuery,
      options,
    });

    if (!userQuery || userQuery.trim() === "") {
      return "Будь ласка, введіть ваше питання.";
    }

    // Отримання вектору запиту
    logger.debug("Генерація вектору для запиту користувача");
    const queryEmbedding = await getTextEmbedding(userQuery);

    // Пошук релевантних документів
    logger.debug("Пошук релевантних документів");
    const relevantDocs = await searchSimilarDocuments(
      userQuery,
      queryEmbedding
    );

    if (
      !relevantDocs ||
      relevantDocs === "Вибачте, не знайдено відповідних результатів."
    ) {
      logger.info(
        "Не знайдено релевантних документів, генерую загальну відповідь"
      );
      return await generateCompletion(userQuery, "");
    }

    // Генерація відповіді з контекстом
    logger.debug("Генерація відповіді з контекстом");
    const aiResponse = await generateCompletion(
      userQuery,
      relevantDocs,
      options
    );

    return aiResponse;
  } catch (error) {
    logger.error("Помилка обробки запиту AI", { error });

    // Формування зрозумілої відповіді користувачу
    if (error instanceof AppError) {
      if (error.statusCode === 401) {
        return "Виникла проблема з автентифікацією AI сервісу. Зверніться до адміністратора.";
      } else if (error.statusCode === 429) {
        return "Перевищено ліміт запитів до AI сервісу. Спробуйте пізніше.";
      }
    }

    return `На жаль, виникла помилка при обробці вашого запиту. ${error.message}`;
  }
}

/**
 * Обробка текстового повідомлення користувача
 * @param {string} message - Повідомлення користувача
 * @returns {Promise<string>} Результат обробки
 */
export async function processUserMessage(message) {
  try {
    if (!message || message.trim() === "") {
      return "Будь ласка, введіть ваше питання.";
    }

    // Отримання вектору
    const queryEmbedding = await getTextEmbedding(message);

    // Пошук релевантних документів
    const results = await searchSimilarDocuments(message, queryEmbedding);

    return results;
  } catch (error) {
    logger.error("Помилка обробки повідомлення користувача", { error });
    return "Сталася помилка під час пошуку.";
  }
}

export default {
  processAIagent,
  processUserMessage,
};
