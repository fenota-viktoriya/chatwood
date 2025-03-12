import { ensureCollectionExists } from "./collectionManager.js";
import { vectorLength } from "../utils/config.js";

const collectionName = "faq_base";

export async function addVector(text, vector) {
  try {
    if (!text || !Array.isArray(vector) || vector.length === 0) {
      throw new Error("Передані порожні дані або вектор.");
    }
    if (vector.length !== vectorLength) {
      throw new Error(
        `Некоректная длина вектора: ${vector.length}. Ожидается ${vectorLength}.`
      );
    }
    // Отримуємо або створюємо колекцію
    const collection = await ensureCollectionExists(collectionName);
    // Генеруємо унікальний ID для цього запису
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    await collection.add({
      ids: [id],
      embeddings: [vector],
      documents: [text],
    });
    console.log("✅ Дані успішно додані в ChromaDB");
    return { success: true };
  } catch (error) {
    console.error("❌ Помилка при додаванні даних у ChromaDB:", error.message);
    throw new Error(`Помилка при додаванні даних: ${error.message}`);
  }
}
