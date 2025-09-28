import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import AIAssistant from "../components/AIAssistant";
import UserSearch from "../components/UserSearch";
import {
  Bot,
  MessageSquare,
  Search,
  LogOut,
  User,
  MessageCircle,
} from "lucide-react";

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    // Load conversations on component mount
    loadConversations();
  }, []);

  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on("new-message", (message) => {
        console.log("New message received:", message);

        if (
          selectedChat &&
          (message.sender === selectedChat.partnerId ||
            message.receiver === selectedChat.partnerId)
        ) {
          setMessages((prev) => [...prev, message]);
        }

        // Update conversation list
        loadConversations();
      });

      socket.on("chat-started", (data) => {
        console.log("Chat started:", data);
        setSelectedChat(data);
        setShowSearch(false);
        loadMessages(data.partnerId);
      });

      socket.on("user-typing", (data) => {
        if (selectedChat && data.userId === selectedChat.partnerId) {
          setSelectedChat((prev) => ({ ...prev, isTyping: data.typing }));
        }
      });

      // Listen for message status updates
      socket.on("message-delivered", (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId || msg._id === data.messageId
              ? { ...msg, delivered: true }
              : msg
          )
        );
      });

      socket.on("message-read", (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId || msg._id === data.messageId
              ? { ...msg, read: true, readAt: new Date() }
              : msg
          )
        );
      });

      return () => {
        socket.off("new-message");
        socket.off("chat-started");
        socket.off("user-typing");
        socket.off("message-delivered");
        socket.off("message-read");
      };
    }
  }, [socket, selectedChat]);

  const loadConversations = async () => {
    try {
      const { chatApi } = await import("../services/api");
      const response = await chatApi.getConversations();
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setLoading(false);
    }
  };

  const loadMessages = async (partnerId) => {
    try {
      const { chatApi } = await import("../services/api");
      const response = await chatApi.getMessages(partnerId);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleChatSelect = (conversation) => {
    setSelectedChat({
      partnerId: conversation.partnerId,
      partnerName: conversation.partner.name,
      partnerAvatar: conversation.partner.avatar,
      isOnline: conversation.partner.isOnline,
      lastSeen: conversation.partner.lastSeen,
    });

    if (socket) {
      socket.emit("join-chat", { partnerId: conversation.partnerId });
    }

    loadMessages(conversation.partnerId);
    setShowSearch(false);
    setShowAIAssistant(false);
  };

  const handleStartChat = (partner) => {
    if (socket) {
      socket.emit("start-chat", { partnerId: partner.userId });
    }
  };

  // Callback to refresh conversations after marking messages as read
  const handleConversationUpdate = () => {
    loadConversations();
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={24} />
              </div>
              <div>
                <h1 className="font-semibold">{user?.name}</h1>
                <p className="text-sm text-primary-100">@{user?.userId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-400"
                }`}
                title={isConnected ? "Connected" : "Disconnected"}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <button
            onClick={() => {
              setShowSearch(true);
              setShowAIAssistant(false);
              setSelectedChat(null);
            }}
            className="btn btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Search size={16} />
            <span>Start New Chat</span>
          </button>

          <button
            onClick={() => {
              setShowAIAssistant(true);
              setShowSearch(false);
              setSelectedChat(null);
            }}
            className="btn btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <Bot size={16} />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-hidden">
          <ChatSidebar
            conversations={conversations}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            loading={loading}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="btn btn-danger w-full flex items-center justify-center space-x-2"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {showSearch && <UserSearch onStartChat={handleStartChat} />}

        {showAIAssistant && <AIAssistant />}

        {selectedChat && !showSearch && !showAIAssistant && (
          <ChatWindow
            chat={selectedChat}
            messages={messages}
            setMessages={setMessages}
            onConversationUpdate={handleConversationUpdate}
          />
        )}

        {!selectedChat && !showSearch && !showAIAssistant && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold mb-2">
                Welcome to Simple Chat!
              </h2>
              <p className="text-gray-400 mb-4">
                Select a conversation or start a new chat
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setShowSearch(true)}
                  className="btn btn-primary mr-2"
                >
                  <Search size={16} className="mr-2" />
                  Find Someone
                </button>
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="btn btn-secondary"
                >
                  <Bot size={16} className="mr-2" />
                  AI Help
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
