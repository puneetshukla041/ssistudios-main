"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthBg from "@/components/backgrounds/AuthBg";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTick, setShowTick] = useState(false);

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

      if (!res.ok) throw new Error(data.message || "Login failed. Please try again.");

      // Step 1: Verifying credentials (1.5s)
      setTimeout(() => {
        setIsLoading(false);
        setShowTick(true);

        // Step 2: Green tick animation (1s)
        setTimeout(() => {
          setShowTick(false);
          setShowWelcome(true);

          // Step 3: Welcome username animation (2s)
          setTimeout(() => {
            setShowWelcome(false);
            login(data.user);
          }, 2000);
        }, 1000);
      }, 1500);
    } catch (err: any) {
      console.error("API Error Response:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative">
      <div className="hidden md:block absolute inset-0">
        <AuthBg />
      </div>

      {/* Animations */}
      <AnimatePresence>
        {/* Verifying credentials */}
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-sm tracking-wide font-semibold">
                Verifying credentials...
              </p>
            </div>
          </motion.div>
        )}

{/* Green tick with celebration */}
{showTick && (
<motion.div
  className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {/* Circular Badge */}
  <motion.div
    className="relative flex flex-col items-center justify-center 
               rounded-full bg-white shadow-2xl 
               w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 200, damping: 20 }}
  >
    {/* Confetti burst */}
    <AnimatePresence>
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400"
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos((i / 14) * 2 * Math.PI) * 100,
            y: Math.sin((i / 14) * 2 * Math.PI) * 100,
            scale: 0.5,
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      ))}
    </AnimatePresence>

    {/* Tick icon */}
    <svg
      className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-green-500 relative z-10"
      viewBox="0 0 24 24"
      fill="none"
    >
      <motion.path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </svg>

    {/* Success text */}
    <p className="text-green-600 font-bold mt-3 text-base sm:text-lg md:text-xl tracking-wide relative z-10">
      Success!
    </p>
  </motion.div>
</motion.div>

)}

{/* Welcome username */}
{showWelcome && (
  <motion.div
    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {/* Animated glowing background */}
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-green-400/40 via-blue-400/30 to-purple-400/40 blur-3xl"
      initial={{ scale: 0.8, opacity: 0.5 }}
      animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 8, repeat: Infinity }}
    />

    {/* Confetti burst */}
    <AnimatePresence>
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400"
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos((i / 14) * 2 * Math.PI) * 200,
            y: Math.sin((i / 14) * 2 * Math.PI) * 200,
            scale: 0.5,
          }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
      ))}
    </AnimatePresence>

    {/* Welcome Card */}
    <motion.div
      className="relative bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-2xl border border-white/20"
      initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Username with shimmer underline */}
      <motion.h2
        className="text-3xl font-extrabold mb-3 text-gray-900 dark:text-gray-100 relative inline-block"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Welcome,&nbsp;{username}!
        <motion.span
          className="absolute left-0 -bottom-1 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        />
      </motion.h2>

      {/* Subtext */}
      <motion.p
        className="text-gray-600 dark:text-gray-300 text-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        Glad to see you back 
      </motion.p>
    </motion.div>
  </motion.div>
)}


      </AnimatePresence>

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-2xl aspect-video rounded-2xl p-8
                   bg-gradient-to-tr from-white/80 to-gray-100/70
                   md:bg-gradient-to-tr md:from-gray-800/40 md:to-gray-900/30
                   border border-gray-200 md:border-gray-700/50
                   shadow-xl md:shadow-2xl
                   backdrop-blur-md
                   transition-all duration-300
                   hover:scale-[1.02] hover:shadow-2xl md:hover:shadow-3xl
                   md:text-gray-100 flex flex-col justify-center"
      >
        <h1 className="text-3xl font-semibold text-gray-900 md:text-gray-100 mb-4 text-center">
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
                         bg-white md:bg-gray-900/30 md:border-gray-700/50
                         transition-all duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading || showTick || showWelcome}
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
                         bg-white md:bg-gray-900/30 md:border-gray-700/50
                         transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading || showTick || showWelcome}
            />
          </div>

<button
  type="submit"
  className="w-full bg-black text-white py-2.5 rounded-lg font-medium
             hover:bg-gray-800 transition-colors
             disabled:opacity-50 disabled:cursor-not-allowed
             md:bg-gray-800/40 md:border md:border-gray-700/50 md:hover:bg-gray-700/50 md:shadow-inner
             transition-all duration-200 cursor-pointer" // ✅ added this
  disabled={isLoading || showTick || showWelcome}
>
  {isLoading ? "Logging in..." : "Login"}
</button>

        </form>
      </div>
    </div>
  );
}
