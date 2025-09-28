// src/components/AIAssistant.js
import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import { agentApi } from "../services/api";
import { Bot, Send, RotateCcw, MessageCircle, Sparkles } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket } = useSocket();

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content:
          "Hi there! 👋 I'm your chat assistant. How can I help you today?\n\n• Get suggestions to continue an existing conversation\n• Help you start a new conversation with someone\n• Any other chat-related assistance",
        timestamp: new Date(),
      },
    ]);

    // Listen for agent responses via socket
    if (socket) {
      socket.on("agent-response", (data) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "assistant",
            content: data.message,
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
      });

      socket.on("agent-error", (data) => {
        toast.error(data.message);
        setLoading(false);
      });

      return () => {
        socket.off("agent-response");
        socket.off("agent-error");
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Send via socket for real-time response
    if (socket) {
      socket.emit("agent-message", { message: inputMessage.trim() });
    } else {
      // Fallback to HTTP API
      try {
        const response = await agentApi.chat(inputMessage.trim());
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "assistant",
            content: response.data.response,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        toast.error("Failed to get AI response");
      } finally {
        setLoading(false);
      }
    }

    setInputMessage("");
  };

  const handleReset = async () => {
    setIsResetting(true);

    try {
      await agentApi.reset();
      setMessages([
        {
          id: "welcome-reset",
          type: "assistant",
          content: "Session reset! How can I help you today?",
          timestamp: new Date(),
        },
      ]);
      toast.success("AI session reset");
    } catch (error) {
      toast.error("Failed to reset session");
    } finally {
      setIsResetting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* AI Assistant Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="font-semibold">AI Chat Assistant</h2>
              <p className="text-sm text-purple-100">
                Your smart conversation helper
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Reset conversation"
          >
            {isResetting ? (
              <LoadingSpinner size="small" />
            ) : (
              <RotateCcw size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-sm lg:max-w-md ${
                msg.type === "user" ? "order-2" : "order-1"
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`px-4 py-3 rounded-lg ${
                  msg.type === "user"
                    ? "bg-primary-600 text-white rounded-br-sm"
                    : "bg-gradient-to-r from-purple-100 to-blue-100 text-gray-900 rounded-bl-sm border border-purple-200"
                }`}
              >
                {msg.type === "assistant" && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot size={14} className="text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">
                      AI Assistant
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>

              {/* Timestamp */}
              <div
                className={`mt-1 text-xs text-gray-500 ${
                  msg.type === "user" ? "text-right" : "text-left"
                }`}
              >
                {formatDistanceToNow(new Date(msg.timestamp), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-3 rounded-lg border border-purple-200 rounded-bl-sm">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="small" />
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your conversations..."
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent max-h-32 min-h-[48px]"
              rows="1"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() =>
              setInputMessage("I need help continuing a conversation")
            }
            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
          >
            <Sparkles size={12} className="inline mr-1" />
            Continue Chat
          </button>
          <button
            onClick={() => setInputMessage("Help me start a new conversation")}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            <MessageCircle size={12} className="inline mr-1" />
            Start New
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
