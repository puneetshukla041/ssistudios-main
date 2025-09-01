import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const App = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progress, setProgress] = useState(0);

  const imageData = {
    imageUrl: "/certificates/certificate.jpg",
    title: "Certificate Template",
    description: `This elegant Certificate Template features a balanced layout 
      with clean typography and refined borders. 
      Designed to celebrate achievements, milestones, and recognition events, 
      it ensures a professional and dignified presentation. 
      Ideal for awards, workshops, academic excellence, and corporate certifications.`,
    uploadedBy: "Jane Smith",
    uploadedOn: "August 28, 2024",
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
            window.location.href =
              "/certificates/training";
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
        className="text-lg sm:text-xl font-semibold text-black mb-4 pl-2 tracking-normal"
      >
        Certificate Template Library
      </motion.h2>

{/* Main Card */}
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="
    w-full max-w-3xl bg-white rounded-xl p-3 shadow-md
    flex flex-col md:flex-row items-center gap-2
    border border-gray-300 hover:border-gray-500 transition-all duration-300
    transform hover:scale-[1.01]
  "
>
  {/* Left: Certificate Preview */}
  <div className="md:w-1/2 w-full flex-shrink-0">
    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-md">
      <img
        src={imageData.imageUrl}
        alt={imageData.title}
        className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
      />
    </div>
  </div>

  {/* Right: Text + Button */}
  <div className="md:w-1/2 w-full text-center md:text-left flex flex-col justify-between">
    <div>
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-lg sm:text-xl font-bold mb-1 text-black"
      >
        {imageData.title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-gray-700 mb-2 text-xs sm:text-sm leading-snug"
      >
        {imageData.description}
      </motion.p>
    </div>

    {/* Flex wrapper to push button slightly left from the right edge */}
    <div className="w-full flex justify-end mt-2">
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        onClick={handleUseTemplate}
        className="mr-35 bg-gray-900 text-white font-semibold py-1 px-3 rounded-full shadow-md border-2 border-blue-500 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 cursor-pointer text-xs"
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
            className="relative w-64 p-4 rounded-lg bg-gray-900 border border-gray-700 shadow-lg backdrop-blur-md"
          >
            <h2 className="text-sm text-white font-medium mb-2 text-center">
              Preparing Certificate Editor
            </h2>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-300 text-center">
              Loading workspace...
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default App;
