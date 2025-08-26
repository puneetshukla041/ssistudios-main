'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  X,
  PlusCircle,
  Download,
  RotateCcw,
  Maximize2,
  Minimize2,
  Droplets,
  Ruler,
  Paintbrush,
  Square,
  LayoutGrid,
  LayoutPanelLeft
} from 'lucide-react'

// --- HELPER FUNCTIONS ---
// Helper functions remain unchanged, but I've added one new function for the curved plate.
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  lineWidth: number
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0)'
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

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}


/** ========= PNG DPI WRITER (valid CRC) ========= */
function crc32(bytes: Uint8Array) {
  let c = ~0 >>> 0
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1))
  }
  return ~c >>> 0
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
    const len =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    )
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
    const len =
      (bytes[physStart] << 24) |
      (bytes[physStart + 1] << 16) |
      (bytes[physStart + 2] << 8) |
      bytes[physStart + 3]
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
/** ============== END PNG DPI WRITER ============== */

/** ========= JPEG DPI WRITER ========= */
function setJpegDpi(dataUrl: string, dpi: number) {
  if (!dataUrl.startsWith('data:image/jpeg;base64,')) return dataUrl

  const base64 = dataUrl.split(',')[1]
  const bin = atob(base64)
  const len = bin.length

  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i)
  }

  const app0Offset = 2

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[app0Offset] !== 0xff || bytes[app0Offset + 1] !== 0xe0) {
    console.warn('Standard JFIF header not found. Cannot set DPI.')
    return dataUrl
  }

  const jfifIdOffset = app0Offset + 4
  if (
    bytes[jfifIdOffset] !== 0x4a ||
    bytes[jfifIdOffset + 1] !== 0x46 ||
    bytes[jfifIdOffset + 2] !== 0x49 ||
    bytes[jfifIdOffset + 3] !== 0x46 ||
    bytes[jfifIdOffset + 4] !== 0x00
  ) {
    console.warn('JFIF identifier not found. Cannot set DPI.')
    return dataUrl
  }

  const unitsOffset = app0Offset + 11
  const xDensityOffset = app0Offset + 12
  const yDensityOffset = app0Offset + 14

  bytes[unitsOffset] = 1

  bytes[xDensityOffset] = (dpi >> 8) & 0xff
  bytes[xDensityOffset + 1] = dpi & 0xff

  bytes[yDensityOffset] = (dpi >> 8) & 0xff
  bytes[yDensityOffset + 1] = dpi & 0xff

  const CHUNK = 0x8000
  let s = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return `data:image/jpeg;base64,${btoa(s)}`
}
/** ============== END JPEG DPI WRITER ============== */

// --- TYPE DEFINITIONS ---
type ExportFormat = 'png' | 'jpeg'
type ExportResolution = { name: string; width: number; height: number; kind?: 'preset' | 'original' }
type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'

// --- CONSTANTS ---
const RESOLUTIONS: ExportResolution[] = [
  { name: 'Original', width: 0, height: 0, kind: 'original' },
  { name: '4K (3840x2160)', width: 3840, height: 2160, kind: 'preset' },
  { name: 'Full HD (1920x1080)', width: 1920, height: 1080, kind: 'preset' },
  { name: 'Social (1080x1080)', width: 1080, height: 1080, kind: 'preset' }
]

const BLEND_MODES: BlendMode[] = [
  'source-over',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity'
]

