// src/utils/helpers.js

// Format time ago
export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return time.toLocaleDateString();
};

// Validate user ID
export const isValidUserId = (userId) => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(userId);
};

// Validate phone number
export const isValidPhoneNumber = (phoneNumber) => {
  return /^[0-9]{10,15}$/.test(phoneNumber);
};

// Generate avatar URL
export const getAvatarUrl = (name, userId) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || userId
  )}&background=random&size=128`;
};

// Detect message language
export const detectLanguage = (text) => {
  if (/[है|हैं|का|की|के|में|से|को|पर|और|या|नहीं]/.test(text)) {
    return "hindi";
  } else if (
    /[hai|hain|kar|ki|ke|mein|se|ko|par|aur|ya|nahi|kya|kaise]/.test(text)
  ) {
    return "roman_hindi";
  }
  return "english";
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};
