import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, Wand2, Eye, EyeOff } from "lucide-react";

const MessageBubble = ({ message, isOwn }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  const formatTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Determine message status
  const getMessageStatus = () => {
    if (!isOwn) return null; // Don't show status for received messages

    if (message.read) {
      return { icon: CheckCheck, color: "text-blue-500", title: "Read" };
    } else if (message.delivered) {
      return { icon: CheckCheck, color: "text-gray-400", title: "Delivered" };
    } else {
      return { icon: Check, color: "text-gray-400", title: "Sent" };
    }
  };

  const messageStatus = getMessageStatus();

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-2" : "order-1"}`}>
        {/* Message Bubble */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? "bg-primary-600 text-white rounded-br-sm"
              : "bg-gray-200 text-gray-900 rounded-bl-sm"
          }`}
        >
          {/* AI Processing Indicator */}
          {message.aiProcessed && message.originalMessage && (
            <div className="mb-2">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={`text-xs flex items-center space-x-1 ${
                  isOwn
                    ? "text-primary-200 hover:text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Wand2 size={12} />
                <span>AI Enhanced</span>
                {showOriginal ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          )}

          {/* Message Content */}
          <div className="whitespace-pre-wrap break-words">
            {showOriginal && message.originalMessage
              ? message.originalMessage
              : message.message}
          </div>

          {/* Original Message Preview */}
          {message.aiProcessed && message.originalMessage && showOriginal && (
            <div
              className={`mt-2 pt-2 border-t ${
                isOwn ? "border-primary-500" : "border-gray-300"
              }`}
            >
              <p
                className={`text-xs ${
                  isOwn ? "text-primary-200" : "text-gray-500"
                }`}
              >
                Enhanced from: {message.originalMessage}
              </p>
            </div>
          )}
        </div>

        {/* Message Info */}
        <div
          className={`mt-1 flex items-center space-x-2 text-xs text-gray-500 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <span>{formatTime(message.timestamp || message.createdAt)}</span>

          {/* Message Status for Own Messages */}
          {isOwn && messageStatus && (
            <div className="flex items-center space-x-1">
              <messageStatus.icon
                size={12}
                className={messageStatus.color}
                title={messageStatus.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
