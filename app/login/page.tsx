// =========================================================================
// app/login/page.tsx
// UPDATED: This page is now much simpler. It only handles the form submission.
"use client";
import { useState } from "react";
import AuthBg from "@/components/backgrounds/AuthBg";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If response is not ok, throw an error to be caught below
        throw new Error(data.message || "Login failed. Please try again.");
      }

      // On success, just call the login function.
      // The AuthProvider will handle the redirect automatically.
      login(data.user);

    } catch (err: any) {
      console.error("API Error Response:", err);
      setError(err.message);
      setIsLoading(false); // Stop loading on error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative">
      <div className="hidden md:block absolute inset-0">
        <AuthBg />
      </div>

      {/* Loading overlay can be simplified */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-sm tracking-wide">
              Verifying credentials...
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm rounded-xl shadow-lg p-8
                     bg-white md:bg-gray-800/20 md:backdrop-blur-md
                     border border-gray-200 md:border-gray-700/50
                     md:text-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-gray-100 mb-2 text-center">
          SSI Studios Admin
        </h1>
        <p className="text-gray-500 md:text-gray-300 text-sm text-center mb-6">
          Please log in to continue
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 md:text-gray-300">
              Username
            </label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2
                         text-gray-900 md:text-white
                         focus:outline-none focus:ring-2 focus:ring-black md:focus:ring-blue-300
                         bg-white md:bg-gray-900/30 md:border-gray-700/50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 md:text-gray-300">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2
                         text-gray-900 md:text-white
                         focus:outline-none focus:ring-2 focus:ring-black md:focus:ring-blue-300
                         bg-white md:bg-gray-900/30 md:border-gray-700/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         md:bg-gray-800/40 md:border md:border-gray-700/50 md:hover:bg-gray-700/50 md:shadow-inner"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}