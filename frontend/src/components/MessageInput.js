import React, { useState, useRef } from "react";
import { Send, Settings, RefreshCw, Check, X, Wand2 } from "lucide-react";
import { chatApi } from "../services/api";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

const MessageInput = ({ onSendMessage, onTyping, disabled }) => {
  const [message, setMessage] = useState("");
  const [originalMessage, setOriginalMessage] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [suggestionType, setSuggestionType] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [processing, setProcessing] = useState(false);
  const textareaRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    setShowSuggestion(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }

    if (onTyping) {
      onTyping();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get Grammar Suggestion
  const handleGrammarCheck = async () => {
    console.log("=== Grammar Check Started ===");

    if (!message.trim()) {
      toast.error("Please type a message first");
      return;
    }

    setProcessing(true);

    const requestPayload = {
      message: message.trim(),
      options: {
        grammarCheck: true,
        toneAdjust: false,
        tone: "neutral",
        save: false,
        includeEmbeddingInResponse: false,
      },
    };

    console.log("Sending grammar check request:", requestPayload);

    try {
      const response = await chatApi.processWithAI(
        message.trim(),
        requestPayload.options
      );

      console.log("Grammar check response received:", response);
      console.log("Response data:", response.data);

      if (response.data && response.data.success !== false) {
        if (response.data.changed) {
          console.log("✅ Grammar changes detected:", {
            original: response.data.originalMessage,
            processed: response.data.processedMessage,
          });

          setOriginalMessage(message);
          setAiSuggestion(response.data.processedMessage);
          setSuggestionType("grammar");
          setShowSuggestion(true);
          toast.success("Grammar suggestion ready!");
        } else {
          console.log("ℹ️ No grammar changes needed");
          toast.success("Your grammar is already perfect!");
        }
      } else {
        console.error("❌ API returned error:", response.data);
        toast.error(response.data.error || "Grammar check failed");
      }
    } catch (error) {
      console.error("❌ Grammar check request failed:");
      console.error("Error object:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        "Grammar check failed";

      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Get Tone Suggestion
  const handleToneAdjustment = async (tone) => {
    console.log(`=== Tone Adjustment Started (${tone}) ===`);

    if (!message.trim()) {
      toast.error("Please type a message first");
      return;
    }

    setProcessing(true);

    const requestPayload = {
      message: message.trim(),
      options: {
        grammarCheck: false,
        toneAdjust: true,
        tone: tone,
        save: false,
        includeEmbeddingInResponse: false,
      },
    };

    console.log("Sending tone adjustment request:", requestPayload);

    try {
      const response = await chatApi.processWithAI(
        message.trim(),
        requestPayload.options
      );

      console.log("Tone adjustment response received:", response);
      console.log("Response data:", response.data);

      if (response.data && response.data.success !== false) {
        if (response.data.changed) {
          console.log(`✅ Tone changes detected (${tone}):`, {
            original: response.data.originalMessage,
            processed: response.data.processedMessage,
          });

          setOriginalMessage(message);
          setAiSuggestion(response.data.processedMessage);
          setSuggestionType(`tone-${tone}`);
          setShowSuggestion(true);
          toast.success(
            `${
              tone.charAt(0).toUpperCase() + tone.slice(1)
            } tone suggestion ready!`
          );
        } else {
          console.log(`ℹ️ No tone changes needed for ${tone}`);
          toast.success(`Your message already has a ${tone} tone!`);
        }
      } else {
        console.error("❌ API returned error:", response.data);
        toast.error(response.data.error || "Tone adjustment failed");
      }
    } catch (error) {
      console.error("❌ Tone adjustment request failed:");
      console.error("Error object:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        "Tone adjustment failed";

      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const acceptSuggestion = () => {
    console.log("✅ Accepting suggestion:", aiSuggestion);
    setMessage(aiSuggestion);
    setShowSuggestion(false);
    setAiSuggestion("");
    setOriginalMessage("");
    toast.success("Suggestion applied!");

    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height =
            textareaRef.current.scrollHeight + "px";
        }
      }, 0);
    }
  };

  const rejectAndTryAgain = async () => {
    console.log("🔄 Trying another suggestion for type:", suggestionType);

    if (suggestionType.startsWith("tone-")) {
      const tones = ["formal", "casual", "friendly", "professional"];
      const currentTone = suggestionType.split("-")[1];
      const otherTones = tones.filter((t) => t !== currentTone);
      const randomTone =
        otherTones[Math.floor(Math.random() * otherTones.length)];

      await handleToneAdjustment(randomTone);
    } else {
      await handleGrammarCheck();
    }
  };

  const rejectSuggestion = () => {
    console.log("❌ Rejecting suggestion");
    setShowSuggestion(false);
    setAiSuggestion("");
    setOriginalMessage("");
    toast.info("Suggestion rejected");
  };

  const handleSendMessage = async () => {
    if (!message.trim() || disabled) return;

    console.log("📤 Sending message:", message.trim());
    onSendMessage(message.trim());
    setMessage("");
    setShowSuggestion(false);
    setAiSuggestion("");
    setOriginalMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="border-t border-gray-200">
      {/* AI Suggestion Panel */}
      {showSuggestion && (
        <div className="p-4 bg-blue-50 border-b border-blue-200 animate-slide-down">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Wand2 className="w-5 h-5 text-blue-600 mt-1" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-blue-900">
                  {suggestionType === "grammar"
                    ? "Grammar Suggestion"
                    : "Tone Adjustment"}
                </h3>
                {processing && <LoadingSpinner size="small" />}
              </div>

              <div className="space-y-2">
                <div className="p-2 bg-red-100 rounded border-l-4 border-red-400">
                  <p className="text-sm text-red-800">
                    <strong>Original:</strong> {originalMessage}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded border-l-4 border-green-400">
                  <p className="text-sm text-green-800">
                    <strong>Suggestion:</strong> {aiSuggestion}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={acceptSuggestion}
                  disabled={processing}
                  className="btn btn-primary btn-sm flex items-center space-x-1"
                >
                  <Check size={14} />
                  <span>Accept</span>
                </button>
                <button
                  onClick={rejectAndTryAgain}
                  disabled={processing}
                  className="btn btn-secondary btn-sm flex items-center space-x-1"
                >
                  <RefreshCw size={14} />
                  <span>Try Another</span>
                </button>
                <button
                  onClick={rejectSuggestion}
                  disabled={processing}
                  className="btn btn-outline btn-sm flex items-center space-x-1"
                >
                  <X size={14} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Controls */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={handleGrammarCheck}
            disabled={!message.trim() || processing}
            className="btn btn-outline btn-sm flex items-center space-x-1"
          >
            <span>📝</span>
            <span>Check Grammar</span>
            {processing && <LoadingSpinner size="small" />}
          </button>

          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600">Tone:</span>
            {["formal", "casual", "friendly", "professional"].map((tone) => (
              <button
                key={tone}
                onClick={() => handleToneAdjustment(tone)}
                disabled={!message.trim() || processing}
                className="btn btn-outline btn-sm capitalize"
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={disabled || processing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32 min-h-[48px]"
              rows="1"
            />

            {processing && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <LoadingSpinner size="small" />
              </div>
            )}
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || disabled || processing}
            className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
