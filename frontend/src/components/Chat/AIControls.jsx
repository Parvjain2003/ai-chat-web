import React from "react";

const AIControls = ({ settings, onSettingsChange, isProcessing }) => {
  const handleGrammarToggle = () => {
    console.log("Grammar toggle clicked, current settings:", settings);
    onSettingsChange((prev) => {
      const newSettings = {
        ...prev,
        grammarCheck: !prev.grammarCheck,
      };
      console.log("Grammar toggle - updating from:", prev, "to:", newSettings);
      return newSettings;
    });
  };

  const handleToneToggle = () => {
    console.log("Tone toggle clicked, current settings:", settings);
    onSettingsChange((prev) => {
      const newSettings = {
        ...prev,
        toneAdjust: !prev.toneAdjust,
      };
      console.log("Tone toggle - updating from:", prev, "to:", newSettings);
      return newSettings;
    });
  };

  const handleToneChange = (tone) => {
    console.log(
      "Tone change clicked, new tone:",
      tone,
      "current settings:",
      settings
    );
    onSettingsChange((prev) => {
      const newSettings = {
        ...prev,
        tone,
        toneAdjust: tone !== "neutral", // Only enable tone adjust if tone is not neutral
      };
      console.log("Tone change - updating from:", prev, "to:", newSettings);
      return newSettings;
    });
  };

  console.log("AIControls rendering with settings:", settings);

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        {isProcessing && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="w-4 h-4 mr-2">
              <div className="w-full h-full border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            AI Processing...
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGrammarToggle}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              settings.grammarCheck
                ? "bg-green-500 text-white shadow-md hover:bg-green-600"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
            title={
              settings.grammarCheck
                ? "Disable Grammar Check"
                : "Enable Grammar Check"
            }
          >
            <span className="mr-1">📝</span>
            Grammar
            {settings.grammarCheck && (
              <span className="ml-1 text-xs bg-green-600 px-1 rounded">ON</span>
            )}
          </button>

          <button
            onClick={handleToneToggle}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              settings.toneAdjust
                ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
            title={
              settings.toneAdjust
                ? "Disable Tone Adjustment"
                : "Enable Tone Adjustment"
            }
          >
            <span className="mr-1">🎭</span>
            Tone
            {settings.toneAdjust && (
              <span className="ml-1 text-xs bg-blue-600 px-1 rounded">ON</span>
            )}
          </button>
        </div>

        <select
          value={settings.tone || "neutral"}
          onChange={(e) => handleToneChange(e.target.value)}
          className={`text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
            settings.toneAdjust
              ? "border-blue-300 focus:ring-blue-500 bg-white"
              : "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!settings.toneAdjust}
          title={
            settings.toneAdjust
              ? "Select tone style"
              : "Enable tone adjustment first"
          }
        >
          <option value="neutral">Neutral</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
          <option value="friendly">Friendly</option>
          <option value="professional">Professional</option>
        </select>
      </div>

      <div className="text-xs text-gray-500">
        {settings.grammarCheck || settings.toneAdjust ? (
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
            AI features active
          </span>
        ) : (
          <span className="flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
            AI features disabled
          </span>
        )}
      </div>
    </div>
  );
};

export default AIControls;
