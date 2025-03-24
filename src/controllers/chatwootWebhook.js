import express from "express";
import { processAIagent, processUserMessage } from "./processAIagent.js";
import { chatwootService } from "../services/chatwoot/client.js";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * Chatwoot webhook handler
 */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    logger.debug("FULL WEBHOOK FROM CHATWOOT:", {
      payload,
      headers: req.headers,
    });

    // Support for two formats: direct and Chatwoot event format
    let conversationId, accountId, messageContent, messageType;

    // Try to get data in standard test request format
    if (payload.message_type) {
      // Your test format
      messageType = payload.message_type;
      conversationId = payload?.conversation?.id;
      accountId = payload?.account?.id;
      messageContent = payload?.content;
    }
    // Try to get data in Chatwoot webhook format
    else if (
      payload.event === "message_created" ||
      payload.event === "message.created"
    ) {
      // Chatwoot webhook format
      messageType = payload.message?.message_type || "unknown";
      conversationId = payload.conversation?.id;
      accountId = payload.account?.id;
      messageContent = payload.message?.content;
    }

    logger.debug("Detected data:", {
      conversationId,
      accountId,
      messageContent,
      messageType,
    });

    // Skip non-incoming messages
    if (messageType !== "incoming" && messageType !== "text") {
      logger.debug("Skipping non-text or non-incoming message", {
        messageType,
      });
      return res
        .status(200)
        .json({ status: "skipped", reason: "not_incoming_message" });
    }

    // Check for required data
    if (!conversationId || !accountId || !messageContent) {
      logger.warn("Incomplete webhook", {
        conversationId,
        accountId,
        hasContent: !!messageContent,
      });
      return res.status(200).json({
        status: "error",
        message: "Incomplete data in webhook",
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

/**
 * Test endpoint that sends a direct message to a conversation
 */
router.post("/test-reply", async (req, res) => {
  try {
    const accountId = 113023; // Your real accountId
    const conversationId = 3; // Your real conversationId
    const message = "This is a test response from the bot!";

    logger.info("Sending test message", { accountId, conversationId, message });

    await chatwootService.sendMessage(accountId, conversationId, message);

    res.status(200).json({ status: "success", message: "Test message sent" });
  } catch (error) {
    logger.error("Error sending test message", { error });
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
