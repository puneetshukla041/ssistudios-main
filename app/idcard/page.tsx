"use client";
import React, { useEffect, useState, useRef } from "react";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import {
  Calendar,
  Upload,
  Image as ImageIcon,
  XCircle,
  CheckCircle,
  CloudUpload,
  FileText,
  Save,
  Download,
} from "lucide-react";

// Helper component for text input fields
interface InputProps {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  focusColor: string;
  icon?: React.ReactNode;
}

const InputComponent: React.FC<InputProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  focusColor,
  icon,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-gray-300 font-medium tracking-wide">
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ "--tw-ring-color": focusColor } as React.CSSProperties}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-4 pr-10 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-[--tw-ring-color] outline-none transition-all duration-200 ease-in-out hover:border-gray-500 uppercase font-semibold placeholder:font-semibold"
      />
      {icon && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 cursor-pointer">
          {icon}
        </span>
      )}
    </div>
  </div>
);

// Helper component for the blood group dropdown
interface SelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  focusColor: string;
}

const SelectComponent: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  focusColor,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-gray-300 font-medium tracking-wide">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      style={{ "--tw-ring-color": focusColor } as React.CSSProperties}
      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-4 pr-10 text-sm text-white focus:ring-1 focus:ring-[--tw-ring-color] outline-none transition-all duration-200 ease-in-out hover:border-gray-500 font-semibold"
    >
      <option value="">Select a blood group</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

