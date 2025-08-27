'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  X,
  PlusCircle,
  Download,
  RotateCcw,
  Square,
  LayoutGrid,
  Trash2,
  ChevronUp,
  ChevronDown,
  LayoutPanelLeft,
  GripHorizontal
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

interface LogoState {
  id: string;
  imageSrc: string | null;
  image: HTMLImageElement | null;
  // Logo transformation states
  logoZoom: number;
  logoOpacity: number;
  logoBorderWidth: number;
  logoBorderColor: string;
  logoBlendMode: BlendMode;
  logoHorizontalOffset: number;
  logoVerticalOffset: number;
  logoRadius: number;
  backgroundType: 'original' | 'white';
  logoPlateHorizontalPadding: number;
  logoPlateVerticalPadding: number;
  logoPlateRadius: number;
}

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

const LOGO_COUNT_OPTIONS = [2, 3, 4, 5];

// A simple placeholder header component to make the app self-contained
const Header = () => (
    <nav className="flex items-center space-x-4">
        <a href="#" className="text-zinc-400 hover:text-blue-500 transition-colors">Home</a>
        <a href="#" className="text-zinc-400 hover:text-blue-500 transition-colors">About</a>
    </nav>
);

// --- MAIN COMPONENT ---
export default function PosterEditor() {
  const combinedCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const controlsRef = useRef<HTMLDivElement>(null);

  const [baseImageSrc] = useState('/posters/poster1.jpg');
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  const [logoCount, setLogoCount] = useState(2);
  const [logos, setLogos] = useState<LogoState[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState(true);

  const [exportSettings, setExportSettings] = useState({
    format: 'jpeg' as ExportFormat,
    resolution: RESOLUTIONS.find(r => r.name === 'Original') || RESOLUTIONS[0],
    quality: 1.0,
    dpi: 300
  });
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'complete'>('idle');

  const previewWidth = 1920;
  const previewHeight = 1080;

  // Find the selected logo object from the array
  const selectedLogo = logos.find(logo => logo.id === selectedLogoId);

  // Helper function to update a single property of the selected logo
  const updateSelectedLogo = (updates: Partial<LogoState>) => {
    setLogos(prevLogos => prevLogos.map(logo =>
      logo.id === selectedLogoId ? { ...logo, ...updates } : logo
    ));
  };
  
  const makeSmoothRangeHandler = useCallback(
    (setter: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const next = Number(target.value);
      requestAnimationFrame(() => {
        setter(next);
      });
    },
    []
  );

  const handleLogoZoom = makeSmoothRangeHandler(n => updateSelectedLogo({ logoZoom: n }));
  const handleLogoOpacity = makeSmoothRangeHandler(n => updateSelectedLogo({ logoOpacity: n }));
  const handleLogoBorderWidth = makeSmoothRangeHandler(n => updateSelectedLogo({ logoBorderWidth: n }));
  const handleLogoRadius = makeSmoothRangeHandler(n => updateSelectedLogo({ logoRadius: n }));
  const handleLogoHorizontalOffset = makeSmoothRangeHandler(n => updateSelectedLogo({ logoHorizontalOffset: n }));
  const handleLogoVerticalOffset = makeSmoothRangeHandler(n => updateSelectedLogo({ logoVerticalOffset: n }));
  const handleLogoPlateHorizontalPadding = makeSmoothRangeHandler(n => updateSelectedLogo({ logoPlateHorizontalPadding: n }));
  const handleLogoPlateVerticalPadding = makeSmoothRangeHandler(n => updateSelectedLogo({ logoPlateVerticalPadding: n }));
  const handleLogoPlateRadius = makeSmoothRangeHandler(n => updateSelectedLogo({ logoPlateRadius: n }));

  /**
   * Resets all logo transformation and export settings to their default values.
   */
  const resetAllSettings = () => {
    setLogoCount(2);
    setLogos([]);
    setSelectedLogoId(null);
    setExportSettings({
      format: 'jpeg',
      resolution: RESOLUTIONS.find(r => r.name === 'Original') || RESOLUTIONS[0],
      quality: 1.0,
      dpi: 300
    });
  };
  
  /**
   * Resets settings for the currently selected logo.
   */
  const resetSelectedLogoSettings = () => {
    if (selectedLogo) {
      updateSelectedLogo({
        logoZoom: 100,
        logoOpacity: 100,
        logoBorderWidth: 0,
        logoBorderColor: '#ffffff',
        logoBlendMode: 'source-over',
        logoHorizontalOffset: 0,
        logoVerticalOffset: 0,
        logoRadius: 0,
        backgroundType: 'original',
        logoPlateHorizontalPadding: 15,
        logoPlateVerticalPadding: 15,
        logoPlateRadius: 0,
      });
    }
  };

  // Effect to load the base image when the source URL changes.
  useEffect(() => {
    if (!baseImageSrc) return setBaseImage(null)
    const img = new Image()
    img.src = baseImageSrc
    img.crossOrigin = 'anonymous'
    img.onload = () => setBaseImage(img)
    img.onerror = (e) => console.error("Failed to load base image:", e);
  }, [baseImageSrc]);

  // Effect to handle logo count changes and manage the logos array
  useEffect(() => {
    setLogos(prevLogos => {
      if (prevLogos.length > logoCount) {
        const newLogos = prevLogos.slice(0, logoCount);
        if (!newLogos.some(l => l.id === selectedLogoId)) {
          setSelectedLogoId(newLogos.length > 0 ? newLogos[0].id : null);
        }
        return newLogos;
      } else if (prevLogos.length < logoCount) {
        const newLogos = Array.from({ length: logoCount - prevLogos.length }, (_, i) => ({
          id: crypto.randomUUID(),
          imageSrc: null,
          image: null,
          logoZoom: 100,
          logoOpacity: 100,
          logoBorderWidth: 0,
          logoBorderColor: '#ffffff',
          logoBlendMode: 'source-over',
          logoHorizontalOffset: 0,
          logoVerticalOffset: 0,
          logoRadius: 0,
          backgroundType: 'original',
          logoPlateHorizontalPadding: 15,
          logoPlateVerticalPadding: 15,
          logoPlateRadius: 0,
        }));
        const combinedLogos = [...prevLogos, ...newLogos];
        if (!selectedLogoId && combinedLogos.length > 0) {
          setSelectedLogoId(combinedLogos[0].id);
        }
        return combinedLogos;
      }
      return prevLogos;
    });
  }, [logoCount, selectedLogoId]);

  // Effect to load logo images when their source URLs change.
  useEffect(() => {
    logos.forEach(logo => {
      if (!logo.imageSrc || logo.image) return;
      const img = new Image();
      img.src = logo.imageSrc;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLogos(prevLogos => prevLogos.map(l =>
          l.id === logo.id ? { ...l, image: img } : l
        ));
      };
      img.onerror = (e) => {
        console.error(`Failed to load logo image for ID ${logo.id}:`, e);
        setLogos(prevLogos => prevLogos.filter(l => l.id !== logo.id));
      };
    });
  }, [logos]);

  /**
   * Draws a single logo with its specific transformations onto its hidden preview canvas.
   * This is then used by the main canvas to composite the final image.
   */
  const drawLogoPreview = useCallback((logo: LogoState) => {
    const canvas = previewCanvasRefs.current[logo.id];
    if (!canvas || !logo.image) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const maxDimension = 1000;
    let logoCanvasWidth = logo.image.naturalWidth || logo.image.width;
    let logoCanvasHeight = logo.image.naturalHeight || logo.image.height;

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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);

    const originalLogoDrawWidth = logo.image.width;
    const originalLogoDrawHeight = logo.image.height;

    const fitScale = Math.min(canvas.width / originalLogoDrawWidth, canvas.height / originalLogoDrawHeight);
    const currentLogoScaleFactor = fitScale * (logo.logoZoom / 100);

    ctx.scale(currentLogoScaleFactor, currentLogoScaleFactor);

    ctx.globalAlpha = logo.logoOpacity / 100;
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';

    const drawX = -originalLogoDrawWidth / 2;
    const drawY = -originalLogoDrawHeight / 2;

    const effectiveLogoRadius = logo.logoRadius / currentLogoScaleFactor;
    if (effectiveLogoRadius > 0) {
      clipRoundedRect(ctx, drawX, drawY, originalLogoDrawWidth, originalLogoDrawHeight, effectiveLogoRadius);
    }
    ctx.drawImage(logo.image, drawX, drawY, originalLogoDrawWidth, originalLogoDrawHeight);
    ctx.restore();

    if (logo.logoBorderWidth > 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(currentLogoScaleFactor, currentLogoScaleFactor);
      ctx.strokeStyle = logo.logoBorderColor;
      ctx.lineWidth = logo.logoBorderWidth / currentLogoScaleFactor;
      drawRoundedRect(ctx, drawX, drawY, originalLogoDrawWidth, originalLogoDrawHeight, effectiveLogoRadius, ctx.lineWidth);
      ctx.restore();
    }
  }, []);

  // Effect to re-draw the logo previews whenever their settings change.
  useEffect(() => {
    logos.forEach(logo => drawLogoPreview(logo));
  }, [logos, drawLogoPreview]);

  // Effect to draw the combined poster preview on the main canvas.
  useEffect(() => {
    const canvas = combinedCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = previewWidth;
    canvas.height = previewHeight;

    ctx.clearRect(0, 0, previewWidth, previewHeight);

    if (baseImage) {
      ctx.drawImage(baseImage, 0, 0, previewWidth, previewHeight);
    }

    if (logos.length > 0) {
      const containerConfig = { top: 0.62, bottom: 0.76, hPadding: 0.05, vOffset: 0.05 };
      const containerY = previewHeight * containerConfig.top;
      const containerHeight = previewHeight * (containerConfig.bottom - containerConfig.top);
      const containerX = previewWidth * containerConfig.hPadding;
      const containerWidth = previewWidth * (1 - 2 * containerConfig.hPadding);
      const logoSpacing = 20;

      const totalLogoSpace = containerWidth - (logos.length - 1) * logoSpacing;
      
      const transformedLogos = logos.map(logo => {
        const transformedLogoCanvas = previewCanvasRefs.current[logo.id];
        if (!transformedLogoCanvas) return null;
        return {
          ...logo,
          width: transformedLogoCanvas.width,
          height: transformedLogoCanvas.height
        };
      }).filter(Boolean) as (LogoState & { width: number, height: number })[];
      
      if (transformedLogos.length === 0) return;

      const totalImageWidth = transformedLogos.reduce((sum, logo) => sum + logo.width, 0);
      const totalImageHeight = transformedLogos.reduce((sum, logo) => sum + logo.height, 0);
      const avgImageWidth = totalImageWidth / transformedLogos.length;
      const avgImageHeight = totalImageHeight / transformedLogos.length;

      const maxSingleLogoWidth = totalLogoSpace / logos.length;
      const maxSingleLogoHeight = containerHeight;

      const scaleFactorToFitContainer = Math.min(
        maxSingleLogoWidth / avgImageWidth,
        maxSingleLogoHeight / avgImageHeight
      );

      const finalLogoWidths = transformedLogos.map(logo => logo.width * scaleFactorToFitContainer);
      const finalLogoHeights = transformedLogos.map(logo => logo.height * scaleFactorToContainer);

      const totalRenderedWidth = finalLogoWidths.reduce((sum, width) => sum + width, 0) + (logos.length - 1) * logoSpacing;
      const startX = containerX + (containerWidth - totalRenderedWidth) / 2;

      let currentX = startX;
      logos.forEach((logo, index) => {
        const transformedLogoCanvas = previewCanvasRefs.current[logo.id];
        if (!transformedLogoCanvas) return;

        const finalLogoWidth = finalLogoWidths[index];
        const finalLogoHeight = finalLogoHeights[index];

        const logoX = currentX + (logo.logoHorizontalOffset / 100) * containerWidth;
        const logoY = containerY + (containerHeight - finalLogoHeight) / 2 + (logo.logoVerticalOffset / 100) * containerHeight;

        if (logo.backgroundType === 'white') {
          const hPadding = finalLogoWidth * (logo.logoPlateHorizontalPadding / 100);
          const vPadding = finalLogoHeight * (logo.logoPlateVerticalPadding / 100);
          const plateWidth = finalLogoWidth + hPadding * 2;
          const plateHeight = finalLogoHeight + vPadding * 2;
          const plateX = logoX - hPadding;
          const plateY = logoY - vPadding;
          ctx.fillStyle = 'white';
          fillRoundedRect(ctx, plateX, plateY, plateWidth, plateHeight, logo.logoPlateRadius);
        }

        ctx.save();
        ctx.globalCompositeOperation = logo.logoBlendMode;
        ctx.drawImage(transformedLogoCanvas, logoX, logoY, finalLogoWidth, finalLogoHeight);
        ctx.restore();

        currentX += finalLogoWidth + logoSpacing;
      });
    }
  }, [baseImage, logos, previewWidth, previewHeight]);
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const objectUrl = URL.createObjectURL(file);
    
    setLogos(prevLogos => prevLogos.map(logo => {
      if (logo.id === id) {
        return {
          ...logo,
          imageSrc: objectUrl
        };
      }
      return logo;
    }));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
    };
    img.onerror = () => {
      console.error('Failed to load image. Please ensure it is a valid PNG.');
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      setLogos(prevLogos => prevLogos.filter(logo => logo.id !== id));
    };
    img.src = objectUrl;
  };

  const handleRemoveLogo = (id: string) => {
    if (logos.length <= 2) {
      // Show an alert or do nothing if min logo count is reached
      return;
    }
    setLogoCount(prev => prev - 1);
    setLogos(prevLogos => {
      const updatedLogos = prevLogos.filter(logo => logo.id !== id);
      if (selectedLogoId === id) {
        setSelectedLogoId(updatedLogos.length > 0 ? updatedLogos[0].id : null);
      }
      return updatedLogos;
    });
  };

  const handleGenerateClick = () => {
    if (logos.some(l => !l.image)) {
      // Show an alert or UI message if there are un-uploaded logos
      return;
    }
    setShowExportModal(true);
  };

  const executeExport = async () => {
    if (!baseImage || logos.length === 0) return;
    setGenerating(true);
    setExportStatus('loading');
    setShowExportModal(false);
    
    await new Promise((r) => setTimeout(r, 1500));

    let outW = exportSettings.resolution.width;
    let outH = exportSettings.resolution.height;
    if (exportSettings.resolution.kind === 'original' && baseImage) {
      outW = (baseImage as any).naturalWidth || baseImage.width;
      outH = (baseImage as any).naturalHeight || baseImage.height;
    }
    outW = Math.max(16, Math.floor(outW || 0));
    outH = Math.max(16, Math.floor(outH || 0));

    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;
    exportCanvas.width = outW;
    exportCanvas.height = outH;
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';

    ctx.drawImage(baseImage, 0, 0, outW, outH);

    const containerConfig = { top: 0.62, bottom: 0.76, hPadding: 0.05, vOffset: 0.05 };
    const containerY = outH * containerConfig.top;
    const containerHeight = outH * (containerConfig.bottom - containerConfig.top);
    const containerX = outW * containerConfig.hPadding;
    const containerWidth = outW * (1 - 2 * containerConfig.hPadding);
    const logoSpacing = 20;
    
    const totalLogoSpace = containerWidth - (logos.length - 1) * logoSpacing;

    const transformedLogos = logos.map(logo => {
      const transformedLogoCanvas = previewCanvasRefs.current[logo.id];
      if (!transformedLogoCanvas) return null;
      return {
        ...logo,
        width: transformedLogoCanvas.width,
        height: transformedLogoCanvas.height
      };
    }).filter(Boolean) as (LogoState & { width: number, height: number })[];

    if (transformedLogos.length === 0) return;
    
    const totalImageWidth = transformedLogos.reduce((sum, logo) => sum + logo.width, 0);
    const totalImageHeight = transformedLogos.reduce((sum, logo) => sum + logo.height, 0);
    const avgImageWidth = totalImageWidth / transformedLogos.length;
    const avgImageHeight = totalImageHeight / transformedLogos.length;

    const maxSingleLogoWidth = totalLogoSpace / logos.length;
    const maxSingleLogoHeight = containerHeight;

    const scaleFactorToFitContainer = Math.min(
      maxSingleLogoWidth / avgImageWidth,
      maxSingleLogoHeight / avgImageHeight
    );

const finalLogoWidths = transformedLogos.map(logo => logo.width * scaleFactorToFitContainer);
const finalLogoHeights = transformedLogos.map(logo => logo.height * scaleFactorToFitContainer);


    const totalRenderedWidth = finalLogoWidths.reduce((sum, width) => sum + width, 0) + (logos.length - 1) * logoSpacing;
    const startX = containerX + (containerWidth - totalRenderedWidth) / 2;

    let currentX = startX;
    logos.forEach((logo, index) => {
      const transformedLogoCanvas = previewCanvasRefs.current[logo.id];
      if (!transformedLogoCanvas) return;

      const finalLogoWidth = finalLogoWidths[index];
      const finalLogoHeight = finalLogoHeights[index];

      const logoX = currentX + (logo.logoHorizontalOffset / 100) * containerWidth;
      const logoY = containerY + (containerHeight - finalLogoHeight) / 2 + (logo.logoVerticalOffset / 100) * containerHeight;

      if (logo.backgroundType === 'white') {
        const hPadding = finalLogoWidth * (logo.logoPlateHorizontalPadding / 100);
        const vPadding = finalLogoHeight * (logo.logoPlateVerticalPadding / 100);
        const plateWidth = finalLogoWidth + hPadding * 2;
        const plateHeight = finalLogoHeight + vPadding * 2;
        const plateX = logoX - hPadding;
        const plateY = logoY - vPadding;
        ctx.fillStyle = 'white';
        fillRoundedRect(ctx, plateX, plateY, plateWidth, plateHeight, logo.logoPlateRadius);
      }

      ctx.save();
      ctx.globalCompositeOperation = logo.logoBlendMode;
      ctx.drawImage(transformedLogoCanvas, logoX, logoY, finalLogoWidth, finalLogoHeight);
      ctx.restore();

      currentX += finalLogoWidth + logoSpacing;
    });

    const downloadFormat = exportSettings.format;
    let mimeType = `image/${downloadFormat}`;
    if (downloadFormat === 'jpg') {
      mimeType = 'image/jpeg';
    }

    let dataUrl = exportCanvas.toDataURL(mimeType, exportSettings.quality);
    if (downloadFormat === 'png') {
      dataUrl = setPngDpi(dataUrl, exportSettings.dpi);
    } else if (downloadFormat === 'jpeg' || downloadFormat === 'jpg') {
      dataUrl = setJpegDpi(dataUrl, exportSettings.dpi);
    }

    const base64Data = dataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fileW = outW;
    const fileH = outH;
    link.download = `poster_ssi_${fileW}x${fileH}.${downloadFormat}`;
    link.click();
    URL.revokeObjectURL(link.href);
    setGenerating(false);
    setExportStatus('complete');
    setTimeout(() => setExportStatus('idle'), 2000);
  };
  
  const handleFullscreenClick = () => {
    if (!baseImage || logos.length === 0) return;

    const originalWidth = baseImage.naturalWidth || baseImage.width;
    const originalHeight = baseImage.naturalHeight || baseImage.height;
    
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;
    
    exportCanvas.width = originalWidth;
    exportCanvas.height = originalHeight;
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';

    ctx.drawImage(baseImage, 0, 0, originalWidth, originalHeight);

    const containerConfig = { top: 0.62, bottom: 0.76, hPadding: 0.05, vOffset: 0.05 };
    const containerY = originalHeight * containerConfig.top;
    const containerHeight = originalHeight * (containerConfig.bottom - containerConfig.top);
    const containerX = originalWidth * containerConfig.hPadding;
    const containerWidth = originalWidth * (1 - 2 * containerConfig.hPadding);
    const logoSpacing = 20;

    const totalLogoSpace = containerWidth - (logos.length - 1) * logoSpacing;
      
    const transformedLogos = logos.map(logo => {
      const transformedLogoCanvas = previewCanvasRefs.current[logo.id];
      if (!transformedLogoCanvas) return null;
      return {
        ...logo,
        width: transformedLogoCanvas.width,
        height: transformedLogoCanvas.height
      };
    }).filter(Boolean) as (LogoState & { width: number, height: number })[];
    
    if (transformedLogos.length === 0) return;

    const totalImageWidth = transformedLogos.reduce((sum, logo) => sum + logo.width, 0);
    const totalImageHeight = transformedLogos.reduce((sum, logo) => sum + logo.height, 0);
    const avgImageWidth = totalImageWidth / transformedLogos.length;
    const avgImageHeight = totalImageHeight / transformedLogos.length;

    const maxSingleLogoWidth = totalLogoSpace / logos.length;
    const maxSingleLogoHeight = containerHeight;

    const scaleFactorToFitContainer = Math.min(
      maxSingleLogoWidth / avgImageWidth,
      maxSingleLogoHeight / avgImageHeight
    );

    const finalLogoWidths = transformedLogos.map(logo => logo.width * scaleFactorToFitContainer);
    const finalLogoHeights = transformedLogos.map(logo => logo.height * scaleFactorToContainer);

    const totalRenderedWidth = finalLogoWidths.reduce((sum, width) => sum + width, 0) + (logos.length - 1) * logoSpacing;
    const startX = containerX + (containerWidth - totalRenderedWidth) / 2;

    let currentX = startX;
    logos.forEach((logo, index) => {
      const transformedLogoCanvas = previewCanvasRefs.current[logo.id];
      if (!transformedLogoCanvas) return;

      const finalLogoWidth = finalLogoWidths[index];
      const finalLogoHeight = finalLogoHeights[index];

      const logoX = currentX + (logo.logoHorizontalOffset / 100) * containerWidth;
      const logoY = containerY + (containerHeight - finalLogoHeight) / 2 + (logo.logoVerticalOffset / 100) * containerHeight;

      if (logo.backgroundType === 'white') {
        const hPadding = finalLogoWidth * (logo.logoPlateHorizontalPadding / 100);
        const vPadding = finalLogoHeight * (logo.logoPlateVerticalPadding / 100);
        const plateWidth = finalLogoWidth + hPadding * 2;
        const plateHeight = finalLogoHeight + vPadding * 2;
        const plateX = logoX - hPadding;
        const plateY = logoY - vPadding;
        ctx.fillStyle = 'white';
        fillRoundedRect(ctx, plateX, plateY, plateWidth, plateHeight, logo.logoPlateRadius);
      }

      ctx.save();
      ctx.globalCompositeOperation = logo.logoBlendMode;
      ctx.drawImage(transformedLogoCanvas, logoX, logoY, finalLogoWidth, finalLogoHeight);
      ctx.restore();

      currentX += finalLogoWidth + logoSpacing;
    });

    const dataUrl = exportCanvas.toDataURL('image/png');
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<img src="${dataUrl}" style="max-width: 100%; height: auto; display: block; margin: auto;">`);
      newWindow.document.title = 'Fullscreen Preview';
    }
  };


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

  const Section = ({ title, children, isCentered = false }: { title: string; children: React.ReactNode; isCentered?: boolean }) => (
    <div className="flex flex-col gap-3">
      <h3 className={`text-sm font-semibold text-zinc-400 uppercase tracking-widest ${isCentered ? 'text-center' : ''}`}>{title}</h3>
      {children}
    </div>
  );

  const InputGroup = ({ label, value, unit, children, onReset, isDefault, isDisabled = false }: { label: string, value: number, unit: string, children: React.ReactNode, onReset: () => void, isDefault: boolean, isDisabled?: boolean }) => (
    <div className={`flex flex-col gap-1 ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
        <span>{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-zinc-300">{value}{unit}</span>
          <ResetButton onReset={onReset} isDefault={isDefault} />
        </div>
      </div>
      {children}
    </div>
  );

  const LogoCard = ({ logo, index, isSelected, onClick, onRemove }: { logo: LogoState, index: number, isSelected: boolean, onClick: () => void, onRemove: () => void }) => {
    const fileInputId = `file-input-${logo.id}`;
    
    return (
      <div
        className={`group relative flex-shrink-0 w-36 h-36 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 shadow-xl' : 'border-zinc-700 hover:border-zinc-500'}`}
        onClick={onClick}
      >
        <div className="absolute inset-0 flex items-center justify-center p-2" onClick={(e) => {
          if (!logo.imageSrc) {
            e.stopPropagation();
            document.getElementById(fileInputId)?.click();
          }
        }}>
          {logo.imageSrc ? (
            <img src={logo.imageSrc} alt={`Logo ${index + 1}`} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-500 text-xs text-center">
              <PlusCircle size={24} className="mb-2" />
              <span className="font-medium">Logo {index + 1}</span>
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoUpload(e, logo.id)}
              />
            </div>
          )}
        </div>
        {logo.imageSrc && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            disabled={logos.length <= 2}
            className="absolute -top-3 -right-3 bg-red-600 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    );
  };
  
  const currentLogo = logos.find(l => l.id === selectedLogoId);

  return (
    <div className="absolute top-0 bottom-0 right-0 left-0 bg-[#161719] text-zinc-200 overflow-hidden flex flex-col font-sans">
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #25262c;
          border-radius: 4px;
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

        input[type="range"] {
          -webkit-tap-highlight-color: transparent;
          touch-action: none;
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

      <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-transparent border-b border-zinc-700/30 shadow-sm z-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              SSI Studios
            </h1>
            <p className="text-sm md:text-base text-zinc-400 font-medium">
              Create. Customize. Inspire.
            </p>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-[40%] scale-90">
          <Header />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            className="text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer"
            aria-label="Toggle editing controls"
          >
            {isControlsExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col pt-16 bg-[#161719] relative">
        <div className="flex-1 flex items-center justify-center p-8 bg-[#161719] relative">
          {!baseImage && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-lg font-light">
              Loading...
            </div>
          )}

          <div className="relative w-full max-w-[1280px] aspect-[16/9] shadow-2xl rounded-xl overflow-hidden flex items-center justify-center bg-[#25262c] border-2 border-dashed border-zinc-700/50">
            <canvas ref={combinedCanvasRef} className="w-full h-full object-contain" />

            {(logos.length === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-lg font-light border-2 border-dashed border-zinc-600 rounded-xl">
                <PlusCircle size={48} className="text-zinc-600 mb-2" />
                Select number of logos below to get started.
              </div>
            )}

            {logos.map(logo => (
              <canvas key={logo.id} ref={el => { previewCanvasRefs.current[logo.id] = el; }} className="hidden" />
            ))}
          </div>
        </div>
        
        {/* Bottom Controls Panel */}
        <motion.div
          ref={controlsRef}
          initial={false}
          animate={{ height: isControlsExpanded ? '50%' : '100px', padding: isControlsExpanded ? '2rem' : '1rem' }}
          transition={{ type: "tween", duration: 0.2 }}
          className="relative flex-shrink-0 w-full bg-[#1f2024] border-t border-zinc-700/30 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-center -translate-y-full">
            <button
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              className="p-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-blue-500 hover:bg-zinc-700 transition-colors"
              aria-label={isControlsExpanded ? "Collapse controls" : "Expand controls"}
            >
              {isControlsExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {isControlsExpanded ? (
                <motion.div
                  key="expanded-controls"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-8 h-full"
                >
                  <Section title="Logo Count">
                    <div className="flex items-center justify-between gap-4">
                      <select
                        value={logoCount}
                        onChange={(e) => setLogoCount(Number(e.target.value))}
                        className="w-full px-4 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                      >
                        {LOGO_COUNT_OPTIONS.map(count => (
                          <option key={count} value={count}>{count} Logos</option>
                        ))}
                      </select>
                      <button
                        onClick={handleGenerateClick}
                        disabled={logos.some(l => !l.image) || generating}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                      >
                        <Download size={16} /> Download
                      </button>
                    </div>
                  </Section>
                  
                  <div className="w-full h-px bg-zinc-700/50" />
                  
                  <Section title="Your Logos">
                    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                      {logos.map((logo, index) => (
                        <LogoCard
                          key={logo.id}
                          logo={logo}
                          index={index}
                          isSelected={selectedLogoId === logo.id}
                          onClick={() => {
                            if (selectedLogoId === logo.id) {
                              setSelectedLogoId(null);
                            } else {
                              setSelectedLogoId(logo.id);
                            }
                          }}
                          onRemove={() => handleRemoveLogo(logo.id)}
                        />
                      ))}
                    </div>
                  </Section>
                  <div className="w-full h-px bg-zinc-700/50" />

                  <Section title="Active Logo Settings">
                    {currentLogo ? (
                      <div className="flex flex-col gap-6">
                        <Section title="Placement">
                          <InputGroup
                            label="Horizontal"
                            value={currentLogo.logoHorizontalOffset}
                            unit="%"
                            onReset={() => updateSelectedLogo({ logoHorizontalOffset: 0 })}
                            isDefault={currentLogo.logoHorizontalOffset === 0}
                          >
                            <input type="range" min="-50" max="50" step="0.1" value={currentLogo.logoHorizontalOffset} onInput={handleLogoHorizontalOffset} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                          </InputGroup>
                          <InputGroup
                            label="Vertical"
                            value={currentLogo.logoVerticalOffset}
                            unit="%"
                            onReset={() => updateSelectedLogo({ logoVerticalOffset: 0 })}
                            isDefault={currentLogo.logoVerticalOffset === 0}
                          >
                            <input type="range" min="-50" max="50" step="0.1" value={currentLogo.logoVerticalOffset} onInput={handleLogoVerticalOffset} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                          </InputGroup>
                        </Section>
                        <Section title="Visual Flourishes">
                          <div>
                            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
                              <span>Blend Style</span>
                              <ResetButton onReset={() => updateSelectedLogo({ logoBlendMode: 'source-over' })} isDefault={currentLogo.logoBlendMode === 'source-over'} />
                            </div>
                            <select
                              value={currentLogo.logoBlendMode}
                              onChange={(e) => updateSelectedLogo({ logoBlendMode: e.target.value as BlendMode })}
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
                            value={currentLogo.logoBorderWidth}
                            unit="px"
                            onReset={() => updateSelectedLogo({ logoBorderWidth: 0 })}
                            isDefault={currentLogo.logoBorderWidth === 0}
                          >
                            <input type="range" min="0" max="20" step="0.5" value={currentLogo.logoBorderWidth} onInput={handleLogoBorderWidth} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mt-2">
                              <span>Outline Color</span>
                              <input type="color" value={currentLogo.logoBorderColor} onInput={(e) => updateSelectedLogo({ logoBorderColor: (e.target as HTMLInputElement).value })} disabled={currentLogo.logoBorderWidth === 0} className="w-6 h-6 rounded-md border-none cursor-pointer" />
                            </div>
                          </InputGroup>
                          <InputGroup
                            label="Rounded Corners"
                            value={currentLogo.logoRadius}
                            unit="px"
                            onReset={() => updateSelectedLogo({ logoRadius: 0 })}
                            isDefault={currentLogo.logoRadius === 0}
                          >
                            <input type="range" min="0" max="50" step="0.5" value={currentLogo.logoRadius} onInput={handleLogoRadius} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                          </InputGroup>
                        </Section>
                        <Section title="Logo Backdrop">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                              <span>Background Type</span>
                              <ResetButton
                                onReset={() => updateSelectedLogo({ backgroundType: 'original', logoPlateRadius: 0 })}
                                isDefault={currentLogo.backgroundType === 'original'}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateSelectedLogo({ backgroundType: 'original', logoPlateRadius: 0 })}
                                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${currentLogo.backgroundType === 'original' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'}`}
                              >
                                <LayoutGrid size={16} /> Original
                              </button>
                              <button
                                onClick={() => updateSelectedLogo({ backgroundType: 'white', logoPlateRadius: 15 })}
                                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${currentLogo.backgroundType === 'white' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'}`}
                              >
                                <Square size={16} fill="white" stroke="white" /> White Plate
                              </button>
                            </div>
                          </div>
                          <InputGroup
                            label="Plate Curvature"
                            value={currentLogo.logoPlateRadius}
                            unit="px"
                            onReset={() => updateSelectedLogo({ logoPlateRadius: 0 })}
                            isDefault={currentLogo.logoPlateRadius === 0}
                            isDisabled={currentLogo.backgroundType !== 'white'}
                          >
                            <input type="range" min="0" max="50" step="0.5" value={currentLogo.logoPlateRadius} onInput={handleLogoPlateRadius} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={currentLogo.backgroundType !== 'white'} />
                          </InputGroup>
                          <InputGroup
                            label="Horizontal Padding"
                            value={currentLogo.logoPlateHorizontalPadding}
                            unit="%"
                            onReset={() => updateSelectedLogo({ logoPlateHorizontalPadding: 15 })}
                            isDefault={currentLogo.logoPlateHorizontalPadding === 15}
                            isDisabled={currentLogo.backgroundType !== 'white'}
                          >
                            <input type="range" min="0" max="100" step="0.1" value={currentLogo.logoPlateHorizontalPadding} onInput={handleLogoPlateHorizontalPadding} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={currentLogo.backgroundType !== 'white'} />
                          </InputGroup>
                          <InputGroup
                            label="Vertical Padding"
                            value={currentLogo.logoPlateVerticalPadding}
                            unit="%"
                            onReset={() => updateSelectedLogo({ logoPlateVerticalPadding: 15 })}
                            isDefault={currentLogo.logoPlateVerticalPadding === 15}
                            isDisabled={currentLogo.backgroundType !== 'white'}
                          >
                            <input type="range" min="0" max="100" step="0.1" value={currentLogo.logoPlateVerticalPadding} onInput={handleLogoPlateVerticalPadding} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={currentLogo.backgroundType !== 'white'} />
                          </InputGroup>
                        </Section>
                      </div>
                    ) : (
                      <div className="text-zinc-500 text-sm font-light text-center py-4">
                        Select a logo card above to start editing.
                      </div>
                    )}
                  </Section>
                  <div className="w-full h-px bg-zinc-700/50" />
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed-controls"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex items-center justify-between gap-4 h-full"
                >
                  <Section title="Logo Count" isCentered={true}>
                    <select
                      value={logoCount}
                      onChange={(e) => setLogoCount(Number(e.target.value))}
                      className="w-full px-4 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    >
                      {LOGO_COUNT_OPTIONS.map(count => (
                        <option key={count} value={count}>{count} Logos</option>
                      ))}
                    </select>
                  </Section>
                  <button
                    onClick={handleGenerateClick}
                    disabled={logos.some(l => !l.image) || generating}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                  >
                    <Download size={16} /> Download
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
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
