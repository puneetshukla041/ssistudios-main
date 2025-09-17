'use client'

import { useState, useRef, useEffect, useCallback, FC, ChangeEvent, FormEvent } from 'react'
import Header from "@/components/dashboard/Header";
import { motion, AnimatePresence } from 'framer-motion'
// NOTE: The Header component was commented out due to a compilation error.
// import Header from "@/components/dashboard/Header";
import {
  Settings,
  X,
  Trash2,
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
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y); // corrected line
  ctx.closePath();
  ctx.clip();
}

type RenderedLogo = LogoState & {
  finalWidth: number;
  finalHeight: number;
  transformedCanvas: HTMLCanvasElement;
};

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

// --- NEW: Define a single source of truth for default logo settings ---
const DEFAULT_LOGO_STATE: Omit<LogoState, 'id' | 'imageSrc' | 'image'> = {
  logoZoom: 100,
  logoOpacity: 100,
  logoBorderWidth: 0,
  logoBorderColor: '#ffffff',
  logoBlendMode: 'source-over',
  logoHorizontalOffset: 0,
  logoVerticalOffset: 0,
  logoRadius: 20, // Default to 20px
  backgroundType: 'original',
  logoPlateHorizontalPadding: 15,
  logoPlateVerticalPadding: 15,
  logoPlateRadius: 20, // Default to 20px for white plate
};

