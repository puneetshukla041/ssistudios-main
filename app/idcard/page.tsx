"use client";
  import React, { useEffect, useState, useRef } from "react";
  import fontkit from "@pdf-lib/fontkit";
  import { PDFDocument, rgb } from "pdf-lib";
  import { Calendar, Upload, Image as ImageIcon, XCircle } from "lucide-react";

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
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const generatePdf = async () => {
        setIsLoading(true);
        try {
          // Fetch the template PDF from the public folder
          const existingPdfBytes = await fetch("/idcard/idcard.pdf").then((res) =>
            res.arrayBuffer()
          );
          const pdfDoc = await PDFDocument.load(existingPdfBytes);

          pdfDoc.registerFontkit(fontkit);

          // Load fonts from the public folder
          const soraFont = await pdfDoc.embedFont(
            await fetch("/fonts/Sora-Regular.ttf").then((res) => res.arrayBuffer())
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

          // Access the second page of the PDF to draw the dynamic content
          if (pdfDoc.getPages().length < 2) {
            pdfDoc.addPage();
          }
          const secondPage = pdfDoc.getPages()[1];
          const { width: pageWidth, height: pageHeight } = secondPage.getSize();

          // --- Dynamic font sizing helper ---
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

          // --- Text positions ---
          const FULL_NAME_Y_POS = 50;
          const DESIGNATION_Y_POS = 38;
          const ID_CARD_NO_Y_POS = 16;
          const IMAGE_SIZE = 50;  

          // --- Full Name ---
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

          // --- Designation (center + auto shrink) ---
          if (designation) {
            const titleCaseDesignation = toTitleCase(designation);
            const MAX_DESIGNATION_WIDTH = pageWidth * 0.7;
            const fontSize = getDynamicFontSize(
              titleCaseDesignation,
              poppinsMediumFont,
              MAX_DESIGNATION_WIDTH,
              12
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
              color: rgb(0, 0, 0),
            });
          }

          // --- ID Card No ---
          if (idCardNo) {
            const formattedIdCardNo = `#${idCardNo}`;
            const fontSize = 16;
            const idCardNoWidth = soraSemiBoldFont.widthOfTextAtSize(formattedIdCardNo, fontSize);
            const x = (pageWidth / 2) - (idCardNoWidth / 2) - 10;
            secondPage.drawText(formattedIdCardNo, {
              x,
              y: ID_CARD_NO_Y_POS,
              size: fontSize,
              font: soraSemiBoldFont,
              color: rgb(80 / 255, 185 / 255, 162 / 255),
            });
          }

          // --- Blood Group with image ---
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
              console.error(`Failed to load PNG for blood group ${bloodGroup}:`, e);
            }
          }
if (userImage) {
  try {
    const imageBytes = await fetch(userImage).then(res => res.arrayBuffer());
    let image;
    if (userImage.startsWith("data:image/jpeg")) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (userImage.startsWith("data:image/png")) {
      image = await pdfDoc.embedPng(imageBytes);
    }

    if (image) {
      const photoWidth = 80;
      const photoHeight = 126;
      const xPos = pageWidth / 2 - photoWidth / 2;
      const yPos = 89;
      const slopeHeight = 47;

      // Preprocess image in canvas to apply slope
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

      const clippedBytes = await fetch(clippedDataUrl).then(res => res.arrayBuffer());
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


          // Save + Preview
          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([new Uint8Array(pdfBytes)], {
            type: "application/pdf",
          });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        } catch (error) {
          console.error("Failed to generate PDF:", error);
        } finally {
          setIsLoading(false);
        }
      };
      generatePdf();
    }, [fullName, designation, idCardNo, bloodGroup, userImage]);

    // Handler to export the PDF
    const handleExport = () => {
      if (previewUrl) {
        const link = document.createElement("a");
        link.href = previewUrl;
        link.download = "id_card.pdf";
        link.click();
      }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUserImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const resetImage = () => {
      setUserImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const bloodGroupOptions = ["A-", "A+", "AB-", "AB+", "B-", "B+", "O-", "O+"];
    const header = (
      <div className="flex justify-between items-center w-full px-8 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-extrabold text-white">ID Card Generator</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-400">
            Powered by PDF-Lib
          </span>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen w-full bg-[#161719] text-white font-sans flex justify-center items-center p-8 mt-[-32] mb-[-40] ml-12 mr-5">
        <style>
          {`
            .clip-image {
              clip-path: polygon(0% 0%, 100% 0%, 100% 85%, 0% 100%);
            }
          `}
        </style>
        <div className="flex flex-col w-full h-full max-w-[1300px]">
          <div className="w-full flex justify-center mb-8">
            {header}
          </div>
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
                      <div className="relative w-20 h-32 rounded-lg overflow-hidden border border-gray-600 group clip-image">
                        <img src={userImage} alt="User" className="w-full h-full object-cover" />
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
                className="mt-auto w-full bg-gradient-to-r from-[#4A90E2] to-[#BD10E0]
                  text-white text-sm font-semibold py-3 rounded-lg
                  hover:scale-[1.01] transition-transform shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transform hover:shadow-2xl hover:brightness-110
                  cursor-pointer"
                disabled={!previewUrl || isLoading}
              >
                {isLoading ? "Generating..." : "Export PDF"}
              </button>
            </div>
            <div className="w-3/4 bg-[#242436] rounded-xl shadow-lg flex items-center justify-center overflow-hidden border border-[#303045] h-full outline outline-white outline-1">
              {isLoading ? (
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
