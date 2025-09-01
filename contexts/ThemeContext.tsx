"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types
export type Theme = "light" | "flower" | "anime";
export type ThemeContextType = { theme: Theme; setTheme: (theme: Theme) => void };

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

// --- Provider ---
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("flower"); 

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) setThemeState(savedTheme);
    else setThemeState("flower");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.className = "";
    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

// --- Cherry Blossom Background ---
export const CherryBlossomBackground = () => {
  const { theme } = useTheme();
  if (theme !== "flower") return null;

  const branchPetals = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 6 + 3;
    const left = 70 + Math.random() * 20;
    const top = 50 + Math.random() * 50;
    const duration = 8 + Math.random() * 6;
    const delay = Math.random() * 5;
    return (
      <div
        key={i}
        className="absolute bg-pink-300 rounded-full shadow-md animate-fall"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          top: `${top}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-pink-200">
      {/* Tree SVG */}
      <svg
        className="absolute right-0 bottom-0 h-4/5 w-auto"
        viewBox="0 0 250 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M120 450 C110 350 130 280 120 220 C110 160 130 130 120 90" stroke="#5a3d2e" strokeWidth="10" strokeLinecap="round"/>
        <path d="M120 220 C160 200 200 160 210 130" stroke="#5a3d2e" strokeWidth="6" strokeLinecap="round"/>
        <path d="M120 180 C80 160 50 120 40 90" stroke="#5a3d2e" strokeWidth="6" strokeLinecap="round"/>
        <path d="M120 150 C140 120 180 90 190 70" stroke="#5a3d2e" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="210" cy="130" r="12" fill="#fbcfe8"/>
        <circle cx="190" cy="70" r="10" fill="#fbcfe8"/>
        <circle cx="40" cy="90" r="12" fill="#fbcfe8"/>
        <circle cx="60" cy="140" r="8" fill="#fbcfe8"/>
        <circle cx="120" cy="90" r="15" fill="#fbcfe8"/>
      </svg>

      {/* Falling petals */}
      {Array.from({ length: 30 }).map((_, i) => {
        const width = Math.random() * 6 + 4;
        const height = width * (1.5 + Math.random() * 0.5);
        const left = Math.random() * 100;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        const rotate = Math.random() * 360;
        return (
          <div
            key={i}
            className="absolute bg-pink-500 shadow-md animate-fall"
            style={{
              width,
              height,
              left: `${left}%`,
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              transform: `rotate(${rotate}deg)`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      {branchPetals}

      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-fall { animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; }
      `}</style>
    </div>
  );
};

// --- Anime Video Background ---
export const AnimeVideoBackground = () => {
  const { theme } = useTheme();
  if (theme !== "anime") return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/videos/anime.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/30" /> {/* optional overlay */}
    </div>
  );
};
