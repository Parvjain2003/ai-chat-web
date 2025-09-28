// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      const newSocket = io(
        process.env.REACT_APP_SERVER_URL || "http://localhost:3001",
        {
          auth: {
            token: token,
          },
        }
      );

      newSocket.on("connect", () => {
        console.log("Connected to server");
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        toast.error("Connection failed");
        setIsConnected(false);
      });

      // Chat events
      newSocket.on("chat-request", (data) => {
        toast.success(`${data.fromName} wants to chat with you!`);
        // Auto-accept chat requests for simplicity
        newSocket.emit("accept-chat", {
          chatRoomId: data.chatRoomId,
          fromUserId: data.from,
        });
      });

      newSocket.on("chat-accepted", (data) => {
        toast.success(`${data.byName} accepted your chat request!`);
      });

      newSocket.on("message-notification", (data) => {
        toast(`New message from ${data.fromName}: ${data.message}`, {
          icon: "💬",
        });
      });

      newSocket.on("user-offline", (data) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      newSocket.on("error", (data) => {
        toast.error(data.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token]);

  const startChat = (partnerId) => {
    if (socket) {
      socket.emit("start-chat", { partnerId });
    }
  };

  const sendMessage = (
    partnerId,
    message,
    originalMessage = null,
    aiProcessed = false
  ) => {
    if (socket) {
      socket.emit("send-message", {
        partnerId,
        message,
        originalMessage,
        aiProcessed,
      });
    }
  };

  const joinChat = (partnerId) => {
    if (socket) {
      socket.emit("join-chat", { partnerId });
    }
  };

  const leaveChat = (partnerId) => {
    if (socket) {
      socket.emit("leave-chat", { partnerId });
    }
  };

  const sendTyping = (partnerId, typing) => {
    if (socket) {
      socket.emit("typing", { partnerId, typing });
    }
  };

  const markMessageAsRead = (messageId, partnerId) => {
    if (socket) {
      socket.emit("message-read", { messageId, partnerId });
    }
  };

  const sendAgentMessage = (message) => {
    if (socket) {
      socket.emit("agent-message", { message });
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    startChat,
    sendMessage,
    joinChat,
    leaveChat,
    sendTyping,
    markMessageAsRead,
    sendAgentMessage,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
