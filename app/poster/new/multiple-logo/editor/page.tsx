'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useRef, useEffect, FC, useCallback, DragEvent } from 'react'
import { AiOutlineUpload, AiOutlineReload, AiOutlineDownload, AiOutlineDelete } from 'react-icons/ai'
import { motion, AnimatePresence } from 'framer-motion'
import { nanoid } from 'nanoid'

// --- TYPE DEFINITIONS ---
type Logo = {
  id: string
  src: string | null
  image: HTMLImageElement | null
}

type ExportFormat = 'png' | 'jpeg'
type ExportResolution = { name: string; width: number; height: number; kind?: 'preset' | 'original' }
type BackgroundType = 'original' | 'white'

// --- CONSTANTS ---
const RESOLUTIONS: ExportResolution[] = [
  { name: 'Use Original', width: 0, height: 0, kind: 'original' },
  { name: '4K (3840x2160)', width: 3840, height: 2160, kind: 'preset' },
  { name: 'Full HD (1920x1080)', width: 1920, height: 1080, kind: 'preset' },
  { name: 'Social Media (1080x1080)', width: 1080, height: 1080, kind: 'preset' }
]
const PREVIEW_WIDTH = 800
const PREVIEW_HEIGHT = 450
const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const MAX_FILE_SIZE_MB = 5


// --- CANVAS DRAWING HELPERS ---
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  lineWidth: number
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'

  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.stroke()
}

function clipRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.clip()
}


/** ========= PNG DPI WRITER (valid CRC) ========= */
function crc32(bytes: Uint8Array) {
  let c = ~0 >>> 0
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1))
  }
  return (~c) >>> 0
}
function writeUInt32BE(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = (value >>> 24) & 0xff
  buf[offset + 1] = (value >>> 16) & 0xff
  buf[offset + 2] = (value >>> 8) & 0xff
  buf[offset + 3] = value & 0xff
}
function setPngDpi(dataUrl: string, dpi: number) {
  if (!dataUrl.startsWith('data:image/png;base64,')) return dataUrl
  const base64 = dataUrl.split(',')[1]
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) return dataUrl
  let offset = 8
  let ihdrEnd = -1
  let physStart = -1
  while (offset + 8 <= bytes.length) {
    const len = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
    const chunkStart = offset
    const chunkEnd = offset + 12 + len
    if (type === 'IHDR') ihdrEnd = chunkEnd
    if (type === 'pHYs') physStart = chunkStart
    if (type === 'IEND') break
    offset = chunkEnd
  }
  if (ihdrEnd === -1) return dataUrl
  const ppm = Math.round(dpi / 0.0254)
  const pHYsData = new Uint8Array(9)
  writeUInt32BE(pHYsData, 0, ppm)
  writeUInt32BE(pHYsData, 4, ppm)
  pHYsData[8] = 1
  const typeBytes = new Uint8Array([0x70, 0x48, 0x59, 0x73])
  const crcInput = new Uint8Array(typeBytes.length + pHYsData.length)
  crcInput.set(typeBytes, 0)
  crcInput.set(pHYsData, typeBytes.length)
  const crc = crc32(crcInput)
  const pHYsChunk = new Uint8Array(4 + 4 + 9 + 4)
  writeUInt32BE(pHYsChunk, 0, 9)
  pHYsChunk.set(typeBytes, 4)
  pHYsChunk.set(pHYsData, 8)
  writeUInt32BE(pHYsChunk, 17, crc)
  let out: Uint8Array
  if (physStart !== -1) {
    const len = (bytes[physStart] << 24) | (bytes[physStart + 1] << 16) | (bytes[physStart + 2] << 8) | bytes[physStart + 3]
    const physEnd = physStart + 12 + len
    out = new Uint8Array(bytes.length - (physEnd - physStart) + pHYsChunk.length)
    out.set(bytes.subarray(0, physStart), 0)
    out.set(pHYsChunk, physStart)
    out.set(bytes.subarray(physEnd), physStart + pHYsChunk.length)
  } else {
    out = new Uint8Array(bytes.length + pHYsChunk.length)
    out.set(bytes.subarray(0, ihdrEnd), 0)
    out.set(pHYsChunk, ihdrEnd)
    out.set(bytes.subarray(ihdrEnd), ihdrEnd + pHYsChunk.length)
  }
  const CHUNK = 0x8000
  let s = ''
  for (let i = 0; i < out.length; i += CHUNK) {
    s += String.fromCharCode(...out.subarray(i, i + CHUNK))
  }
  return `data:image/png;base64,${btoa(s)}`
}

