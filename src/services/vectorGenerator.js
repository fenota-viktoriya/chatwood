import axios from "axios";
import { openaiApiKey } from "../utils/config.js";

if (!openaiApiKey) {
  throw new Error(
    "Отсутствует OpenAI API ключ. Убедитесь, что он задан в переменных окружения."
  );
}

export async function getTextEmbedding(text) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        input: text,
        model: "text-embedding-ada-002",
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data[0]?.embedding || [];
  } catch (error) {
    console.error("Ошибка при генерации вектора:", error.message);
    throw new Error(`Ошибка при генерации вектора: ${error.message}`);
  }
}
