// src/controllers/chatwootWebhook.js
import express from "express";
import { processAIagent, processUserMessage } from "./processAIagent.js";
import { chatwootService } from "../services/chatwoot/client.js";
import logger from "../utils/logger.js";
import { AppError } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * Обробник вебхуку від Chatwoot
 */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    logger.debug("Отримано вебхук від Chatwoot", { payload });

    // Перевірка типу повідомлення
    if (payload.message_type !== "incoming") {
      logger.debug("Пропускаємо повідомлення не вхідного типу", {
        messageType: payload.message_type,
      });
      return res.status(200).send("OK");
    }

    const conversationId = payload?.conversation?.id;
    const accountId = payload?.account?.id;
    const messageContent = payload?.content;

    // Перевірка наявності необхідних даних
    if (!conversationId || !accountId || !messageContent) {
      logger.warn("Неповний payload у вебхуку", {
        conversationId,
        accountId,
        hasContent: !!messageContent,
      });
      return res.status(400).json({
        status: "error",
        message: "Неповні дані в запиті",
      });
    }

    logger.info(`Отримано повідомлення з розмови ${conversationId}`, {
      messageContent,
    });

    // Обробка запиту користувача
    try {
      // Пошук в базі знань
      logger.debug("Пошук інформації в базі знань");
      const contentFromDB = await processUserMessage(messageContent);
      logger.debug("Результат пошуку в базі знань", { contentFromDB });

      // Генерація відповіді через AI
      logger.debug("Генерація відповіді через AI");
      const replyContent = await processAIagent(messageContent, {
        context: contentFromDB,
      });
      logger.info("Згенеровано відповідь AI", {
        responseLength: replyContent.length,
      });

      // Відправка відповіді через Chatwoot API
      logger.debug("Відправка відповіді в Chatwoot");
      await chatwootService.sendMessage(
        accountId,
        conversationId,
        replyContent
      );

      logger.info("Відповідь успішно відправлена");
      res.status(200).json({ status: "success" });
    } catch (error) {
      logger.error("Помилка при обробці повідомлення", { error });

      // Надсилаємо відповідь про помилку користувачу
      const errorMessage =
        "Вибачте, сталася помилка при обробці вашого запиту. Спробуйте ще раз або зверніться до підтримки.";

      try {
        await chatwootService.sendMessage(
          accountId,
          conversationId,
          errorMessage
        );
      } catch (sendError) {
        logger.error("Не вдалося відправити повідомлення про помилку", {
          sendError,
        });
      }

      // Повертаємо 200 для Chatwoot, щоб він не намагався повторно відправити вебхук
      res.status(200).json({
        status: "error",
        message: "Помилка оброблена",
      });
    }
  } catch (error) {
    logger.error("Критична помилка при обробці вебхука", { error });
    res.status(500).json({
      status: "error",
      message: "Внутрішня помилка сервера",
    });
  }
});

/**
 * Тестовий ендпоінт для перевірки роботи вебхука
 */
router.get("/webhook", (req, res) => {
  logger.info("Отримано GET запит на /webhook");
  res.status(200).json({
    status: "success",
    message: "✅ Вебхук працює!",
  });
});

export default router;
