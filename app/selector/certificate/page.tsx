"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/Header";
import Image from "next/image";

export default function LoadingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- Initial page loading ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

// --- Handle Redirect Progress Bar ---
useEffect(() => {
  if (isRedirecting) {
    setProgress(0);
    const duration = 1500; // total duration in ms
    const intervalTime = 15; // ms per update
    const increment = 100 / (duration / intervalTime); // amount to increase per tick

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }
}, [isRedirecting]);

const handleUseTemplate = () => {
  setIsRedirecting(true);
  setTimeout(() => {
    router.push("/certificates/training");
  }, 1500); // redirect after 1.5s
};

  return (
    <main className="relative min-h-screen flex flex-col items-center p-4 bg-transparent text-white font-sans overflow-hidden">

      {/* --- Redirecting Overlay --- */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[60] flex items-center justify-center transition-opacity duration-700">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08),transparent)]" />

          <div className="relative text-center w-[28rem] p-10 rounded-2xl bg-neutral-900/70 border border-white/10 shadow-2xl backdrop-blur-md animate-[fadeInUp_0.6s_ease]">
            {/* Title */}
            <h2 className="text-xl font-medium tracking-wide text-gray-200 mb-6 relative overflow-hidden">
              <span className="animate-[textShimmer_2.5s_infinite] bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-[length:200%_100%] bg-clip-text text-transparent">
                Setting up editing environment
              </span>
            </h2>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 relative overflow-hidden transition-all duration-200"
                style={{ width: `${progress}%` }}
              >
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

      {/* --- Initial Loading Overlay --- */}
      {isLoading && !isRedirecting && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center transition-opacity duration-1000 ease-in-out animate-fade-in"
          style={{
            opacity: isLoading ? 1 : 0,
            pointerEvents: isLoading ? "auto" : "none",
          }}
        >
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Spinner */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-2xl opacity-60 animate-pulse" />
              <div className="w-20 h-20 border-4 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin relative z-10" />
            </div>

            {/* Text */}
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

      {/* --- Header --- */}
      <div
        className={`w-full max-w-7xl mx-auto transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        <Header />
      </div>

      {/* --- Main Content --- */}
      {/* Changed justify-end to justify-start and added horizontal padding */}
      <div className="w-full max-w-6xl mx-auto flex justify-start pl-8">
<div
  className={`
    w-full max-w-4xl bg-white/5 rounded-3xl p-8 shadow-2xl mt-8 md:mt-20
    flex flex-col md:flex-row items-center gap-8
    backdrop-blur-lg border-4 border-white/20 hover:border-white/40 transition-all duration-300
    transform transition-all duration-1000 ease-in-out hover:scale-[1.01]
    -ml-4 md:ml-18   /* mobile = small left shift, desktop = proper margin */
  `}
>



          {/* Left: Poster Preview */}
          <div className="md:w-1/2 w-full flex-shrink-0">
            {/* Corrected aspect ratio to 16:9 for proper image display */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-lg">
              <img
                src="\certificates\certificate.jpg"
                alt="Poster template"
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>

          {/* Right: Text + Button */}
{/* Right: Text + Button */}
<div className="md:w-1/2 w-full text-center md:text-left">
  <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-teal-900">
    Certificate of Training
  </h1>

  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
    This <span className="font-semibold text-gray-900">Certificate of Training</span> is awarded to individuals who have 
    successfully completed the <span className="text-gray-900">SSI Mantra Surgical Robotic System</span> program. <br />
    The program covers both <span className="text-gray-800">technical</span> and <span className="text-gray-900">functional aspects</span> 
    of the robotic system, ensuring participants gain a high level of competence to perform robotic surgeries. <br />
    Provided by <span className="text-gray-900">Sudhir Srivastava Innovations Pvt. Ltd.</span>, this certification 
    highlights expertise, precision, and professional achievement.
  </p>


            <button
              onClick={handleUseTemplate}
              // Ensured cursor-pointer class is present
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 cursor-pointer"
              disabled={isRedirecting}
            >
              Use this Template
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
