const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [{ 
      userId: String,
      phoneNumber: String,
      name: String
    }],
    chatId: { 
      type: String, 
      required: true, 
      unique: true 
    },
    lastMessage: {
      text: String,
      sender: String,
      timestamp: Date
    },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);