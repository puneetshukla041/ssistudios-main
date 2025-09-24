"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LayoutGrid,
  Box,
  FileText,
  HardDrive,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  Check,
  X,
  Mail, // Change Bug to Mail
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/dashboard/Header";
import Footer from "@/components/dashboard/Footer";
import NewTemplates from "@/components/dashboard/Newtemplates";
import Visitingcard from "@/components/dashboard/visitingcard";
import Certificates from "@/components/dashboard/certificates";
import Usernameheader from "@/components/dashboard/usernameheader";
import { useRouter } from "next/navigation";
import BugReporterCard from "@/components/dashboard/BugReporterCard"; 
import { useTabUsage } from "@/hooks/useTabUsage";
// Define the shape of a template object from the database
interface Template {
  _id: string;
  templateName: string;
  imageUrl: string;
}
// Define the shape of a member object from the database
interface MemberData {
  _id: string;
  username: string;
  createdAt: string;
  lastLoggedIn?: string; // New field for login status
}

// Card component for displaying a design thumbnail and title
const DesignCard = ({
  title,
  imageUrl,
  actionText,
  actionIcon,
}: {
  title: string;
  imageUrl: string;
  actionText: string;
  actionIcon: React.ReactNode;
}) => (
  <div className="group relative overflow-hidden rounded-xl bg-transparent border border-gray-300 shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-pointer">
    {imageUrl && (
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-auto max-w-full rounded-t-xl object-cover transition-opacity duration-300 group-hover:opacity-80"
      />
    )}
    <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
      <button className="bg-white/90 text-gray-900 font-semibold px-6 py-2 rounded-full flex items-center gap-2 transform transition-transform duration-300 group-hover:scale-100 scale-90 cursor-pointer">
        {actionIcon}
        <span>{actionText}</span>
      </button>
    </div>
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
    </div>
  </div>
);

