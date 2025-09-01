"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  LayoutGrid,
  Download,
  Box,
  Sparkles,
  FileText,
  FolderOpen,
  LayoutTemplate,
  HardDrive,
  Activity,
  TrendingUp,
  Users,
  Clock,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/dashboard/Header";
import Footer from "@/components/dashboard/Footer";
import NewTemplates from "@/components/dashboard/Newtemplates";

import Aicreative from "@/components/dashboard/aicreative";
import Usernameheader from "@/components/dashboard/usernameheader"; // Import your new component

// Define the shape of a template object from the database
interface Template {
  _id: string;
  templateName: string;
  imageUrl: string;
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

// A simple metric card component for analytics (new smaller version)
const SmallMetricCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -4 }}
    className={`p-4 rounded-xl shadow-md border border-gray-300 flex flex-col items-start gap-2 bg-transparent transition-transform duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer group`}
  >
    <div className={`p-2 rounded-full bg-gray-100/50 ${color} transition-transform duration-300 group-hover:scale-110`}>
      {icon}
    </div>
    <div className="space-y-1">
      <h4 className="text-lg font-bold text-gray-900">{value}</h4>
      <p className="text-sm text-gray-600 truncate">{title}</p>
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [newTemplates, setNewTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

// A simple metric card component for analytics (new smaller version)
const SmallMetricCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -4 }}
    className={`relative p-4 rounded-xl shadow-md border border-gray-300 flex flex-col items-start gap-2 bg-transparent transition-transform duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer group`}
  >
    {/* Green small bar for Storage Used */}
    {title === "Storage Used" && (
      <div className="absolute top-2 right-2 bg-green-400 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
        8.8% used
      </div>
    )}
    <div
      className={`p-2 rounded-full bg-gray-100/50 ${color} transition-transform duration-300 group-hover:scale-110`}
    >
      {icon}
    </div>
    <div className="space-y-1">
      <h4 className="text-lg font-bold text-gray-900">{value}</h4>
      <p className="text-sm text-gray-600 truncate">{title}</p>
    </div>
  </motion.div>
);

// Metrics array (unchanged except Storage Used will show badge automatically)
const metrics = [
  {
    title: "Total Active Projects",
    value: "3",
    icon: <FolderOpen size={20} />,
    color: "text-blue-600",
  },
  {
    title: "Total Templates",
    value: "5",
    icon: <LayoutTemplate size={20} />,
    color: "text-green-600",
  },
  {
    title: "Storage Used",
    value: "44MB",
    icon: <HardDrive size={20} />,
    color: "text-orange-600",
  },
  {
    title: "Recent Activity",
    value: "0",
    icon: <Activity size={20} />,
    color: "text-purple-600",
  },
  {
    title: "Your Exports",
    value: "0",
    icon: <TrendingUp size={20} />,
    color: "text-cyan-600",
  },
  {
    title: "Total Members",
    value: "7",
    icon: <Users size={20} />,
    color: "text-yellow-600",
  },
  {
    title: " Your Avg. Session",
    value: "0h",
    icon: <Clock size={20} />,
    color: "text-red-600",
  },
];


  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch("/api/templates");
        if (!response.ok) throw new Error("Templates fetch failed");
        const data = await response.json();
        setNewTemplates(data.data);
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch templates:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  return (
    <main className="flex-1 min-h-screen px-4 sm:px-6 lg:px-12 xl:px-20 transition-all duration-300 bg-transparent text-gray-900">
      {/* --- Header --- */}
      <div className="my-4 cursor-pointer hidden lg:block">
        <Header />
      </div>
      <Usernameheader />

      {/* --- Advanced Analytics --- */}
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

      {/* --- Quick Actions --- */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-600/30 border border-blue-400/40 shadow-md text-gray-900 font-semibold hover:bg-blue-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <Plus size={20} />
            <span>Create New Poster</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-purple-600/30 border border-purple-400/40 shadow-md text-gray-900 font-semibold hover:bg-purple-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <FileText size={20} />
            <span>Generate Visiting Card</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-teal-600/30 border border-teal-400/40 shadow-md text-gray-900 font-semibold hover:bg-teal-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <LayoutGrid size={20} />
            <span>Generate Certificates</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-red-600/30 border border-red-400/40 shadow-md text-gray-900 font-semibold hover:bg-red-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <Box size={20} />
            <span>My assets</span>
          </button>
        </div>
      </section>

      {/* --- Newest Templates --- */}
      <div className="ml-0 sm:ml-0 lg:ml-0 xl:ml-0 my-2">
        <NewTemplates />
      </div>

      {/* --- AI Creative --- */}
      <div className="mt-8">
        <Aicreative />
      </div>

      {/* --- Footer --- */}
      <Footer />
    </main>

  );
}





