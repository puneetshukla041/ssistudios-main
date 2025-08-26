// welcomeanimation.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WelcomeAnimation = ({ onComplete }) => {
  const [currentThought, setCurrentThought] = useState(0);
  const thoughts = ['AI', 'CODE', 'DESIGN', 'INNOVATION', 'FUTURE', 'CREATIVITY'];

  // This effect cycles through the "thoughts"
  useEffect(() => {
    const thoughtInterval = setInterval(() => {
      setCurrentThought(prev => (prev + 1) % thoughts.length);
    }, 1500); // Change thought every 1.5 seconds

    // This timeout triggers the completion of the animation
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 6000); // Animation runs for 6 seconds before completing

    return () => {
      clearInterval(thoughtInterval);
      clearTimeout(completeTimeout);
    };
  }, [thoughts.length, onComplete]);

  // Framer Motion Variants for the animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Stagger effect for each letter
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 1, ease: 'easeInOut' },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 10,
        stiffness: 100,
      },
    },
  };

  const thoughtVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      className="welcome-container"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <motion.h1 className="title">
        {'SSI STUDIO'.split('').map((char, index) => (
          <motion.span key={index} variants={letterVariants} className="title-letter">
            {char === ' ' ? '\u00A0' : char} {/* Handles spaces */}
          </motion.span>
        ))}
      </motion.h1>

      <div className="thought-container">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentThought}
            variants={thoughtVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="thought-text"
          >
            {thoughts[currentThought]}
          </motion.p>
        </AnimatePresence>
      </div>

      <style jsx>{`
        .welcome-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #0d0c1d; /* Deep, dark background */
          color: #f0f0f0;
          font-family: 'Segoe UI', 'Roboto', sans-serif;
          z-index: 999;
          text-shadow: 0 0 10px #7b4397, 0 0 20px #7b4397, 0 0 40px #7b4397; /* Subtle glow */
        }
        .title {
          font-size: 5rem;
          font-weight: 700;
          letter-spacing: 0.5rem;
          margin: 0;
          text-align: center;
          display: inline-block;
          color: #d8b4e8; /* Lighter purple for highlight */
        }
        .title-letter {
          display: inline-block;
        }
        .thought-container {
          height: 2rem;
          margin-top: 1rem;
          text-align: center;
        }
        .thought-text {
          font-size: 1.5rem;
          font-weight: 300;
          color: #a494cb; /* Muted purple */
        }
        @media (max-width: 768px) {
          .title {
            font-size: 3rem;
          }
          .thought-text {
            font-size: 1rem;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default WelcomeAnimation;