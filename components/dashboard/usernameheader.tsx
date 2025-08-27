"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Helper to capitalize the first letter
function capitalizeFirstLetter(name: string): string {
  if (!name) return "Guest";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Animated SVG character with anime-style features
const WavingAnimeCharacter = () => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className="absolute h-10 w-10"
      style={{ top: "-20px", left: "20px" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        damping: 10,
        stiffness: 100,
        delay: 0.8,
      }}
    >
      {/* Head and Hair */}
      <motion.path
        d="M50,20 Q60,10 70,20 L65,30 Q60,40 50,35 Q40,40 35,30 L30,20 Q40,10 50,20"
        fill="#f3a745"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1 }}
      />
      {/* Headband */}
      <motion.rect
        x="20"
        y="28"
        width="60"
        height="8"
        rx="4"
        fill="#333"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1.1 }}
      />
      {/* Headband Symbol (e.g., a swirl) */}
      <motion.path
        d="M45,32 C48,30 52,30 55,32"
        stroke="#fff"
        strokeWidth="1.5"
        fill="none"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1.2 }}
      />
      {/* Eyes */}
      <motion.circle cx="43" cy="45" r="3" fill="#333" />
      <motion.circle cx="57" cy="45" r="3" fill="#333" />
      {/* Mouth */}
      <motion.path
        d="M45,55 Q50,60 55,55"
        stroke="#333"
        strokeWidth="2"
        fill="none"
      />
      {/* Waving arm */}
      <motion.path
        d="M70,60 C80,50 85,40 80,30 L75,35"
        stroke="#f3a745"
        strokeWidth="10"
        strokeLinecap="round"
        initial={{ rotate: 0 }}
        animate={{
          rotate: [0, 20, -10, 20, 0],
          y: [0, -5, 5, -5, 0],
        }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 2.5,
          delay: 1.5,
        }}
      />
    </motion.svg>
  );
};

export default function UserHeader() {
  const { user } = useAuth();
  const displayName = capitalizeFirstLetter(user?.username || "Guest");

  return (
    <motion.header
      className="mb-8 hidden lg:block"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.h1
        className="text-4xl sm:text-5xl font-bold tracking-tight mb-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
      >
        <span>Welcome back,</span>
        <span className="relative inline-block ml-2">
          <WavingAnimeCharacter />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-700">
            {displayName}
          </span>
        </span>
      </motion.h1>

      <motion.p
        className="text-lg text-gray-600"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
      >
        Let's get your creative projects started.
      </motion.p>
    </motion.header>
  );
}