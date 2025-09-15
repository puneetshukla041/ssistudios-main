import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const messages = [
  "Setting up editing environment...",
  "Loading creative assets...",
  "Almost ready to design...",
  "Applying magic to your poster..."
];

export default function Preloader({ onFinish }: { onFinish: () => void }) {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    // cycle messages every second
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 1000);

    // finish preloader after 3 seconds
    const finishTimeout = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(finishTimeout);
    };
  }, [onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white"
      >
        {/* Loader Circle */}
        <div className="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>

        {/* Animated Messages */}
        <motion.div
          key={currentMessage}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 text-center text-sm font-medium tracking-wider"
        >
          {messages[currentMessage]}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