function drawPosterWithLogos(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    baseImage: HTMLImageElement,
    logos: Logo[],
    settings: {
        backgroundType: BackgroundType;
        logoRadius: number;
    }
) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(baseImage, 0, 0, canvasWidth, canvasHeight);
    const containerConfig = { top: 0.62, bottom: 0.76, hPadding: 0.35 };
    const containerY = canvasHeight * containerConfig.top;
    const containerHeight = canvasHeight * (containerConfig.bottom - containerConfig.top);
    const containerX = canvasWidth * containerConfig.hPadding;
    const containerWidth = canvasWidth * (1 - 2 * containerConfig.hPadding);
    const scaleFactor = canvasWidth / PREVIEW_WIDTH;
    const scaledRadius = 20 * scaleFactor;
    const scaledLineWidth = 2 * scaleFactor;
    const scaledLogoRadius = settings.logoRadius * scaleFactor;
    drawRoundedRect(ctx, containerX, containerY, containerWidth, containerHeight, scaledRadius, scaledLineWidth);
    const loadedLogos = logos.filter(l => l.image);
    if (loadedLogos.length === 0) return;
    if (settings.backgroundType === 'white') {
        ctx.fillStyle = 'white';
        ctx.save();
        clipRoundedRect(ctx, containerX, containerY, containerWidth, containerHeight, scaledRadius);
        ctx.fillRect(containerX, containerY, containerWidth, containerHeight);
        ctx.restore();
    }
    const totalLogos = loadedLogos.length;
    const slotWidth = containerWidth / totalLogos;
    loadedLogos.forEach((logo, idx) => {
        const img = logo.image!;
        const maxW = slotWidth * 0.85;
        const maxH = containerHeight * 0.85;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const logoWidth = img.width * scale;
        const logoHeight = img.height * scale;
        const slotStartX = containerX + idx * slotWidth;
        const x = slotStartX + (slotWidth - logoWidth) / 2;
        const y = containerY + (containerHeight - logoHeight) / 2;
        ctx.save();
        clipRoundedRect(ctx, x, y, logoWidth, logoHeight, scaledLogoRadius);
        ctx.drawImage(img, x, y, logoWidth, logoHeight);
        ctx.restore();
    });
}

