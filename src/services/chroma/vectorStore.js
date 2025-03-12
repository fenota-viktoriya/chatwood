// src/services/chroma/vectorStore.js
import { v4 as uuidv4 } from "uuid";
import { ensureCollectionExists } from "./collection.js";
import logger from "../../utils/logger.js";
import { config } from "../../config/index.js";
import { AppError } from "../../middleware/errorHandler.js";

const DEFAULT_COLLECTION = config.chroma.collectionName;
const VECTOR_LENGTH = config.chroma.vectorLength;

/**
 * Add document and its vector embedding to ChromaDB
 * @param {string} text - Document text
 * @param {Array<number>} vector - Vector embedding
 * @param {Object} metadata - Optional metadata
 * @param {string} collectionName - Collection name
 * @returns {Promise<Object>} Result with ID
 */
export async function addVector(
  text,
  vector,
  metadata = {},
  collectionName = DEFAULT_COLLECTION
) {
  try {
    if (!text || !Array.isArray(vector) || vector.length === 0) {
      throw new Error("Empty data or vector provided");
    }

    if (vector.length !== VECTOR_LENGTH) {
      throw new Error(
        `Incorrect vector length: ${vector.length}. Expected ${VECTOR_LENGTH}`
      );
    }

    // Get or create collection
    const collection = await ensureCollectionExists(collectionName);

    // Generate unique ID
    const id = metadata.id || uuidv4();

    // Add vector to collection
    await collection.add({
      ids: [id],
      embeddings: [vector],
      documents: [text],
      metadatas: [metadata],
    });

    logger.info("Vector added to ChromaDB", { id, collectionName });

    return { id, success: true };
  } catch (error) {
    logger.error("Error adding vector to ChromaDB", { error });
    throw new AppError(`Error adding vector: ${error.message}`, 500);
  }
}

/**
 * Get document by ID
 * @param {string} id - Document ID
 * @param {string} collectionName - Collection name
 * @returns {Promise<Object>} Document
 */
export async function getVectorById(id, collectionName = DEFAULT_COLLECTION) {
  try {
    const collection = await ensureCollectionExists(collectionName);

    const result = await collection.get({
      ids: [id],
      include: ["documents", "embeddings", "metadatas"],
    });

    if (!result.ids.length) {
      throw new Error(`Document with ID ${id} not found`);
    }

    logger.debug("Retrieved vector by ID", { id, collectionName });

    return {
      id: result.ids[0],
      document: result.documents[0],
      embedding: result.embeddings[0],
      metadata: result.metadatas[0],
    };
  } catch (error) {
    logger.error("Error getting vector by ID", { id, error });
    throw new AppError(`Error getting vector: ${error.message}`, 500);
  }
}

/**
 * Delete document by ID
 * @param {string} id - Document ID
 * @param {string} collectionName - Collection name
 * @returns {Promise<Object>} Success status
 */
export async function deleteVector(id, collectionName = DEFAULT_COLLECTION) {
  try {
    const collection = await ensureCollectionExists(collectionName);

    await collection.delete({ ids: [id] });

    logger.info("Vector deleted from ChromaDB", { id, collectionName });

    return { success: true };
  } catch (error) {
    logger.error("Error deleting vector", { id, error });
    throw new AppError(`Error deleting vector: ${error.message}`, 500);
  }
}

/**
 * Get all vectors in collection
 * @param {string} collectionName - Collection name
 * @returns {Promise<Array>} All vectors
 */
export async function getAllVectors(collectionName = DEFAULT_COLLECTION) {
  try {
    const collection = await ensureCollectionExists(collectionName);

    const result = await collection.get({
      include: ["documents", "metadatas", "embeddings"],
    });

    logger.debug("Retrieved all vectors", {
      collectionName,
      count: result.ids.length,
    });

    return result;
  } catch (error) {
    logger.error("Error getting all vectors", { error });
    throw new AppError(`Error getting all vectors: ${error.message}`, 500);
  }
}

export default {
  addVector,
  getVectorById,
  deleteVector,
  getAllVectors,
};
