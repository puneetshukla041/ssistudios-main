"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/Header"; // ✅ Imported Header component

export default function LoadingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progress, setProgress] = useState(0); // 👈 Added state for progress bar

  // --- Initial page loading ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // --- Handle Redirect Progress Bar ---
  useEffect(() => {
    if (isRedirecting) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2; // smoother step
        });
      }, 80); // ~4s total
      return () => clearInterval(interval);
    }
  }, [isRedirecting]);

  const handleUseTemplate = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      router.push("/poster/editor/singlelogo/poster1editor");
    }, 4000);
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center p-4 bg-transparent text-white font-sans overflow-hidden">

      {/* Secondary Loading Overlay for redirection */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[60] flex items-center justify-center transition-opacity duration-700">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08),transparent)]" />

          <div className="relative text-center w-[28rem] p-10 rounded-2xl bg-neutral-900/70 border border-white/10 shadow-2xl backdrop-blur-md animate-[fadeInUp_0.6s_ease]">
            
            {/* Title with shimmer effect */}
            <h2 className="text-xl font-medium tracking-wide text-gray-200 mb-6 relative overflow-hidden">
              <span className="animate-[textShimmer_2.5s_infinite] bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-[length:200%_100%] bg-clip-text text-transparent">
                Setting up editing environment
              </span>
            </h2>

            {/* Elegant Progress Bar */}
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 relative overflow-hidden transition-all duration-200"
                style={{ width: `${progress}%` }}
              >
                {/* Moving shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[barShimmer_1.5s_linear_infinite]" />
              </div>
            </div>

            {/* Subtext */}
            <p className="mt-4 text-sm text-gray-400 tracking-wide">
              Preparing your workspace...
            </p>
          </div>
        </div>
      )}

      {/* Initial Page Loading Overlay */}
      {isLoading && !isRedirecting && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center transition-opacity duration-1000 ease-in-out animate-fade-in"
          style={{ 
            opacity: isLoading ? 1 : 0, 
            pointerEvents: isLoading ? 'auto' : 'none' 
          }}
        >
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Glowing Spinner */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-2xl opacity-60 animate-pulse" />
              <div className="w-20 h-20 border-4 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin relative z-10" />
            </div>

            {/* Loading Text */}
            <p className="text-lg font-semibold tracking-wide text-gray-300 flex items-center space-x-1">
              <span>Loading templates</span>
              <span className="flex">
                <span className="animate-bounce delay-0">.</span>
                <span className="animate-bounce delay-200">.</span>
                <span className="animate-bounce delay-400">.</span>
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Header component */}
      <div className={`w-full max-w-7xl mx-auto transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Header />
      </div>

      {/* Main Content */}
      <div
        className={`
          w-full max-w-2xl bg-gray-800 rounded-3xl p-8 shadow-2xl mt-8
          flex flex-col md:flex-row items-center gap-8
          transform transition-all duration-1000 ease-in-out
          ${isLoading ? "scale-95 blur-sm opacity-0" : "scale-100 blur-0 opacity-100"}
        `}
      >
        <div className="md:w-1/2 w-full flex-shrink-0">
          <div className="relative w-full h-auto aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://placehold.co/800x600/222222/FFFFFF?text=Poster"
              alt="Poster template"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
        <div className="md:w-1/2 w-full text-center md:text-left">
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Poster Template
          </h1>
          <p className="text-gray-400 mb-4 text-sm">
            A professional and modern template for creating stunning posters.
          </p>
          <button
            onClick={handleUseTemplate}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            disabled={isRedirecting}
          >
            Use this Template
          </button>
        </div>
      </div>
    </main>
  );
}
