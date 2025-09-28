const express = require("express");
const router = express.Router();
const { chatWithAgent, resetAgentSession } = require("../controllers/aiAgentController");
const authenticateToken = require("../middlewares/authMiddleware");

// Chat with AI agent
router.post("/chat", authenticateToken, chatWithAgent);

// Reset agent session
router.post("/reset", authenticateToken, resetAgentSession);

module.exports = router;