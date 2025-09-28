import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar.jsx";
import ChatArea from "./ChatArea";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

const ChatApp = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      setupSocketListeners();

      // Join user's rooms
      const roomIds = rooms.map((room) => room._id);
      if (roomIds.length > 0) {
        socket.emit("join-rooms", roomIds);
      }
    }

    return () => {
      if (socket) {
        socket.off("new-message");
        socket.off("user-joined");
        socket.off("user-left");
        socket.off("user-typing");
      }
    };
  }, [socket, connected, rooms]);

  const loadRooms = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/rooms");
      setRooms(response.data);

      // Select first room by default
      if (response.data.length > 0 && !currentRoom) {
        setCurrentRoom(response.data[0]);
        loadMessages(response.data[0]._id);
      }
    } catch (error) {
      console.error("Failed to load rooms:", error);
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/messages/${roomId}`
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const setupSocketListeners = () => {
    socket.on("new-message", (messageData) => {
      if (messageData.room === currentRoom?._id) {
        setMessages((prev) => [...prev, messageData]);
      }

      // Update room's last message
      setRooms((prev) =>
        prev.map((room) =>
          room._id === messageData.room
            ? {
                ...room,
                lastMessage: messageData.message,
                lastActivity: messageData.timestamp,
              }
            : room
        )
      );
    });

    socket.on("user-joined", (data) => {
      // Handle user joined
    });

    socket.on("user-left", (data) => {
      // Handle user left
    });

    socket.on("user-typing", (data) => {
      if (data.room === currentRoom?._id) {
        if (data.typing) {
          setTypingUsers((prev) => [
            ...prev.filter((u) => u !== data.username),
            data.username,
          ]);
        } else {
          setTypingUsers((prev) => prev.filter((u) => u !== data.username));
        }

        // Clear typing after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== data.username));
        }, 3000);
      }
    });
  };

  const handleRoomSelect = (room) => {
    setCurrentRoom(room);
    loadMessages(room._id);

    if (socket) {
      socket.emit("join-room", room._id);
    }
  };

  const handleSendMessage = (messageData) => {
    if (socket && currentRoom) {
      socket.emit("send-message", {
        ...messageData,
        room: currentRoom._id,
      });

      // Add message locally for immediate feedback
      const newMessage = {
        ...messageData,
        id: Date.now(),
        username: user.username,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  const handleTyping = (isTyping) => {
    if (socket && currentRoom) {
      socket.emit("typing", {
        room: currentRoom._id,
        typing: isTyping,
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        rooms={rooms}
        currentRoom={currentRoom}
        onRoomSelect={handleRoomSelect}
        onCreateRoom={loadRooms}
      />
      <ChatArea
        currentRoom={currentRoom}
        messages={messages}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        typingUsers={typingUsers}
      />
    </div>
  );
};

export default ChatApp;
