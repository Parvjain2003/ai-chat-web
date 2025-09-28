import React, { useEffect, useRef } from "react";

const MessageList = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isConsecutiveMessage = (currentMsg, previousMsg) => {
    if (!previousMsg) return false;

    const timeDiff =
      new Date(currentMsg.timestamp) - new Date(previousMsg.timestamp);
    const isSameUser = currentMsg.username === previousMsg.username;
    const isWithinMinute = timeDiff < 60000; // 1 minute

    return isSameUser && isWithinMinute;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      {messages.map((message, index) => {
        const isOwn = message.username === currentUser?.username;
        const previousMessage = messages[index - 1];
        const isConsecutive = isConsecutiveMessage(message, previousMessage);
        const showAvatar = !isConsecutive || !isOwn;

        return (
          <div
            key={message.id || message._id}
            className={`flex items-end space-x-2 ${
              isOwn ? "justify-end" : "justify-start"
            }`}
          >
            {!isOwn && (
              <div className="w-8 h-8 flex-shrink-0">
                {showAvatar ? (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {message.username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-8 h-8"></div>
                )}
              </div>
            )}

            <div
              className={`max-w-xs lg:max-w-md ${isOwn ? "order-first" : ""}`}
            >
              {!isConsecutive && !isOwn && (
                <div className="text-xs text-gray-600 mb-1 ml-2">
                  {message.username}
                </div>
              )}

              <div
                className={`px-4 py-2 rounded-2xl ${
                  isOwn
                    ? "bg-green-600 text-white rounded-br-md"
                    : "bg-white text-gray-900 shadow-sm border border-gray-200 rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.message}
                </p>

                {message.aiProcessed && message.originalMessage && (
                  <div
                    className={`mt-2 p-2 rounded text-xs ${
                      isOwn
                        ? "bg-green-700 bg-opacity-50"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <span className="mr-1">🤖</span>
                      <span className="font-medium">AI Enhanced</span>
                    </div>
                    <div className={isOwn ? "text-green-100" : "text-gray-600"}>
                      Original: "{message.originalMessage}"
                    </div>
                  </div>
                )}

                <div
                  className={`text-xs mt-1 ${
                    isOwn ? "text-green-100" : "text-gray-500"
                  } flex items-center justify-end space-x-1`}
                >
                  <span>{formatTime(message.timestamp)}</span>
                  {isOwn && <span>✓✓</span>}
                </div>
              </div>
            </div>

            {isOwn && (
              <div className="w-8 h-8 flex-shrink-0">
                {showAvatar ? (
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {currentUser?.username?.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-8 h-8"></div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
