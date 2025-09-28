import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import CreateRoomModal from "./CreateRoomModal";
import UserProfile from "./UserProfile";

const Sidebar = ({ rooms, currentRoom, onRoomSelect, onCreateRoom }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuth();

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${user?.username}&background=random`
                }
                alt="Profile"
                className="w-10 h-10 rounded-full cursor-pointer"
                onClick={() => setShowProfile(true)}
              />
              <div>
                <h2 className="font-semibold">{user?.username}</h2>
                <p className="text-sm opacity-80">Online</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 hover:bg-green-700 rounded-full transition-colors"
                title="Create Room"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="p-2 hover:bg-green-700 rounded-full transition-colors"
                title="Settings"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI Controls */}
          <div className="flex space-x-2 text-xs">
            <span className="bg-green-500 px-2 py-1 rounded-full">
              🤖 AI Grammar
            </span>
            <span className="bg-green-500 px-2 py-1 rounded-full">
              🎭 Tone Adjust
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room) => (
            <div
              key={room._id}
              onClick={() => onRoomSelect(room)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                currentRoom?._id === room._id
                  ? "bg-green-50 border-r-4 border-r-green-500"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {room.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {room.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatTime(room.lastActivity)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {room.lastMessage || "No messages yet..."}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {room.members?.length || 0} members
                    </span>
                    {room.isPrivate && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={onCreateRoom}
        />
      )}

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Sidebar;
