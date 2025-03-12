// src/services/ai/embeddings.js
import OpenAI from "openai";
import axios from "axios";
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
 * Отримання векторного вбудовування тексту через OpenAI API
 * @param {string} text - Текст для векторизації
 * @param {string} model - Модель для вбудовування
 * @returns {Promise<Array<number>>} Вектор вбудовування
 */
export async function getTextEmbedding(
  text,
  model = config.openai.embeddingModel
) {
  try {
    if (!text || typeof text !== "string" || text.trim() === "") {
      throw new Error("Текст для векторизації не може бути порожнім");
    }

    logger.debug("Запит на отримання вектору", {
      textLength: text.length,
      model,
    });

    // Використання SDK
    const response = await openai.embeddings.create({
      input: text,
      model,
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Отримано некоректний формат вбудовування");
    }

    logger.debug("Вектор успішно отримано", {
      vectorLength: embedding.length,
    });

    return embedding;
  } catch (error) {
    logger.error("Помилка отримання вектору", { error });

    // Запасний варіант через axios у випадку проблем з SDK
    if (
      error.message.includes("Unexpected token") ||
      error.message.includes("JSON")
    ) {
      try {
        logger.info("Спроба отримання вектору через безпосередній API запит");

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
            "Отримано некоректний формат вбудовування через API запит"
          );
        }

        logger.debug("Вектор успішно отримано через API запит", {
          vectorLength: embedding.length,
        });

        return embedding;
      } catch (axiosError) {
        logger.error("Помилка запасного варіанту отримання вектору", {
          axiosError,
        });
        throw new AppError(
          `Помилка запасного варіанту: ${axiosError.message}`,
          500
        );
      }
    }

    // Обробка типових помилок
    if (error.message.includes("401")) {
      throw new AppError("Невірний API-ключ OpenAI", 401);
    } else if (error.message.includes("429")) {
      throw new AppError("Перевищено ліміт запитів до OpenAI", 429);
    } else if (error.message.includes("500")) {
      throw new AppError("Помилка сервера OpenAI", 500);
    }

    throw new AppError(`Помилка при отриманні вектору: ${error.message}`, 500);
  }
}

export default {
  getTextEmbedding,
};
