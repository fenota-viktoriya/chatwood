import { readTextFile } from "../utils/fileProcessor.js";
import { getTextEmbedding } from "../services/vectorGenerator.js";
import { addVector } from "../services/vectorAdder.js";
import { vectorLength } from "../utils/config.js";

async function main(nameFile) {
  try {
    console.log("Запуск обработки файла...");
    const textData = await readTextFile(nameFile);
    console.log("Файл успешно считан.");

    if (!textData || textData.trim() === "") {
      throw new Error("Файл пуст или не содержит данных.");
    }

    const embedding = await getTextEmbedding(textData);
    console.log(`Получен вектор длиной: ${embedding.length}`);

    if (embedding.length !== vectorLength) {
      throw new Error(
        `Ожидаемая длина вектора: ${vectorLength}, но получено: ${embedding.length}`
      );
    }

    const result = await addVector(textData, embedding);
    console.log("Данные успешно вставлены в ChromaDB:", result);
  } catch (error) {
    console.error("Произошла ошибка:", error.message);
  }
}

main("copyOfRTB.txt");
