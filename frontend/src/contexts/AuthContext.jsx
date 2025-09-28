// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const initAuth = () => {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          // Set default authorization header
          api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        } catch (error) {
          console.error("Error parsing saved user:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await api.post("/auth/login", {
        identifier,
        password,
      });

      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Set default authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      toast.success("Login successful!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);

      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Set default authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      toast.success("Registration successful!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
      toast.success("Logged out successfully");
    }
  };

  const searchUser = async (identifier) => {
    try {
      const response = await api.get(
        `/auth/search?identifier=${encodeURIComponent(identifier)}`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Search failed";
      return { found: false, error: message };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    searchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
