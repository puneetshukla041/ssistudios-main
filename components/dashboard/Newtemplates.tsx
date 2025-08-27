import React, { useState, useEffect } from 'react';

const App = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progress, setProgress] = useState(0);

  const imageData = {
    imageUrl: '/posters/poster1.jpg',
    title: 'Poster Template',
    description: `This Welcome Poster is designed with a modern gradient background 
      and bold typography to make a lasting first impression. 
      It reflects the spirit of SS-Innovation and collaboration, 
      making it ideal for corporate events, conferences, or workplace branding. 
      Its clean and professional look ensures your message stands out with clarity and impact.`,
    uploadedBy: 'John Doe',
    uploadedOn: 'October 26, 2023',
  };

  const handleUseTemplate = () => {
    setIsRedirecting(true);
  };

  // Animate progress bar and redirect after complete
  useEffect(() => {
    if (isRedirecting) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            window.location.href = '/poster/editor/singlelogo/poster1editor';
            return 100;
          }
          return prev + 2; // adjust speed here
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isRedirecting]);

  return (
    <div className="flex flex-col justify-start items-start min-h-[50vh] bg-transparent font-sans p-2 sm:p-4 space-y-4">
      {/* Section Heading */}
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
        Poster Template Library
      </h2>

      {/* Main Card */}
      <div
        className={`
          w-full max-w-4xl bg-white/5 rounded-3xl p-4 sm:p-6 shadow-2xl
          flex flex-col md:flex-row items-center gap-4 sm:gap-6
          backdrop-blur-lg border-4 border-white/20 hover:border-white/40 transition-all duration-300
          transform transition-all duration-500 ease-in-out hover:scale-[1.01]
        `}
      >
        {/* Left: Poster Preview */}
        <div className="md:w-1/2 w-full flex-shrink-0">
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-lg">
            <img
              src={imageData.imageUrl}
              alt={imageData.title}
              className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Right: Text + Button */}
        <div className="md:w-1/2 w-full text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {imageData.title}
          </h1>
          <p className="text-gray-400 mb-2 text-sm sm:text-base">{imageData.description}</p>
          <button
            onClick={handleUseTemplate}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 cursor-pointer"
            disabled={isRedirecting}
          >
            Use this Template
          </button>
        </div>
      </div>

      {/* Redirecting Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center transition-opacity duration-700">
          <div className="relative w-80 p-6 rounded-2xl bg-neutral-900/70 border border-white/10 shadow-2xl backdrop-blur-md">
            <h2 className="text-lg text-gray-200 font-medium mb-4 text-center">
              Setting up editing environment
            </h2>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-400 text-center">
              Preparing your workspace...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
