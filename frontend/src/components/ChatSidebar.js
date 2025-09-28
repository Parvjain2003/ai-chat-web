// src/components/ChatSidebar.js
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Circle } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const ChatSidebar = ({
  conversations,
  selectedChat,
  onChatSelect,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <MessageCircle size={48} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs text-gray-400">Start a new chat to begin!</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Conversations</h2>
        <p className="text-sm text-gray-500">{conversations.length} chats</p>
      </div>

      <div className="overflow-y-auto scrollbar-thin">
        {conversations.map((conversation) => (
          <div
            key={conversation.partnerId}
            onClick={() => onChatSelect(conversation)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedChat?.partnerId === conversation.partnerId
                ? "bg-primary-50 border-r-4 border-r-primary-500"
                : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="relative">
                <img
                  src={
                    conversation.partner.avatar ||
                    `https://ui-avatars.com/api/?name=${conversation.partner.name}&background=random`
                  }
                  alt={conversation.partner.name}
                  className="w-12 h-12 rounded-full"
                />
                {conversation.partner.isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversation.partner.name}
                  </h3>
                  {conversation.lastMessageTime && (
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(
                        new Date(conversation.lastMessageTime),
                        { addSuffix: true }
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage || "No messages yet"}
                  </p>

                  {conversation.unreadCount > 0 && (
                    <div className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {conversation.unreadCount > 99
                        ? "99+"
                        : conversation.unreadCount}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  @{conversation.partnerId}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