// Helper function to capitalize the first letter of each word
const toTitleCase = (str: string) => {
  return str
    .split(" ")
    .map((word) => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

// Main App component
export default function App() {
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [idCardNo, setIdCardNo] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [exportStep, setExportStep] = useState<
    "idle" | "exporting" | "uploading" | "downloading" | "complete" | "error"
  >("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for image positioning and dragging
  const [imageXOffset, setImageXOffset] = useState(0);
  const [imageYOffset, setImageYOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const generatePdf = async () => {
      try {
        const existingPdfBytes = await fetch("/idcard/idcard.pdf").then((res) =>
          res.arrayBuffer()
        );
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        pdfDoc.registerFontkit(fontkit);

        const soraFont = await pdfDoc.embedFont(
          await fetch("/fonts/Sora-Regular.ttf").then((res) =>
            res.arrayBuffer()
          )
        );
        const soraSemiBoldFont = await pdfDoc.embedFont(
          await fetch("/fonts/Sora-SemiBold.ttf").then((res) =>
            res.arrayBuffer()
          )
        );
        const bebasNeueFont = await pdfDoc.embedFont(
          await fetch("/fonts/BebasNeue-Regular.ttf").then((res) =>
            res.arrayBuffer()
          )
        );
        const poppinsMediumFont = await pdfDoc.embedFont(
          await fetch("/fonts/Poppins-Medium.ttf").then((res) =>
            res.arrayBuffer()
          )
        );

        if (pdfDoc.getPages().length < 2) {
          pdfDoc.addPage();
        }
        const secondPage = pdfDoc.getPages()[1];
        const { width: pageWidth, height: pageHeight } = secondPage.getSize();

        const getDynamicFontSize = (
          text: string,
          font: any,
          maxWidth: number,
          maxFontSize: number
        ) => {
          let fontSize = maxFontSize;
          let textWidth = font.widthOfTextAtSize(text, fontSize);
          while (textWidth > maxWidth && fontSize > 1) {
            fontSize -= 1;
            textWidth = font.widthOfTextAtSize(text, fontSize);
          }
          return fontSize;
        };

        const FULL_NAME_Y_POS = 65;
        const DESIGNATION_Y_POS = 53;
        const ID_CARD_NO_Y_POS = 16;

        if (fullName) {
          const capitalizedFullName = fullName.toUpperCase();
          const MAX_FULL_NAME_WIDTH = pageWidth * 0.8;
          const dynamicFontSize = getDynamicFontSize(
            capitalizedFullName,
            bebasNeueFont,
            MAX_FULL_NAME_WIDTH,
            18
          );
          const fullNameWidth = bebasNeueFont.widthOfTextAtSize(
            capitalizedFullName,
            dynamicFontSize
          );
          const x = pageWidth / 2 - fullNameWidth / 2;
          secondPage.drawText(capitalizedFullName, {
            x,
            y: FULL_NAME_Y_POS,
            size: dynamicFontSize,
            font: bebasNeueFont,
            color: rgb(0, 0, 0),
          });
        }

        if (designation) {
          const titleCaseDesignation = toTitleCase(designation);
const MAX_DESIGNATION_WIDTH = pageWidth * 0.7;
const fontSize = getDynamicFontSize(
  titleCaseDesignation,
  poppinsMediumFont,
  MAX_DESIGNATION_WIDTH,
  8 // smaller than 10
);
const designationWidth = poppinsMediumFont.widthOfTextAtSize(
  titleCaseDesignation,
  fontSize
);
const x = pageWidth / 2 - designationWidth / 2;
secondPage.drawText(titleCaseDesignation, {
  x,
  y: DESIGNATION_Y_POS,
  size: fontSize,
  font: poppinsMediumFont,
  color: rgb(0.4, 0.4, 0.4), // lighter black
});

        }

        if (idCardNo) {
          const formattedIdCardNo = `#${idCardNo}`;
          const fontSize = 16;
          const idCardNoWidth = soraSemiBoldFont.widthOfTextAtSize(
            formattedIdCardNo,
            fontSize
          );
          const x = pageWidth / 2 - idCardNoWidth / 2 - 10;
          secondPage.drawText(formattedIdCardNo, {
            x,
            y: ID_CARD_NO_Y_POS,
            size: fontSize,
            font: soraSemiBoldFont,
            color: rgb(80 / 255, 185 / 255, 162 / 255),
          });
        }

        if (bloodGroup) {
          const bloodGroupImagePath = `/bloodgroup/${bloodGroup
            .toLowerCase()
            .replace("+", "plus")
            .replace("-", "minus")}.png`;

          try {
            const response = await fetch(bloodGroupImagePath);
            if (!response.ok) {
              throw new Error(`Image not found: ${bloodGroupImagePath}`);
            }

            const imageBytes = await response.arrayBuffer();
            const image = await pdfDoc.embedPng(imageBytes);

            const IMAGE_SIZE = 15;
            const imageX = pageWidth / 2 - IMAGE_SIZE / 2 + 38;
            const imageY = pageHeight / 2 - IMAGE_SIZE / 2 - 100;

            const LINE_WIDTH = 1;
            const LINE_HEIGHT = 15;
            const GAP = 6;

            const lineX = imageX - GAP - LINE_WIDTH;
            const lineY = imageY;

            secondPage.drawRectangle({
              x: lineX,
              y: lineY,
              width: LINE_WIDTH,
              height: LINE_HEIGHT,
              color: rgb(0.3, 0.3, 0.3),
            });

            secondPage.drawImage(image, {
              x: imageX,
              y: imageY,
              width: IMAGE_SIZE,
              height: IMAGE_SIZE,
            });
          } catch (e) {
            console.error(
              `Failed to load PNG for blood group ${bloodGroup}:`,
              e
            );
          }
        }

        if (userImage) {
          try {
            const imageBytes = await fetch(userImage).then((res) =>
              res.arrayBuffer()
            );
            let image;
            if (userImage.startsWith("data:image/jpeg")) {
              image = await pdfDoc.embedJpg(imageBytes);
            } else if (userImage.startsWith("data:image/png")) {
              image = await pdfDoc.embedPng(imageBytes);
            }

            if (image) {
              const photoWidth = 94;
              const photoHeight = 126;
              const xPos = pageWidth / 2 - photoWidth / 2 + imageXOffset;
              const yPos = 85 + imageYOffset;
              const slopeHeight = 55;

const img = new Image();
img.src = userImage;
await new Promise((resolve) => (img.onload = resolve));

const scale = 3;
const canvas = document.createElement("canvas");
canvas.width = photoWidth * scale;
canvas.height = photoHeight * scale;
const ctx = canvas.getContext("2d")!;

ctx.scale(scale, scale);
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(photoWidth, 0);
ctx.lineTo(photoWidth, photoHeight - slopeHeight);
ctx.lineTo(0, photoHeight);
ctx.closePath();
ctx.clip();

ctx.drawImage(img, 0, 0, photoWidth, photoHeight);

const clippedDataUrl = canvas.toDataURL("image/png");

const clippedBytes = await fetch(clippedDataUrl).then((res) =>
  res.arrayBuffer()
);
const finalImage = await pdfDoc.embedPng(clippedBytes);

secondPage.drawImage(finalImage, {
  x: xPos,
  y: yPos,
  width: photoWidth,
  height: photoHeight,
});

            }
          } catch (e) {
            console.error("Failed to embed sloped user image:", e);
          }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (error) {
        console.error("Failed to generate PDF:", error);
      }
    };
    generatePdf();
  }, [
    fullName,
    designation,
    idCardNo,
    bloodGroup,
    userImage,
    imageXOffset,
    imageYOffset,
  ]);

  const handleExport = async () => {
    if (!previewUrl || exportStep !== "idle") return;

    try {
      setExportStep("uploading");
      setFeedbackMessage("Uploading to AWS...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // This part requires a backend endpoint to handle the upload.
      // We will simulate a successful upload for this example.
      const blob = await fetch(previewUrl).then((res) => res.blob());
      const arrayBuffer = await blob.arrayBuffer();
      const base64File = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // In a real app, you would send this to your backend.
      // For this example, we'll just log it.
      console.log("Simulating upload of file to AWS:", base64File.slice(0, 50) + "...");

      setExportStep("downloading");
      setFeedbackMessage("Saving to Local Storage...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const fileName = `id_card_${idCardNo || Date.now()}.pdf`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setExportStep("complete");
      setFeedbackMessage("PDF saved and ready to use!");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setExportStep("idle");

    } catch (err) {
      console.error("Export failed:", err);
      setExportStep("error");
      setFeedbackMessage("Export failed.");
      setTimeout(() => setExportStep("idle"), 3000);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
        setImageXOffset(0);
        setImageYOffset(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetImage = () => {
    setUserImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setImageXOffset(0);
    setImageYOffset(0);
  };

  const onDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - imageXOffset,
      y: e.clientY - imageYOffset,
    };
  };

  const onDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;

    const maxX = 10;
    const minX = -10;
    const maxY = 15;
    const minY = -15;

    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));

    setImageXOffset(constrainedX);
    setImageYOffset(constrainedY);
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  const bloodGroupOptions = ["A-", "A+", "AB-", "AB+", "B-", "B+", "O-", "O+"];
  const header = (
    <div className="flex justify-between items-center w-full px-8 py-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-3xl font-extrabold text-white animate-glow-pulse">ID Card Generator</h1>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-400">
          A SSI MAYA APPLICATION
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen w-full bg-[#161719] text-white font-sans flex justify-center items-center p-8 mt-[-32] mb-[-40] ml-12 mr-5"
      onMouseMove={onDrag}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
    >
      <style>
        {`
          .clip-image {
            clip-path: polygon(0% 0%, 100% 0%, 100% 85%, 0% 100%);
            touch-action: none;
          }
          @keyframes glowing-pulse {
            0% {
              filter: drop-shadow(0 0 1px #4A90E2) brightness(100%);
              transform: scale(1);
            }
            50% {
              filter: drop-shadow(0 0 5px #4A90E2) brightness(120%);
              transform: scale(1.01);
            }
            100% {
              filter: drop-shadow(0 0 1px #4A90E2) brightness(100%);
              transform: scale(1);
            }
          }
          .animate-glow-pulse {
            animation: glowing-pulse 4s ease-in-out infinite;
          }
        `}
      </style>
      <div className="flex flex-col w-full h-full max-w-[1300px]">
        <div className="w-full flex justify-center mb-8">{header}</div>
        <div className="flex w-full max-w-[1300px] h-[90vh] gap-6">
          <div className="w-2/5 bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col gap-8 border border-gray-700/50 h-full">
            <div className="pb-4 border-b border-gray-700">
              <h2 className="text-3xl font-extrabold text-white tracking-wide">
                ID Card Details
              </h2>
              <p className="text-gray-400 mt-1 text-sm">
                Enter your details to generate your ID card.
              </p>
            </div>
            <div className="flex flex-col gap-6 flex-grow overflow-y-auto pr-2">
              <InputComponent
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ENTER FULL NAME"
                focusColor="#4A90E2"
              />
              <InputComponent
                label="Designation"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Enter Designation"
                focusColor="#4A90E2"
              />
              <InputComponent
                label="ID Card No."
                type="text"
                value={idCardNo}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value) && value.length <= 4) {
                    setIdCardNo(value);
                  }
                }}
                placeholder="Enter ID card number"
                focusColor="#4A90E2"
              />
              <SelectComponent
                label="Blood Group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                options={bloodGroupOptions}
                focusColor="#4A90E2"
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-300 font-medium tracking-wide">
                  Photo
                </label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-6 mt-6 hover:border-gray-500 transition-colors cursor-pointer">
                  {userImage ? (




<div
  className="relative w-28 aspect-[3/4] rounded-lg overflow-hidden border border-gray-600 group clip-image"
  onMouseDown={onDragStart}
  style={{
    transform: `translate(${imageXOffset}px, ${imageYOffset}px)`,
    cursor: "grab",
  }}
>
  <img
    src={userImage}
    alt="User"
    className="w-full h-full object-contain" // ← keep this
    style={{ objectFit: "contain" }} // ensure aspect ratio
  />
  <button
    onClick={resetImage}
    className="absolute top-1 right-1 bg-gray-900 rounded-full p-0.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <XCircle size={20} />
  </button>
</div>



                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleImageChange}
                        className="hidden"
                        ref={fileInputRef}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <Upload size={24} />
                        <span className="mt-2 text-sm font-semibold">
                          Choose a photo
                        </span>
                        <span className="text-xs text-gray-500">
                          (PNG or JPG)
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full bg-gradient-to-r from-[#4A90E2] to-[#BD10E0]
                        text-white text-sm font-semibold py-3 rounded-lg
                        hover:scale-[1.01] transition-transform shadow-lg
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transform hover:shadow-2xl hover:brightness-110
                        cursor-pointer relative overflow-hidden flex items-center justify-center gap-2"
              disabled={
                !previewUrl || exportStep !== "idle"
              }
            >
              {exportStep === "idle" && "Export PDF"}
              {exportStep === "uploading" && (
                <>
                  <CloudUpload className="h-4 w-4 animate-bounce" />
                  <span>Uploading to AWS...</span>
                </>
              )}
              {exportStep === "downloading" && (
                <>
                  <Download className="h-4 w-4" />
                  <span>Saving to Local Storage...</span>
                </>
              )}
              {exportStep === "complete" && (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete!</span>
                </>
              )}
              {exportStep === "error" && "Export Failed"}
            </button>
            {feedbackMessage && (
              <div
                className={`text-center text-xs font-medium mt-2 py-2 px-4 rounded-lg
                  ${exportStep === "error"
                      ? "bg-red-900/50 text-red-300"
                      : "bg-green-900/50 text-green-300"
                  }`}
              >
                {feedbackMessage}
              </div>
            )}
          </div>
          <div className="w-3/4 bg-[#242436] rounded-xl shadow-lg flex items-center justify-center overflow-hidden border border-[#303045] h-full outline outline-white outline-1">
            {exportStep === "exporting" ? (
              <div className="flex flex-col items-center justify-center text-[#8888AA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A90E2]"></div>
                <p className="mt-4 text-sm">Loading preview...</p>
              </div>
            ) : previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full rounded-xl" />
            ) : (
              <p className="text-[#8888AA] text-sm">
                Preview will appear here...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
