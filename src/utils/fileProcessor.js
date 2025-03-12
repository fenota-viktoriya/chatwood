// src/fileProcessor.js
import { promises as fs } from "fs";

const fileCache = new Map();

export async function readTextFile(filePath) {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }
  try {
    const data = await fs.readFile(filePath, "utf8");
    fileCache.set(filePath, data); // Кэшируем данные
    return data;
  } catch (err) {
    console.error(`Ошибка при чтении файла ${filePath}:`, err.message);
    throw new Error(`Ошибка при чтении файла: ${err.message}`);
  }
}
