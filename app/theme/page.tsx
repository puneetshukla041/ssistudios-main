"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme, CherryBlossomBackground, Theme } from "@/contexts/ThemeContext";

// Icons
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 21v-2.25m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FlowerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9.75 21.75M3.75 15.904l1.84-1.84a5.25 5.25 0 017.424 0l.969.969a1.125 1.125 0 001.957 0h3.843a1.125 1.125 0 001.957 0l.969-.969a5.25 5.25 0 017.424 0l1.84 1.84M15.75 12.185v-1.378a3.375 3.375 0 00-3.375-3.375H12a2.625 2.625 0 00-2.625 2.625v1.378M9.75 15.904h7.5M10.5 7.5v-1.875c0-.621.504-1.125 1.125-1.125h.75c.621 0 1.125.504 1.125 1.125v1.875m-3.75 0h7.5" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9.5 14.25a.75.75 0 01-1.154.114l-6-5.5a.75.75 0 111.02-1.102l5.093 4.685 8.541-12.793a.75.75 0 011.04-.208z" clipRule="evenodd" />
  </svg>
);

const ThemePageComponent = () => {
  const { theme, setTheme } = useTheme();
  const [applying, setApplying] = useState(false);

  // Only light and flower themes
  const themes = [
    { name: "light", label: "Sunrise", icon: <SunIcon />, bgColor: "bg-white", textColor: "text-gray-800" },
    { name: "flower", label: "Blossom", icon: <FlowerIcon />, bgColor: "bg-pink-100", textColor: "text-gray-900" },
  ];

  const applyTheme = (newTheme: Theme) => {
    if (theme === newTheme) return;
    setApplying(true);
    setTheme(newTheme);
    setTimeout(() => setApplying(false), 500);
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
      <CherryBlossomBackground />

      {applying && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="w-20 h-20 border-4 border-white rounded-full border-t-transparent animate-spin" />
        </motion.div>
      )}

      {/* Header */}
      <div className="text-center max-w-2xl py-8">
        <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tighter">Customize Your Experience</h1>
        <p className="text-lg md:text-xl font-medium opacity-80">Select a theme that best fits your style.</p>
      </div>

      {/* Theme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl py-12">
        {themes.map((t) => (
          <motion.div
            key={t.name}
            className={`relative flex flex-col items-center justify-center p-8 rounded-3xl shadow-2xl cursor-pointer transition-all duration-300
              ${theme === t.name ? "ring-4 ring-blue-500 ring-offset-4 ring-offset-white scale-105" : "hover:scale-105"}
              ${t.bgColor} ${t.textColor}`}
            onClick={() => applyTheme(t.name as Theme)}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center justify-center w-28 h-28 mb-4">{t.icon}</div>
            <h2 className="text-2xl font-bold mb-1">{t.label}</h2>
            <p className="text-sm font-medium opacity-70">{theme === t.name ? "Currently Active" : "Click to Apply"}</p>
            {theme === t.name && (
              <motion.div
                className="absolute top-6 right-6 text-blue-500 bg-white rounded-full p-2 shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <CheckIcon />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ThemePageComponent;
