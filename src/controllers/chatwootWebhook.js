// src/controllers/chatwootWebhook.js
import express from "express";
import { processAIagent, processUserMessage } from "./processAIagent.js";
import { chatwootService } from "../services/chatwoot/client.js";
import logger from "../utils/logger.js";
import { AppError } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * Chatwoot webhook handler
 */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    logger.debug("Received webhook from Chatwoot", { payload });

    // Check message type
    if (payload.message_type !== "incoming") {
      logger.debug("Skipping non-incoming message type", {
        messageType: payload.message_type,
      });
      return res.status(200).send("OK");
    }

    const conversationId = payload?.conversation?.id;
    const accountId = payload?.account?.id;
    const messageContent = payload?.content;

    // Check for required data
    if (!conversationId || !accountId || !messageContent) {
      logger.warn("Incomplete payload in webhook", {
        conversationId,
        accountId,
        hasContent: !!messageContent,
      });
      return res.status(400).json({
        status: "error",
        message: "Incomplete data in request",
      });
    }

    logger.info(`Received message from conversation ${conversationId}`, {
      messageContent,
    });

    // Process user request
    try {
      // Search in knowledge base
      logger.debug("Searching for information in knowledge base");
      const contentFromDB = await processUserMessage(messageContent);
      logger.debug("Knowledge base search result", { contentFromDB });

      // Generate response via AI
      logger.debug("Generating response via AI");
      const replyContent = await processAIagent(messageContent, {
        context: contentFromDB,
      });
      logger.info("AI response generated", {
        responseLength: replyContent.length,
      });

      // Send response through Chatwoot API
      logger.debug("Sending response to Chatwoot");
      await chatwootService.sendMessage(
        accountId,
        conversationId,
        replyContent
      );

      logger.info("Response successfully sent");
      res.status(200).json({ status: "success" });
    } catch (error) {
      logger.error("Error processing message", { error });

      // Send error response to user
      const errorMessage =
        "Sorry, an error occurred while processing your request. Please try again or contact support.";

      try {
        await chatwootService.sendMessage(
          accountId,
          conversationId,
          errorMessage
        );
      } catch (sendError) {
        logger.error("Failed to send error message", {
          sendError,
        });
      }

      // Return 200 to Chatwoot so it doesn't retry sending the webhook
      res.status(200).json({
        status: "error",
        message: "Error handled",
      });
    }
  } catch (error) {
    logger.error("Critical error processing webhook", { error });
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Test endpoint to verify webhook functionality
 */
router.get("/webhook", (req, res) => {
  logger.info("Received GET request to /webhook");
  res.status(200).json({
    status: "success",
    message: "✅ Webhook is working!",
  });
});

export default router;
