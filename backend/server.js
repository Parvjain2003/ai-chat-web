// server.js - COMPLETELY FIXED VERSION
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const rateLimiter = require("./middlewares/rateLimiter");

dotenv.config();

// Connect to database
connectDB();

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with proper options
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["websocket", "polling"],
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: false,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes - Load in specific order
console.log("Loading routes...");
try {
  app.use("/api/auth", require("./routes/authRoutes"));
  console.log("Auth routes loaded");
} catch (error) {
  console.error("Error loading auth routes:", error.message);
  process.exit(1);
}

try {
  app.use("/api/chat", require("./routes/chatRoutes"));
  console.log("Chat routes loaded");
} catch (error) {
  console.error("Error loading chat routes:", error.message);
  process.exit(1);
}

try {
  app.use("/api/agent", require("./routes/aiAgentRoutes"));
  console.log("AI agent routes loaded");
} catch (error) {
  console.error("Error loading AI agent routes:", error.message);
  process.exit(1);
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    error: "Internal server error",
    details:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Setup Socket.IO AFTER all routes are configured
console.log("Setting up Socket.IO...");
try {
  const { setupSocket } = require("./sockets");
  setupSocket(io);
  console.log("Socket.IO setup complete");
} catch (error) {
  console.error("Error setting up Socket.IO:", error.message);
  console.error("Stack trace:", error.stack);
  process.exit(1);
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

module.exports = { app, server, io };
