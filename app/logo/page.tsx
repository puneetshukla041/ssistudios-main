// app/logo.tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

interface LogoItem {
  name: string;
  src: string;
}

const initialLogos: LogoItem[] = [
  { name: "Logo 1", src: "/logos/logo1.png" },
  { name: "Logo 2", src: "/logos/logo2.png" },
  { name: "Logo 3", src: "/logos/logo3.png" },
  { name: "Logo 4", src: "/logos/logo4.png" },
  { name: "Logo 5", src: "/logos/logo5.png" },
  { name: "Logo 6", src: "/logos/logo6.png" },
  { name: "Logo 7", src: "/logos/logo7.png" },
  { name: "Logo 8", src: "/logos/logo8.png" },
  { name: "Logo 9", src: "/logos/logo9.png" },
  { name: "Logo 10", src: "/logos/logo10.png" },
];

export default function LogoLibrary() {
  const [logos, setLogos] = useState<LogoItem[]>(initialLogos);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newLogo: LogoItem = {
        name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
        src: reader.result as string,
      };
      setLogos((prev) => [...prev, newLogo]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 font-sans bg-transparent">
      <h1 className="text-3xl font-bold text-gray-900 mb-12 text-center">
        Logo Library
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        {logos.map((logo, index) => (
          <motion.div
            key={logo.name + index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
            className="bg-gray-900/90 dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform duration-300"
          >
            <div className="relative mb-4 w-24 h-24">
              <Image
                src={logo.src}
                alt={logo.name}
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
            <p className="text-white font-medium text-center">{logo.name}</p>
          </motion.div>
        ))}

        {/* Add new logo card */}
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: logos.length * 0.1, duration: 0.5, ease: "easeOut" }}
          htmlFor="logo-upload"
          className="cursor-pointer bg-gray-900/60 dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300"
        >
          <div className="w-24 h-24 mb-4 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-xl text-gray-400 text-3xl font-bold">
            +
          </div>
          <p className="text-white font-medium text-center">Add Logo</p>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </motion.label>
      </div>
    </main>
  );
}
