'use client'

import { Fragment } from 'react';

// This component can be used as a placeholder for pages under construction.
export default function TemplatesPage() {
  return (
    <>
      {/* Google Font Import */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Main container is now fully transparent. */}
      <div className="flex min-h-screen font-space-grotesk overflow-hidden">
        
        {/* Main Content */}
        {/* Adjusted padding for smaller screens to ensure content isn't too close to edges */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
          <div className="w-full max-w-lg">
            
            {/* Professional, blueprint-style wireframe cat animation */}
            <div className="relative h-64 w-full mb-8">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64">
                <svg viewBox="0 0 250 200" className="w-full h-auto">
                  <defs>
                    {/* Filter for the glowing elements */}
                    <filter id="wireframe-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Main group for all cat parts */}
                  {/* SVG stroke colors are darker for visibility on light backgrounds */}
                  <g strokeWidth="1.5" fill="none">
                    {/* Cat's Tail */}
                    <g className="animate-tail-flow">
                      <path
                        d="M 180 160 Q 220 120 200 80"
                        stroke="#475569"
                      />
                    </g>

                    {/* Cat's Body */}
                    <path
                      d="M 70 180 C 30 180, 20 130, 80 110 S 180 90, 190 150 S 120 190, 70 180 Z"
                      stroke="#475569"
                    />
                    
                    {/* Cat's Head */}
                    <g className="animate-head-tilt">
                      <circle cx="95" cy="90" r="45" stroke="#475569" />
                      
                      {/* Ears */}
                      <path d="M 60 65 L 80 30 L 100 65" stroke="#475569" className="animate-ear-twitch-left" />
                      <path d="M 105 65 L 125 30 L 145 65" stroke="#475569" />
                      
                      {/* Eyes - Replaced with scanning reticles */}
                      <g className="animate-eyes-blink" filter="url(#wireframe-glow)">
                        <circle cx="80" cy="90" r="8" stroke="#0f766e" strokeDasharray="2 4" className="animate-reticle-spin" />
                        <circle cx="110" cy="90" r="8" stroke="#0f766e" strokeDasharray="2 4" className="animate-reticle-spin-reverse" />
                        <line x1="80" y1="82" x2="80" y2="98" stroke="#0f766e" strokeWidth="1"/>
                        <line x1="72" y1="90" x2="88" y2="90" stroke="#0f766e" strokeWidth="1"/>
                        <line x1="110" y1="82" x2="110" y2="98" stroke="#0f766e" strokeWidth="1"/>
                        <line x1="102" y1="90" x2="118" y2="90" stroke="#0f766e" strokeWidth="1"/>
                      </g>
                    </g>
                    
                    {/* Horizontal scanning line animation */}
                    <line x1="0" x2="250" y1="0" stroke="#0f766e" strokeWidth="1" opacity="0.6" className="animate-scan-line" filter="url(#wireframe-glow)"/>
                  </g>
                </svg>
              </div>
            </div>

            {/* Text colors are darker for visibility on light backgrounds */}
            {/* Main Heading with shimmer effect */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-slate-800 relative animate-text-shimmer bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-500 to-slate-800">
              Under Maintenance
            </h1>

            {/* Version Sub-heading with typing effect */}
            {/* Adjusted font size for mobile */}
            <p className="mt-4 font-mono text-base sm:text-lg text-slate-500 h-6">
              <span className="animate-typing">Version 2.08.25</span>
            </p>
          </div>
        </main>
      </div>

      {/* FIX: Removed 'jsx' and 'global' attributes to prevent React warnings.
        The styles are inherently global because they are not scoped.
      */}
      <style>{`
        /* Import font */
        .font-space-grotesk { font-family: 'Space Grotesk', sans-serif; }

        /* Text Animations */
        .animate-text-shimmer {
            background-size: 200% 100%;
            animation: text-shimmer 5s linear infinite;
        }
        .animate-typing::after {
            content: '_';
            animation: blink-caret .75s step-end infinite;
        }
        
        /* Cat Animations */
        .animate-tail-flow { animation: tail-flow 6s ease-in-out infinite; transform-origin: 180px 160px; }
        .animate-head-tilt { animation: head-tilt 10s ease-in-out infinite; transform-origin: center 120px; }
        .animate-ear-twitch-left { animation: ear-twitch 8s ease-in-out infinite 2s; transform-origin: 80px 65px; }
        .animate-eyes-blink { animation: eyes-blink 7s linear infinite; }
        .animate-reticle-spin { animation: reticle-spin 4s linear infinite; transform-origin: center; }
        .animate-reticle-spin-reverse { animation: reticle-spin-reverse 4s linear infinite; transform-origin: center; }
        .animate-scan-line { animation: scan-line 5s ease-in-out infinite; }


        /* Keyframes */
        @keyframes text-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes blink-caret { from, to { opacity: 1; } 50% { opacity: 0; } }
        @keyframes tail-flow { 0%, 100% { transform: rotate(5deg); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(10deg); } }
        @keyframes head-tilt { 0%, 100% { transform: rotate(0deg); } 40% { transform: rotate(0deg); } 50% { transform: rotate(-5deg); } 60% { transform: rotate(3deg); } 70% { transform: rotate(0deg); } }
        @keyframes ear-twitch { 0%, 100% { transform: rotate(0deg); } 5% { transform: rotate(-10deg); } 10% { transform: rotate(5deg); } 15% { transform: rotate(0deg); } }
        @keyframes eyes-blink { 0%, 94%, 100% { opacity: 1; } 97% { opacity: 0.2; } }
        @keyframes reticle-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes reticle-spin-reverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes scan-line {
            0% { transform: translateY(200px); }
            50% { transform: translateY(0px); }
            100% { transform: translateY(200px); }
        }
      `}</style>
    </>
  )
}