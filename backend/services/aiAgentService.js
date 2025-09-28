// services/aiAgentService.js
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const Message = require("../models/Message");
const User = require("../models/User");

class AIAgentService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.client = null;
    this.sessions = new Map(); // Store session data

    if (this.apiKey) {
      this.client = new ChatGoogleGenerativeAI({
        apiKey: this.apiKey,
        model: "gemini-2.5-flash",
        temperature: 0.7,
      });
    }
  }

  // Initialize or get session
  getSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        stage: "greeting", // greeting, asking_duration, analyzing, suggestions, custom_request
        context: {},
        conversationHistory: [],
      });
    }
    return this.sessions.get(userId);
  }

  // Clear session
  clearSession(userId) {
    this.sessions.delete(userId);
  }

  // Main chat handler
  async handleUserMessage(userId, message) {
    try {
      const session = this.getSession(userId);
      const userMessage = message.toLowerCase().trim();

      switch (session.stage) {
        case "greeting":
          return this.handleGreeting(userId, userMessage);

        case "asking_duration":
          return this.handleDurationRequest(userId, userMessage);

        case "analyzing":
          return await this.analyzeAndSuggest(userId, userMessage);

        case "suggestions":
          return await this.handleSuggestionResponse(userId, userMessage);

        case "custom_request":
          return await this.handleCustomRequest(userId, userMessage);

        default:
          return this.handleGreeting(userId, userMessage);
      }
    } catch (error) {
      console.error("AI Agent Error:", error);
      return "Sorry, I encountered an error. Please try again.";
    }
  }

  handleGreeting(userId, message) {
    const session = this.getSession(userId);

    if (
      message.includes("suggest") ||
      message.includes("continue") ||
      message.includes("chat")
    ) {
      session.stage = "asking_duration";
      return "Great! I can help you continue your conversation. First, let me know - would you like me to analyze your chat history from the last 1 day or 1 week to provide better suggestions?";
    } else if (
      message.includes("initiate") ||
      message.includes("start") ||
      message.includes("new")
    ) {
      session.stage = "custom_request";
      session.context.requestType = "initiate";
      return "I can help you start a new conversation! Tell me a bit about the person you want to chat with. Are they a friend, colleague, someone you're interested in romantically, or someone else?";
    } else {
      return "Hi there! 👋 I'm your chat assistant. How can I help you today?\n\n1. Get suggestions to continue an existing conversation\n2. Help you start a new conversation with someone\n3. Any other specific request\n\nJust let me know what you'd like to do!";
    }
  }

  handleDurationRequest(userId, message) {
    const session = this.getSession(userId);

    if (message.includes("day") || message.includes("1 day")) {
      session.context.duration = "1day";
      session.stage = "analyzing";
      return "Got it! I'll analyze your chat history from the last 1 day. Please provide the user ID or phone number of the person you want to continue chatting with.";
    } else if (message.includes("week") || message.includes("1 week")) {
      session.context.duration = "1week";
      session.stage = "analyzing";
      return "Perfect! I'll analyze your chat history from the last 1 week. Please provide the user ID or phone number of the person you want to continue chatting with.";
    } else {
      return "Please choose either '1 day' or '1 week' for the chat history analysis.";
    }
  }

  async analyzeAndSuggest(userId, partnerId) {
    const session = this.getSession(userId);

    try {
      // Fetch chat history
      const duration = session.context.duration;
      const days = duration === "1week" ? 7 : 1;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: partnerId },
          { sender: partnerId, receiver: userId },
        ],
        createdAt: { $gte: startDate },
      })
        .sort({ createdAt: 1 })
        .limit(100);

      if (!messages || messages.length === 0) {
        return "No recent messages found with this person. Would you like me to help you start a new conversation instead?";
      }

      // Analyze the chat and generate suggestions
      const suggestions = await this.generateChatSuggestions(
        messages,
        userId,
        partnerId
      );

      session.stage = "suggestions";
      session.context.currentSuggestions = suggestions;
      session.context.partnerId = partnerId;

      return `Based on your chat history, here are 3 message suggestions:\n\n${suggestions}\n\nWould you like 3 more suggestions? (yes/no)`;
    } catch (error) {
      console.error("Error analyzing chat:", error);
      return "Sorry, I couldn't analyze your chat history. Please try again with a valid user ID or phone number.";
    }
  }

  async handleSuggestionResponse(userId, message) {
    const session = this.getSession(userId);

    if (message.includes("yes") || message.includes("more")) {
      // Generate 3 more suggestions
      const partnerId = session.context.partnerId;
      const messages = await this.getRecentMessages(
        userId,
        partnerId,
        session.context.duration
      );
      const newSuggestions = await this.generateChatSuggestions(
        messages,
        userId,
        partnerId,
        true
      );

      return `Here are 3 more suggestions:\n\n${newSuggestions}\n\nWould you like even more suggestions? (yes/no)`;
    } else if (message.includes("no") || message.includes("thank")) {
      this.clearSession(userId);
      return "You're welcome! Feel free to ask for help anytime. Have a great conversation! 😊";
    } else {
      return "Please respond with 'yes' for more suggestions or 'no' if you're satisfied.";
    }
  }

  async handleCustomRequest(userId, message) {
    const session = this.getSession(userId);

    if (session.context.requestType === "initiate") {
      if (!session.context.relationship) {
        // Store relationship context
        session.context.relationship = message;
        return "Great! Now tell me, what would you like to talk about with them? (e.g., asking about their day, sharing something interesting, making plans, etc.)";
      } else {
        // Generate initiation message
        const suggestion = await this.generateInitiationMessage(
          session.context.relationship,
          message
        );
        this.clearSession(userId);
        return `Here's a great conversation starter:\n\n${suggestion}\n\nFeel free to ask for more suggestions anytime!`;
      }
    } else {
      // Handle other custom requests
      if (message.includes("chat") || message.includes("history")) {
        session.stage = "asking_duration";
        return "I can help with that! Would you like me to analyze your chat history from the last 1 day or 1 week?";
      } else {
        const response = await this.handleGeneralRequest(message);
        this.clearSession(userId);
        return response;
      }
    }
  }

  async generateChatSuggestions(
    messages,
    userId,
    partnerId,
    isSecondBatch = false
  ) {
    if (!this.client) {
      return "1. How's your day going?\n2. Hope you're doing well!\n3. Let's catch up soon!";
    }

    try {
      // Analyze the chat context
      const chatContext = this.analyzeChatContext(messages, userId);
      const lastMessages = messages
        .slice(-5)
        .map((m) => `${m.sender === userId ? "You" : "Them"}: ${m.message}`)
        .join("\n");

      const prompt = `
Analyze this chat conversation and provide 3 ${
        isSecondBatch ? "different" : ""
      } message suggestions to continue the conversation naturally.

Chat Context:
- Language used: ${chatContext.language}
- Relationship type: ${chatContext.relationship}
- Conversation tone: ${chatContext.tone}
- Recent messages:
${lastMessages}

Generate 3 ${isSecondBatch ? "alternative" : ""} message suggestions that:
1. Match the established tone and language
2. Are appropriate for the relationship type
3. Continue the conversation naturally
4. Are culturally appropriate

Format as:
1. [suggestion 1]
2. [suggestion 2]  
3. [suggestion 3]
`;

      const response = await this.client.invoke([
        { role: "user", content: prompt },
      ]);

      return (
        response.content ||
        "1. How are you?\n2. What's up?\n3. Hope you're doing well!"
      );
    } catch (error) {
      console.error("Error generating suggestions:", error);
      return "1. How's everything going?\n2. Hope you're having a good day!\n3. Let's chat soon!";
    }
  }

  async generateInitiationMessage(relationship, topic) {
    if (!this.client) {
      return "Hi! How are you doing?";
    }

    try {
      const prompt = `
Generate a friendly conversation starter for someone who is a ${relationship}. 
The person wants to talk about: ${topic}

Create a warm, natural message that:
1. Is appropriate for the relationship
2. Addresses the topic naturally
3. Is engaging and likely to get a response
4. Feels genuine and not scripted

Just return the message, nothing else.
`;

      const response = await this.client.invoke([
        { role: "user", content: prompt },
      ]);

      return response.content || "Hi! How are you doing?";
    } catch (error) {
      console.error("Error generating initiation message:", error);
      return "Hi! Hope you're having a great day!";
    }
  }

  async handleGeneralRequest(message) {
    if (!this.client) {
      return "I'm here to help with your conversations! You can ask me to suggest messages or help start new chats.";
    }

    try {
      const prompt = `
The user has made this request: "${message}"

If this is related to chatting, messaging, or communication, provide helpful advice.
If it's not related to communication, politely redirect them to chat-related assistance.

Keep the response friendly and helpful.
`;

      const response = await this.client.invoke([
        { role: "user", content: prompt },
      ]);

      return (
        response.content ||
        "I'm here to help with your conversations! Feel free to ask for message suggestions or conversation starters."
      );
    } catch (error) {
      console.error("Error handling general request:", error);
      return "I'm here to help with your conversations! You can ask me to suggest messages or help start new chats.";
    }
  }

  analyzeChatContext(messages, userId) {
    // Simple context analysis
    const recentMessages = messages.slice(-10);
    let language = "english";
    let relationship = "friend";
    let tone = "casual";

    // Language detection (basic)
    const allText = recentMessages
      .map((m) => m.message)
      .join(" ")
      .toLowerCase();
    if (/[है|हैं|का|की|के|में|से|को|पर|और|या|नहीं]/.test(allText)) {
      language = "hindi";
    } else if (
      /[hai|hain|kar|ki|ke|mein|se|ko|par|aur|ya|nahi|kya|kaise]/.test(allText)
    ) {
      language = "roman_hindi";
    }

    // Relationship detection (basic)
    if (/[sir|madam|boss|manager|office|meeting|work]/.test(allText)) {
      relationship = "colleague";
      tone = "professional";
    } else if (
      /[love|baby|darling|sweetheart|miss you|love you]/.test(allText)
    ) {
      relationship = "romantic";
      tone = "affectionate";
    }

    return { language, relationship, tone };
  }

  async getRecentMessages(userId, partnerId, duration) {
    const days = duration === "1week" ? 7 : 1;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId },
      ],
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: 1 })
      .limit(100);
  }

  // Analyze message for vector storage
  async analyzeMessageForVector(messageText, senderContext = {}) {
    if (!this.client) {
      return {
        language: "english",
        tone: "neutral",
        relationship: "unknown",
        context: "",
        sentiment: "neutral",
        keywords: [],
        isQuestion: messageText.includes("?"),
        isResponse: false,
      };
    }

    try {
      const prompt = `
Analyze this message and return a JSON object with the following fields:

Message: "${messageText}"

Return JSON with:
{
  "language": "english|hindi|roman_hindi|mixed",
  "tone": "formal|casual|friendly|flirty|professional|angry|sad|happy|neutral",
  "relationship": "friend|colleague|boss|romantic|family|unknown",
  "context": "brief description of what the message is about",
  "sentiment": "positive|negative|neutral",
  "keywords": ["array", "of", "important", "keywords"],
  "isQuestion": true/false,
  "isResponse": true/false
}

Only return the JSON object, nothing else.
`;

      const response = await this.client.invoke([
        { role: "user", content: prompt },
      ]);

      try {
        return JSON.parse(response.content);
      } catch {
        // Fallback if JSON parsing fails
        return {
          language: "english",
          tone: "neutral",
          relationship: "unknown",
          context: messageText.substring(0, 100),
          sentiment: "neutral",
          keywords: messageText.split(" ").slice(0, 5),
          isQuestion: messageText.includes("?"),
          isResponse: false,
        };
      }
    } catch (error) {
      console.error("Error analyzing message for vector:", error);
      return {
        language: "english",
        tone: "neutral",
        relationship: "unknown",
        context: "",
        sentiment: "neutral",
        keywords: [],
        isQuestion: messageText.includes("?"),
        isResponse: false,
      };
    }
  }
}

module.exports = new AIAgentService();
