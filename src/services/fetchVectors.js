import { ChromaClient } from "chromadb";
import { chromaDBUrl } from "../utils/config.js";

const collectionName = "faq_base";

async function fetchAllVectors() {
  try {
    const client = new ChromaClient({ path: chromaDBUrl });
    const collection = await client.getCollection({ name: collectionName });
    const result = await collection.get({
      include: ["documents", "embeddings"],
    });
    console.log("📌 Все документы:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Ошибка получения векторов:", error.message);
  }
}

fetchAllVectors();
