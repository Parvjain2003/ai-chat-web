import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { PaperAirplaneIcon, FaceSmileIcon } from "@heroicons/react/24/outline";
import MessageList from "./MessageList";
import AIControls from "./AIControls";
import axios from "axios";
import toast from "react-hot-toast";

// const ChatArea = ({
//   currentRoom,
//   messages,
//   onSendMessage,
//   onTyping,
//   typingUsers,
// }) => {
//   const [inputValue, setInputValue] = useState("");
//   const [aiSettings, setAiSettings] = useState({
//     grammarCheck: false,
//     toneAdjust: false,
//     tone: "neutral",
//   });
//   const [isProcessing, setIsProcessing] = useState(false);
//   const inputRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   // Auto-scroll to bottom when new messages arrive
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const processMessageWithAI = async (message) => {
//     if (!aiSettings.grammarCheck && !aiSettings.toneAdjust) {
//       return message; // No processing needed
//     }

//     try {
//       setIsProcessing(true);

//       const response = await fetch("http://localhost:5000/api/process", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           message: message,
//           options: {
//             grammarCheck: aiSettings.grammarCheck,
//             toneAdjust: aiSettings.toneAdjust,
//             tone: aiSettings.tone,
//           },
//         }),
//       });

//       const data = await response.json();
//       console.log("AI Processing result:", data);
//       return data.processedMessage || message;
//     } catch (error) {
//       console.error("AI processing failed:", error);
//       // Return original message if AI processing fails
//       return message;
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!inputValue.trim() || !currentRoom || isProcessing) return;

//     const originalMessage = inputValue.trim();

//     try {
//       // Process message with AI if any features are enabled
//       const processedMessage = await processMessageWithAI(originalMessage);

//       // Send the processed message
//       onSendMessage({
//         message: processedMessage,
//         type: "text",
//         originalMessage:
//           originalMessage !== processedMessage ? originalMessage : undefined,
//       });

//       setInputValue("");
//       inputRef.current?.focus();
//     } catch (error) {
//       console.error("Failed to send message:", error);
//       // Still clear the input even if sending fails
//       setInputValue("");
//     }
//   };

//   const handleInputChange = (e) => {
//     setInputValue(e.target.value);

//     // Handle typing indicator
//     if (e.target.value.trim()) {
//       onTyping(true);
//     } else {
//       onTyping(false);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit(e);
//     }
//   };

//   const formatTime = (timestamp) => {
//     return new Date(timestamp).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   if (!currentRoom) {
//     return (
//       <div className="flex-1 flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="text-6xl mb-4">💬</div>
//           <h2 className="text-xl font-semibold text-gray-600 mb-2">
//             Select a room to start chatting
//           </h2>
//           <p className="text-gray-500">
//             Choose a room from the sidebar to begin your conversation
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 flex flex-col bg-white">
//       {/* Header */}
//       <div className="p-4 border-b border-gray-200 bg-white">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-lg font-semibold text-gray-800">
//               {currentRoom.name}
//             </h2>
//             <p className="text-sm text-gray-500">
//               {currentRoom.description || "No description available"}
//             </p>
//           </div>
//           <div className="flex items-center space-x-2 text-sm text-gray-500">
//             <span className="w-2 h-2 bg-green-400 rounded-full"></span>
//             <span>{messages.length} messages</span>
//           </div>
//         </div>
//       </div>

//       {/* AI Controls */}
//       <AIControls
//         settings={aiSettings}
//         onSettingsChange={setAiSettings}
//         isProcessing={isProcessing}
//       />

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages.length === 0 ? (
//           <div className="text-center text-gray-500 mt-8">
//             <div className="text-4xl mb-2">🚀</div>
//             <p>No messages yet. Start the conversation!</p>
//           </div>
//         ) : (
//           messages.map((message, index) => (
//             <div
//               key={message.id || index}
//               className={`flex ${
//                 message.username === "You" ? "justify-end" : "justify-start"
//               }`}
//             >
//               <div
//                 className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
//                   message.username === "You"
//                     ? "bg-blue-500 text-white"
//                     : "bg-gray-200 text-gray-800"
//                 }`}
//               >
//                 <div className="flex items-center justify-between mb-1">
//                   <span className="text-xs font-medium opacity-75">
//                     {message.username}
//                   </span>
//                   <span className="text-xs opacity-75">
//                     {formatTime(message.timestamp)}
//                   </span>
//                 </div>
//                 <div className="text-sm">
//                   {message.message}
//                   {message.originalMessage && (
//                     <div className="mt-1 text-xs opacity-75 italic">
//                       (Originally: "{message.originalMessage}")
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))
//         )}