// --- MAIN COMPONENT ---
export default function PosterEditor() {
  const combinedCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const [baseImageSrc, setBaseImageSrc] = useState('/posters/poster1.jpg');
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  const [logos, setLogos] = useState<LogoState[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [exportSettings, setExportSettings] = useState({
    format: 'jpeg' as ExportFormat,
    resolution: RESOLUTIONS.find(r => r.name === 'Original') || RESOLUTIONS[0],
    quality: 1.0,
    dpi: 300
  });
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'complete'>('idle');

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

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
  
  // Create a memoized version of the handler to prevent re-renders
  const makeSmoothRangeHandler = useCallback(
    (setter: (n: number) => void) => (e: ChangeEvent<HTMLInputElement> | FormEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const next = Number(target.value);
      requestAnimationFrame(() => {
        setter(next);
      });
    },
    []
  );

  // Set up the smooth range handlers for the selected logo's properties
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
      updateSelectedLogo(DEFAULT_LOGO_STATE);
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
        // Remove the logo on error
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

  /**
   * A function to draw the logos onto a target canvas, either for preview or export.
   * This centralizes the logo drawing logic.
   */
  const drawLogosToCanvas = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const containerConfig = { top: 0.62, bottom: 0.76, hPadding: 0.05, vOffset: 0.05 };
    const containerY = canvasHeight * containerConfig.top;
    const containerHeight = canvasHeight * (containerConfig.bottom - containerConfig.top);
    const containerX = canvasWidth * containerConfig.hPadding;
    const containerWidth = canvasWidth * (1 - 2 * containerConfig.hPadding);
    
    // Use a percentage of the canvas width for spacing to ensure it scales
    const spacing = canvasWidth * 0.02; // A fixed spacing of 2% of the canvas width

    const loadedLogos = logos.filter(l => l.image);
    if (loadedLogos.length === 0) return;

    // Calculate maximum logo height to ensure they all fit within the container
    const maxLogoHeight = containerHeight * 0.8;
    
    // Pre-calculate the final dimensions for each logo
const renderedLogos: RenderedLogo[] = loadedLogos
  .map((logo): RenderedLogo | null => {
    const transformedCanvas = previewCanvasRefs.current[logo.id];
    if (!transformedCanvas || !logo.image) return null;

    const ratio = logo.image.width / logo.image.height;
    const finalHeight = maxLogoHeight;
    const finalWidth = finalHeight * ratio;

    return {
      ...logo,
      finalWidth,
      finalHeight,
      transformedCanvas,
    };
  })
  .filter((l): l is RenderedLogo => l !== null);


    // Calculate the total horizontal space required for all logos and spacing
    const totalLogosWidth = renderedLogos.reduce((acc, curr) => acc + curr.finalWidth, 0);
    const totalSpaceWidth = (renderedLogos.length > 1) ? (spacing * (renderedLogos.length - 1)) : 0;
    const totalContentWidth = totalLogosWidth + totalSpaceWidth;
    
    // Determine the overall scale factor to fit all logos and spacing in the container
    const scaleFactor = Math.min(1, containerWidth / totalContentWidth);

    let currentX = containerX + (containerWidth - totalContentWidth * scaleFactor) / 2;

renderedLogos.forEach((logo: RenderedLogo) => {
  const transformedLogoCanvas = previewCanvasRefs.current[logo.id];
  if (!transformedLogoCanvas) return;

  const finalWidth = logo.finalWidth * scaleFactor;
  const finalHeight = logo.finalHeight * scaleFactor;

  const x = currentX + (logo.logoHorizontalOffset / 100) * containerWidth;
  const y = containerY + (containerHeight - finalHeight) / 2 + (logo.logoVerticalOffset / 100) * containerHeight;

  if (logo.backgroundType === 'white') {
    const hPadding = finalWidth * (logo.logoPlateHorizontalPadding / 100);
    const vPadding = finalHeight * (logo.logoPlateVerticalPadding / 100);
    const plateWidth = finalWidth + hPadding * 2;
    const plateHeight = finalHeight + vPadding * 2;
    const plateX = x - hPadding;
    const plateY = y - vPadding;
    ctx.fillStyle = 'white';
    fillRoundedRect(ctx, plateX, plateY, plateWidth, plateHeight, logo.logoPlateRadius);
  }

  ctx.save();
  ctx.globalCompositeOperation = logo.logoBlendMode;
  ctx.drawImage(transformedLogoCanvas, x, y, finalWidth, finalHeight);
  ctx.restore();

  currentX += finalWidth + spacing * scaleFactor;
});

  }, [logos]);

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

    // Draw base image
    if (baseImage) {
      ctx.drawImage(baseImage, 0, 0, previewWidth, previewHeight);
    }

    // Draw logos
    if (logos.length > 0) {
      drawLogosToCanvas(ctx, previewWidth, previewHeight);
    }
  }, [baseImage, logos, previewWidth, previewHeight, drawLogosToCanvas]);

  /**
   * Handles a logo file upload from the user.
   * @param e The file input change event.
   */
  function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return;
    setUploading(true);
    const objectUrl = URL.createObjectURL(file);
    
    // Create a new logo state object using the default values
    const newLogo: LogoState = {
      id: crypto.randomUUID(), // Unique ID for each logo
      imageSrc: objectUrl,
      image: null,
      ...DEFAULT_LOGO_STATE, // Use the default state
    };
    
    setLogos(prevLogos => {
      const updatedLogos = [...prevLogos, newLogo];
      setSelectedLogoId(newLogo.id); // Select the newly added logo
      return updatedLogos;
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLogos(prevLogos => prevLogos.map(l =>
        l.id === newLogo.id ? { ...l, image: img } : l
      ));
      setUploading(false);
    };
    img.onerror = () => {
      console.error('Failed to load image. Please ensure it is a valid PNG.');
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      setLogos(prevLogos => prevLogos.filter(l => l.id !== newLogo.id));
    };
    img.src = objectUrl;
  }
  
  const handleRemoveLogo = (id: string) => {
    setLogos(prevLogos => {
      const updatedLogos = prevLogos.filter(logo => logo.id !== id);
      if (selectedLogoId === id) {
        setSelectedLogoId(updatedLogos.length > 0 ? updatedLogos[0].id : null);
      }
      return updatedLogos;
    });
  };

  const handleGenerateClick = () => {
    if (logos.length === 0) return;
    setShowExportModal(true);
  };

  const handleFullscreenClick = () => {
    if (!baseImage || logos.length === 0) return;

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

    // Draw base image
    ctx.drawImage(baseImage, 0, 0, originalWidth, originalHeight);

    // Draw logos using the unified function
    drawLogosToCanvas(ctx, originalWidth, originalHeight);
    
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
    if (!baseImage || logos.length === 0) return;
    setGenerating(true);
    setExportStatus('loading');
    setShowExportModal(false);
    
    // Simulate processing time
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

    // Draw base image
    ctx.drawImage(baseImage, 0, 0, outW, outH);

    // Draw logos using the unified function
    drawLogosToCanvas(ctx, outW, outH);
    
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
  );

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
  );

  // A small component for the logo thumbnails in the sidebar
  const LogoThumbnail = ({ logo, isSelected, onClick, onRemove }: { logo: LogoState, isSelected: boolean, onClick: () => void, onRemove: () => void }) => {
    return (
      <div 
        onClick={onClick}
        className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all group cursor-pointer ${isSelected ? 'border-blue-500 shadow-lg' : 'border-zinc-700/50 hover:border-zinc-500'}`}
      >
        <img src={logo.imageSrc || ''} alt={`Logo ${logo.id}`} className="w-full h-full object-contain p-1" />
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 size={24} className="text-white" />
        </button>
      </div>
    );
  };
  
  const currentLogo = logos.find(l => l.id === selectedLogoId);

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
          cursor: grab;
          border-radius: 9999px;
          border: none;
          margin-top: -6px;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }

        input[type="range"]::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.25);
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background-color: #3b82f6;
          cursor: grab;
          border-radius: 9999px;
          border: none;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.25);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }

        input[type="range"]::-moz-range-thumb:active {
            cursor: grabbing;
            transform: scale(1.25);
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
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
  Multiple Logo Editor
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
                
                {/* Logo Thumbnails Section */}
                <Section title="Your Logos (min 2, max 5)">
                  <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar max-h-64 pr-4">
                    {logos.map(logo => (
                      <div key={logo.id} className="relative group">
                        <LogoThumbnail 
                          logo={logo} 
                          isSelected={selectedLogoId === logo.id} 
                          onClick={() => setSelectedLogoId(logo.id)}
                          onRemove={() => handleRemoveLogo(logo.id)}
                        />
                      </div>
                    ))}
                    {logos.length < 5 && (
                      <button
                        onClick={() => { fileInputRef.current?.click() }}
                        disabled={uploading}
                        className="w-16 h-16 rounded-lg flex-shrink-0 border-2 border-dashed border-zinc-600 text-zinc-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusCircle size={24} />
                      </button>
                    )}
                  </div>
                </Section>
                <div className="w-full h-px bg-zinc-700/50" />
                
                {/* Logo Tweaks Section */}
                <Section title="Logo Tweaks">
                  {!selectedLogo ? (
                    <div className="text-zinc-500 text-sm font-light text-center py-4">
                      Select a logo to edit its settings.
                    </div>
                  ) : (
                    <>
                      <InputGroup
                        label="Size"
                        value={selectedLogo.logoZoom}
                        unit="%"
                        onReset={() => updateSelectedLogo({ logoZoom: DEFAULT_LOGO_STATE.logoZoom })}
                        isDefault={selectedLogo.logoZoom === DEFAULT_LOGO_STATE.logoZoom}
                      >
                        <input type="range" min="10" max="200" step="0.1" value={selectedLogo.logoZoom} onInput={handleLogoZoom} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-blue-600" />
                      </InputGroup>
                      <InputGroup
                        label="Rounded Corners"
                        value={selectedLogo.logoRadius}
                        unit="px"
                        onReset={() => updateSelectedLogo({ logoRadius: DEFAULT_LOGO_STATE.logoRadius })}
                        isDefault={selectedLogo.logoRadius === DEFAULT_LOGO_STATE.logoRadius}
                      >
                        <input type="range" min="0" max="50" step="0.5" value={selectedLogo.logoRadius} onInput={handleLogoRadius} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-blue-600" />
                      </InputGroup>
                    </>
                  )}
                </Section>
                <div className="w-full h-px bg-zinc-700/50" />
                
                <Section title="Ready to Go?">
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleGenerateClick}
                      disabled={logos.length < 2 || generating}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                    >
                      <Download size={16} className="inline-block mr-2" /> Download Image
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

            {(logos.length === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-lg font-light border-2 border-dashed border-zinc-600 rounded-xl">
                <PlusCircle size={48} className="text-zinc-600 mb-2" />
                It's a blank canvas! Add a logo to get started.
              </div>
            )}

            {logos.map(logo => (
              <canvas
                key={logo.id}
                ref={el => { previewCanvasRefs.current[logo.id] = el; }}
                className="hidden"
              />
            ))}

            <AnimatePresence>
              {(baseImage && logos.length > 0) && (
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

                {/* Conditional rendering for logo settings */}
                {!selectedLogo ? (
                  <div className="text-zinc-500 text-sm font-light text-center py-4">
                    Select a logo to edit its settings.
                  </div>
                ) : (
                  <>
                    <Section title="Placement">
                      <InputGroup
                        label="Horizontal"
                        value={selectedLogo.logoHorizontalOffset}
                        unit="%"
                        onReset={() => updateSelectedLogo({ logoHorizontalOffset: DEFAULT_LOGO_STATE.logoHorizontalOffset })}
                        isDefault={selectedLogo.logoHorizontalOffset === DEFAULT_LOGO_STATE.logoHorizontalOffset}
                      >
                        <input type="range" min="-50" max="50" step="0.1" value={selectedLogo.logoHorizontalOffset} onInput={handleLogoHorizontalOffset} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-blue-600" />
                      </InputGroup>
                      <InputGroup
                        label="Vertical"
                        value={selectedLogo.logoVerticalOffset}
                        unit="%"
                        onReset={() => updateSelectedLogo({ logoVerticalOffset: DEFAULT_LOGO_STATE.logoVerticalOffset })}
                        isDefault={selectedLogo.logoVerticalOffset === DEFAULT_LOGO_STATE.logoVerticalOffset}
                      >
                        <input type="range" min="-50" max="50" step="0.1" value={selectedLogo.logoVerticalOffset} onInput={handleLogoVerticalOffset} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-blue-600" />
                      </InputGroup>
                    </Section>
                    <div className="w-full h-px bg-zinc-700/50" />
                    <Section title="Visual Flourishes">
                      <div>
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
                          <span>Blend Style</span>
                          <ResetButton onReset={() => updateSelectedLogo({ logoBlendMode: DEFAULT_LOGO_STATE.logoBlendMode })} isDefault={selectedLogo.logoBlendMode === DEFAULT_LOGO_STATE.logoBlendMode} />
                        </div>
                        <select
                          value={selectedLogo.logoBlendMode}
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
                        value={selectedLogo.logoBorderWidth}
                        unit="px"
                        onReset={() => updateSelectedLogo({ logoBorderWidth: DEFAULT_LOGO_STATE.logoBorderWidth })}
                        isDefault={selectedLogo.logoBorderWidth === DEFAULT_LOGO_STATE.logoBorderWidth}
                      >
                        <input type="range" min="0" max="20" step="0.5" value={selectedLogo.logoBorderWidth} onInput={handleLogoBorderWidth} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-blue-600" />
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mt-2">
                          <span>Outline Color</span>
                          <input type="color" value={selectedLogo.logoBorderColor} onInput={(e) => updateSelectedLogo({ logoBorderColor: (e.target as HTMLInputElement).value })} disabled={selectedLogo.logoBorderWidth === 0} className="w-6 h-6 rounded-md border-none cursor-pointer" />
                        </div>
                      </InputGroup>
                    </Section>
                    <div className="w-full h-px bg-zinc-700/50" />
                    <Section title="Logo Backdrop">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                          <span>Background Type</span>
                          <ResetButton
                            onReset={() => updateSelectedLogo({ backgroundType: DEFAULT_LOGO_STATE.backgroundType })}
                            isDefault={selectedLogo.backgroundType === DEFAULT_LOGO_STATE.backgroundType}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateSelectedLogo({ backgroundType: 'white', logoPlateRadius: DEFAULT_LOGO_STATE.logoPlateRadius })}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${selectedLogo.backgroundType === 'white' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'}`}
                          >
                            <Square size={16} fill="white" stroke="white" /> White Plate
                          </button>
                          <button
                            onClick={() => updateSelectedLogo({ backgroundType: 'original', logoPlateRadius: 0 })}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${selectedLogo.backgroundType === 'original' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'}`}
                          >
                            <LayoutGrid size={16} /> Original
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                          {selectedLogo.backgroundType === 'white' && (
                              <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-4 overflow-hidden"
                              >
                                  <InputGroup
                                      label="Plate Curvature"
                                      value={selectedLogo.logoPlateRadius}
                                      unit="px"
                                      onReset={() => updateSelectedLogo({ logoPlateRadius: DEFAULT_LOGO_STATE.logoPlateRadius })}
                                      isDefault={selectedLogo.logoPlateRadius === DEFAULT_LOGO_STATE.logoPlateRadius}
                                  >
                                      <input type="range" min="0" max="50" step="0.5" value={selectedLogo.logoPlateRadius} onInput={handleLogoPlateRadius} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-blue-600" />
                                  </InputGroup>
                                  <InputGroup
                                      label="Horizontal Padding"
                                      value={selectedLogo.logoPlateHorizontalPadding}
                                      unit="%"
                                      onReset={() => updateSelectedLogo({ logoPlateHorizontalPadding: DEFAULT_LOGO_STATE.logoPlateHorizontalPadding })}
                                      isDefault={selectedLogo.logoPlateHorizontalPadding === DEFAULT_LOGO_STATE.logoPlateHorizontalPadding}
                                  >
                                      <input type="range" min="0" max="100" step="0.1" value={selectedLogo.logoPlateHorizontalPadding} onInput={handleLogoPlateHorizontalPadding} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-blue-600" />
                                  </InputGroup>
                                  <InputGroup
                                      label="Vertical Padding"
                                      value={selectedLogo.logoPlateVerticalPadding}
                                      unit="%"
                                      onReset={() => updateSelectedLogo({ logoPlateVerticalPadding: DEFAULT_LOGO_STATE.logoPlateVerticalPadding })}
                                      isDefault={selectedLogo.logoPlateVerticalPadding === DEFAULT_LOGO_STATE.logoPlateVerticalPadding}
                                  >
                                      <input type="range" min="0" max="100" step="0.1" value={selectedLogo.logoPlateVerticalPadding} onInput={handleLogoPlateVerticalPadding} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-blue-600" />
                                  </InputGroup>
                              </motion.div>
                          )}
                      </AnimatePresence>
                    </Section>
                  </>
                )}
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
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-blue-600 mt-2"
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