'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from "@/components/dashboard/Header";
import {
  Settings,
  X,
  PlusCircle,
  Download,
  RotateCcw,
  LayoutPanelLeft,
  Square,
  LayoutGrid
} from 'lucide-react'

// --- HELPER FUNCTIONS ---
/**
 * Draws a rounded rectangle path. Used for clipping and drawing borders.
 * @param ctx The canvas rendering context.
 * @param x The x-coordinate of the top-left corner.
 * @param y The y-coordinate of the top-left corner.
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @param radius The radius of the corners.
 * @param lineWidth The line width for the border.
 */
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

/**
 * Clips the canvas context to a rounded rectangle shape.
 * @param ctx The canvas rendering context.
 * @param x The x-coordinate of the top-left corner.
 * @param y The y-coordinate of the top-left corner.
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @param radius The radius of the corners.
 */
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

/**
 * Fills a rounded rectangle on the canvas.
 * @param ctx The canvas rendering context.
 * @param x The x-coordinate of the top-left corner.
 * @param y The y-coordinate of the top-left corner.
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @param radius The radius of the corners.
 */
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

/**
 * Sets the DPI metadata in a PNG data URL.
 * @param dataUrl The PNG image data URL.
 * @param dpi The DPI value to set.
 * @returns The new data URL with DPI information.
 */
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
/**
 * Sets the DPI metadata in a JPEG data URL.
 * @param dataUrl The JPEG image data URL.
 * @param dpi The DPI value to set.
 * @returns The new data URL with DPI information.
 */
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
type ExportFormat = 'png' | 'jpeg' | 'jpg'
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
    resolution: RESOLUTIONS.find(r => r.name === 'Original') || RESOLUTIONS[0],
    quality: 1.0,
    dpi: 300
  })
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'complete'>('idle')

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)

  const previewWidth = 1920
  const previewHeight = 1080

  /**
   * NEW: ultra-smooth slider updates via rAF + onInput
   */
  const rafRef = useRef<number | null>(null);
  const makeSmoothRangeHandler = useCallback(
    (setter: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const next = Number(target.value);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setter(next);
      });
    },
    []
  );
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  /**
   * Resets all logo transformation and export settings to their default values.
   */
  const resetAllSettings = () => {
    setLogoZoom(100);
    setLogoOpacity(100);
    setLogoBorderWidth(0);
    setLogoBorderColor('#ffffff');
    setLogoBlendMode('source-over');
    setLogoHorizontalOffset(0);
    setLogoVerticalOffset(0);
    setLogoRadius(0);
    setBackgroundType('original');
    setLogoPlateHorizontalPadding(15);
    setLogoPlateVerticalPadding(15);
    setLogoPlateRadius(0);
    setExportSettings({
      format: 'jpeg',
      resolution: RESOLUTIONS.find(r => r.name === 'Original') || RESOLUTIONS[0],
      quality: 1.0,
      dpi: 300
    });
  }

  // Effect to load the base image when the source URL changes.
  useEffect(() => {
    if (!baseImageSrc) return setBaseImage(null)
    const img = new Image()
    img.src = baseImageSrc
    img.crossOrigin = 'anonymous'
    img.onload = () => setBaseImage(img)
    img.onerror = (e) => console.error("Failed to load base image:", e);
  }, [baseImageSrc])

  // Effect to load the logo image when the source URL changes.
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

  /**
   * Draws the logo with its current transformations onto a hidden canvas for preview.
   * This is then used by the main canvas to composite the final image.
   */
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
      ctx.scale(currentLogoScaleFactor, currentLogoScaleFactor);
      ctx.strokeStyle = logoBorderColor;
      ctx.lineWidth = logoBorderWidth / currentLogoScaleFactor;
      drawRoundedRect(ctx, drawX, drawY, originalLogoDrawWidth, originalLogoDrawHeight, effectiveLogoRadius, ctx.lineWidth);
      ctx.restore();
    }
  }, [logoImage, logoZoom, logoOpacity, logoRadius, logoBorderWidth, logoBorderColor])

  // Effect to re-draw the logo preview whenever its settings change.
  useEffect(() => {
    drawLogoPreview()
  }, [drawLogoPreview])

  // Effect to draw the combined poster preview on the main canvas.
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
      const containerConfig = { top: 0.62, bottom: 0.76, hPadding: 0.35 }
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

  /**
   * Handles a logo file upload from the user.
   * @param e The file input change event.
   */
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setLogoRadius(15); // Set default radius on upload
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

  const handleFullscreenClick = () => {
    if (!combinedCanvasRef.current || !baseImage) return;

    // Create a new canvas with the original image's dimensions
    const originalWidth = baseImage.naturalWidth || baseImage.width;
    const originalHeight = baseImage.naturalHeight || baseImage.height;
   
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;
   
    exportCanvas.width = originalWidth;
    exportCanvas.height = originalHeight;
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';

    // Draw the full composition to the new canvas
    ctx.drawImage(baseImage, 0, 0, originalWidth, originalHeight);

    if (logoImage && logoPreviewCanvasRef.current) {
        const transformedLogoCanvas = logoPreviewCanvasRef.current;
        const containerConfig = { top: 0.62, bottom: 0.76, hPadding: 0.35 };
        const containerY = originalHeight * containerConfig.top;
        const containerHeight = originalHeight * (containerConfig.bottom - containerConfig.top);
        const containerX = originalWidth * containerConfig.hPadding;
        const containerWidth = originalWidth * (1 - 2 * containerConfig.hPadding);
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

    const dataUrl = exportCanvas.toDataURL('image/png');
    const newWindow = window.open();
    if (newWindow) {
        newWindow.document.write(`<img src="${dataUrl}" style="max-width: 100%; height: auto; display: block; margin: auto;">`);
        newWindow.document.title = 'Fullscreen Preview';
    }
  };

  /**
   * Executes the image export process based on the user's settings.
   */
  async function executeExport() {
    if (!baseImage || !logoImage || !logoPreviewCanvasRef.current) return
    setGenerating(true)
    setExportStatus('loading');
    setShowExportModal(false)
   
    // Simulate processing time
    await new Promise((r) => setTimeout(r, 1500))

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

    const downloadFormat = exportSettings.format;
    let mimeType = `image/${downloadFormat}`
    if (downloadFormat === 'jpg') {
        mimeType = 'image/jpeg';
    }

    let dataUrl = exportCanvas.toDataURL(mimeType, exportSettings.quality)
    if (downloadFormat === 'png') {
      dataUrl = setPngDpi(dataUrl, exportSettings.dpi)
    } else if (downloadFormat === 'jpeg' || downloadFormat === 'jpg') {
      dataUrl = setJpegDpi(dataUrl, exportSettings.dpi)
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
    link.download = `poster_ssi_${fileW}x${fileH}.${downloadFormat}`
    link.click()
    URL.revokeObjectURL(link.href)
    setGenerating(false)
    setExportStatus('complete');
    setTimeout(() => setExportStatus('idle'), 2000); // Hide after 2 seconds
  }

  const ResetButton = ({ onReset, isDefault }: { onReset: () => void; isDefault: boolean }) => (
    <button
      onClick={onReset}
      className={`text-zinc-500 hover:text-blue-500 transition-colors duration-200 cursor-pointer ${isDefault ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}
      aria-label="Reset setting"
      disabled={isDefault}
    >
      <RotateCcw size={12} />
    </button>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">{title}</h3>
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
    <div className="absolute top-0 bottom-0 right-0 left-0 sm:left-20 bg-[#161719] text-zinc-200 overflow-hidden flex flex-col font-sans">
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #25262c;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #555;
          border-radius: 4px;
          border: 2px solid #25262c;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background-color: #3b82f6;
          cursor: pointer;
          border-radius: 9999px;
          border: none;
          margin-top: -6px;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        input[type="range"]::-webkit-slider-thumb:hover, input[type="range"]:active::-webkit-slider-thumb {
            transform: scale(1.25);
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background-color: #3b82f6;
          cursor: pointer;
          border-radius: 9999px;
          border: none;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        input[type="range"]::-moz-range-thumb:hover, input[type="range"]:active::-moz-range-thumb {
            transform: scale(1.25);
        }

        input[type="range"]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          background-color: #444;
          border-radius: 9999px;
        }

        input[type="range"]::-moz-range-track {
          width: 100%;
          height: 4px;
          background-color: #444;
          border-radius: 9999px;
        }
        
        .accent-blue-600 {
            accent-color: #3b82f6;
        }

        /* NEW: silky pointer interactions */
        input[type="range"] {
          -webkit-tap-highlight-color: transparent;
          touch-action: none; /* prevents scroll from hijacking drag */
        }
        input[type="range"]::-webkit-slider-runnable-track,
        input[type="range"]::-moz-range-track { transition: none; }

        @keyframes fillCircle {
          from { stroke-dasharray: 0, 300; }
          to { stroke-dasharray: 300, 300; }
        }
        
        .fill-circle-animation { animation: fillCircle 1.5s linear infinite; }

        .checkmark-animation { stroke-dasharray: 100; stroke-dashoffset: 100; animation: drawCheckmark 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
        @keyframes drawCheckmark { to { stroke-dashoffset: 0; } }
        `}
      </style>

{/* Header */}
<header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-transparent border-b border-zinc-700/30 shadow-sm z-20">

  {/* Left branding */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        SSI Studios
      </h1>
<p className="text-xs text-zinc-400 font-medium font-asian-sans ml-1">
  Single Logo Editor
</p>
    </div>
  </div>

{/* Centered Header component */}
<div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-[40%] scale-90">
  <Header />
</div>

  {/* Right side actions */}
  <div className="flex items-center gap-4">
    <button
      onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
      className="text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer"
      aria-label="Toggle editing tools"
    >
      <LayoutPanelLeft size={20} />
    </button>
    <button
      onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
      className="text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer"
      aria-label="Toggle visual settings"
    >
      <Settings size={20} />
    </button>
  </div>
</header>

      {/* Main Container */}
      <main className="flex-1 overflow-hidden flex pt-16 bg-[#161719]">
        {/* Left Sidebar */}
        <AnimatePresence>
          {isLeftSidebarOpen && (
<motion.aside
  initial={{ x: -320 }}
  animate={{ x: 0 }}
  exit={{ x: -320 }}
  transition={{ type: "tween", duration: 0.2 }}
  className="absolute lg:relative left-0 top-0 bottom-0 w-80 bg-transparent border-r border-zinc-700/30 flex flex-col p-6 z-10 overflow-y-auto custom-scrollbar"
>

            <button
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-red-500 lg:hidden cursor-pointer"
              onClick={() => setIsLeftSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col gap-8 pt-4">
              <Section title="Logo Tweaks">
                <InputGroup
                  label="Size"
                  value={logoZoom}
                  unit="%"
                  onReset={() => setLogoZoom(100)}
                  isDefault={logoZoom === 100}
                >
                  <input type="range" min="10" max="200" step="0.1" value={logoZoom} onInput={makeSmoothRangeHandler(setLogoZoom)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={!logoImage} />
                </InputGroup>
                <InputGroup
                  label="Rounded Corners"
                  value={logoRadius}
                  unit="px"
                  onReset={() => setLogoRadius(0)}
                  isDefault={logoRadius === 0}
                >
                  <input type="range" min="0" max="50" step="0.5" value={logoRadius} onInput={makeSmoothRangeHandler(setLogoRadius)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={!logoImage} />
                </InputGroup>
              </Section>
              <div className="w-full h-px bg-zinc-700/50" />
              <Section title="Ready to Go?">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { fileInputRef.current?.click() }}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                  >
                    <PlusCircle size={16} /> Add Your Logo
                  </button>
                  <button
                    onClick={handleGenerateClick}
                    disabled={!logoImage || generating}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                  >
                    <Download size={16} /> Get Your Masterpiece
                  </button>
                  <input ref={fileInputRef} type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
                </div>
              </Section>
              <div className="w-full h-px bg-zinc-700/50" />
              <Section title="Reset">
                  <button
                    onClick={resetAllSettings}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                  >
                    <RotateCcw size={16} /> Start Over
                  </button>
                </Section>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

{/* Central Preview Area */}
<div className="flex-1 flex items-center justify-center p-8 bg-[#161719] relative">
  {!baseImage && (
    <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-lg font-light">
      Flipping on the lights...
    </div>
  )}

  {/* 16:9 Ratio Container */}
  <div className="relative w-full max-w-[1280px] aspect-[16/9] shadow-2xl rounded-xl overflow-hidden flex items-center justify-center bg-[#25262c] border-2 border-dashed border-zinc-700/50">
    <canvas
      ref={combinedCanvasRef}
      className="w-full h-full object-contain"
    />

    {(!logoImage) && (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-lg font-light border-2 border-dashed border-zinc-600 rounded-xl">
        <PlusCircle size={48} className="text-zinc-600 mb-2" />
        It's a blank canvas! Add a logo to get started.
      </div>
    )}

    <canvas ref={logoPreviewCanvasRef} className="hidden" />

    <AnimatePresence>
      {(baseImage && logoImage) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 right-4"
        >
          <button
            onClick={handleFullscreenClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors cursor-pointer shadow-md"
          >
            See the Big Picture
          </button>
        </motion.div>
      )}
    </AnimatePresence>
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
              className="absolute lg:relative right-0 top-0 bottom-0 w-80 bg-transparent border-l border-zinc-700/30 flex flex-col p-6 z-10 overflow-y-auto custom-scrollbar"

            >
              <button
                className="absolute top-4 left-4 p-2 text-zinc-500 hover:text-red-500 lg:hidden cursor-pointer"
                onClick={() => setIsRightSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col gap-8 pt-4">

                <Section title="Placement">
                  <InputGroup
                    label="Horizontal"
                    value={logoHorizontalOffset}
                    unit="%"
                    onReset={() => setLogoHorizontalOffset(0)}
                    isDefault={logoHorizontalOffset === 0}
                  >
                    <input type="range" min="-50" max="50" step="0.1" value={logoHorizontalOffset} onInput={makeSmoothRangeHandler(setLogoHorizontalOffset)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={!logoImage} />
                  </InputGroup>
                  <InputGroup
                    label="Vertical"
                    value={logoVerticalOffset}
                    unit="%"
                    onReset={() => setLogoVerticalOffset(0)}
                    isDefault={logoVerticalOffset === 0}
                  >
                    <input type="range" min="-50" max="50" step="0.1" value={logoVerticalOffset} onInput={makeSmoothRangeHandler(setLogoVerticalOffset)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={!logoImage} />
                  </InputGroup>
                </Section>
                <div className="w-full h-px bg-zinc-700/50" />
                <Section title="Visual Flourishes">
                  <div>
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
                      <span>Blend Style</span>
                      <ResetButton onReset={() => setLogoBlendMode('source-over')} isDefault={logoBlendMode === 'source-over'} />
                    </div>
                    <select
                      value={logoBlendMode}
                      onChange={(e) => setLogoBlendMode(e.target.value as BlendMode)}
                      disabled={!logoImage}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-700 border border-zinc-600 text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
                    >
                      {BLEND_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  <InputGroup
                    label="Outline"
                    value={logoBorderWidth}
                    unit="px"
                    onReset={() => setLogoBorderWidth(0)}
                    isDefault={logoBorderWidth === 0}
                  >
                    <input type="range" min="0" max="20" step="0.5" value={logoBorderWidth} onInput={makeSmoothRangeHandler(setLogoBorderWidth)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={!logoImage} />
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mt-2">
                      <span>Outline Color</span>
                      <input type="color" value={logoBorderColor} onInput={(e) => setLogoBorderColor((e.target as HTMLInputElement).value)} disabled={!logoImage || logoBorderWidth === 0} className="w-6 h-6 rounded-md border-none cursor-pointer" />
                    </div>
                  </InputGroup>
                </Section>
                <div className="w-full h-px bg-zinc-700/50" />
                <Section title="Logo Backdrop">
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
                        onClick={() => {
                          setBackgroundType('original');
                          setLogoPlateRadius(0);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${backgroundType === 'original' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'}`}
                        disabled={!logoImage}
                      >
                        <LayoutGrid size={16} /> Original
                      </button>
                      <button
                        onClick={() => {
                          setBackgroundType('white');
                          setLogoPlateRadius(15);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${backgroundType === 'white' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'}`}
                        disabled={!logoImage}
                      >
                        <Square size={16} fill="white" stroke="white" /> White Plate
                      </button>
                    </div>
                  </div>
                  <InputGroup
                    label="Plate Curvature"
                    value={logoPlateRadius}
                    unit="px"
                    onReset={() => setLogoPlateRadius(0)}
                    isDefault={logoPlateRadius === 0}
                  >
                    <input type="range" min="0" max="50" step="0.5" value={logoPlateRadius} onInput={makeSmoothRangeHandler(setLogoPlateRadius)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={!logoImage || backgroundType !== 'white'} />
                  </InputGroup>
                  <InputGroup
                    label="Horizontal Padding"
                    value={logoPlateHorizontalPadding}
                    unit="%"
                    onReset={() => setLogoPlateHorizontalPadding(15)}
                    isDefault={logoPlateHorizontalPadding === 15}
                  >
                    <input type="range" min="0" max="100" step="0.1" value={logoPlateHorizontalPadding} onInput={makeSmoothRangeHandler(setLogoPlateHorizontalPadding)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={!logoImage || backgroundType !== 'white'} />
                  </InputGroup>
                  <InputGroup
                    label="Vertical Padding"
                    value={logoPlateVerticalPadding}
                    unit="%"
                    onReset={() => setLogoPlateVerticalPadding(15)}
                    isDefault={logoPlateVerticalPadding === 15}
                  >
                    <input type="range" min="0" max="100" step="0.1" value={logoPlateVerticalPadding} onInput={makeSmoothRangeHandler(setLogoPlateVerticalPadding)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={!logoImage || backgroundType !== 'white'} />
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
                className="bg-[#1f2024] rounded-lg p-8 w-96 max-w-full shadow-lg border border-zinc-700/50 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-100">Download Your Poster</h2>
                  <button onClick={() => setShowExportModal(false)} className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer">
                    <X size={24} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">File Format</label>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => setExportSettings({ ...exportSettings, format: 'jpeg' })}
                        className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors border cursor-pointer ${exportSettings.format === 'jpeg' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'}`}
                      >
                        JPEG
                      </button>
                      <button
                        onClick={() => setExportSettings({ ...exportSettings, format: 'jpg' })}
                        className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors border cursor-pointer ${exportSettings.format === 'jpg' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'}`}
                      >
                        JPG
                      </button>
                      <button
                        onClick={() => setExportSettings({ ...exportSettings, format: 'png' })}
                        className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors border cursor-pointer ${exportSettings.format === 'png' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'}`}
                      >
                        PNG
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Resolution</label>
                    <select
                      value={exportSettings.resolution.name}
                      onChange={(e) => setExportSettings({ ...exportSettings, resolution: RESOLUTIONS.find(r => r.name === e.target.value) || RESOLUTIONS[0] })}
                      className="w-full px-4 py-2 mt-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    >
                      {RESOLUTIONS.map((res) => (
                        <option key={res.name} value={res.name}>
                          {res.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">DPI</label>
                    <input
                      type="number"
                      min="72"
                      max="600"
                      step="1"
                      value={exportSettings.dpi}
                      onChange={(e) => setExportSettings({ ...exportSettings, dpi: Number(e.target.value) })}
                      className="w-full px-4 py-2 mt-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {(exportSettings.format === 'jpeg' || exportSettings.format === 'jpg') && (
                    <div>
                      <label className="text-sm font-semibold text-zinc-300">Quality</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={exportSettings.quality}
                        onInput={makeSmoothRangeHandler((n) => setExportSettings(s => ({ ...s, quality: n })))}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                      />
                      <span className="text-xs text-zinc-500 text-right block mt-1">{Math.round(exportSettings.quality * 100)}%</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={executeExport} className="px-6 py-3 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium cursor-pointer shadow-md">
                    <Download size={16} className="inline-block mr-2" /> Download Image
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
        {(exportStatus !== 'idle') && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 z-40 flex flex-col items-center justify-center text-white backdrop-blur-sm"
            >
                {exportStatus === 'loading' && (
                    <div className="w-20 h-20 relative">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-zinc-300" strokeWidth="6" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                            <motion.circle
                                className="text-blue-600"
                                strokeWidth="6"
                                stroke="currentColor"
                                fill="transparent"
                                r="40"
                                cx="50"
                                cy="50"
                                style={{
                                    rotate: -90,
                                    originX: '50%',
                                    originY: '50%',
                                }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{
                                    duration: 1.5,
                                    ease: 'easeInOut',
                                    repeat: Infinity,
                                    repeatType: 'loop',
                                }}
                            />
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-zinc-200">
                               {Math.round(0)}%
                            </span>
                        </svg>
                    </div>
                )}
                {exportStatus === 'complete' && (
                        <div className="w-20 h-20 flex items-center justify-center">
                            <svg className="w-full h-full text-green-500" viewBox="0 0 52 52">
                                <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="3" />
                                <motion.path
                                    className="checkmark-animation"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                                    initial={{ strokeDashoffset: 100 }}
                                    animate={{ strokeDashoffset: 0 }}
                                    transition={{ duration: 0.6 }}
                                />
                            </svg>
                        </div>
                )}
                <span className="mt-4 text-sm font-light text-zinc-200">
                  {exportStatus === 'loading' ? 'Whipping up your poster...' : 'Your poster is ready! 🎉'}
                </span>
            </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  )
}
