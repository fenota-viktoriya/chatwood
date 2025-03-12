import express from "express";
import axios from "axios";
import { searchSimilarVectors } from "../services/searchVectors.js";
import { processAIagent } from "../controllers/processAIagent.js";
import { charwoodApiToken } from "../utils/config.js";

const app = express();

// Розбір JSON-тел запитів
app.use(express.json());

/**
 * Вебхук для отримання повідомлень від Chatwoot
 */
app.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    if (payload.message_type == "incoming") {
      const conversationId = payload?.conversation?.id;
      const accountId = payload?.account?.id;
      const messageContent = payload?.content;

      if (!conversationId || !accountId || !messageContent) {
        return res.status(400).send("Неповний payload");
      }

      console.log(
        `Отримано повідомлення з розмови ${conversationId}: ${messageContent}`
      );

      // Обробка повідомлення користувача
      const contentFromDB = await processUserMessage(messageContent);
      console.log(`Результат пошуку вектора: ${contentFromDB}`);

      const replyContent = await processAIagent(messageContent, contentFromDB);
      console.log(`Згенерована AI відповідь: ${replyContent}`);

      // Формування URL для відправки відповіді через API Chatwoot
      const chatwootApiUrl = `https://app.chatwoot.com/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
      const chatwootApiToken = charwoodApiToken;

      if (!chatwootApiToken) {
        throw new Error("CHATWOOT_API_TOKEN не заданий у .env файлі");
      }

      // Відправка відповіді в розмову
      const response = await axios.post(
        chatwootApiUrl,
        {
          content: replyContent,
          message_type: "outgoing",
        },
        {
          headers: {
            api_access_token: chatwootApiToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Відповідь від Chatwoot API:", response.data);

      // Відповідь Chatwoot, що запит оброблено
      res.status(200).send("OK");
    }
  } catch (error) {
    console.error("Помилка при обробці вебхука:", error);
    res.status(500).send("Error");
  }
});

app.get("/webhook", (req, res) => {
  res.status(200).send("✅ Webhook працює!");
});

// Функція для обробки повідомлення користувача та генерації відповіді.
async function processUserMessage(message) {
  try {
    const results = await searchSimilarVectors(message);
    if (results) {
      return `Найбільш схожий документ: "${results}"`;
    } else {
      return "Вибачте, не знайдено відповідних результатів.";
    }
  } catch (error) {
    console.error("Помилка при обробці повідомлення:", error);
    return "Сталася помилка під час пошуку.";
  }
}

export { processUserMessage };

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порті ${PORT}`);
});
