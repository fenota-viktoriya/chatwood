// import OpenAI from "openai";
// import { deepseekApiKey } from "./config.js";

// if (!deepseekApiKey) {
//   throw new Error(
//     "Відсутній DeepSeek API ключ. Переконайтеся, що він заданий у файлі .env"
//   );
// }

// // Ініціалізація OpenAI SDK для використання DeepSeek
// const openai = new OpenAI({
//   baseURL: "https://api.deepseek.com",
//   apiKey: deepseekApiKey,
// });

// export async function processAIagent(text) {
//   console.log(text);
//   try {
//     const completion = await openai.chat.completions.create({
//       messages: [{ role: "user", content: text }],
//       model: "deepseek-chat",
//     });

//     return completion.choices[0].message.content;
//   } catch (error) {
//     console.error("❌ Помилка під час виклику AI DeepSeek:", error.message);
//     return "Вибачте, сталася помилка при генерації відповіді AI.";
//   }
// }

import OpenAI from "openai";
import { openaiApiKey } from "../utils/config.js";

if (!openaiApiKey) {
  throw new Error(
    "❌ Відсутній OpenAI API ключ. Додайте його у config.js або .env."
  );
}

// Ініціалізація OpenAI SDK для використання GPT-4
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

/**
 * Викликає OpenAI GPT-4 для генерації відповіді на основі тексту з ChromaDB і запиту користувача.
 * @param {string} usersAnswer - Вхідний текст користувача.
 * @param {string} text - Інформація, знайдена в ChromaDB.
 * @returns {Promise<string>} - Відповідь від OpenAI.
 */
export async function processAIagent(usersAnswer, text) {
  console.log(`📩 Запит до OpenAI: ${usersAnswer}`);
  //console.log(`📚 Контекст з ChromaDB: ${text}`);

  try {
    if (!usersAnswer || usersAnswer.trim() === "") {
      console.warn("⚠️ Користувач не надіслав питання.");
      return "Будь ласка, поставте своє питання.";
    }

    if (!text || text.trim() === "") {
      console.warn("⚠️ ChromaDB не повернула релевантних результатів.");
      return "На жаль, я не знайшов інформації з бази, але можу відповісти загально.";
    }

    const prompt = `
    Ти — інтелектуальний помічник, який допомагає користувачам отримувати відповіді на їхні питання.
    Використовуй подану інформацію з бази знань (ChromaDB) для відповіді, але якщо вона не містить потрібних даних, надай корисну загальну відповідь.

    📌 **Питання користувача:** 
    "${usersAnswer}"

    📖 **Інформація з ChromaDB:** 
    "${text}"

    🎯 **Твоя відповідь повинна бути:** 
    - Зрозумілою та логічною.
    - Використовувати інформацію з ChromaDB, якщо вона містить релевантні дані.
    - Якщо інформація не містить відповіді, поясни тему загалом.
    - Не вигадуй відповідей, якщо не маєш достатньо інформації.

    ℹ️ Відповідай коротко та по суті.
    `;

    const completion = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
    });

    const aiResponse =
      completion.choices[0]?.message?.content || "Відповідь AI не отримана.";
    console.log(`🤖 Відповідь від OpenAI: ${aiResponse}`);

    return aiResponse;
  } catch (error) {
    console.error("❌ Помилка під час виклику OpenAI GPT-4:", error);

    if (error.response) {
      console.error("📢 Відповідь сервера OpenAI:", error.response.data);
    } else if (error.request) {
      console.error("📢 Помилка запиту: сервер не відповідає.");
    } else {
      console.error("📢 Неочікувана помилка:", error.message);
    }

    if (error.message.includes("401")) {
      return "❌ Невірний API-ключ OpenAI. Перевірте налаштування.";
    } else if (error.message.includes("429")) {
      return "🚨 Ліміт запитів до OpenAI вичерпано. Спробуйте пізніше.";
    } else if (error.message.includes("500")) {
      return "🛠️ Помилка сервера OpenAI. Будь ласка, спробуйте ще раз.";
    }

    return `❌ Виникла помилка: ${error.message}`;
  }
}
