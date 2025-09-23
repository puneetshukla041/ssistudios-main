import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

const Template = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [displayLine, setDisplayLine] = useState("");

  const titleControls = useAnimation();
  const descriptionControls = useAnimation();
  const buttonControls = useAnimation();

  const imageData = {
    imageUrl: "/posters/poster1.jpg",
    title: "Poster Template",
    description: `This Welcome Poster is designed with a modern gradient background and bold typography to make a lasting first impression. It reflects the spirit of SS-Innovation and collaboration, making it ideal for corporate events, conferences, or workplace branding. Its clean and professional look ensures your message stands out with clarity and impact.`,
  };

  const handleUseTemplate = () => {
    setIsRedirecting(true);
  };


// Animate the text and button elements on hover
const handleHoverStart = async () => {
  await titleControls.start({ y: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } });
  await descriptionControls.start({ y: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut", delay: 0.05 } });
  await buttonControls.start({ scale: 1, opacity: 1, transition: { duration: 0.25, ease: "easeOut", delay: 0.1 } });
};

const handleHoverEnd = async () => {
  await buttonControls.start({ scale: 0.9, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } });
  await descriptionControls.start({ y: "100%", opacity: 0, transition: { duration: 0.2, ease: "easeIn", delay: 0.05 } });
  await titleControls.start({ y: "100%", opacity: 0, transition: { duration: 0.2, ease: "easeIn", delay: 0.1 } });
};


  useEffect(() => {
    if (isRedirecting) {
      setProgress(0);

      // Smooth progress bar over 4 seconds
      const progressStart = performance.now();
      const progressDuration = 4000; // 4 seconds

      const progressAnimation = (timestamp: number) => {
        const elapsed = timestamp - progressStart;
        const percentage = Math.min((elapsed / progressDuration) * 100, 100);
        setProgress(percentage);

        if (percentage < 100) {
          requestAnimationFrame(progressAnimation);
        } else {
          setTimeout(() => {
            window.location.href = "/poster/editor/singlelogo/poster1editor";
          }, 300);
        }
      };

      requestAnimationFrame(progressAnimation);

      // Animate lines one by one
      const lines = [
        "Just a moment while we load everything up...",
        "AWS Bucket connecting...",
        "AWS Bucket connected",
        "Workspace Ready!"
      ];
      let index = 0;
      setDisplayLine(lines[index]);
      const lineInterval = setInterval(() => {
        index++;
        if (index < lines.length) setDisplayLine(lines[index]);
        else clearInterval(lineInterval);
      }, 1300); // 1.3s per line

      return () => clearInterval(lineInterval);
    }
  }, [isRedirecting]);

  return (
    <div className="flex flex-col justify-start items-start min-h-[50vh] bg-transparent font-sans p-2 sm:p-4">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-lg sm:text-xl font-bold font-['Be_Vietnam_Pro'] text-black mb-6 pl-60 tracking-normal"
      ></motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ease-in-out hover:scale-[1.02] cursor-pointer"
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        onClick={handleUseTemplate}
      >
        <div
          className="relative w-full aspect-[16/9] bg-cover bg-center"
          style={{ backgroundImage: `url(${imageData.imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2 text-white">
          <motion.h2
            initial={{ y: "100%", opacity: 0 }}
            animate={titleControls}
            className="text-2xl font-bold"
          >
            {imageData.title}
          </motion.h2>
          <motion.p
            initial={{ y: "100%", opacity: 0 }}
            animate={descriptionControls}
            className="text-sm"
          >
            {imageData.description}
          </motion.p>
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={buttonControls}
            disabled={isRedirecting}
            className="bg-white/10 text-white font-semibold py-2 px-4 rounded-full shadow-md border border-white/20 
                     hover:bg-white/20 transition-all duration-300 transform hover:scale-105 
                     cursor-pointer text-sm backdrop-blur-sm"
          >
            {isRedirecting ? "Loading..." : "Use this Template"}
          </motion.button>
        </div>
      </motion.div>

      {isRedirecting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center transition-opacity duration-700">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-80 p-6 rounded-2xl bg-neutral-900/80 border border-white/20 shadow-2xl backdrop-blur-md text-center"
          >
            <h2 className="text-xl text-white font-bold mb-4 tracking-wide">
              Preparing Your Workspace
            </h2>
            <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                style={{ width: `${progress}%` }}
                transition={{ duration: 4 }}
              />
            </div>

            <div className="mt-4 text-sm text-gray-400 h-6">
              <motion.p
                key={displayLine}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {displayLine}
              </motion.p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Template;
