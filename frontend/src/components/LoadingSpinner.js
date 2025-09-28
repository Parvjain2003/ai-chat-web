// src/components/LoadingSpinner.js
import React from "react";

const LoadingSpinner = ({ size = "medium", className = "" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-200 border-t-primary-600 h-full w-full"></div>
    </div>
  );
};

export default LoadingSpinner;