// --- MAIN COMPONENT ---
export default function PosterEditor() {
  const combinedCanvasRef = useRef<HTMLCanvasElement>(null)
  const logoPreviewCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [baseImageSrc, setBaseImageSrc] = useState('/posters/poster1.jpg')
  const [logoImageSrc, setLogoImageSrc] = useState<string | null>(null)
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null)
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)

  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const [backgroundType, setBackgroundType] = useState<'original' | 'white'>('original')

  // Logo transformation states
  const [logoZoom, setLogoZoom] = useState(100)
  const [logoRotation, setLogoRotation] = useState(0)
  const [logoOpacity, setLogoOpacity] = useState(100)
  const [logoBorderWidth, setLogoBorderWidth] = useState(0)
  const [logoBorderColor, setLogoBorderColor] = useState('#ffffff')
  const [logoBlendMode, setLogoBlendMode] = useState<BlendMode>('source-over')
  const [logoHorizontalOffset, setLogoHorizontalOffset] = useState(0);
  const [logoVerticalOffset, setLogoVerticalOffset] = useState(0);
  const [logoRadius, setLogoRadius] = useState(0);
  const [logoPlateHorizontalPadding, setLogoPlateHorizontalPadding] = useState(15);
  const [logoPlateVerticalPadding, setLogoPlateVerticalPadding] = useState(15);
  const [logoPlateRadius, setLogoPlateRadius] = useState(0);

  const [exportSettings, setExportSettings] = useState({
    format: 'jpeg' as ExportFormat,
    resolution: RESOLUTIONS[0],
    quality: 1.0
  })

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)


  const previewWidth = 1920
  const previewHeight = 1080

  useEffect(() => {
    if (!baseImageSrc) return setBaseImage(null)
    const img = new Image()
    img.src = baseImageSrc
    img.crossOrigin = 'anonymous'
    img.onload = () => setBaseImage(img)
    img.onerror = (e) => console.error("Failed to load base image:", e);
  }, [baseImageSrc])

  useEffect(() => {
    if (!logoImageSrc) return setLogoImage(null)
    const img = new Image()
    img.src = logoImageSrc
    img.crossOrigin = 'anonymous'
    img.onload = () => setLogoImage(img)
    img.onerror = (e) => {
      console.error("Failed to load logo image:", e);
      setLogoImageSrc(null);
    }
  }, [logoImageSrc])

  const drawLogoPreview = useCallback(() => {
    const canvas = logoPreviewCanvasRef.current
    if (!canvas || !logoImage) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const maxDimension = 1000;
    let logoCanvasWidth = logoImage.naturalWidth || logoImage.width;
    let logoCanvasHeight = logoImage.naturalHeight || logoImage.height;

    const aspectRatio = logoCanvasWidth / logoCanvasHeight;
    if (logoCanvasWidth > maxDimension || logoCanvasHeight > maxDimension) {
      if (logoCanvasWidth > logoCanvasHeight) {
        logoCanvasWidth = maxDimension;
        logoCanvasHeight = maxDimension / aspectRatio;
      } else {
        logoCanvasHeight = maxDimension;
        logoCanvasWidth = maxDimension * aspectRatio;
      }
    }

    canvas.width = logoCanvasWidth;
    canvas.height = logoCanvasHeight;

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(logoRotation * (Math.PI / 180))

    const originalLogoDrawWidth = logoImage.width;
    const originalLogoDrawHeight = logoImage.height;

    const fitScale = Math.min(canvas.width / originalLogoDrawWidth, canvas.height / originalLogoDrawHeight);
    const currentLogoScaleFactor = fitScale * (logoZoom / 100);

    ctx.scale(currentLogoScaleFactor, currentLogoScaleFactor);

    ctx.globalAlpha = logoOpacity / 100
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';

    const drawX = -originalLogoDrawWidth / 2
    const drawY = -originalLogoDrawHeight / 2

    const effectiveLogoRadius = logoRadius / currentLogoScaleFactor;
    if (effectiveLogoRadius > 0) {
      clipRoundedRect(ctx, drawX, drawY, originalLogoDrawWidth, originalLogoDrawHeight, effectiveLogoRadius);
    }
    ctx.drawImage(logoImage, drawX, drawY, originalLogoDrawWidth, originalLogoDrawHeight)
    ctx.restore()

    if (logoBorderWidth > 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(logoRotation * (Math.PI / 180));
      ctx.scale(currentLogoScaleFactor, currentLogoScaleFactor);
      ctx.strokeStyle = logoBorderColor;
      ctx.lineWidth = logoBorderWidth / currentLogoScaleFactor;
      drawRoundedRect(ctx, drawX, drawY, originalLogoDrawWidth, originalLogoDrawHeight, effectiveLogoRadius, ctx.lineWidth);
      ctx.restore();
    }
  }, [logoImage, logoZoom, logoRotation, logoOpacity, logoRadius, logoBorderWidth, logoBorderColor])

  useEffect(() => {
    drawLogoPreview()
  }, [drawLogoPreview])

  useEffect(() => {
    const canvas = combinedCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = previewWidth
    canvas.height = previewHeight

    ctx.clearRect(0, 0, previewWidth, previewHeight)

    if (baseImage) {
      ctx.drawImage(baseImage, 0, 0, previewWidth, previewHeight)
    }

    if (logoImage && logoPreviewCanvasRef.current) {
      const transformedLogoCanvas = logoPreviewCanvasRef.current;
      const containerConfig = { top: 0.62, bottom: 0.76, hPadding: 0.35 };
      const containerY = previewHeight * containerConfig.top;
      const containerHeight = previewHeight * (containerConfig.bottom - containerConfig.top);
      const containerX = previewWidth * containerConfig.hPadding;
      const containerWidth = previewWidth * (1 - 2 * containerConfig.hPadding);
      const transformedLogoRenderWidth = transformedLogoCanvas.width;
      const transformedLogoRenderHeight = transformedLogoCanvas.height;
      const scaleFactorToFitContainer = Math.min(
        containerWidth / transformedLogoRenderWidth,
        containerHeight / transformedLogoRenderHeight
      );
      const finalLogoWidth = transformedLogoRenderWidth * scaleFactorToFitContainer;
      const finalLogoHeight = transformedLogoRenderHeight * scaleFactorToFitContainer;
      let x = containerX + (containerWidth - finalLogoWidth) / 2;
      let y = containerY + (containerHeight - finalLogoHeight) / 2;
      x += (logoHorizontalOffset / 100) * containerWidth;
      y += (logoVerticalOffset / 100) * containerHeight;

      if (backgroundType === 'white') {
        const hPadding = finalLogoWidth * (logoPlateHorizontalPadding / 100);
        const vPadding = finalLogoHeight * (logoPlateVerticalPadding / 100);
        const plateWidth = finalLogoWidth + hPadding * 2;
        const plateHeight = finalLogoHeight + vPadding * 2;
        const plateX = x - hPadding;
        const plateY = y - vPadding;
        ctx.fillStyle = 'white';
        fillRoundedRect(ctx, plateX, plateY, plateWidth, plateHeight, logoPlateRadius);
      }

      ctx.save();
      ctx.globalCompositeOperation = logoBlendMode;
      ctx.drawImage(transformedLogoCanvas, x, y, finalLogoWidth, finalLogoHeight);
      ctx.restore();
    }
  }, [
    baseImage, logoImage, backgroundType, logoHorizontalOffset, logoVerticalOffset,
    logoBlendMode, previewWidth, previewHeight, drawLogoPreview,
    logoPlateHorizontalPadding, logoPlateVerticalPadding, logoPlateRadius
  ])

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const objectUrl = URL.createObjectURL(file)
    setLogoImageSrc(objectUrl)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      setUploading(false)
    }
    img.onerror = () => {
      console.error('Failed to load image. Please ensure it is a valid PNG.')
      setUploading(false)
      setLogoImageSrc(null)
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
  }

  const handleGenerateClick = () => {
    if (!baseImage || !logoImage) return
    setShowExportModal(true)
  }

  async function executeExport() {
    if (!baseImage || !logoImage || !logoPreviewCanvasRef.current) return
    setGenerating(true)
    setShowExportModal(false)
    await new Promise((r) => setTimeout(r, 300))

    let outW = exportSettings.resolution.width
    let outH = exportSettings.resolution.height
    if (exportSettings.resolution.kind === 'original' && baseImage) {
      outW = (baseImage as any).naturalWidth || baseImage.width
      outH = (baseImage as any).naturalHeight || baseImage.height
    }
    outW = Math.max(16, Math.floor(outW || 0))
    outH = Math.max(16, Math.floor(outH || 0))

    const exportCanvas = document.createElement('canvas')
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return
    exportCanvas.width = outW
    exportCanvas.height = outH
    ctx.imageSmoothingEnabled = true
    ;(ctx as any).imageSmoothingQuality = 'high'

    ctx.drawImage(baseImage, 0, 0, outW, outH)

    const transformedLogoCanvas = logoPreviewCanvasRef.current;
    const containerConfig = { top: 0.62, bottom: 0.76, hPadding: 0.35 }
    const containerY = outH * containerConfig.top
    const containerHeight = outH * (containerConfig.bottom - containerConfig.top)
    const containerX = outW * containerConfig.hPadding
    const containerWidth = outW * (1 - 2 * containerConfig.hPadding)
    const transformedLogoRenderWidth = transformedLogoCanvas.width;
    const transformedLogoRenderHeight = transformedLogoCanvas.height;
    const scaleFactorToFitContainer = Math.min(
      containerWidth / transformedLogoRenderWidth,
      containerHeight / transformedLogoRenderHeight
    );
    const finalLogoWidth = transformedLogoRenderWidth * scaleFactorToFitContainer;
    const finalLogoHeight = transformedLogoRenderHeight * scaleFactorToFitContainer;
    let x = containerX + (containerWidth - finalLogoWidth) / 2;
    let y = containerY + (containerHeight - finalLogoHeight) / 2;
    x += (logoHorizontalOffset / 100) * containerWidth;
    y += (logoVerticalOffset / 100) * containerHeight;

    if (backgroundType === 'white') {
      const hPadding = finalLogoWidth * (logoPlateHorizontalPadding / 100);
      const vPadding = finalLogoHeight * (logoPlateVerticalPadding / 100);
      const plateWidth = finalLogoWidth + hPadding * 2;
      const plateHeight = finalLogoHeight + vPadding * 2;
      const plateX = x - hPadding;
      const plateY = y - vPadding;
      ctx.fillStyle = 'white';
      fillRoundedRect(ctx, plateX, plateY, plateWidth, plateHeight, logoPlateRadius);
    }

    ctx.save();
    ctx.globalCompositeOperation = logoBlendMode;
    ctx.drawImage(transformedLogoCanvas, x, y, finalLogoWidth, finalLogoHeight);
    ctx.restore();

    const mimeType = `image/${exportSettings.format}`
    let dataUrl = exportCanvas.toDataURL(mimeType, exportSettings.quality)
    if (exportSettings.format === 'png') {
      dataUrl = setPngDpi(dataUrl, 300)
    } else if (exportSettings.format === 'jpeg') {
      dataUrl = setJpegDpi(dataUrl, 300)
    }
    const base64Data = dataUrl.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const fileW = outW
    const fileH = outH
    link.download = `poster_ssi_${fileW}x${fileH}.${exportSettings.format}`
    link.click()
    URL.revokeObjectURL(link.href)
    setGenerating(false)
  }

  const ResetButton = ({ onReset, isDefault }: { onReset: () => void; isDefault: boolean }) => (
    <button
      onClick={onReset}
      className={`text-zinc-500 hover:text-zinc-300 transition-colors duration-200 cursor-pointer ${isDefault ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}
      aria-label="Reset setting"
      disabled={isDefault}
    >
      <RotateCcw size={12} />
    </button>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  )

  const InputGroup = ({ label, value, unit, children, onReset, isDefault }: { label: string, value: number, unit: string, children: React.ReactNode, onReset: () => void, isDefault: boolean }) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
        <span>{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-zinc-300">{value}{unit}</span>
          <ResetButton onReset={onReset} isDefault={isDefault} />
        </div>
      </div>
      {children}
    </div>
  )

  return (
<div className="absolute top-0 bottom-0 right-0 left-20 bg-black text-neutral-200 overflow-hidden flex flex-col">

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 bg-[#1a1b1f] border-b border-zinc-700/50 z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold tracking-wider uppercase text-zinc-400">
            Professional Poster Designer
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Toggle left sidebar"
          >
            <LayoutPanelLeft size={18} />
          </button>
          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Toggle right sidebar"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-hidden flex pt-12">
        {/* Left Sidebar */}
        <AnimatePresence>
          {isLeftSidebarOpen && (
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="absolute lg:relative left-0 top-12 bottom-0 w-80 bg-[#1a1b1f] border-r border-zinc-700/50 flex flex-col p-4 z-10 overflow-y-auto custom-scrollbar"
            >
              <button
                className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 lg:hidden cursor-pointer"
                onClick={() => setIsLeftSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col gap-6 pt-4">
                <Section title="Logo Properties">
                  <InputGroup
                    label="Scale"
                    value={logoZoom}
                    unit="%"
                    onReset={() => setLogoZoom(100)}
                    isDefault={logoZoom === 100}
                  >
                    <input type="range" min="10" max="200" value={logoZoom} onChange={(e) => setLogoZoom(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage} />
                  </InputGroup>
                  <InputGroup
                    label="Rotation"
                    value={logoRotation}
                    unit="°"
                    onReset={() => setLogoRotation(0)}
                    isDefault={logoRotation === 0}
                  >
                    <input type="range" min="-180" max="180" value={logoRotation} onChange={(e) => setLogoRotation(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage} />
                  </InputGroup>
                  <InputGroup
                    label="Opacity"
                    value={logoOpacity}
                    unit="%"
                    onReset={() => setLogoOpacity(100)}
                    isDefault={logoOpacity === 100}
                  >
                    <input type="range" min="0" max="100" value={logoOpacity} onChange={(e) => setLogoOpacity(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage} />
                  </InputGroup>
                  <InputGroup
                    label="Corner Radius"
                    value={logoRadius}
                    unit="px"
                    onReset={() => setLogoRadius(0)}
                    isDefault={logoRadius === 0}
                  >
                    <input type="range" min="0" max="50" value={logoRadius} onChange={(e) => setLogoRadius(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage} />
                  </InputGroup>
                </Section>
                <div className="w-full h-px bg-zinc-700/50" />
                <Section title="Tools">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { fileInputRef.current?.click() }}
                      disabled={uploading}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-zinc-700 hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <PlusCircle size={16} /> Upload Logo
                    </button>
                    <button
                      onClick={handleGenerateClick}
                      disabled={!logoImage || generating}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-zinc-200 text-zinc-900 hover:bg-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Download size={16} /> Export
                    </button>
                    <input ref={fileInputRef} type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
                  </div>
                </Section>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Central Preview Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-[#1a1b1f] relative">
          {!baseImage && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-lg font-light">
              Loading base image...
            </div>
          )}
          <div className="relative w-full h-full max-w-[1280px] max-h-[720px] shadow-2xl rounded-xl overflow-hidden flex items-center justify-center">
            <canvas
              ref={combinedCanvasRef}
              className="w-full h-full object-contain"
            />
            {(!logoImage) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-light">
                Upload a logo to begin
              </div>
            )}
            <canvas ref={logoPreviewCanvasRef} className="hidden" />
          </div>
        </div>

        {/* Right Sidebar */}
        <AnimatePresence>
          {isRightSidebarOpen && (
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="absolute lg:relative right-0 top-12 bottom-0 w-80 bg-[#1a1b1f] border-l border-zinc-700/50 flex flex-col p-4 z-10 overflow-y-auto custom-scrollbar"
            >
              <button
                className="absolute top-2 left-2 p-1 text-zinc-500 hover:text-zinc-300 lg:hidden cursor-pointer"
                onClick={() => setIsRightSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col gap-6 pt-4">

                <Section title="Position">
                  <InputGroup
                    label="Horizontal"
                    value={logoHorizontalOffset}
                    unit="%"
                    onReset={() => setLogoHorizontalOffset(0)}
                    isDefault={logoHorizontalOffset === 0}
                  >
                    <input type="range" min="-50" max="50" value={logoHorizontalOffset} onChange={(e) => setLogoHorizontalOffset(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage} />
                  </InputGroup>
                  <InputGroup
                    label="Vertical"
                    value={logoVerticalOffset}
                    unit="%"
                    onReset={() => setLogoVerticalOffset(0)}
                    isDefault={logoVerticalOffset === 0}
                  >
                    <input type="range" min="-50" max="50" value={logoVerticalOffset} onChange={(e) => setLogoVerticalOffset(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage} />
                  </InputGroup>
                </Section>
                <div className="w-full h-px bg-zinc-700/50" />
                <Section title="Effects">
                  <div>
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
                      <span>Blend Mode</span>
                      <ResetButton onReset={() => setLogoBlendMode('source-over')} isDefault={logoBlendMode === 'source-over'} />
                    </div>
                    <select
                      value={logoBlendMode}
                      onChange={(e) => setLogoBlendMode(e.target.value as BlendMode)}
                      disabled={!logoImage}
                      className="w-full px-2 py-1 text-xs rounded bg-zinc-700 border border-zinc-600 text-zinc-200 focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 cursor-pointer transition-colors"
                    >
                      {BLEND_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  <InputGroup
                    label="Border"
                    value={logoBorderWidth}
                    unit="px"
                    onReset={() => setLogoBorderWidth(0)}
                    isDefault={logoBorderWidth === 0}
                  >
                    <input type="range" min="0" max="20" value={logoBorderWidth} onChange={(e) => setLogoBorderWidth(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage} />
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mt-2">
                      <span>Border Color</span>
                      <input type="color" value={logoBorderColor} onChange={(e) => setLogoBorderColor(e.target.value)} disabled={!logoImage || logoBorderWidth === 0} className="w-6 h-6 rounded-sm border-none cursor-pointer" />
                    </div>
                  </InputGroup>
                </Section>
                <div className="w-full h-px bg-zinc-700/50" />
                <Section title="Background Plate">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                      <span>Background Type</span>
                      <ResetButton
                        onReset={() => setBackgroundType('original')}
                        isDefault={backgroundType === 'original'}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBackgroundType('original')}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${backgroundType === 'original' ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                        disabled={!logoImage}
                      >
                        <LayoutGrid size={12} /> Original
                      </button>
                      <button
                        onClick={() => setBackgroundType('white')}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${backgroundType === 'white' ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                        disabled={!logoImage}
                      >
                        <Square size={12} fill="white" stroke="white" /> White Plate
                      </button>
                    </div>
                  </div>
                  <InputGroup
                    label="Plate Radius"
                    value={logoPlateRadius}
                    unit="px"
                    onReset={() => setLogoPlateRadius(0)}
                    isDefault={logoPlateRadius === 0}
                  >
                    <input type="range" min="0" max="50" value={logoPlateRadius} onChange={(e) => setLogoPlateRadius(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage || backgroundType !== 'white'} />
                  </InputGroup>
                  <InputGroup
                    label="H-Padding"
                    value={logoPlateHorizontalPadding}
                    unit="%"
                    onReset={() => setLogoPlateHorizontalPadding(15)}
                    isDefault={logoPlateHorizontalPadding === 15}
                  >
                    <input type="range" min="0" max="100" value={logoPlateHorizontalPadding} onChange={(e) => setLogoPlateHorizontalPadding(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage || backgroundType !== 'white'} />
                  </InputGroup>
                  <InputGroup
                    label="V-Padding"
                    value={logoPlateVerticalPadding}
                    unit="%"
                    onReset={() => setLogoPlateVerticalPadding(15)}
                    isDefault={logoPlateVerticalPadding === 15}
                  >
                    <input type="range" min="0" max="100" value={logoPlateVerticalPadding} onChange={(e) => setLogoPlateVerticalPadding(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider" disabled={!logoImage || backgroundType !== 'white'} />
                  </InputGroup>
                </Section>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Export Modal */}
        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 z-30 flex items-center justify-center backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="bg-[#1a1b1f] rounded-lg p-6 w-96 max-w-full shadow-lg border border-zinc-700/50 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-200">Export Options</h2>
                  <button onClick={() => setShowExportModal(false)} className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300">File Format</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => setExportSettings({ ...exportSettings, format: 'jpeg' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors border cursor-pointer ${exportSettings.format === 'jpeg' ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                      >
                        JPEG
                      </button>
                      <button
                        onClick={() => setExportSettings({ ...exportSettings, format: 'png' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors border cursor-pointer ${exportSettings.format === 'png' ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                      >
                        PNG
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">Resolution</label>
                    <select
                      value={exportSettings.resolution.name}
                      onChange={(e) => setExportSettings({ ...exportSettings, resolution: RESOLUTIONS.find(r => r.name === e.target.value) || RESOLUTIONS[0] })}
                      className="w-full px-3 py-2 mt-1 text-sm rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 cursor-pointer"
                    >
                      {RESOLUTIONS.map((res) => (
                        <option key={res.name} value={res.name}>
                          {res.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {exportSettings.format === 'jpeg' && (
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Quality</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={exportSettings.quality}
                        onChange={(e) => setExportSettings({ ...exportSettings, quality: Number(e.target.value) })}
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-slider mt-1"
                      />
                      <span className="text-xs text-zinc-400 text-right block">{Math.round(exportSettings.quality * 100)}%</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button onClick={executeExport} className="px-5 py-2 text-sm rounded-md bg-zinc-200 text-zinc-900 hover:bg-zinc-300 transition-colors font-medium cursor-pointer">
                    Download Image
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Loading overlay */}
      {(uploading || generating) && (
        <div className="absolute inset-0 bg-black/70 z-40 flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-gray-500 border-t-zinc-200 rounded-full animate-spin"></div>
          <span className="mt-4 text-sm font-light">
            {uploading ? 'Loading logo...' : 'Generating image...'}
          </span>
        </div>
      )}

    </div>
  )
}
