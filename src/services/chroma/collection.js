// src/services/chroma/collection.js
import chromaClient from "./client.js";
import logger from "../../utils/logger.js";
import { config } from "../../config/index.js";
import { AppError } from "../../middleware/errorHandler.js";

const DEFAULT_COLLECTION = config.chroma.collectionName;

/**
 * Ensure collection exists, create if not
 * @param {string} collectionName - Collection name
 * @returns {Promise<Collection>} Collection object
 */
export async function ensureCollectionExists(
  collectionName = DEFAULT_COLLECTION
) {
  try {
    logger.debug("Ensuring collection exists", { collectionName });

    const collections = await chromaClient.listCollections();
    const collectionExists = collections.some(
      (col) => col.name === collectionName
    );

    if (!collectionExists) {
      logger.info(`Collection "${collectionName}" not found. Creating...`);

      try {
        return await chromaClient.createCollection(collectionName);
      } catch (error) {
        // Handle case where collection already exists (race condition)
        if (error.message.includes("already exists")) {
          logger.info(`Collection "${collectionName}" already exists.`);
          return await chromaClient.getCollection(collectionName);
        }
        throw error;
      }
    }

    return await chromaClient.getCollection(collectionName);
  } catch (error) {
    logger.error("Error checking/creating collection", {
      collectionName,
      error,
    });
    throw new AppError(`Error with collection: ${error.message}`, 500);
  }
}

/**
 * Get collection stats
 * @param {string} collectionName - Collection name
 * @returns {Promise<Object>} Collection stats
 */
export async function getCollectionStats(collectionName = DEFAULT_COLLECTION) {
  try {
    const collection = await ensureCollectionExists(collectionName);
    const count = await collection.count();

    logger.debug("Got collection stats", { collectionName, count });

    return { name: collectionName, count };
  } catch (error) {
    logger.error("Error getting collection stats", { collectionName, error });
    throw new AppError(`Error getting collection stats: ${error.message}`, 500);
  }
}

/**
 * Reset collection (delete and recreate)
 * @param {string} collectionName - Collection name
 * @returns {Promise<Collection>} New collection
 */
export async function resetCollection(collectionName = DEFAULT_COLLECTION) {
  try {
    logger.info("Resetting collection", { collectionName });

    const collections = await chromaClient.listCollections();
    const collectionExists = collections.some(
      (col) => col.name === collectionName
    );

    if (collectionExists) {
      await chromaClient.deleteCollection(collectionName);
    }

    return await chromaClient.createCollection(collectionName);
  } catch (error) {
    logger.error("Error resetting collection", { collectionName, error });
    throw new AppError(`Error resetting collection: ${error.message}`, 500);
  }
}

export default {
  ensureCollectionExists,
  getCollectionStats,
  resetCollection,
};
