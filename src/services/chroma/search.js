// src/services/chroma/search.js
import { ensureCollectionExists } from "./collection.js";
import logger from "../../utils/logger.js";
import { config } from "../../config/index.js";
import { AppError } from "../../../middleware/errorHandler.js";

const DEFAULT_COLLECTION = config.chroma.collectionName;

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

    logger.debug("Results", {
      collectionName,
      topK,
      resultsCount: result.ids[0]?.length || 0,
    });

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
    logger.error("Error search", { error });
    throw new AppError(`Error search: ${error.message}`, 500);
  }
}

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

    logger.debug("Result search by filter", {
      collectionName,
      filter,
      resultsCount: result.ids.length,
    });

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
    logger.error("Error search by filter", { error });
    throw new AppError(`Error search by filter: ${error.message}`, 500);
  }
}

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
      logger.info("Not found doc", { queryText });
      return "Not found doc";
    }

    const combinedResult = searchResults.results
      .map((item) => item.document)
      .join("\n\n");

    logger.debug("Doc", {
      queryText,
      resultCount: searchResults.results.length,
    });

    return combinedResult;
  } catch (error) {
    logger.error("Error search doc", { queryText, error });
    throw new AppError(`Error search doc: ${error.message}`, 500);
  }
}

export default {
  searchByVector,
  searchWithFilter,
  searchSimilarDocuments,
};
