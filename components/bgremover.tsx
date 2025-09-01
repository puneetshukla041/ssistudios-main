'use client';

import React, { useRef, useState } from 'react';
import axios from 'axios';
import { CloudArrowUpIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export default function BgRemoverFullPage() {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
      setOutput(null);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(URL.createObjectURL(e.dataTransfer.files[0]));
      setOutput(null);
    }
  };

  const handleRemoveBG = async () => {
    if (!fileInput.current?.files?.[0]) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', fileInput.current.files[0]);

    try {
      const response = await axios.post('/api/remove-bg', formData, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      setOutput(url);
    } catch (err) {
      console.error(err);
      alert('Failed to remove background.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setOutput(null);
    if (fileInput.current) {
      fileInput.current.value = '';
    }
  };

  return (
<div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 text-white font-sans" style={{ backgroundColor: '#161719' }}>
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }} 
        className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600"
      >
        Background Remover
      </motion.h1>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-5xl bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-10 flex flex-col items-center gap-8"
      >
        <div
          className={`relative w-full h-64 flex flex-col items-center justify-center border-4 border-dashed rounded-2xl transition-all duration-300 cursor-pointer ${
            dragActive ? 'border-cyan-400 bg-gray-800' : 'border-gray-700 hover:border-cyan-400'
          }`}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
        >
          <input
            ref={fileInput}
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleUpload}
            className="hidden"
          />
          <AnimatePresence mode="wait">
            {!image ? (
              <motion.div
                key="upload-prompt"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-2 text-gray-400"
              >
                <CloudArrowUpIcon className="w-12 h-12" />
                <span className="text-lg font-medium">Drag & Drop or Click to Upload</span>
                <span className="text-sm">PNG, JPG, or JPEG up to 5MB</span>
              </motion.div>
            ) : (
              <motion.img
                key="image-preview"
                src={image}
                alt="preview"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="max-h-full max-w-full object-contain rounded-xl pointer-events-none p-4"
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {image && !output && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="flex gap-4"
            >
              <motion.button
                onClick={handleRemoveBG}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Remove Background'
                )}
              </motion.button>
              <motion.button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-700 text-gray-300 rounded-full shadow-lg hover:bg-gray-600 transition-colors duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrashIcon className="w-5 h-5" />
                <span>Reset</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {output && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col md:flex-row gap-6 mt-6 justify-center"
            >
              <div className="flex flex-col items-center bg-gray-800 p-6 rounded-xl shadow-md flex-1">
                <h2 className="mb-4 text-xl font-semibold text-gray-300">Original</h2>
                <div className="bg-gray-700 bg-grid-pattern p-2 rounded-lg">
                  <img src={image!} alt="original" className="max-h-96 rounded-lg object-contain" />
                </div>
              </div>
              <div className="flex flex-col items-center bg-gray-800 p-6 rounded-xl shadow-md flex-1">
                <h2 className="mb-4 text-xl font-semibold text-gray-300">Result</h2>
                <div className="bg-gray-700 bg-grid-pattern p-2 rounded-lg">
                  <img src={output} alt="result" className="max-h-96 rounded-lg object-contain" />
                </div>
                <a
                  href={output}
                  download="output.png"
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>Download PNG</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}