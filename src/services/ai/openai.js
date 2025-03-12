// src/services/ai/openai.js
import OpenAI from "openai";
import { config } from "../../config/index.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../middleware/errorHandler.js";

// Перевірка наявності API ключа
if (!config.openai.apiKey) {
  throw new Error(
    "Відсутній OpenAI API ключ. Додайте його у config.js або .env."
  );
}

// Ініціалізація OpenAI SDK
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Генерація відповіді за допомогою OpenAI
 * @param {string} userQuery - Запит користувача
 * @param {string} context - Контекст з бази знань
 * @param {Object} options - Додаткові параметри
 * @returns {Promise<string>} Відповідь від AI
 */
export async function generateCompletion(userQuery, context, options = {}) {
  const {
    model = config.openai.completionModel,
    temperature = config.openai.temperature,
    maxTokens = config.openai.maxTokens,
  } = options;

  logger.debug("Запит до OpenAI", { userQuery, model, temperature });

  try {
    if (!userQuery || userQuery.trim() === "") {
      return "Будь ласка, введіть ваше питання.";
    }

    const systemPrompt = `
    Ти — інтелектуальний помічник, який допомагає користувачам отримувати відповіді на їхні питання.
    Використовуй подану інформацію з бази знань для відповіді, але якщо вона не містить потрібних даних, 
    надай корисну загальну відповідь.

    📌 **Контекст з бази знань:** 
    "${context || "Контекст відсутній"}"

    🎯 **Твоя відповідь повинна бути:** 
    - Зрозумілою та логічною.
    - Використовувати інформацію з контексту, якщо вона містить релевантні дані.
    - Якщо інформація не містить відповіді, поясни тему загалом.
    - Не вигадуй відповідей, якщо не маєш достатньо інформації.

    ℹ️ Відповідай українською мовою, коротко та по суті.
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
      completion.choices[0]?.message?.content || "Відповідь не отримана";

    logger.debug("Відповідь від OpenAI", {
      responseLength: response.length,
      model,
    });

    return response;
  } catch (error) {
    logger.error("Помилка взаємодії з OpenAI", { error });

    if (error.response) {
      logger.error("Деталі помилки OpenAI", {
        status: error.response.status,
        data: error.response.data,
      });
    }

    // Обробка типових помилок
    if (error.message.includes("401")) {
      throw new AppError("Невірний API-ключ OpenAI", 401);
    } else if (error.message.includes("429")) {
      throw new AppError("Перевищено ліміт запитів до OpenAI", 429);
    } else if (error.message.includes("500")) {
      throw new AppError("Помилка сервера OpenAI", 500);
    }

    throw new AppError(`Помилка при генерації тексту: ${error.message}`, 500);
  }
}

export default {
  generateCompletion,
};
