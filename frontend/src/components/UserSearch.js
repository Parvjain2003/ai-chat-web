// src/components/UserSearch.js
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Search, User, Phone, Circle, UserCheck } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

const UserSearch = ({ onStartChat }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { searchUser } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    const result = await searchUser(searchTerm.trim());
    setSearchResult(result);
    setLoading(false);

    if (!result.found) {
      toast.error(result.message || "User not found");
    }
  };

  const handleStartChat = () => {
    if (searchResult?.user) {
      onStartChat(searchResult.user);
      setSearchTerm("");
      setSearchResult(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Find Someone to Chat
        </h2>
        <p className="text-gray-600">
          Enter a User ID or phone number to start chatting
        </p>
      </div>

      {/* Search Form */}
      <div className="p-6 bg-white border-b border-gray-200">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 text-lg"
              placeholder="Enter User ID or phone number..."
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="btn btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Search User</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Search Result */}
      <div className="flex-1 p-6">
        {searchResult && (
          <div className="animate-fade-in">
            {searchResult.found ? (
              <div className="card p-6 max-w-md">
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={
                      searchResult.user.avatar ||
                      `https://ui-avatars.com/api/?name=${searchResult.user.name}&background=random`
                    }
                    alt={searchResult.user.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {searchResult.user.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>@{searchResult.user.userId}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone size={14} />
                        <span>{searchResult.user.phoneNumber}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          searchResult.user.isOnline
                            ? "bg-green-400"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm text-gray-500">
                        {searchResult.user.isOnline
                          ? "Online"
                          : `Last seen ${formatDistanceToNow(
                              new Date(searchResult.user.lastSeen),
                              { addSuffix: true }
                            )}`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartChat}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Circle size={16} />
                  <span>Start Chatting</span>
                </button>
              </div>
            ) : (
              <div className="card p-6 max-w-md">
                <div className="text-center text-gray-500">
                  <UserCheck size={48} className="mx-auto mb-3 text-gray-300" />
                  <h3 className="font-medium text-gray-700 mb-2">
                    User Not Found
                  </h3>
                  <p className="text-sm">
                    No user exists with this User ID or phone number.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Make sure you've entered the correct information.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!searchResult && !loading && (
          <div className="text-center text-gray-500 mt-12">
            <Search size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Find New Friends
            </h3>
            <p className="text-sm max-w-md mx-auto">
              Enter someone's User ID or phone number to start a conversation.
              Make sure they're already registered on the platform.
            </p>

            <div className="mt-6 text-left max-w-sm mx-auto">
              <h4 className="font-medium text-gray-700 mb-2">Search Tips:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• User ID example: john_doe123</li>
                <li>• Phone number example: 1234567890</li>
                <li>• Make sure the person is registered</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
