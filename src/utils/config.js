// src/config.js
import dotenv from "dotenv";
dotenv.config();

function validateEnvVariable(name) {
  if (!process.env[name]) {
    throw new Error(
      `Переменная окружения ${name} не задана. Проверьте .env файл.`
    );
  }
  return process.env[name];
}

export const primaryColor = validateEnvVariable("PRIMARY_COLOR");
export const logoURL = validateEnvVariable("LOGO_URL");
export const chromaDBUrl = validateEnvVariable("CHROMA_DB_URL");
export const vectorLength = parseInt(validateEnvVariable("VECTOR_LENGTH"), 10);
export const openaiApiKey = validateEnvVariable("OPENAI_API_KEY");
export const charwoodApiToken = validateEnvVariable("CHATWOOT_API_TOKEN");
export const deepseekApiKey = validateEnvVariable("DS_API_KEY");