//         {/* Typing indicators */}
//         {typingUsers.length > 0 && (
//           <div className="flex justify-start">
//             <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">
//               <div className="flex items-center space-x-1">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                   <div
//                     className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                     style={{ animationDelay: "0.1s" }}
//                   ></div>
//                   <div
//                     className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                     style={{ animationDelay: "0.2s" }}
//                   ></div>
//                 </div>
//                 <span className="ml-2">
//                   {typingUsers.join(", ")}{" "}
//                   {typingUsers.length === 1 ? "is" : "are"} typing...
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className="p-4 border-t border-gray-200 bg-white">
//         <form onSubmit={handleSubmit} className="flex space-x-2">
//           <input
//             ref={inputRef}
//             type="text"
//             value={inputValue}
//             onChange={handleInputChange}
//             onKeyPress={handleKeyPress}
//             placeholder={
//               isProcessing
//                 ? "Processing with AI..."
//                 : `Type a message to ${currentRoom.name}...`
//             }
//             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             disabled={isProcessing}
//           />
//           <button
//             type="submit"
//             disabled={!inputValue.trim() || isProcessing}
//             className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
//               !inputValue.trim() || isProcessing
//                 ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                 : "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg"
//             }`}
//           >
//             {isProcessing ? (
//               <div className="flex items-center">
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                 Processing...
//               </div>
//             ) : (
//               "Send"
//             )}
//           </button>
//         </form>

//         {/* AI Status */}
//         {(aiSettings.grammarCheck || aiSettings.toneAdjust) && (
//           <div className="mt-2 text-xs text-gray-500 flex items-center justify-center">
//             <span className="flex items-center">
//               <span className="w-1 h-1 bg-blue-400 rounded-full mr-1"></span>
//               AI will{" "}
//               {aiSettings.grammarCheck && aiSettings.toneAdjust
//                 ? "correct grammar and adjust tone"
//                 : aiSettings.grammarCheck
//                 ? "correct grammar"
//                 : "adjust tone"}{" "}
//               before sending
//             </span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatArea;

const ChatArea = ({
  currentRoom,
  messages,
  onSendMessage,
  onTyping,
  typingUsers,
}) => {
  const [messageText, setMessageText] = useState("");
  const [aiSettings, setAiSettings] = useState({
    grammarCheck: true,
    toneAdjust: false,
    tone: "neutral",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [messageText]);

  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    // Handle typing indicator
    onTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);

    // Process with AI if enabled
    if (
      (aiSettings.grammarCheck || aiSettings.toneAdjust) &&
      e.target.value.trim()
    ) {
      debounceAIProcess(e.target.value);
    }
  };

  const debounceAIProcess = React.useCallback(
    debounce(async (text) => {
      await processWithAI(text);
    }, 1000),
    [aiSettings]
  );

  const processWithAI = async (text) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/ai/process",
        {
          message: text,
          options: {
            grammarCheck: aiSettings.grammarCheck,
            toneAdjust: aiSettings.toneAdjust,
            tone: aiSettings.tone,
          },
        }
      );

      if (response.data.changed) {
        setAiSuggestion(response.data);
        setShowAISuggestion(true);
      }
    } catch (error) {
      console.error("AI processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !currentRoom) return;

    let finalMessage = text;
    let originalMessage = null;

    // Process with AI if enabled
    if (aiSettings.grammarCheck || aiSettings.toneAdjust) {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/ai/process",
          {
            message: text,
            options: {
              grammarCheck: aiSettings.grammarCheck,
              toneAdjust: aiSettings.toneAdjust,
              tone: aiSettings.tone,
            },
          }
        );

        if (response.data.changed) {
          finalMessage = response.data.processedMessage;
          originalMessage = text;
        }
      } catch (error) {
        console.error("AI processing error:", error);
        toast.error("AI processing failed, sending original message");
      }
    }

    // Send message
    onSendMessage({
      message: finalMessage,
      originalMessage,
      aiProcessed: originalMessage !== null,
    });

    // Clear input
    setMessageText("");
    setShowAISuggestion(false);
    setAiSuggestion(null);
    onTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const acceptAISuggestion = () => {
    if (aiSuggestion) {
      setMessageText(aiSuggestion.processedMessage);
      setShowAISuggestion(false);
      setAiSuggestion(null);
    }
  };

  const dismissAISuggestion = () => {
    setShowAISuggestion(false);
    setAiSuggestion(null);
  };

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💬</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to AI Chat!
          </h2>
          <p className="text-gray-600">
            Select a room from the sidebar to start chatting with AI assistance
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Grammar Check
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Tone Adjustment
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Multi-language Support
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
              {currentRoom.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {currentRoom.name}
              </h2>
              <p className="text-sm text-gray-500">
                {currentRoom.members?.length || 0} members
                {typingUsers.length > 0 && (
                  <span className="ml-2 text-green-600">
                    • {typingUsers.join(", ")}{" "}
                    {typingUsers.length === 1 ? "is" : "are"} typing...
                  </span>
                )}
              </p>
            </div>
          </div>

          <AIControls
            settings={aiSettings}
            onSettingsChange={setAiSettings}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} currentUser={user} />

      {/* AI Suggestion */}
      {showAISuggestion && aiSuggestion && (
        <div className="mx-4 mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                🤖 AI Suggestion:
              </p>
              <p className="text-sm text-yellow-700 mb-2">
                "{aiSuggestion.processedMessage}"
              </p>
              <p className="text-xs text-yellow-600">
                Original: "{aiSuggestion.originalMessage}"
              </p>
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={acceptAISuggestion}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Accept
              </button>
              <button
                onClick={dismissAISuggestion}
                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${currentRoom.name}...`}
              className="w-full max-h-32 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="1"
            />
          </div>

          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <FaceSmileIcon className="w-6 h-6" />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isProcessing}
            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>

        {isProcessing && (
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500 mr-2"></div>
            AI is processing your message...
          </div>
        )}
      </div>
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default ChatArea;
