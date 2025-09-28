// controllers/chatController.js (only the processMessageWithAI handler)
const Message = require("../models/Message");
const aiService = require("../services/aiService");
const User = require("../models/User");

// Process message with AI (grammar and tone) and optionally save + embed
exports.processMessageWithAI = async (req, res) => {
  try {
    const { message, options } = req.body;

    // Validate input
    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Message is required and must be a string." });
    }
    if (message.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }
    if (!options || typeof options !== "object") {
      return res.status(400).json({ error: "Options object is required." });
    }

    let processedMessage = message.trim();
    const originalMessage = message.trim();

    // Step 1: Grammar Correction
    if (options.grammarCheck === true) {
      try {
        const grammarCorrected = await aiService.correctGrammar(
          processedMessage
        );
        processedMessage = grammarCorrected || processedMessage;
        console.log(grammarCorrected);
      } catch (grammarError) {
        console.error("Grammar correction failed:", grammarError.message);
      }
    }

    // Step 2: Tone Adjustment
    if (
      options.toneAdjust === true &&
      options.tone &&
      options.tone !== "neutral"
    ) {
      try {
        const toneAdjusted = await aiService.adjustTone(
          processedMessage,
          options.tone
        );
        processedMessage = toneAdjusted || processedMessage;
      } catch (toneError) {
        console.error("Tone adjustment failed:", toneError.message);
      }
    }

    // Ensure fallback
    if (!processedMessage) processedMessage = originalMessage;

    // Generate embedding & analysis (these are the vector fields we'll save)
    const embedding = await aiService.generateMessageEmbedding(
      processedMessage
    ); // numeric array or null
    const analysis = await aiService.analyzeMessageForVector(processedMessage); // object

    const response = {
      originalMessage,
      processedMessage,
      changed: originalMessage !== processedMessage,
      vector: {
        embeddingPresent: Array.isArray(embedding) && embedding.length > 0,
        embedding: Array.isArray(embedding)
          ? options.includeEmbeddingInResponse
            ? embedding
            : undefined
          : undefined,
        analysis,
      },
      appliedProcessing: {
        grammarCheck: options.grammarCheck === true,
        toneAdjust: options.toneAdjust === true && options.tone !== "neutral",
        tone: options.tone || "neutral",
      },
    };

    // Optionally save the processed message into DB (only if client explicitly asks)
    // options.save must be true and options.receiver must be provided (userId of the partner)
    if (options.save === true && options.receiver) {
      const senderId = req.user && (req.user.userId || req.user.id);
      const msgDoc = new Message({
        sender: senderId,
        receiver: options.receiver,
        message: processedMessage,
        originalMessage,
        aiProcessed: true,
        messageVector: {
          embedding: Array.isArray(embedding) ? embedding : [],
          content: processedMessage,
          language: analysis.language || "english",
          tone: analysis.tone || "neutral",
          relationship: analysis.relationship || "unknown",
          context: analysis.context || "",
          sentiment: analysis.sentiment || "neutral",
          keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
          isQuestion: !!analysis.isQuestion,
          isResponse: !!analysis.isResponse,
        },
      });

      await msgDoc.save();
      response.saved = true;
      response.savedMessageId = msgDoc._id;
    }

    res.json(response);
  } catch (error) {
    console.error("AI Processing Error:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });

    res.status(500).json({
      error: "AI processing failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get chat messages between two users
exports.getChatMessages = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: partnerId },
        { sender: partnerId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    console.error("Get Chat Messages Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    // Get all messages where current user is sender or receiver
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { receiver: currentUserId }],
        },
      },
      {
        $addFields: {
          partnerId: {
            $cond: {
              if: { $eq: ["$sender", currentUserId] },
              then: "$receiver",
              else: "$sender",
            },
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$partnerId",
          lastMessage: { $first: "$message" },
          lastMessageTime: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", currentUserId] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get partner details
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const partner = await User.findOne({ userId: conv._id }).select(
          "userId name avatar isOnline lastSeen"
        );

        return {
          partnerId: conv._id,
          partner,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount,
        };
      })
    );

    res.json(
      conversationsWithDetails.sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      )
    );
  } catch (error) {
    console.error("Get Conversations Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { partnerId } = req.body;
    const currentUserId = req.user.userId;

    await Message.updateMany(
      {
        sender: partnerId,
        receiver: currentUserId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
