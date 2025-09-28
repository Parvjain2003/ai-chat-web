const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    message: { type: String, required: true },
    originalMessage: { type: String },

    aiProcessed: { type: Boolean, default: false },

    // Vector + metadata for each message
    messageVector: {
      embedding: { type: [Number], default: [] }, // numeric vector for Atlas
      content: { type: String, default: "" },
      language: {
        type: String,
        enum: ["english", "hindi", "roman_hindi", "mixed"],
        default: "english",
      },
      tone: {
        type: String,
        enum: [
          "formal",
          "casual",
          "friendly",
          "flirty",
          "professional",
          "angry",
          "sad",
          "happy",
          "neutral",
        ],
        default: "neutral",
      },
      relationship: {
        type: String,
        enum: ["friend", "colleague", "boss", "romantic", "family", "unknown"],
        default: "unknown",
      },
      context: { type: String, default: "" },
      sentiment: {
        type: String,
        enum: ["positive", "negative", "neutral"],
        default: "neutral",
      },
      keywords: { type: [String], default: [] },
      isQuestion: { type: Boolean, default: false },
      isResponse: { type: Boolean, default: false },
    },

    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
