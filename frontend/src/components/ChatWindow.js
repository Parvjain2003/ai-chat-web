import React, { useState, useRef, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { Phone, Video, MoreVertical, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { chatApi } from "../services/api";

const ChatWindow = ({ chat, messages, setMessages, onConversationUpdate }) => {
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { socket, sendMessage, sendTyping, markMessageAsRead } = useSocket();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when chat is opened or messages change
    if (chat && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [chat, messages, user.userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markMessagesAsRead = async () => {
    try {
      const unreadMessages = messages.filter(
        (msg) => msg.receiver === user.userId && !msg.read
      );

      if (unreadMessages.length > 0) {
        // Call API to mark messages as read
        await chatApi.markAsRead(chat.partnerId);

        // Update local messages state
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.receiver === user.userId
              ? { ...msg, read: true, readAt: new Date() }
              : msg
          )
        );

        // Notify parent component to update conversation list
        if (onConversationUpdate) {
          onConversationUpdate();
        }

        // Emit socket event for real-time updates
        unreadMessages.forEach((msg) => {
          if (socket) {
            socket.emit("message-read", {
              messageId: msg._id || msg.id,
              partnerId: chat.partnerId,
            });
          }
        });
      }
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const handleSendMessage = (message, originalMessage, aiProcessed) => {
    const tempMessage = {
      id: Date.now().toString(),
      sender: user.userId,
      receiver: chat.partnerId,
      message: message,
      originalMessage: originalMessage,
      aiProcessed: !!aiProcessed,
      timestamp: new Date(),
      delivered: false,
      read: false,
    };

    // Optimistically add message to UI
    setMessages((prev) => [...prev, tempMessage]);

    // Send via socket
    sendMessage(chat.partnerId, message, originalMessage, aiProcessed);
  };

  const handleTyping = () => {
    sendTyping(chat.partnerId, true);

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Stop typing after 2 seconds
    const timeout = setTimeout(() => {
      sendTyping(chat.partnerId, false);
    }, 2000);

    setTypingTimeout(timeout);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={
                  chat.partnerAvatar ||
                  `https://ui-avatars.com/api/?name=${chat.partnerName}&background=random`
                }
                alt={chat.partnerName}
                className="w-12 h-12 rounded-full"
              />
              {chat.isOnline && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {chat.partnerName}
              </h2>
              <div className="flex items-center space-x-1">
                <Circle
                  size={8}
                  className={`${
                    chat.isOnline
                      ? "text-green-400 fill-current"
                      : "text-gray-400"
                  }`}
                />
                <span className="text-sm text-gray-500">
                  {chat.isOnline
                    ? "Online"
                    : chat.lastSeen
                    ? `Last seen ${formatDistanceToNow(
                        new Date(chat.lastSeen),
                        {
                          addSuffix: true,
                        }
                      )}`
                    : "Last seen recently"}
                </span>
              </div>
              <p className="text-xs text-gray-400">@{chat.partnerId}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Phone size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Video size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Circle size={32} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-2">
              Start the conversation!
            </h3>
            <p className="text-sm text-gray-500">
              Send your first message to {chat.partnerName}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id || message._id}
              message={message}
              isOwn={message.sender === user.userId}
            />
          ))
        )}

        {/* Typing Indicator */}
        {chat.isTyping && <TypingIndicator partnerName={chat.partnerName} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!chat}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
