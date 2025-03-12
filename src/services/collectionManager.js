import { ChromaClient } from "chromadb";
import { chromaDBUrl } from "../utils/config.js";

if (!chromaDBUrl) {
  throw new Error("Нет URL для ChromaDB. Проверьте файл .env.");
}

const client = new ChromaClient({ path: chromaDBUrl });

export async function ensureCollectionExists(collectionName) {
  try {
    const collections = await client.listCollections();
    const collectionExists = collections.some(
      (col) => col.name === collectionName
    );

    if (!collectionExists) {
      console.log(`Коллекция "${collectionName}" не найдена. Создаю...`);
      try {
        await client.createCollection({ name: collectionName });
        console.log(`✅ Коллекция "${collectionName}" успешно создана.`);
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`Коллекция "${collectionName}" уже существует.`);
        } else {
          throw error;
        }
      }
    }
    return await client.getCollection({ name: collectionName });
  } catch (error) {
    console.error("Ошибка при проверке/создании коллекции:", error.message);
    throw error;
  }
}
