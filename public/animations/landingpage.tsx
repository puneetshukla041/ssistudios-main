'use client';

import React, { useState, useEffect } from 'react';


const LandingPage = () => {
  const [showMainPage, setShowMainPage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMainPage(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!showMainPage) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'black',
          overflow: 'hidden',
          zIndex: 999999, // 👑 highest z-index to cover all content
        }}
      >
        <h1
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '11vmin',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textAlign: 'center',
            background:
              'linear-gradient(to right, rgb(0, 255, 255), rgb(53, 53, 240))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'netflix_style 4.5s ease-out',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          SSINNOVATION
        </h1>

        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&display=swap');

          @keyframes netflix_style {
            0% {
              text-shadow: 0px 0px transparent, 100px 100px #aaa;
              transform: scale(1.5);
              color: #f3f3f3;
            }
            10% {
              text-shadow: 1.5px 1.5px #aaa;
            }
            20% {
              color: #e90418;
              text-shadow: none;
              transform: scale(1.1);
            }
            80% {
              opacity: 0;
              transform: scale(0.85);
            }
            100% {
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  return <MainPage />;
};

const MainPage = () => {
  return (
    <>
      
      <main
        style={{
          minHeight: '100vh',
          background: 'black',
          color: 'white',
          paddingTop: '80px', // space for fixed header
        }}
      >
        {/* Your actual content goes here */}
        <div className="text-center text-3xl font-semibold font-poppins py-20">
          Welcome to SS Innovations
        </div>
      </main>
      
    </>
  );
};

export default LandingPage;
