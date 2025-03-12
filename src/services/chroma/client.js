// src/services/chroma/client.js
import { ChromaClient } from "chromadb";
import { config } from "../../config/index.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../middleware/errorHandler.js";

/**
 * Singleton ChromaDB client
 */
class ChromaClientService {
  constructor() {
    if (!ChromaClientService.instance) {
      this.initialize();
      ChromaClientService.instance = this;
    }

    return ChromaClientService.instance;
  }

  /**
   * Initialize ChromaDB client
   */
  initialize() {
    try {
      this.client = new ChromaClient({ path: config.chroma.url });
      logger.info("ChromaDB client initialized", { url: config.chroma.url });
    } catch (error) {
      logger.error("Failed to initialize ChromaDB client", { error });
      throw new AppError("Failed to initialize ChromaDB client", 500);
    }
  }

  /**
   * Get ChromaDB client instance
   * @returns {ChromaClient} ChromaDB client
   */
  getClient() {
    return this.client;
  }

  /**
   * Create a new collection
   * @param {string} name - Collection name
   * @returns {Promise<Collection>} Collection
   */
  async createCollection(name) {
    try {
      const collection = await this.client.createCollection({ name });
      logger.info("Created collection", { name });
      return collection;
    } catch (error) {
      logger.error("Failed to create collection", { name, error });
      throw new AppError(`Failed to create collection: ${error.message}`, 500);
    }
  }

  /**
   * Get collection by name
   * @param {string} name - Collection name
   * @returns {Promise<Collection>} Collection
   */
  async getCollection(name) {
    try {
      const collection = await this.client.getCollection({ name });
      return collection;
    } catch (error) {
      logger.error("Failed to get collection", { name, error });
      throw new AppError(`Failed to get collection: ${error.message}`, 500);
    }
  }

  /**
   * List all collections
   * @returns {Promise<Array>} Collections list
   */
  async listCollections() {
    try {
      const collections = await this.client.listCollections();
      return collections;
    } catch (error) {
      logger.error("Failed to list collections", { error });
      throw new AppError(`Failed to list collections: ${error.message}`, 500);
    }
  }

  /**
   * Delete collection by name
   * @param {string} name - Collection name
   * @returns {Promise<void>}
   */
  async deleteCollection(name) {
    try {
      await this.client.deleteCollection({ name });
      logger.info("Deleted collection", { name });
    } catch (error) {
      logger.error("Failed to delete collection", { name, error });
      throw new AppError(`Failed to delete collection: ${error.message}`, 500);
    }
  }
}

// Export singleton instance
export default new ChromaClientService();
