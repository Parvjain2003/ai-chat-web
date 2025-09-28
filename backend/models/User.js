// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[0-9]{10,15}$/,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    // Array to store user's chat conversations
    conversations: [
      {
        partnerId: String, // userId or phoneNumber of chat partner
        partnerName: String,
        lastMessage: String,
        lastMessageTime: Date,
        unreadCount: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// Index for better search performance
userSchema.index({ userId: 1 });
userSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model("User", userSchema);
