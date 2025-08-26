"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types
export type Theme = "light" | "dark" | "flower";
export type ThemeContextType = { theme: Theme; setTheme: (theme: Theme) => void };

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

// --- Provider ---
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) setThemeState(savedTheme);
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

// --- Cherry Blossom Background with Artistic Japanese Tree ---
export const CherryBlossomBackground = () => {
  const { theme } = useTheme();

  if (theme !== "flower") return null;

  // Random petals from branches
  const branchPetals = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 6 + 3;
    const left = 70 + Math.random() * 20; // around tree right side
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
      {/* Artistic Japanese tree on the right */}
      <svg
        className="absolute right-0 bottom-0 h-3/4 w-auto"
        viewBox="0 0 200 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Thick trunk */}
        <path
          d="M100 400 C95 300 105 250 100 200 C95 150 105 120 100 80"
          stroke="#8B5A2B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Long curved branches */}
        <path
          d="M100 200 C130 180 170 150 180 120"
          stroke="#8B5A2B"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M100 150 C70 130 40 100 30 70"
          stroke="#8B5A2B"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M100 120 C120 100 160 80 170 60"
          stroke="#8B5A2B"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Blossoms on branches */}
        <circle cx="180" cy="120" r="10" fill="#F9A8D4" />
        <circle cx="170" cy="60" r="8" fill="#FBB6CE" />
        <circle cx="30" cy="70" r="10" fill="#F9A8D4" />
        <circle cx="40" cy="100" r="6" fill="#FBB6CE" />
      </svg>

      {/* Falling petals from sky */}
      {Array.from({ length: 30 }).map((_, i) => {
        const size = Math.random() * 6 + 4;
        const left = Math.random() * 100; // percentage
        const duration = Math.random() * 10 + 10; // seconds
        const delay = Math.random() * 5;

        return (
          <div
            key={i}
            className="absolute bg-pink-400 rounded-full shadow-md animate-fall"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}

      {/* Petals from branches */}
      {branchPetals}

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};
