// controllers/aiAgentController.js
const aiAgentService = require("../services/aiAgentService");

// Handle AI agent chat
exports.chatWithAgent = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ 
        error: "Message is required and must be a string." 
      });
    }

    const response = await aiAgentService.handleUserMessage(userId, message.trim());

    res.json({
      response,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("AI Agent Chat Error:", error);
    res.status(500).json({
      error: "AI agent failed to process request",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Reset agent session
exports.resetAgentSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    aiAgentService.clearSession(userId);
    
    res.json({ 
      message: "Agent session reset successfully" 
    });
  } catch (error) {
    console.error("Reset Agent Session Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};