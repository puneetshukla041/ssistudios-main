"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  CheckCircle,
  Lock,
  Settings,
  Shield,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  _id: string;
  username: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTick, setShowTick] = useState<boolean>(false);

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? "Invalid Date"
        : date.toLocaleDateString(undefined, options);
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    async function fetchProfileData() {
      if (!user) {
        setIsLoading(false);
        setError("User not authenticated.");
        return;
      }

      const startTime = Date.now();

      try {
        const userId = (user as any)._id || (user as any).id || (user as any).uid;
        if (!userId) {
          setIsLoading(false);
          setError("User ID not found in session.");
          return;
        }

        const response = await fetch(`/api/user?userId=${userId}`);
        if (!response.ok)
          throw new Error(`Failed to fetch profile: ${response.statusText}`);

        const data = await response.json();
        setProfileData(data.data);
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch user profile:", err);
      } finally {
        const elapsed = Date.now() - startTime;
        const circleDuration = 2000;
        const tickDuration = 2000;

        // Wait for circle to complete, then show tick
        setTimeout(
          () => {
            setShowTick(true);
            // Wait for tick animation to finish, then hide loading
            setTimeout(() => setIsLoading(false), tickDuration);
          },
          circleDuration - elapsed > 0 ? circleDuration - elapsed : 0
        );
      }
    }

    fetchProfileData();
  }, [user]);

  return (
    <main className="flex-1 min-h-screen flex items-center justify-center p-4 font-sans bg-transparent">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <motion.div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-24 h-24">
                {/* Background circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="46"
                  stroke="rgba(229,231,235,0.3)"
                  strokeWidth="4"
                  fill="transparent"
                />
                {/* Animated progress circle */}
                <motion.circle
                  cx="48"
                  cy="48"
                  r="46"
                  stroke="#60A5FA"
                  strokeWidth="4"
                  fill="transparent"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: 0 }}
                  animate={{ strokeDasharray: 2 * Math.PI * 46 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                />
              </svg>

              {/* Tick animation after circle completes */}
              {showTick && (
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="absolute"
                >
                  <CheckCircle size={48} className="text-green-500" />
                </motion.div>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xl text-gray-600 font-medium mt-4"
            >
              Fetching profile details...
            </motion.p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center p-8 rounded-2xl bg-transparent border border-red-300 shadow-md"
          >
            <p className="text-xl font-semibold text-red-700">Error:</p>
            <p className="mt-2 text-red-600">{error}</p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="w-full max-w-4xl p-8 rounded-2xl shadow-xl border border-gray-300 bg-transparent"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 10 }}
                className="p-4 rounded-full bg-transparent text-blue-500 inline-block mb-2 border border-blue-200"
              >
                <User size={48} />
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">
                {profileData?.username || "Guest"}
              </h1>
              <p className="text-md text-gray-500 mt-1 font-light">Your Profile Details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="flex flex-col items-start p-4 rounded-xl shadow-md border border-blue-200 bg-transparent"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  {/* Username */}
                  <div className="flex flex-col items-start p-4 rounded-xl shadow-md border border-blue-200 bg-transparent">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={20} className="text-blue-500" />
                      <p className="text-xs text-gray-500 font-medium">Username</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.username}</p>
                  </div>
                  {/* Password */}
                  <div className="flex flex-col items-start p-4 rounded-xl shadow-md border border-pink-200 bg-transparent">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock size={20} className="text-pink-500" />
                      <p className="text-xs text-gray-500 font-medium">Password</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {profileData?.password || "N/A"}
                    </p>
                  </div>
                  {/* Created At */}
                  <div className="flex flex-col items-start p-4 rounded-xl shadow-md border border-green-200 bg-transparent">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={20} className="text-green-500" />
                      <p className="text-xs text-gray-500 font-medium">Account Created</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {profileData?.createdAt ? formatDate(profileData.createdAt) : "N/A"}
                    </p>
                  </div>
                  {/* Updated At */}
                  <div className="flex flex-col items-start p-4 rounded-xl shadow-md border border-yellow-200 bg-transparent">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={20} className="text-yellow-500" />
                      <p className="text-xs text-gray-500 font-medium">Last Updated</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {profileData?.updatedAt ? formatDate(profileData.updatedAt) : "N/A"}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Account Settings */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Account Settings</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Email Notifications</span>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Two-Factor Authentication</span>
                    <input type="checkbox" className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Auto-save Projects</span>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                </div>
              </motion.div>

              {/* Security */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Security</h2>
                </div>
                <div className="space-y-4">
                  <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    Change Password
                  </button>
                  <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    Login History
                  </button>
                  <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    Active Sessions
                  </button>
                </div>
              </motion.div>

              {/* Preferences */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Bell className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Preferences</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>UTC-5 (Eastern)</option>
                      <option>UTC-8 (Pacific)</option>
                      <option>UTC+0 (GMT)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
              className="text-center mt-12"
            >
              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}