// A simple metric card component for analytics (with storage line display and status indicator)
const SmallMetricCard = ({
  title,
  value,
  icon,
  color,
  percentage, // Prop for the percentage
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  percentage?: number; // Make it optional since not all cards need it
}) => {
  // Determine the status and styles based on the percentage
  const getStatus = () => {
    if (percentage === undefined) {
      return { text: "", color: "", icon: null };
    } else if (percentage >= 90) {
      return { text: "Full", color: "bg-red-500", icon: <X size={14} /> };
    } else if (percentage >= 70) {
      return { text: "Warning", color: "bg-orange-500", icon: <AlertTriangle size={14} /> };
    } else {
      return { text: "Safe", color: "bg-green-500", icon: <Check size={14} /> };
    }
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
      className={`relative p-4 rounded-xl shadow-md border border-gray-300 flex flex-col items-start gap-2 bg-transparent transition-transform duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer group`}
    >
      {/* Status Indicator */}
      {title === "Storage Used" && percentage !== undefined && (
        <div
          className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-white ${status.color}`}
        >
          {status.icon}
          <span>{status.text}</span>
        </div>
      )}

      {/* Main Card Content (existing code) */}
      <div
        className={`p-2 rounded-full bg-gray-100/50 ${color} transition-transform duration-300 group-hover:scale-110`}
      >
        {icon}
      </div>

      <div className="space-y-1 w-full">
        {/* Show percentage + line text for Storage */}
        {title === "Storage Used" ? (
          <>
            <h4 className="text-lg font-bold text-gray-900">{value.split("|")[0]}</h4>
            <p className="text-sm text-gray-600 truncate">{title}</p>
            <p className="text-xs text-gray-500 mt-1">{value.split("|")[1]}</p>
            {/* Progress bar container */}
            <div className="w-full bg-gray-200 rounded-full h-1.0 mt-2 border border-gray-500">
              {/* Progress bar fill */}
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </>
        ) : (
          <>
            <h4 className="text-lg font-bold text-gray-900">{value}</h4>
            <p className="text-sm text-gray-600 truncate">{title}</p>
          </>
        )}
      </div>
    </motion.div>
  );
};

// Dropdown button component
const DropdownButton = ({ router }: { router: any }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-600/30 border border-blue-400/40 shadow-md text-gray-900 font-semibold hover:bg-blue-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer"
      >
        <Plus size={20} />
        <span>Create New Poster</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-lg flex flex-col z-50 overflow-hidden"
          >
            <button
              onClick={() => {
                router.push("/selector/posters/single");
                setOpen(false);
              }}
              className="px-4 py-3 text-white hover:bg-blue-600/60 hover:scale-105 transform transition-all duration-200 text-left cursor-pointer"
            >
              Single Logo Editor
            </button>
            <button
              onClick={() => {
                router.push("/selector/posters/multiple");
                setOpen(false);
              }}
              className="px-4 py-3 text-white hover:bg-blue-600/60 hover:scale-105 transform transition-all duration-200 text-left cursor-pointer"
            >
              Multiple Logo Editor
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Visiting Card Dropdown component (light & dark)
const VisitingCardDropdown = ({ router }: { router: any }) => {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl shadow-md font-semibold transition-all duration-300 active:scale-[0.98] cursor-pointer ${
          theme === "light"
            ? "bg-purple-600/30 border border-purple-400/40 text-gray-900 hover:bg-purple-600/50"
            : "bg-gray-800/50 border border-gray-700 text-white hover:bg-gray-900/60"
        }`}
      >
        <FileText size={20} />
        <span>Generate Visiting Card</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute mt-2 w-56 rounded-xl shadow-lg flex flex-col z-50 overflow-hidden"
          >
            <button
              onClick={() => {
                router.push("/selector/visitingcard/light");
                setOpen(false);
              }}
              className="px-4 py-3 text-gray-900 bg-white hover:bg-purple-600/30 hover:scale-105 transform transition-all duration-200 text-left cursor-pointer"
            >
              Light Theme
            </button>
            <button
              onClick={() => {
                router.push("/selector/visitingcard/dark");
                setOpen(false);
              }}
              className="px-4 py-3 text-white bg-gray-800 hover:bg-gray-900/60 hover:scale-105 transform transition-all duration-200 text-left cursor-pointer"
            >
              Dark Theme
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}


export default function DashboardPage() {
  const { user } = useAuth();
  const [newTemplates, setNewTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBugCardOpen, setIsBugCardOpen] = useState(false);
  const timeSpent = useTabUsage(); 

  // --- MongoDB Progress Bar State & Controls ---
  const [usedStorageKB, setUsedStorageKB] = useState(0);
  const [usedStorageMB, setUsedStorageMB] = useState(0);
  const [totalStorageMB, setTotalStorageMB] = useState(500);
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [membersList, setMembersList] = useState<MemberData[]>([]);

  // Inside DashboardPage
  const [exportCount, setExportCount] = useState<number>(0);
  useEffect(() => {
    if (!user) return;
    const fetchExportCount = async () => {
      try {
        const res = await fetch(`/api/user/exports?userId=${user.id}`);
        const data = await res.json();
        if (data.success) setExportCount(data.count);
        else setExportCount(0);
      } catch (err) {
        console.error(err);
        setExportCount(0);
      }
    };
    fetchExportCount();

    const interval = setInterval(fetchExportCount, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const router = useRouter();

  // Fetch storage data from the API
  const fetchStorageData = useCallback(async () => {
    try {
      const responseMongo = await fetch('/api/storage');
      if (!responseMongo.ok) {
        throw new Error(`HTTP error! status: ${responseMongo.status}`);
      }
      const mongoData = await responseMongo.json();

      if (mongoData.success) {
        setUsedStorageKB(mongoData.data.usedStorageKB);
        setUsedStorageMB(mongoData.data.usedStorageMB);
        setTotalStorageMB(mongoData.data.totalStorageMB);
      } else {
        console.error('API call was not successful:', mongoData.error);
      }
    } catch (error) {
      console.error('Failed to fetch storage data:', error);
      setUsedStorageMB(0);
      setUsedStorageKB(0);
      setTotalStorageMB(500);
    }
  }, []);

  // Fetch total members count from the API
  const fetchMembersList = useCallback(async () => {
    try {
      const response = await fetch('/api/members/count');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setTotalMembers(data.members.length);
      }
    } catch (error) {
      console.error('Failed to fetch members list:', error);
      setTotalMembers(0);
    }
  }, []);

  useEffect(() => {
    fetchStorageData();
    fetchMembersList();
    // Set an interval to refresh member list every 30 seconds
    const intervalId = setInterval(fetchMembersList, 30000);
    return () => clearInterval(intervalId);
  }, [fetchStorageData, fetchMembersList]);

  // New socket code
  // Determine the display value for storage
  const storageDisplayValue = usedStorageMB < 1 ? `${usedStorageKB.toFixed(1)}KB` : `${usedStorageMB.toFixed(1)}MB`;
  const storagePercentage = ((usedStorageMB / totalStorageMB) * 100).toFixed(1);

  // Define metrics with dynamic values
const metrics = [
  {
    title: "Storage Used",
    value: `${storagePercentage}% used | ${
      usedStorageKB > 0 ? `${usedStorageKB}KB` : `${usedStorageMB.toFixed(1)}MB`
    } / ${totalStorageMB}MB`,
    icon: <HardDrive size={20} />,
    color: "text-orange-600",
    percentage: parseFloat(storagePercentage),
  },
  { title: "Your Exports", value: exportCount.toString(), icon: <TrendingUp size={20} />, color: "text-cyan-600" },
  { title: "Total Members", value: totalMembers.toString(), icon: <Users size={20} />, color: "text-yellow-600" },

  // 🔥 Replace the static "0h" with real session time
    { title: "Your Avg. Session", value: timeSpent, icon: <Clock size={20} />, color: "text-red-600" },
];



  return (
    <main className="flex-1 min-h-screen px-4 sm:px-6 lg:px-12 xl:px-20 transition-all duration-300 bg-transparent text-gray-900">
{/* Report Bug Button */}
<div className="absolute top-10 right-10 z-50 flex flex-col items-center">
  <motion.button
    className="p-3 rounded-full bg-blue-600/90 text-white shadow-lg transition-all duration-300 hover:bg-blue-700/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={() => setIsBugCardOpen(true)} // Open the card on click
  >
    <Mail size={24} />
  </motion.button>
  <span className="mt-2 text-xs text-gray-700 dark:text-black-600 text-center whitespace-nowrap">
    Report a bug <br /> or give feedback for Improvements
  </span>
</div>


      <div className="my-4 cursor-pointer hidden lg:block">
        <Header />
      </div>
      <Usernameheader />

      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6">Advanced Analytics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
          {metrics.slice(0, 4).map((metric, index) => (
            <SmallMetricCard key={index} {...metric} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          {metrics.slice(4).map((metric, index) => (
            <SmallMetricCard key={index + 4} {...metric} />
          ))}
        </div>
      </section>

      <section className="mb-20">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <DropdownButton router={router} />
          <VisitingCardDropdown router={router} />

          <button
            onClick={() => router.push("/selector/certificate")}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-teal-600/30 border border-teal-400/40 shadow-md text-gray-900 font-semibold hover:bg-teal-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer"
          >
            <LayoutGrid size={20} />
            <span>Generate Certificates</span>
          </button>

          <button
            onClick={() => router.push("/bgremover")}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-red-600/30 border border-red-400/40 shadow-md text-gray-900 font-semibold hover:bg-red-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer"
          >
            <Box size={20} />
            <span>Background Remover</span>
          </button>
        </div>
      </section>
 <h2 className="text-xl sm:text-2xl font-semibold mb-6">Templates Library</h2>


<div className="flex flex-col lg:flex-row px-3 sm:px-4 lg:px-6 gap-6">
  {/* Left Column: New Templates + Certificates */}
  <div className="flex-shrink-0 min-w-[600px] flex flex-col gap-6">
    <div className="w-full">
      <NewTemplates />
    </div>

    <div className="w-full">
      <Certificates />
    </div>
  </div>

  {/* Right Column: Visiting Card */}
  <div className="flex-shrink-0 w-full lg:w-[880px] mt-2 lg:mt-[-10]">
    <Visitingcard />
  </div>
</div>



      <Footer />

      {/* Bug Reporter Card */}
      {user && ( // Only render if a user is logged in
        <BugReporterCard
          isOpen={isBugCardOpen}
          onClose={() => setIsBugCardOpen(false)}
          userId={user.id}
          username={user.username} // Pass the username to the component
        />
      )}
    </main>
  );
}