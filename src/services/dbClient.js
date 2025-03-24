// src/services/dbClient.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getTextEmbedding } from "./ai/embeddings.js";
import { addVector } from "./chroma/vectorStore.js";
import logger from "../utils/logger.js";
import { readTextFile } from "../utils/fileProcessor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the document directory
const docsDirectory = path.join(__dirname, "../../docs");

async function processFile(filePath) {
  try {
    const content = await readTextFile(filePath);
    const fileName = path.basename(filePath);

    // Generate a vector for the file text
    logger.info(`Generating embedding for ${fileName}`);
    const embedding = await getTextEmbedding(content);

    // Add the document and vector to ChromaDB
    logger.info(`Adding ${fileName} to vector database`);
    const result = await addVector(content, embedding, {
      source: fileName,
      date: new Date().toISOString(),
    });

    logger.info(`Document ${fileName} added with ID: ${result.id}`);
    return result;
  } catch (error) {
    logger.error(`Error processing file ${filePath}`, error);
    throw error;
  }
}

async function addAllDocuments() {
  try {
    // Check for directory existence
    try {
      await fs.access(docsDirectory);
    } catch {
      logger.info(`Creating docs directory at ${docsDirectory}`);
      await fs.mkdir(docsDirectory, { recursive: true });

      // Create a sample document if the folder is empty
      const sampleFilePath = path.join(docsDirectory, "sample.txt");
      await fs.writeFile(
        sampleFilePath,
        "This is a sample document for the knowledge base."
      );
    }

    // Read files from the directory
    const files = await fs.readdir(docsDirectory);

    if (files.length === 0) {
      logger.warn(`No documents found in ${docsDirectory}`);
      return;
    }

    logger.info(`Found ${files.length} documents to process`);

    // Process each file
    for (const file of files) {
      const filePath = path.join(docsDirectory, file);

      // Check if this is a file
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        await processFile(filePath);
      }
    }

    logger.info("All documents processed successfully");
  } catch (error) {
    logger.error("Error adding documents:", error);
    process.exit(1);
  }
}

// Add documents
addAllDocuments();