interface LogoUploaderProps {
  logo: Logo;
  onFileSelect: (id: string, file: File) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
  index: number;
}
const LogoUploader: FC<LogoUploaderProps> = ({ logo, onFileSelect, onDelete, isProcessing, index }) => {
    const [isDraggedOver, setIsDraggedOver] = useState(false);
    const [error, setError] = useState<string>('');
    const handleFileValidation = (file: File): boolean => {
        setError('');
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
            setError('Invalid type');
            return false;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setError(`Max ${MAX_FILE_SIZE_MB}MB`);
            return false;
        }
        return true;
    }
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && handleFileValidation(file)) {
            onFileSelect(logo.id, file);
        }
    }
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggedOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && handleFileValidation(file)) {
            onFileSelect(logo.id, file);
        }
    }
    const uploaderBaseClasses = `relative flex-1 min-w-[120px] aspect-square flex flex-col items-center justify-center gap-2 bg-gray-900/70 border border-gray-600 p-2 rounded-lg shadow-md transition-all duration-300 group`;
    const uploaderDragClasses = isDraggedOver ? 'ring-2 ring-blue-400 scale-105 bg-blue-500/10' : '';
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`${uploaderBaseClasses} ${uploaderDragClasses}`}
            onDragEnter={(e) => { e.preventDefault(); setIsDraggedOver(true) }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setIsDraggedOver(false)}
            onDrop={handleDrop}
        >
            <AnimatePresence>
                {logo.src ? (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full flex items-center justify-center p-1">
                        <img src={logo.src} alt={`Logo ${index + 1}`} className="max-w-full max-h-full object-contain" draggable={false} />
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onDelete(logo.id)} disabled={isProcessing} className="p-2 rounded-full bg-red-600 hover:bg-red-500 text-white transition-transform hover:scale-110">
                                <AiOutlineDelete size={18} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.label key="uploader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} htmlFor={`logo-upload-${logo.id}`} className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer text-gray-400">
                        <AiOutlineUpload className={`w-6 h-6 mb-1 transition-colors ${isDraggedOver ? 'text-blue-300' : ''}`} />
                        <span className="font-semibold text-xs">Logo {index + 1}</span>
                        {error ?
                            <span className="text-xs text-red-400 mt-1">{error}</span> :
                            <span className="text-xs text-gray-500 mt-1">{isDraggedOver ? 'Release' : 'Drag/Click'}</span>
                        }
                        <input id={`logo-upload-${logo.id}`} type="file" accept={ACCEPTED_FILE_TYPES.join(',')} onChange={handleFileChange} disabled={isProcessing} className="hidden" />
                    </motion.label>
                )}
            </AnimatePresence>
        </motion.div>
    );
}


