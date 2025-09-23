import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const App = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [redirectUrl, setRedirectUrl] = useState(""); // store URL dynamically

  const templates = [
    {
      imageUrl: "/visitingcards/darkpreview.jpg",
      title: "Visiting Card (Dark Theme)",
      description: `Clean dark theme with professional typography. Perfect for networking and corporate branding.`,
      editorUrl: "/visitingcards/dark",
    },
    {
      imageUrl: "/visitingcards/lightpreview.jpg",
      title: "Visiting Card (Light Theme)",
      description: `Clean light theme with professional typography. Perfect for networking and corporate branding.`,
      editorUrl: "/visitingcards/light",
    },
  ];

  const handleUseTemplate = (url: string) => {
    setRedirectUrl(url);
    setIsRedirecting(true);
  };

  useEffect(() => {
    if (isRedirecting && redirectUrl) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            window.location.href = redirectUrl;
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isRedirecting, redirectUrl]);

  return (
    <div className="flex flex-col justify-start items-start min-h-[50vh] bg-transparent font-sans p-2 sm:p-4">
      {/* Section Heading */}
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-lg sm:text-xl font-semibold text-gray-700 mb-6 pl-4 tracking-normal"
      >
       
      </motion.h2>

      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-25 w-full max-w-4xl">
        {templates.map((template, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-white/5 rounded-lg p-2 shadow-md flex flex-col items-center gap-2 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-[1.01]"
          >
            {/* Preview */}
            <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden shadow-sm">
              <img
                src={template.imageUrl}
                alt={template.title}
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Text + Button */}
            <div className="w-full text-center">
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-sm sm:text-base font-semibold mb-1 text-gray-900"
              >
                {template.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-gray-500 mb-2 text-xs sm:text-sm leading-snug line-clamp-3"
              >
                {template.description}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                onClick={() => handleUseTemplate(template.editorUrl)}
                className="w-full md:w-auto bg-gray-800 text-white font-medium py-1.5 px-3 rounded-full shadow-sm hover:bg-gray-900 transition-all duration-300 cursor-pointer text-xs"
                disabled={isRedirecting}
              >
                Use this Template
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Redirecting Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center transition-opacity duration-700">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-60 p-4 rounded-lg bg-gray-900/70 border border-white/10 shadow-2xl backdrop-blur-md"
          >
            <h2 className="text-sm text-gray-200 font-medium mb-2 text-center">
              Setting up editing environment
            </h2>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400 text-center">
              Preparing your workspace...
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default App;
