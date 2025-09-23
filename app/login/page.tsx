"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthBg from "@/components/backgrounds/AuthBg";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { XMarkIcon, PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestPhone, setRequestPhone] = useState("");
  const [requestIDFile, setRequestIDFile] = useState<File | null>(null);
  const [requestComment, setRequestComment] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

      setTimeout(() => {
        setIsLoading(false);
        setShowTick(true);

        setTimeout(() => {
          setShowTick(false);
          setShowWelcome(true);

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

  const handleIDFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setRequestError(`File size must be less than ${MAX_FILE_SIZE_MB}MB.`);
      setRequestIDFile(null);
    } else {
      setRequestError("");
      setRequestIDFile(file);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    setIsRequestLoading(true);

    // Basic validation
    if (!requestName || !requestPhone) {
      setRequestError("Full Name and Phone Number are required.");
      setIsRequestLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("fullName", requestName);
    formData.append("phoneNumber", requestPhone);
    formData.append("comment", requestComment);
    if (requestIDFile) {
      formData.append("idCard", requestIDFile);
    }

    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to submit request. Please try again.");

      alert("Your access request has been submitted successfully!");
      setShowRequestModal(false);
      setRequestName("");
      setRequestPhone("");
      setRequestIDFile(null);
      setRequestComment("");
      setIsRequestLoading(false);

    } catch (err: any) {
      console.error("API Error Response:", err);
      setRequestError(err.message);
      setIsRequestLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-transparent relative p-4 md:p-10 font-sans">
      <div className="hidden md:block absolute inset-0">
        <AuthBg />
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="text-center text-white"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <motion.div
                className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-white text-lg tracking-wide font-semibold">
                Verifying credentials...
              </p>
            </motion.div>
          </motion.div>
        )}

        {showTick && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative flex flex-col items-center justify-center rounded-3xl bg-white shadow-2xl p-10 w-[200px] h-[200px]"
              initial={{ scale: 0, rotate: 20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <AnimatePresence>
                {[...Array(14)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-green-400"
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
              <motion.svg
                className="w-20 h-20 text-green-500 relative z-10"
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
              </motion.svg>
              <motion.p
                className="text-green-600 font-extrabold mt-3 text-2xl tracking-wide relative z-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                Success!
              </motion.p>
            </motion.div>
          </motion.div>
        )}


  {showWelcome && (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute w-full h-full"
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-green-400/40 via-blue-400/30 to-purple-400/40 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </motion.div>
      <AnimatePresence>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400"
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos((i / 20) * 2 * Math.PI) * 400,
              y: Math.sin((i / 20) * 2 * Math.PI) * 400,
              scale: 0.5,
            }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
      <motion.div
        className="relative bg-black/40 rounded-3xl p-12 text-center shadow-2xl border border-gray-700/60 backdrop-blur-3xl overflow-hidden"
        initial={{ scale: 0.5, rotateY: 90, opacity: 0 }}
        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <motion.h2
          className="text-4xl font-extrabold mb-3 text-white relative inline-block"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Welcome, <span className="text-pink-400">{username}!</span>
        </motion.h2>
        <motion.p
          className="text-gray-300 text-xl font-light mt-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Glad to see you back.
        </motion.p>
        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1), transparent 70%)' }} />
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      <div className="hidden md:flex relative z-10 w-full max-w-7xl h-[650px] rounded-[3rem] p-12
                         bg-gradient-to-tr from-gray-900/40 to-black/30
                         border border-gray-700/60 shadow-3xl backdrop-blur-3xl
                         transition-all duration-500 hover:scale-[1.01] hover:shadow-4xl
                         text-gray-100 items-center justify-between overflow-hidden">

        {/* Left Side: Animated Welcome Message */}
        <motion.div
          className="flex flex-col h-full justify-center items-start w-1/2 p-6"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
        >
          <div className="flex flex-col items-start space-y-4">
            <h1 className="text-6xl font-extrabold text-white leading-tight">
              Welcome to <br />
            </h1>
          </div>
          <div className="relative -mt-0 ml-0">
            <Logo />
          </div>
          <motion.p
            className="text-sm text-gray-300 italic mt-4 max-w-xs tracking-wide"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            This portal is for authorized personnel only. Your credentials grant access to
            project management, user analytics, and system configurations.
          </motion.p>






          <motion.button
            className="mt-6 flex items-center px-4 py-2 text-sm font-semibold text-blue-300 border border-blue-400/40 rounded-full
                          hover:text-white hover:bg-blue-500/20 transition-all duration-300 backdrop-blur-sm cursor-pointer"
            onClick={() => setShowRequestModal(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Request Access
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </motion.button>

        </motion.div>

        {/* Right Side: Login Form with animations */}
        <motion.div
          className="w-1/2 p-12 bg-black/20 rounded-3xl backdrop-blur-2xl h-full flex flex-col justify-center
                          border border-gray-700/50 shadow-inner"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
        >
          <h2 className="text-3xl font-extrabold mb-2 text-center text-white">User Portal</h2>
          <p className="text-gray-400 text-sm mb-8 text-center">
            Access your control panel with your credentials.
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-900/50 text-red-300 text-sm px-4 py-3 rounded-xl mb-6 text-center border border-red-800"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                className="w-full border border-gray-600 rounded-xl px-5 py-3
                                 bg-gray-800/50 text-white placeholder-gray-500
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                 transition-colors duration-200"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading || showTick || showWelcome}
              />
            </motion.div>

            <motion.div
              className="relative"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-600 rounded-xl px-5 py-3 pr-12
                                 bg-gray-800/50 text-white placeholder-gray-500
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                 transition-colors duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading || showTick || showWelcome}
              />
              <motion.button
                type="button"
                className="absolute inset-y-0 right-0 top-6 flex items-center pr-4 text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer"
                onClick={togglePasswordVisibility}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-6 h-6" />
                ) : (
                  <EyeIcon className="w-6 h-6" />
                )}
              </motion.button>


              
            </motion.div>

            <motion.button
              type="submit"
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2
                                 bg-gradient-to-r from-gray-700 to-gray-900 text-white
                                 hover:bg-gradient-to-r hover:from-gray-600 hover:to-gray-800
                                 transition-colors duration-300
                                 shadow-lg hover:shadow-xl transform hover:-translate-y-1
                                 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={isLoading || showTick || showWelcome}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    Logging in...
                  </motion.span>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <span>Login</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

            {/* NEW: SSI Maya Product line */}
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400 text-xs italic opacity-80">
    A SSI Maya Application
  </div>

        </motion.div>
      </div>

      {/* Mobile View - Remains untouched */}
      <div
        className="md:hidden relative z-10 w-full max-w-2xl aspect-video rounded-2xl p-8
                         bg-gradient-to-tr from-white/80 to-gray-100/70
                         border border-gray-200 shadow-xl backdrop-blur-md
                         transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
                         flex flex-col justify-center"
      >
        <h1 className="text-3xl font-semibold text-gray-900 mb-4 text-center">
          SSI Studios
        </h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Please log in to continue
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2
                                 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black
                                 bg-white transition-all duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading || showTick || showWelcome}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 pr-10
                                 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black
                                 bg-white transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading || showTick || showWelcome}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-400 hover:text-gray-700 cursor-pointer"
              onClick={togglePasswordVisibility}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                {showPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.575 3.01 9.963 7.822.01.033.01.065.023.098a1.012 1.012 0 010 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.575-3.01-9.963-7.822z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.982 12.964A8.96 8.96 0 0112 11.25c.81 0 1.597.117 2.355.334a.97.97 0 01.996.883v1.834c0 .538.438.976.976.976h2.25c.538 0 .976-.438.976-.976v-1.834a.97.97 0 01.996-.883c.758-.217 1.545-.334 2.355-.334A8.96 8.96 0 0112 13.914a8.96 8.96 0 01-8.018-1.95z"
                  />
                )}
              </svg>
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2.5 rounded-lg font-medium
                                 hover:bg-gray-800 transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-all duration-200 cursor-pointer"
            disabled={isLoading || showTick || showWelcome}
            onClick={handleLogin}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>

      {/* Request Access Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                onClick={() => setShowRequestModal(false)}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold mb-2">Request Access</h3>
              <p className="text-gray-500 text-sm mb-6">
                Fill out the form below to request access from the admin.
              </p>

              {requestError && (
                <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 text-center border border-red-500/20">
                  {requestError}
                </div>
              )}

              <form onSubmit={handleRequestAccess} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="e.g., Puneet Shukla"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={requestPhone}
                    onChange={(e) => setRequestPhone(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="+91-8527989270"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="idCard" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ID Card (Optional, max {MAX_FILE_SIZE_MB}MB)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="idCard"
                      type="file"
                      onChange={handleIDFileChange}
                      className="hidden"
                      accept="image/*, .pdf"
                    />
                    <label
                      htmlFor="idCard"
                      className="flex-grow flex items-center justify-center px-4 py-3 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 transition-colors cursor-pointer"
                    >
                      <PhotoIcon className="w-5 h-5 mr-2" />
                      {requestIDFile ? requestIDFile.name : "Choose a file"}
                    </label>
                  </div>
                  {requestIDFile && (
                    <p className="text-xs text-gray-500 mt-2">
                      File chosen: <span className="font-semibold">{requestIDFile.name}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comment
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    value={requestComment}
                    onChange={(e) => setRequestComment(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Explain why you need access..."
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full py-3 rounded-lg font-bold flex items-center justify-center space-x-2
                             bg-gradient-to-r from-blue-600 to-blue-800 text-white
                             hover:from-blue-500 hover:to-blue-700 transition-colors duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isRequestLoading}
                >
                  <AnimatePresence mode="wait">
                    {isRequestLoading ? (
                      <motion.span
                        key="request-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Submitting...
                      </motion.span>
                    ) : (
                      <motion.div
                        key="request-submit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2"
                      >
                        <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                        <span>Submit Request</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}