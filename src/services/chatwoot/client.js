// src/services/chatwoot/client.js
import axios from "axios";
import { config } from "../../config/index.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../middleware/errorHandler.js";

// Check for API token
if (!config.chatwoot.apiToken) {
  throw new Error(
    "Missing Chatwoot API Token. Please add it to config.js or .env file."
  );
}

/**
 * Class for working with Chatwoot API
 */
class ChatwootService {
  constructor() {
    this.apiToken = config.chatwoot.apiToken;
    this.baseUrl = config.chatwoot.baseUrl || "https://app.chatwoot.com";

    logger.debug("ChatwootService initialized", { baseUrl: this.baseUrl });

    // Create axios instance with base settings
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        api_access_token: this.apiToken,
        "Content-Type": "application/json",
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug("Sending request to Chatwoot API", {
          method: config.method,
          url: config.url,
        });
        return config;
      },
      (error) => {
        logger.error("Error creating request to Chatwoot API", { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug("Received response from Chatwoot API", {
          status: response.status,
          statusText: response.statusText,
        });
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error("Error response from Chatwoot API", {
            status: error.response.status,
            data: error.response.data,
          });
        } else if (error.request) {
          logger.error("No response from Chatwoot API", {
            request: error.request,
          });
        } else {
          logger.error("Error setting up request to Chatwoot API", {
            message: error.message,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send message to a conversation
   * @param {number} accountId - Chatwoot account ID
   * @param {number} conversationId - Conversation ID
   * @param {string} content - Message content
   * @param {string} messageType - Message type (default: 'outgoing')
   * @returns {Promise<Object>} API response
   */
  async sendMessage(
    accountId,
    conversationId,
    content,
    messageType = "outgoing"
  ) {
    try {
      if (!accountId || !conversationId || !content) {
        throw new Error("Missing required parameters for sending message");
      }

      const url = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
      const payload = {
        content,
        message_type: messageType,
      };

      logger.debug("Sending message to Chatwoot", {
        accountId,
        conversationId,
        contentLength: content.length,
      });

      const response = await this.client.post(url, payload);

      logger.info("Message sent successfully", {
        messageId: response.data.id,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to send message", { error });
      throw new AppError(`Failed to send message: ${error.message}`, 500);
    }
  }

  /**
   * Get conversation details
   * @param {number} accountId - Chatwoot account ID
   * @param {number} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation data
   */
  async getConversation(accountId, conversationId) {
    try {
      if (!accountId || !conversationId) {
        throw new Error("Missing required parameters for getting conversation");
      }

      const url = `/api/v1/accounts/${accountId}/conversations/${conversationId}`;

      logger.debug("Getting conversation details", {
        accountId,
        conversationId,
      });

      const response = await this.client.get(url);

      logger.debug("Retrieved conversation details", {
        conversationStatus: response.data.status,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to get conversation", { error });
      throw new AppError(`Failed to get conversation: ${error.message}`, 500);
    }
  }

  /**
   * Get conversation messages
   * @param {number} accountId - Chatwoot account ID
   * @param {number} conversationId - Conversation ID
   * @returns {Promise<Array>} Messages array
   */
  async getConversationMessages(accountId, conversationId) {
    try {
      if (!accountId || !conversationId) {
        throw new Error("Missing required parameters for getting messages");
      }

      const url = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

      logger.debug("Getting conversation messages", {
        accountId,
        conversationId,
      });

      const response = await this.client.get(url);

      logger.debug("Retrieved conversation messages", {
        messageCount: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to get conversation messages", { error });
      throw new AppError(`Failed to get messages: ${error.message}`, 500);
    }
  }
}

// Create and export singleton instance
export const chatwootService = new ChatwootService();

export default {
  chatwootService,
};
