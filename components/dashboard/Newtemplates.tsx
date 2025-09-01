import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const App = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progress, setProgress] = useState(0);

  const imageData = {
    imageUrl: "/posters/poster1.jpg",
    title: "Poster Template",
    description: `This Welcome Poster is designed with a modern gradient background 
      and bold typography to make a lasting first impression. 
      It reflects the spirit of SS-Innovation and collaboration, 
      making it ideal for corporate events, conferences, or workplace branding. 
      Its clean and professional look ensures your message stands out with clarity and impact.`,
    uploadedBy: "John Doe",
    uploadedOn: "October 26, 2023",
  };

  const handleUseTemplate = () => {
    setIsRedirecting(true);
  };

  useEffect(() => {
    if (isRedirecting) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            window.location.href = "/poster/editor/singlelogo/poster1editor";
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isRedirecting]);

  return (
    <div className="flex flex-col justify-start items-start min-h-[50vh] bg-transparent font-sans p-2 sm:p-4">
      {/* Section Heading */}
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pl-4 tracking-normal"
      >
        Poster Template Library
      </motion.h2>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`
          w-full max-w-3xl bg-white/5 rounded-2xl p-3 sm:p-5 shadow-xl
          flex flex-col md:flex-row items-center gap-3 sm:gap-5
          backdrop-blur-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300
          transform hover:scale-[1.01]
        `}
      >
        {/* Left: Poster Preview */}
        <div className="md:w-1/2 w-full flex-shrink-0">
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg">
            <img
              src={imageData.imageUrl}
              alt={imageData.title}
              className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>

{/* Right: Text + Button */}
<div className="md:w-1/2 w-full text-center md:text-left flex flex-col">
  <motion.h1
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.6 }}
    className="text-xl sm:text-2xl font-bold mb-1 text-gray-900"
  >
    {imageData.title}
  </motion.h1>

  <motion.p
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.6 }}
    className="text-gray-700 mb-2 text-xs sm:text-sm leading-relaxed"
  >
    {imageData.description}
  </motion.p>

{/* Flex wrapper for button to push it slightly left from the edge */}
<div className="w-full flex justify-end">
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.7, duration: 0.6 }}
    onClick={handleUseTemplate}
    className="mr-29 bg-gray-900 text-white font-semibold py-1.5 px-3 rounded-full shadow-md border-2 border-blue-500 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 cursor-pointer text-xs"
    disabled={isRedirecting}
  >
    Use this Template
  </motion.button>

  </div>
</div>

      </motion.div>

      {/* Redirecting Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center transition-opacity duration-700">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-72 p-5 rounded-xl bg-neutral-900/70 border border-white/10 shadow-2xl backdrop-blur-md"
          >
            <h2 className="text-base text-white font-medium mb-3 text-center">
              Setting up editing environment
            </h2>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-300 text-center">
              Preparing your workspace...
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default App;
