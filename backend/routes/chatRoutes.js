const express = require("express");
const router = express.Router();
const {
  getChatMessages,
  getConversations,
  markAsRead,
  processMessageWithAI,
} = require("../controllers/chatController");
const authenticateToken = require("../middlewares/authMiddleware");

// Get chat messages with a specific user
router.get("/messages/:partnerId", authenticateToken, getChatMessages);

// Get all conversations
router.get("/conversations", authenticateToken, getConversations);

// Mark messages as read
router.post("/mark-read", authenticateToken, markAsRead);

// Process message with AI
router.post("/process-ai", authenticateToken, processMessageWithAI);

module.exports = router;
