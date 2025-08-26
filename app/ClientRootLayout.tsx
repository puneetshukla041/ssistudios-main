"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme, CherryBlossomBackground } from "@/contexts/ThemeContext";
import { ReactNode, useState, useEffect } from "react";
import { motion } from "framer-motion";

// --- Animated Hamburger Icon ---
type MotionLineProps = React.ComponentPropsWithoutRef<"line"> & { variants?: any; [key: string]: any };
const MotionLine = motion.line as React.FC<MotionLineProps>;

const AnimatedHamburgerIcon = ({
  isOpen,
  size = 20,
  strokeWidth = 2,
  className = "",
}: {
  isOpen: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) => {
  const commonLineAttributes = {
    vectorEffect: "non-scaling-stroke" as const,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={isOpen ? "open" : "closed"}
      initial={false}
      variants={{ open: {}, closed: {} }}
    >
      <MotionLine x1="4" y1="6" x2="20" y2="6" variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: 45, y: 6 } }} {...commonLineAttributes} />
      <MotionLine x1="4" y1="12" x2="20" y2="12" variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }} {...commonLineAttributes} />
      <MotionLine x1="4" y1="18" x2="20" y2="18" variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: -45, y: -6 } }} {...commonLineAttributes} />
    </motion.svg>
  );
};

// --- App Layout ---
function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const forceActive = pathname === "/selector" ? "Dashboard" : undefined;

  const isEditorPage = pathname.startsWith("/editor");
  const isLoginPage = pathname === "/login";

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  // Background classes
  const themeBg =
    theme === "light"
      ? "bg-white text-gray-900"
      : theme === "dark"
      ? "bg-black text-white"
      : "relative overflow-hidden text-gray-900"; // flower theme handled by CherryBlossomBackground

  if (isEditorPage) return <>{children}</>;

  if (!isAuthenticated && !isLoginPage) return null;

  return (
    <>
      <CherryBlossomBackground /> {/* ✅ Render petals globally */}
      {!isLoginPage ? (
        <div className={`flex relative z-10 min-h-screen ${themeBg}`}>
          <Sidebar forceActive={forceActive} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto transition-all duration-300 p-4 lg:p-8 relative">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {pathname === "/dashboard"
                  ? "Dashboard"
                  : pathname.startsWith("/poster/new")
                  ? "Creative Studio"
                  : pathname.startsWith("/templates")
                  ? "Templates"
                  : pathname.startsWith("/settings")
                  ? "Settings"
                  : "App"}
              </h1>
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Toggle sidebar"
              >
                <AnimatedHamburgerIcon isOpen={isSidebarOpen} size={28} />
              </button>
            </div>
            {children}
          </main>
        </div>
      ) : (
        <main className="min-h-screen flex flex-col items-center justify-center relative z-10 px-4 bg-white">{children}</main>
      )}
    </>
  );
}

// --- Main Client Layout ---
export default function ClientRootLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppLayout>{children}</AppLayout>
      </ThemeProvider>
    </AuthProvider>
  );
}
