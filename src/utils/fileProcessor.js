// src/utils/fileProcessor.js
import { promises as fs } from "fs";

const fileCache = new Map();

export async function readTextFile(filePath) {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }
  try {
    const data = await fs.readFile(filePath, "utf8");
    fileCache.set(filePath, data); // Cache the data
    return data;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err.message);
    throw new Error(`Error reading file: ${err.message}`);
  }
}
