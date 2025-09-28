// sockets/index.js - FIXED VERSION
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const aiAgentService = require("../services/aiAgentService");
const aiService = require("../services/aiService"); // ADD THIS MISSING IMPORT

const connectedUsers = new Map();

// Socket Authentication
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = user;
    next();
  });
}

function setupSocket(io) {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.userId} connected`);

    // Store connected user
    connectedUsers.set(socket.user.userId, {
      socketId: socket.id,
      user: socket.user,
      activeChats: new Set(),
    });

    // Update user online status
    User.findByIdAndUpdate(socket.user.id, {
      isOnline: true,
      lastSeen: new Date(),
    }).exec();

    // Join user to their personal room for notifications
    socket.join(socket.user.userId);

    // Start chat with someone
    socket.on("start-chat", async (data) => {
      try {
        const { partnerId } = data;

        // Verify partner exists
        const partner = await User.findOne({
          $or: [{ userId: partnerId }, { phoneNumber: partnerId }],
        });

        if (!partner) {
          socket.emit("error", {
            message: "No user found with this ID or phone number",
          });
          return;
        }

        // Create chat room ID (consistent for both users)
        const chatRoomId = [socket.user.userId, partner.userId]
          .sort()
          .join("_");

        socket.join(chatRoomId);
        connectedUsers.get(socket.user.userId)?.activeChats.add(chatRoomId);

        // Notify partner if online
        const partnerConnection = connectedUsers.get(partner.userId);
        if (partnerConnection) {
          io.to(partner.userId).emit("chat-request", {
            from: socket.user.userId,
            fromName: socket.user.name || socket.user.userId,
            chatRoomId,
          });
        }

        socket.emit("chat-started", {
          partnerId: partner.userId,
          partnerName: partner.name,
          partnerAvatar: partner.avatar,
          isOnline: partner.isOnline,
          chatRoomId,
        });
      } catch (error) {
        console.error("Start chat error:", error);
        socket.emit("error", { message: "Failed to start chat" });
      }
    });

    // Accept chat request
    socket.on("accept-chat", (data) => {
      const { chatRoomId, fromUserId } = data;
      socket.join(chatRoomId);
      connectedUsers.get(socket.user.userId)?.activeChats.add(chatRoomId);

      // Notify the requester
      io.to(fromUserId).emit("chat-accepted", {
        by: socket.user.userId,
        byName: socket.user.name || socket.user.userId,
        chatRoomId,
      });
    });

    // Send message - FIXED VERSION
    socket.on("send-message", async (data) => {
      try {
        const { partnerId, message, originalMessage, aiProcessed } = data;

        const chatRoomId = [socket.user.userId, partnerId].sort().join("_");

        // Generate AI analysis for the message
        let messageVector = null;
        try {
          const embedding = await aiService.generateMessageEmbedding(message);
          const analysis = await aiService.analyzeMessageForVector(message);

          messageVector = {
            embedding: Array.isArray(embedding) ? embedding : [],
            content: message,
            language: analysis.language || "english",
            tone: analysis.tone || "neutral",
            relationship: analysis.relationship || "unknown",
            context: analysis.context || "",
            sentiment: analysis.sentiment || "neutral",
            keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
            isQuestion: !!analysis.isQuestion,
            isResponse: !!analysis.isResponse,
          };
        } catch (error) {
          console.error("AI analysis error:", error);
          // Fallback messageVector
          messageVector = {
            embedding: [],
            content: message,
            language: "english",
            tone: "neutral",
            relationship: "unknown",
            context: message.substring(0, 100),
            sentiment: "neutral",
            keywords: [],
            isQuestion: message.includes("?"),
            isResponse: false,
          };
        }

        const newMessage = new Message({
          sender: socket.user.userId,
          receiver: partnerId,
          message,
          originalMessage,
          aiProcessed: aiProcessed || false,
          messageVector,
          delivered: false,
          read: false,
        });

        await newMessage.save();

        // Update delivery status if partner is online
        const partnerConnection = connectedUsers.get(partnerId);
        if (partnerConnection) {
          newMessage.delivered = true;
          await newMessage.save();
        }

        // Send to chat room
        io.to(chatRoomId).emit("new-message", {
          id: newMessage._id,
          sender: socket.user.userId,
          receiver: partnerId,
          message,
          originalMessage,
          aiProcessed,
          timestamp: newMessage.createdAt,
          delivered: newMessage.delivered,
          read: false,
        });

        // Send notification to partner if not in chat
        if (
          partnerConnection &&
          !partnerConnection.activeChats.has(chatRoomId)
        ) {
          io.to(partnerId).emit("message-notification", {
            from: socket.user.userId,
            fromName: socket.user.name || socket.user.userId,
            message:
              message.substring(0, 50) + (message.length > 50 ? "..." : ""),
            timestamp: newMessage.createdAt,
          });
        }
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Mark message as read
    socket.on("message-read", async (data) => {
      try {
        const { messageId, partnerId } = data;

        await Message.findByIdAndUpdate(messageId, {
          read: true,
          readAt: new Date(),
        });

        // Notify sender
        const chatRoomId = [socket.user.userId, partnerId].sort().join("_");
        io.to(chatRoomId).emit("message-read-receipt", {
          messageId,
          readBy: socket.user.userId,
          readAt: new Date(),
        });
      } catch (error) {
        console.error("Message read error:", error);
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      const { partnerId, typing } = data;
      const chatRoomId = [socket.user.userId, partnerId].sort().join("_");

      socket.to(chatRoomId).emit("user-typing", {
        userId: socket.user.userId,
        typing,
        timestamp: new Date(),
      });
    });

    // AI Agent chat
    socket.on("agent-message", async (data) => {
      try {
        const { message } = data;
        const response = await aiAgentService.handleUserMessage(
          socket.user.userId,
          message
        );

        socket.emit("agent-response", {
          message: response,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Agent message error:", error);
        socket.emit("agent-error", {
          message: "AI agent is currently unavailable",
        });
      }
    });

    // Join specific chat room
    socket.on("join-chat", (data) => {
      const { partnerId } = data;
      const chatRoomId = [socket.user.userId, partnerId].sort().join("_");
      socket.join(chatRoomId);
      connectedUsers.get(socket.user.userId)?.activeChats.add(chatRoomId);
    });

    // Leave specific chat room
    socket.on("leave-chat", (data) => {
      const { partnerId } = data;
      const chatRoomId = [socket.user.userId, partnerId].sort().join("_");
      socket.leave(chatRoomId);
      connectedUsers.get(socket.user.userId)?.activeChats.delete(chatRoomId);
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log(`User ${socket.user.userId} disconnected`);

      await User.findByIdAndUpdate(socket.user.id, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Notify active chats about user going offline
      const userConnection = connectedUsers.get(socket.user.userId);
      if (userConnection) {
        userConnection.activeChats.forEach((chatRoomId) => {
          socket.to(chatRoomId).emit("user-offline", {
            userId: socket.user.userId,
            timestamp: new Date(),
          });
        });
      }

      connectedUsers.delete(socket.user.userId);
    });
  });
}

module.exports = { setupSocket };
