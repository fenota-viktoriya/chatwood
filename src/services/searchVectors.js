import { ChromaClient } from "chromadb";
import { chromaDBUrl } from "../utils/config.js";
import { getTextEmbedding } from "../services/vectorGenerator.js";

const collectionName = "faq_base";

export async function searchSimilarVectors(queryText, topK = 2) {
  try {
    const client = new ChromaClient({ path: chromaDBUrl });
    const collection = await client.getCollection({ name: collectionName });
    const queryEmbedding = await getTextEmbedding(queryText);
    const result = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: ["documents", "distances"],
    });
    console.log("🔍 Самые похожие результаты:");
    const res = `${result.documents[0]} ${result.documents[1]}`;
    console.log(`"!!!!!!!!!":${res}`);
    return res;
  } catch (error) {
    console.error("❌ Ошибка при поиске:", error.message);
  }
}
