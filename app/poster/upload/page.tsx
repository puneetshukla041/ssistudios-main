"use client";

import React, { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, AlertTriangle, File, X } from 'lucide-react';

// --- Mock Authentication Context ---
// This mock replaces the unresolved import "@/contexts/AuthContext"
// to make the component self-contained and runnable.
interface User {
  uid?: string;
  id?: string;
  username?: string;
}

const useAuth = () => {
  return { user: { uid: '123-test-user', username: 'DemoUser' } };
};
// ------------------------------------

// Animated sphere component
const AnimatedSphere = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !mounted) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let parentElement = canvas.parentElement;

    const resizeCanvas = () => {
      if(!parentElement) return;
      const rect = parentElement.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Sphere properties
    const getDynamicCenterX = () => parentElement ? parentElement.clientWidth / 2 : 0;
    const getDynamicCenterY = () => parentElement ? parentElement.clientHeight / 2 : 0;
    let radius = Math.min(getDynamicCenterX(), getDynamicCenterY()) * 0.8
    
    // Node network
    const nodes: Array<{
      x: number
      y: number
      z: number
      originalX: number
      originalY: number
      originalZ: number
    }> = []

    // Create nodes on sphere surface
    const nodeCount = 80
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount)
      const theta = Math.sqrt(nodeCount * Math.PI) * phi
      
      const x = radius * Math.cos(theta) * Math.sin(phi)
      const y = radius * Math.sin(theta) * Math.sin(phi)
      const z = radius * Math.cos(phi)
      
      nodes.push({
        x: getDynamicCenterX() + x,
        y: getDynamicCenterY() + y,
        z,
        originalX: x,
        originalY: y,
        originalZ: z
      })
    }

    let animationFrame: number
    let time = 0

    const animate = () => {
      let centerX = getDynamicCenterX();
      let centerY = getDynamicCenterY();
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.01

      // Update node positions with rotation
      nodes.forEach((node) => {
        const rotationY = time * 0.5
        const rotationX = time * 0.3
        
        // Rotate around Y axis
        const cosY = Math.cos(rotationY)
        const sinY = Math.sin(rotationY)
        const x1 = node.originalX * cosY - node.originalZ * sinY
        const z1 = node.originalX * sinY + node.originalZ * cosY
        
        // Rotate around X axis
        const cosX = Math.cos(rotationX)
        const sinX = Math.sin(rotationX)
        const y1 = node.originalY * cosX - z1 * sinX
        const z2 = node.originalY * sinX + z1 * cosX
        
        node.x = centerX + x1
        node.y = centerY + y1
        node.z = z2
      })

      // Draw connections
      nodes.forEach((node, i) => {
        nodes.forEach((otherNode, j) => {
          if (i < j) {
            const dx = node.x - otherNode.x
            const dy = node.y - otherNode.y
            const dz = node.z - otherNode.z
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
            
            if (distance < radius * 0.8) {
              const opacity = Math.max(0, (radius * 0.8 - distance) / (radius * 0.8)) * 0.3
              const avgZ = (node.z + otherNode.z) / 2
              const depthOpacity = (avgZ + radius) / (2 * radius)
              
              ctx.strokeStyle = `rgba(107, 72, 255, ${opacity * depthOpacity})`
              ctx.lineWidth = 0.5
              ctx.beginPath()
              ctx.moveTo(node.x, node.y)
              ctx.lineTo(otherNode.x, otherNode.y)
              ctx.stroke()
            }
          }
        })
      })

      // Draw nodes
      nodes.forEach(node => {
        const depthOpacity = (node.z + radius) / (2 * radius)
        const size = 1 + depthOpacity * 2
        
        ctx.fillStyle = `rgba(107, 72, 255, ${depthOpacity * 0.8})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrame)
    }
  }, [mounted])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    />
  )
}


export default function UploadPage() {
  const { user } = useAuth() as { user: User | null };

  // --- State Management ---
  const [templateName, setTemplateName] = useState<string>('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // --- Effects ---
  useEffect(() => {
    return () => { if (filePreview) URL.revokeObjectURL(filePreview); };
  }, [filePreview]);

  useEffect(() => {
    // This effect simulates a realistic progress bar during the upload.
    if (uploadStatus === 'uploading') {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) { // Stop at 95% to wait for the server response
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [uploadStatus]);

  // --- File Handling ---
  const clearFile = () => {
    setTemplateFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    const fileInput = document.getElementById('templateFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setMessage('');
    setUploadStatus('idle');
  };

  const handleFileChange = (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setMessage('File is too large (Max 50MB).');
      setUploadStatus('error');
      clearFile();
      return;
    }
    setTemplateFile(file);
    setMessage('');
    setUploadStatus('idle');
    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  // --- Form Submission with REAL Backend Logic ---
  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !templateFile) {
      setMessage('All fields are required.');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setMessage('');

    try {
      const userId = user?.uid || user?.id;
      if (!userId) {
        throw new Error('User not authenticated.');
      }

      // Create FormData to send both text and file data
      const formData = new FormData();
      formData.append('templateName', templateName.trim());
      formData.append('templateFile', templateFile);
      formData.append('userId', userId);

      // --- ACTUAL BACKEND FETCH CALL ---
      const response = await fetch('/api/posters/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An unknown error occurred during upload.');
      }
      
      // If fetch is successful, complete the animation and show success
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for progress bar to finish
      setUploadStatus('success');
      setMessage('Template uploaded successfully! It will appear in your dashboard soon.');

    } catch (err: any) {
      setUploadStatus('error');
      setMessage(err.message || 'An unknown error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Reset Logic ---
  const resetForm = () => {
    setTemplateName('');
    clearFile();
    setUploadStatus('idle');
  }

  // --- Drag & Drop Handlers ---
  const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans p-4 overflow-hidden relative">
       {/* Decorative Background */}
      <div className="absolute inset-0 z-0 opacity-70">
        <div className="absolute top-0 left-0 w-126 h-126 -translate-x-1/4 -translate-y-1/4">
          <AnimatedSphere />
        </div>
        <div className="absolute bottom-0 right-10 w-126 h-126 translate-x-1/6 translate-y-1/6">
          <AnimatedSphere />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="w-full max-w-md z-10">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            {uploadStatus === 'success' ? (
              // --- Success State ---
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="p-8 text-center"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                  className="flex justify-center"
                >
                  <CheckCircle className="h-16 w-16 text-green-500 bg-green-50 p-3 rounded-full" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                  className="text-2xl font-bold text-gray-800 mt-4"
                >
                  Upload Successful
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                  className="text-gray-600 mt-2"
                >
                  {message}
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                  onClick={resetForm}
                  className="mt-6 w-full py-2.5 px-4 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Upload Another File
                </motion.button>
              </motion.div>
            ) : (
              // --- Form State ---
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="p-8"
              >
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">Upload New Template</h1>
                  <p className="text-gray-500 mt-1">Share your work with the community.</p>
                </div>
                
                <form onSubmit={handleUpload} className="space-y-5 mt-8">
                  <div>
                    <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                    <input
                      type="text"
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., 'Modern Business Flyer'"
                      disabled={isUploading}
                      className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <AnimatePresence mode="wait">
                      {!templateFile ? (
                        <motion.label
                          key="dropzone"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          htmlFor="templateFile"
                          onDragEnter={(e) => handleDragEvents(e, true)}
                          onDragOver={(e) => handleDragEvents(e, true)}
                          onDragLeave={(e) => handleDragEvents(e, false)}
                          onDrop={handleDrop}
                          className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300
                            ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <div className="flex flex-col items-center justify-center text-center">
                            <UploadCloud size={32} className="text-gray-500 mb-2" />
                            <p className="text-sm text-gray-600"><span className="font-semibold text-blue-600">Click to upload</span> or drag & drop</p>
                            <p className="text-xs text-gray-500 mt-1">Max file size: 50MB</p>
                          </div>
                          <input id="templateFile" type="file" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0])} disabled={isUploading} />
                        </motion.label>
                      ) : (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white flex items-center space-x-3"
                        >
                          {filePreview ? <img src={filePreview} alt="Preview" className="h-12 w-12 rounded-md object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100"><File className="h-6 w-6 text-gray-500" /></div>}
                          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{templateFile.name}</p><p className="text-xs text-gray-500">{(templateFile.size / 1024 / 1024).toFixed(2)} MB</p></div>
                          <button type="button" onClick={clearFile} disabled={isUploading} className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"><X size={18} /></button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {message && uploadStatus === 'error' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm p-3 rounded-md flex items-center gap-2 font-medium bg-red-50 text-red-800">
                        <AlertTriangle size={18} /><span>{message}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {uploadStatus === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <motion.div
                        className="bg-blue-600 h-2.5 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: "linear", duration: 0.2 }}
                      ></motion.div>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full py-2.5 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait shadow-sm hover:shadow-md cursor-pointer"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Template'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- Global Styles ---
const style = document.createElement('style');
style.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
  body { font-family: 'Inter', sans-serif; }
`;
document.head.appendChild(style);