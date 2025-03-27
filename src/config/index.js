import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

/**
 * Validate and get environment variable
 * @param {string} name - Environment variable name
 * @param {*} defaultValue - Default value if not present
 * @param {boolean} required - If true, throws error when not present
 * @returns {string} - Environment variable value
 */
function getEnvVariable(name, defaultValue = null, required = true) {
  const value = process.env[name];

  if (!value && required && defaultValue === null) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }

  return value || defaultValue;
}

/**
 * Application configuration object
 */
export const config = {
  // Server
  serverPort: getEnvVariable("PORT", 3000, false),
  nodeEnv: getEnvVariable("NODE_ENV", "development", false),
  isDevelopment:
    getEnvVariable("NODE_ENV", "development", false) === "development",

  // ChromaDB
  chroma: {
    url: getEnvVariable("CHROMA_DB_URL"),
    collectionName: getEnvVariable("CHROMA_COLLECTION_NAME", "faq_base", false),
    vectorLength: parseInt(getEnvVariable("VECTOR_LENGTH", 1536, false), 10),
  },

  // OpenAI
  openai: {
    apiKey: getEnvVariable("OPENAI_API_KEY"),
    embeddingModel: getEnvVariable(
      "OPENAI_EMBEDDING_MODEL",
      "text-embedding-ada-002",
      false
    ),
    completionModel: getEnvVariable(
      "OPENAI_COMPLETION_MODEL",
      "o3-mini",
      false
    ),
    maxTokens: parseInt(getEnvVariable("OPENAI_MAX_TOKENS", 1000, false), 10),
    temperature: parseFloat(getEnvVariable("OPENAI_TEMPERATURE", 0.7, false)),
  },

  // Chatwoot
  chatwoot: {
    apiToken: getEnvVariable("CHATWOOT_API_TOKEN"),
    widgetToken: getEnvVariable("CHATWOOT_WIDGET_TOKEN"),
    baseUrl: getEnvVariable(
      "CHATWOOT_BASE_URL",
      "https://app.chatwoot.com",
      false
    ),
  },

  // Logging
  logging: {
    level: getEnvVariable("LOG_LEVEL", "info", false),
    file: getEnvVariable("LOG_FILE", false, false),
  },

  // App customization
  app: {
    primaryColor: getEnvVariable("PRIMARY_COLOR", "#3B82F6", false),
    logoURL: getEnvVariable("LOGO_URL", "", false),
  },
};

export default config;