export default function PosterWithMultipleLogosEditor() {
    const combinedCanvasRef = useRef<HTMLCanvasElement>(null);
    const [baseImageSrc] = useState('/posters/poster1.jpg');
    const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
    const [logos, setLogos] = useState<Logo[]>([]);
    const [numLogos, setNumLogos] = useState(3);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showUploadAnimation, setShowUploadAnimation] = useState(false);
    const [progress, setProgress] = useState(0);
    const [backgroundType, setBackgroundType] = useState<BackgroundType>('original');
    const [logoRadius, setLogoRadius] = useState(12);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportSettings, setExportSettings] = useState({
        format: 'png' as ExportFormat,
        resolution: RESOLUTIONS[0],
        quality: 0.92,
    });
    
    // NEW: State for sidebar toggle
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = baseImageSrc;
        img.crossOrigin = 'anonymous';
        img.onload = () => setBaseImage(img);
    }, [baseImageSrc]);

    useEffect(() => {
        setLogos((prev) => {
            const newArr = Array.from({ length: numLogos }, (_, i) => prev[i] || { id: nanoid(), src: null, image: null });
            prev.slice(numLogos).forEach(logo => {
                if (logo.src && logo.src.startsWith('blob:')) URL.revokeObjectURL(logo.src);
            });
            return newArr;
        });
    }, [numLogos]);

    // Redraw canvas whenever a visual element changes
    useEffect(() => {
        const canvas = combinedCanvasRef.current;
        // **THE FIX:** Explicitly check if canvas and baseImage exist before proceeding.
        // This prevents the "cannot set properties of null" error.
        if (!canvas || !baseImage) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        
        canvas.width = PREVIEW_WIDTH;
        canvas.height = PREVIEW_HEIGHT;

        drawPosterWithLogos(ctx, PREVIEW_WIDTH, PREVIEW_HEIGHT, baseImage, logos, { backgroundType, logoRadius });

    }, [baseImage, logos, backgroundType, logoRadius]);

    const startProgressAnimation = (onComplete: () => void) => {
        setShowUploadAnimation(true);
        setProgress(0);
        let current = 0;
        const interval = setInterval(() => {
            current++;
            setProgress(current);
            if (current >= 100) {
                clearInterval(interval);
                onComplete();
                setTimeout(() => setShowUploadAnimation(false), 500);
            }
        }, 8);
    };

    const handleFileSelect = useCallback((id: string, file: File) => {
        setUploading(true);
        startProgressAnimation(() => {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                setLogos(prev => prev.map(logo => {
                    if (logo.id === id) {
                        if (logo.src && logo.src.startsWith('blob:')) URL.revokeObjectURL(logo.src);
                        return { ...logo, src: objectUrl, image: img };
                    }
                    return logo;
                }));
                setUploading(false);
            };
            img.onerror = () => {
                alert('Failed to load image');
                URL.revokeObjectURL(objectUrl);
                setUploading(false);
            };
            img.src = objectUrl;
        });
    }, []);

    const handleDelete = useCallback((id: string) => {
        setLogos(prev => prev.map(logo => {
            if (logo.id === id) {
                if (logo.src && logo.src.startsWith('blob:')) URL.revokeObjectURL(logo.src);
                return { ...logo, src: null, image: null };
            }
            return logo;
        }));
    }, []);

    const handleReset = () => {
        setLogos(prev => {
            prev.forEach(logo => {
                if (logo.src && logo.src.startsWith('blob:')) URL.revokeObjectURL(logo.src);
            });
            return Array.from({ length: numLogos }, () => ({ id: nanoid(), src: null, image: null }));
        });
        setLogoRadius(12);
        setBackgroundType('original');
    };

    const executeExport = async () => {
        if (!baseImage || logos.every(l => !l.image)) return;
        setGenerating(true);
        setShowExportModal(false);
        await new Promise(r => setTimeout(r, 300));
        let outW = exportSettings.resolution.width;
        let outH = exportSettings.resolution.height;
        if (exportSettings.resolution.kind === 'original') {
            outW = baseImage.naturalWidth;
            outH = baseImage.naturalHeight;
        }
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;
        exportCanvas.width = outW;
        exportCanvas.height = outH;
        ctx.imageSmoothingQuality = 'high';
        drawPosterWithLogos(ctx, outW, outH, baseImage, logos, { backgroundType, logoRadius });
        const mimeType = `image/${exportSettings.format}`;
        let dataUrl = exportCanvas.toDataURL(mimeType, exportSettings.quality);
        if (exportSettings.format === 'png') {
            dataUrl = setPngDpi(dataUrl, 300);
        }
        const blob = await (await fetch(dataUrl)).blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `poster_with_logos_${outW}x${outH}.${exportSettings.format}`;
        link.click();
        URL.revokeObjectURL(link.href);
        setGenerating(false);
    };

    const canGenerate = logos.some(l => l.image) && !generating && !uploading;
    const circumference = 2 * Math.PI * 44;
    const dashOffset = circumference - (progress / 100) * circumference;

    // Function to toggle sidebar visibility
    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex min-h-screen bg-transparent text-gray-300 font-sans">
            {/* Pass isOpen and toggleSidebar to the Sidebar component */}
            <Sidebar forceActive="New Poster" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            
            {/* Adjust the main content margin based on sidebar state */}
            <main className={`flex-1 flex flex-col p-6 lg:p-8 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <header className="text-left mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-white">Creative Studio</h1>
                    <p className="text-gray-400 mt-1">Add your brand logos to the poster and export.</p>
                </header>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex flex-col gap-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-4">1. Upload Logos</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="num-logos" className="block font-medium text-gray-300 text-sm mb-2">Number of Logos</label>
                                    <select id="num-logos" value={numLogos} onChange={e => setNumLogos(Number(e.target.value))} disabled={uploading || generating} className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded-md px-4 py-2 cursor-pointer outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-500 transition-colors">
                                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {logos.map((logo, idx) => (
                                        <LogoUploader key={logo.id} logo={logo} index={idx} onFileSelect={handleFileSelect} onDelete={handleDelete} isProcessing={generating || uploading} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className={`transition-opacity duration-500 ${!logos.some(l=>l.image) ? 'opacity-30 pointer-events-none' : ''}`}>
                            <h2 className="text-lg font-semibold text-white mb-4">2. Adjust</h2>
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="background-select" className="block font-medium text-gray-300 text-sm mb-2">Background Plate</label>
                                    <select id="background-select" value={backgroundType} onChange={e => setBackgroundType(e.target.value as BackgroundType)} disabled={generating || uploading} className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded-md px-4 py-2 cursor-pointer outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-500 transition-colors">
                                        <option value="original">Transparent</option>
                                        <option value="white">White</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="logo-radius" className="block font-medium text-gray-300 text-sm mb-2">Logo Curve: {logoRadius}px</label>
                                    <input id="logo-radius" type="range" min="0" max="50" value={logoRadius} onChange={e => setLogoRadius(Number(e.target.value))} disabled={generating || uploading} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-slider" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto flex flex-col gap-4">
                            <button onClick={() => setShowExportModal(true)} disabled={!canGenerate} className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/40">
                                <AiOutlineDownload size={22} />
                                {generating ? 'Exporting...' : 'Export Poster'}
                            </button>
                            {logos.some(l=>l.image) && (
                                <button onClick={handleReset} disabled={generating || uploading} className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 font-medium px-5 py-2 rounded-lg transition-all text-sm">
                                    <AiOutlineReload size={18} />
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-2 relative w-full h-full min-h-[50vh] flex flex-col items-center justify-center">
                        <div className="relative w-full aspect-video rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl shadow-black/30 bg-gray-900">
                           <canvas ref={combinedCanvasRef} className="absolute inset-0 w-full h-full" />
                        </div>
                    </div>
                </div>
                <AnimatePresence>
                    {showUploadAnimation && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                            <svg className="w-24 h-24 mb-4 text-gray-400" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.25" />
                                <motion.circle cx="50" cy="50" r="44" stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} className="animate-pulse" />
                            </svg>
                            <p className="text-gray-200 text-lg font-semibold select-none">UPLOADING... {progress}%</p>
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {showExportModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
                                <h2 className="text-2xl font-bold text-white mb-6">Export Settings</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="export-format" className="block font-medium text-gray-300 text-sm mb-2">Format</label>
                                        <select id="export-format" value={exportSettings.format} onChange={e => setExportSettings({ ...exportSettings, format: e.target.value as ExportFormat })} className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded-md px-4 py-2 cursor-pointer outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-500 transition-colors">
                                            <option value="png">PNG (High Quality, 300 DPI)</option>
                                            <option value="jpeg">JPEG (Smaller File)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="export-resolution" className="block font-medium text-gray-300 text-sm mb-2">Resolution</label>
                                        <select id="export-resolution" value={exportSettings.resolution.name} onChange={e => setExportSettings({ ...exportSettings, resolution: RESOLUTIONS.find(r => r.name === e.target.value) || RESOLUTIONS[0] })} className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded-md px-4 py-2 cursor-pointer outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-500 transition-colors">
                                                {RESOLUTIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <p className="text-xs text-gray-400 text-center pt-2">
                                        PNG exports embed a true 300 DPI tag. “Use Original” keeps the base image’s native pixels.
                                    </p>
                                </div>
                                <div className="mt-8 flex justify-end gap-4">
                                    <button onClick={() => setShowExportModal(false)} className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded-lg transition-colors">Cancel</button>
                                    <button onClick={executeExport} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg transition-colors">Export Now</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            <style jsx global>{`
                .range-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid white;
                    margin-top: -7px;
                }
                .range-slider::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    background: #3b82f6;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid white;
                    margin-top: -7px;
                }
            `}</style>
        </div>
    )
}