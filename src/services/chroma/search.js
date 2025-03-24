// src/services/chroma/search.js
import { ensureCollectionExists } from "./collection.js";
import logger from "../../utils/logger.js";
import { config } from "../../config/index.js";
import { AppError } from "../../../middleware/errorHandler.js";

const DEFAULT_COLLECTION = config.chroma.collectionName;

/**
 * Пошук схожих документів за допомогою векторного вбудовування
 * @param {Array<number>} queryEmbedding - Вектор запиту
 * @param {number} topK - Кількість результатів для повернення
 * @param {string} collectionName - Назва колекції
 * @returns {Promise<Object>} Результати пошуку
 */
export async function searchByVector(
  queryEmbedding,
  topK = 2,
  collectionName = DEFAULT_COLLECTION
) {
  try {
    const collection = await ensureCollectionExists(collectionName);

    const result = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: ["documents", "distances", "metadatas", "embeddings"],
    });

    logger.debug("Результати векторного пошуку", {
      collectionName,
      topK,
      resultsCount: result.ids[0]?.length || 0,
    });

    // Форматування результатів
    const formattedResults = {
      results:
        result.ids[0]?.map((id, index) => ({
          id,
          document: result.documents[0][index],
          distance: result.distances[0][index],
          metadata: result.metadatas[0][index],
          embedding: result.embeddings ? result.embeddings[0][index] : null,
        })) || [],
    };

    return formattedResults;
  } catch (error) {
    logger.error("Помилка пошуку за вектором", { error });
    throw new AppError(`Помилка пошуку: ${error.message}`, 500);
  }
}

/**
 * Пошук у колекції з фільтрацією
 * @param {Object} options - Параметри пошуку
 * @returns {Promise<Object>} Відфільтровані результати
 */
export async function searchWithFilter(options = {}) {
  const {
    filter,
    limit = 10,
    offset = 0,
    collectionName = DEFAULT_COLLECTION,
  } = options;

  try {
    const collection = await ensureCollectionExists(collectionName);

    const result = await collection.get({
      where: filter,
      limit,
      offset,
      include: ["documents", "metadatas"],
    });

    logger.debug("Результати пошуку з фільтром", {
      collectionName,
      filter,
      resultsCount: result.ids.length,
    });

    // Форматування результатів
    const formattedResults = {
      results: result.ids.map((id, index) => ({
        id,
        document: result.documents[index],
        metadata: result.metadatas[index],
      })),
      total: result.ids.length,
    };

    return formattedResults;
  } catch (error) {
    logger.error("Помилка пошуку з фільтром", { error });
    throw new AppError(`Помилка пошуку з фільтром: ${error.message}`, 500);
  }
}

/**
 * Повний пошук для користувацького запиту
 * @param {string} queryText - Текст запиту користувача
 * @param {Array<number>} queryEmbedding - Вектор запиту
 * @param {number} topK - Кількість результатів
 * @param {string} collectionName - Назва колекції
 * @returns {Promise<string>} Об'єднані результати
 */
export async function searchSimilarDocuments(
  queryText,
  queryEmbedding,
  topK = 2,
  collectionName = DEFAULT_COLLECTION
) {
  try {
    const searchResults = await searchByVector(
      queryEmbedding,
      topK,
      collectionName
    );

    if (searchResults.results.length === 0) {
      logger.info("Не знайдено відповідних документів", { queryText });
      return "Вибачте, не знайдено відповідних результатів.";
    }

    // Об'єднання знайдених документів
    const combinedResult = searchResults.results
      .map((item) => item.document)
      .join("\n\n");

    logger.debug("Знайдено документи", {
      queryText,
      resultCount: searchResults.results.length,
    });

    return combinedResult;
  } catch (error) {
    logger.error("Помилка пошуку документів", { queryText, error });
    throw new AppError(`Помилка пошуку документів: ${error.message}`, 500);
  }
}

export default {
  searchByVector,
  searchWithFilter,
  searchSimilarDocuments,
};
