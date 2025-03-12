// src/routes/webhook.js
import express from "express";
import chatwootWebhook from "../controllers/chatwootWebhook.js";

const router = express.Router();
router.use("/", chatwootWebhook);

export default router;
