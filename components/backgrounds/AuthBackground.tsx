'use client'

import { useEffect, useState } from "react";
import { useMemoryMonitor } from '@/hooks/useMemoryOptimization'; // Assuming this hook exists

// Type definitions for our celestial objects
interface Star {
  id: string;
  top: string;
  left: string;
  size: number;
  color: string;
  delay: string;
  duration: string;
}

interface DustCloud {
  id: string;
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
}

export default function AuthBackground() {
  const [stars, setStars] = useState<Star[]>([]);
  const [dust, setDust] = useState<DustCloud[]>([]);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  // Add state for window dimensions
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  // Memory monitoring
  useMemoryMonitor('AuthBackground');

  // Effect to set window dimensions on client-side mount
  useEffect(() => {
    // This code will only run in the browser
    if (typeof window !== 'undefined') {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });

      const handleResize = () => {
        setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []); // Run once on mount

  // Procedurally generate the entire galaxy on component mount
  useEffect(() => {
    // Ensure window dimensions are available before proceeding
    if (windowDimensions.width === 0 || windowDimensions.height === 0) {
      return; // Skip if window dimensions are not yet initialized
    }

    // Check for reduced motion preference and device capabilities
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEndDevice = navigator.hardwareConcurrency <= 4 || windowDimensions.width < 768;

    // --- Galaxy Generation Parameters (Optimized for performance) ---
    const isMobile = windowDimensions.width < 768;
    const starCount = prefersReducedMotion ? 50 : (isLowEndDevice ? 100 : (isMobile ? 150 : 250));
    const dustCount = prefersReducedMotion ? 5 : (isLowEndDevice ? 8 : (isMobile ? 10 : 15));
    const arms = 2; // Main spiral arms
    const armTurns = 2.0; // How many times the arms wrap around
    const armSpread = 0.15; // Tightness of the spiral
    const barWidth = 25; // Width of the central bar
    const barHeight = 5; // Height of the central bar
    const coreRadius = 5;

    const generatedStars: Star[] = [];
    const generatedDust: DustCloud[] = [];

    // --- Generate Stars ---
    for (let i = 0; i < starCount; i++) {
      let x, y, distance;
      const randomType = Math.random();

      // Distribute stars in different parts of the galaxy
      if (randomType > 0.6) { // 40% of stars in the spiral arms
        const angle = Math.random() * armTurns * 2 * Math.PI;
        distance = Math.sqrt(Math.random()) * 50; // Non-linear distribution
        const arm = Math.floor(Math.random() * arms) * (Math.PI * 2 / arms);
        const spiralAngle = distance * armSpread + arm;
        
        x = Math.cos(angle + spiralAngle) * distance;
        y = Math.sin(angle + spiralAngle) * distance;
      } else if (randomType > 0.2) { // 40% in the central bar
        x = (Math.random() - 0.5) * barWidth;
        y = (Math.random() - 0.5) * barHeight;
      } else { // 20% in the core
        const angle = Math.random() * 2 * Math.PI;
        distance = Math.random() * coreRadius;
        x = Math.cos(angle) * distance;
        y = Math.sin(angle) * distance;
      }

      // Add some random fuzziness
      x += (Math.random() - 0.5) * 3;
      y += (Math.random() - 0.5) * 3;

      const starColors = ["#FFFFFF", "#D6E4FF", "#FFDDB4"];

      generatedStars.push({
        id: `s-${i}`,
        top: `${50 + y}%`,
        left: `${50 + x}%`,
        size: Math.random() * 1.5 + 0.2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        delay: `${Math.random() * 10}s`,
        duration: prefersReducedMotion ? '0s' : `${Math.random() * 3 + 3}s`, // Slower or no animation
      });
    }

    // --- Generate Dust Lanes along the arms ---
    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * armTurns * 2 * Math.PI;
      const distance = Math.sqrt(Math.random()) * 45 + 5; // Place dust slightly outside the core
      const arm = Math.floor(Math.random() * arms) * (Math.PI * 2 / arms);
      const spiralAngle = distance * armSpread + arm;

      const x = Math.cos(angle + spiralAngle) * distance + (Math.random() - 0.5) * 8;
      const y = Math.sin(angle + spiralAngle) * distance + (Math.random() - 0.5) * 8;

      generatedDust.push({
        id: `d-${i}`,
        top: `${50 + y}%`,
        left: `${50 + x}%`,
        size: Math.random() * 150 + 80,
        delay: `${Math.random() * 10}s`,
        duration: prefersReducedMotion ? '0s' : `${Math.random() * 30 + 20}s`, // Slower or no animation
      });
    }

    setStars(generatedStars);
    setDust(generatedDust);
  }, [windowDimensions]); // Re-run when window dimensions are available/change

  // Mouse parallax effect listener
  useEffect(() => {
    if (typeof window === 'undefined') {
      return; // Do not attach listener if window is not defined (SSR)
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Use windowDimensions from state, or fallback to window directly if this effect runs before initial render
      const currentWidth = windowDimensions.width > 0 ? windowDimensions.width : window.innerWidth;
      const currentHeight = windowDimensions.height > 0 ? windowDimensions.height : window.innerHeight;

      const x = (e.clientX / currentWidth - 0.5) * 2;
      const y = (e.clientY / currentHeight - 0.5) * 2;
      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [windowDimensions]); // Depend on windowDimensions to ensure latest values are used

  return (
    <div className="fixed inset-0 -z-50 w-screen h-screen overflow-hidden bg-black">
        
      {/* Galaxy Container for rotation and parallax */}
      <div className="absolute inset-0 animate-galaxy-rotate"
        style={{
          transform: `translate(${mouse.x * 40}px, ${mouse.y * 40}px) scale(1.5)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        {/* Layer 1: Galaxy Core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-galaxy-core rounded-full" />

        {/* Layer 2: Dust Lanes (dark clouds) */}
        {dust.map((d) => (
          <div
            key={d.id}
            className="absolute rounded-full animate-nebula-drift bg-black/40"
            style={{
              width: `${d.size}px`,
              height: `${d.size}px`,
              top: d.top,
              left: d.left,
              animationDelay: d.delay,
              animationDuration: d.duration,
              filter: `blur(${d.size / 4}px)`,
              transform: `translate(-50%, -50%)`,
            }}
          />
        ))}

        {/* Layer 3: Starfield */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full animate-twinkle"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: star.top,
              left: star.left,
              backgroundColor: star.color,
              animationDelay: star.delay,
              animationDuration: star.duration,
              transform: `translate(-50%, -50%)`,
            }}
          />
        ))}
      </div>
      
      {/* Layer 4: Mouse Aura (kept outside the rotating galaxy) */}
      <div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(165, 243, 252, 0.05) 0%, rgba(165, 243, 252, 0) 60%)',
          // Only apply transform if windowDimensions are available
          transform: windowDimensions.width > 0 ? 
            `translate(calc(${mouse.x * 50}px - 50%), calc(${mouse.y * 50}px - 50%)) translate(${mouse.x * windowDimensions.width}px, ${mouse.y * windowDimensions.height}px)` :
            `translate(-50%, -50%)`, // Default or fallback transform
          transition: "transform 0.1s ease-out",
        }}
      />

      {/* Global CSS Animations */}
      <style>{`
        .bg-galaxy-core {
            background: radial-gradient(ellipse at center, rgba(255, 229, 180, 0.6) 0%, rgba(255, 204, 153, 0.2) 40%, rgba(251, 242, 219, 0) 70%);
            filter: blur(20px);
            animation: core-pulse 10s ease-in-out infinite;
        }
      
        @keyframes twinkle {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }
        
        @keyframes nebula-drift {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          50% { transform: translate(-50%, -50%) rotate(45deg) scale(1.05); }
          100% { transform: translate(-50%, -50%) rotate(90deg) scale(1); }
        }
        .animate-nebula-drift {
          animation: nebula-drift ease-in-out infinite;
        }

        @keyframes galaxy-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-galaxy-rotate {
            animation: galaxy-rotate 60s linear infinite; /* faster rotation */
        }
        
        @keyframes core-pulse {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
            50% { transform: scale(1.05) rotate(5deg); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}