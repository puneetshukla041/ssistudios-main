"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle, Star } from 'lucide-react';

interface BugReportData {
  userId: string;
  username: string;
  bugType: string;
  severity: string;
  description: string;
  rating: number;
  screenshot?: string;
}

interface BugReporterCardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

const BugReporterCard = ({ isOpen, onClose, userId, username }: BugReporterCardProps) => {
  const [bugType, setBugType] = useState('Functionality');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isLoading) return;

    setIsLoading(true);
    setStatus('idle');

    const bugReport: BugReportData = {
      userId,
      username,
      bugType,
      severity,
      description,
      rating,
      screenshot: screenshot || undefined,
    };

    try {
      const response = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bugReport),
      });

      // ✅ Ensure backend always returns JSON
      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setDescription('');
        setBugType('Functionality');
        setSeverity('Medium');
        setRating(0);
        setScreenshot(null);
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            ref={cardRef}
            className="w-full max-w-xl p-6 bg-white rounded-xl shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Report an Issue</h2>
            <p className="text-sm text-gray-600 mb-6">Help us improve by providing detailed feedback.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bug type + Severity */}
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <label htmlFor="bugType" className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    id="bugType"
                    value={bugType}
                    onChange={(e) => setBugType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="Functionality">Functionality Error</option>
                    <option value="UI">UI/Visual Bug</option>
                    <option value="Performance">Performance Issue</option>
                    <option value="Data">Data Problem</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    id="severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="Low">Low - Annoyance</option>
                    <option value="Medium">Medium - Affects some functionality</option>
                    <option value="High">High - Major feature is broken</option>
                    <option value="Critical">Critical - App is unusable</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., The 'Generate Poster' button does not work after uploading a new image. The console shows an error."
                  required
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Your Experience
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={24}
                      className={`cursor-pointer transition-colors ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>

              {/* Screenshot */}
              <div>
                <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 mb-1">
                  Attach Screenshot (Optional)
                </label>
                <input
                  type="file"
                  id="screenshot"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {screenshot && (
                  <div className="mt-4 border border-gray-200 rounded-lg p-2">
                    <img src={screenshot} alt="Screenshot Preview" className="max-w-full h-auto rounded-md" />
                  </div>
                )}
              </div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </motion.button>

              {/* Status */}
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center text-green-600 mt-4 text-sm font-medium"
                >
                  <CheckCircle size={16} className="mr-2" /> Report submitted successfully!
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center text-red-600 mt-4 text-sm font-medium"
                >
                  <AlertCircle size={16} className="mr-2" /> Failed to submit report. Please try again.
                </motion.div>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BugReporterCard;
