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

// Шлях до директорії з документами
const docsDirectory = path.join(__dirname, "../../docs");

async function processFile(filePath) {
  try {
    const content = await readTextFile(filePath);
    const fileName = path.basename(filePath);

    // Генеруємо вектор для тексту файлу
    logger.info(`Generating embedding for ${fileName}`);
    const embedding = await getTextEmbedding(content);

    // Додаємо документ і вектор до ChromaDB
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
    // Перевіряємо наявність директорії
    try {
      await fs.access(docsDirectory);
    } catch {
      logger.info(`Creating docs directory at ${docsDirectory}`);
      await fs.mkdir(docsDirectory, { recursive: true });

      // Створюємо зразковий документ, якщо папка порожня
      const sampleFilePath = path.join(docsDirectory, "sample.txt");
      await fs.writeFile(
        sampleFilePath,
        "This is a sample document for the knowledge base."
      );
    }

    // Зчитуємо файли із директорії
    const files = await fs.readdir(docsDirectory);

    if (files.length === 0) {
      logger.warn(`No documents found in ${docsDirectory}`);
      return;
    }

    logger.info(`Found ${files.length} documents to process`);

    // Обробляємо кожен файл
    for (const file of files) {
      const filePath = path.join(docsDirectory, file);

      // Перевіряємо чи це файл
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

// Виконуємо додавання документів
addAllDocuments();
