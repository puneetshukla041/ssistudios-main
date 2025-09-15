"use client";
import React, { useEffect, useState } from "react";
import fontkit from "@pdf-lib/fontkit";
import Header from "@/components/dashboard/Header";
import { Calendar } from "lucide-react";

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

export default function Editor() {
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [idCardNo, setIdCardNo] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generatePdf = async () => {
      setIsLoading(true);
      try {
        const { PDFDocument, rgb } = await import("pdf-lib");
        const existingPdfBytes = await fetch("/idcard/idcard.pdf").then((res) =>
          res.arrayBuffer()
        );
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        pdfDoc.registerFontkit(fontkit);

        // Load fonts
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

        // Fetch the Droplet SVG content from a public path
        const dropletSvgResponse = await fetch("/logos/droplet.svg");
        const dropletSvgText = await dropletSvgResponse.text();

        // Extract the path data (d attribute) from the SVG content
        const pathData = /d="([^"]*)"/.exec(dropletSvgText)?.[1];
        if (!pathData) {
          throw new Error("Could not find path data in Droplet SVG.");
        }

        // Page 2: ID Card
        if (pdfDoc.getPages().length < 2) {
          pdfDoc.addPage();
        }
        const secondPage = pdfDoc.getPages()[1];
        const { width: pageWidth } = secondPage.getSize();

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
        const BLOOD_GROUP_Y_POS = 28;

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
// --- Blood Group with vector icon ---
if (bloodGroup) {
  const bloodGroupTextSize = 14; // bigger text
  const iconSize = 40;           // make icon larger
  const iconPadding = 8;

  // Measure text
  const textWidth = soraSemiBoldFont.widthOfTextAtSize(
    bloodGroup,
    bloodGroupTextSize
  );
  const totalWidth = textWidth + iconSize + iconPadding;

  // Center horizontally
  const startX = pageWidth / 2 - totalWidth / 2;
  const iconX = startX;
  const textX = startX + iconSize + iconPadding;

  // Center vertically (half page height)
  const { height: pageHeight } = secondPage.getSize();
  const BLOOD_GROUP_Y_POS = pageHeight / 2;

  // Draw Droplet icon
  secondPage.drawSvgPath(pathData, {
    x: iconX,
    y: BLOOD_GROUP_Y_POS,
    scale: iconSize / 24, // enlarge from base 24x24
    color: rgb(0.8, 0, 0), // dark red for visibility
  });

  // Draw text aligned with icon
  secondPage.drawText(bloodGroup, {
    x: textX,
    y: BLOOD_GROUP_Y_POS + iconSize / 4, // adjust to align vertically with icon
    size: bloodGroupTextSize,
    font: soraSemiBoldFont,
    color: rgb(0, 0, 0),
  });
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
  }, [fullName, designation, idCardNo, bloodGroup]);

  const handleExport = () => {
    if (previewUrl) {
      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = "id_card.pdf";
      link.click();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#161719] text-white font-sans flex justify-center items-center p-8 mt-[-32] mb-[-40] ml-12 mr-5">
      <div className="flex flex-col w-full h-full max-w-[1300px]">
        <div className="w-full flex justify-center mb-8">
          <Header />
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
                onChange={(e) => setDesignation(toTitleCase(e.target.value))}
                placeholder="Enter Designation"
                focusColor="#4A90E2"
              />
              <InputComponent
                label="ID Card No."
                type="text"
                value={idCardNo}
                onChange={(e) => setIdCardNo(e.target.value)}
                placeholder="Enter ID card number"
                focusColor="#4A90E2"
              />
              <InputComponent
                label="Blood Group"
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="Enter blood group"
                focusColor="#4A90E2"
              />
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