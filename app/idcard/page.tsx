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
        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-4 pr-10 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-[--tw-ring-color] outline-none transition-all duration-200 ease-in-out hover:border-gray-500"
      />
      {icon && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 cursor-pointer">
          {icon}
        </span>
      )}
    </div>
  </div>
);

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
          await fetch("/fonts/Sora-SemiBold.ttf").then((res) => res.arrayBuffer())
        );
        const bebasNeueFont = await pdfDoc.embedFont(
          await fetch("/fonts/Sora-SemiBold.ttf").then((res) => res.arrayBuffer())
        );
        const poppinsMediumFont = await pdfDoc.embedFont(
          await fetch("/fonts/Poppins-Medium.ttf").then((res) => res.arrayBuffer())
        );

        // Page 2: ID Card
        if (pdfDoc.getPages().length < 2) {
          pdfDoc.addPage();
        }
        const secondPage = pdfDoc.getPages()[1];
        
        const { width: pageWidth } = secondPage.getSize();
        
        // Define text positions and sizes
        const FULL_NAME_FONT_SIZE = 18;
        const FULL_NAME_Y_POS = 50; // Distance from the bottom of the page

        // Add Full Name
        if (fullName) {
          const capitalizedFullName = fullName.toUpperCase();
          const fullNameWidth = bebasNeueFont.widthOfTextAtSize(capitalizedFullName, FULL_NAME_FONT_SIZE);
          const x = (pageWidth / 2) - (fullNameWidth / 2); // Center horizontally
          
          secondPage.drawText(capitalizedFullName, {
            x: x,
            y: FULL_NAME_Y_POS,
            size: FULL_NAME_FONT_SIZE,
            font: bebasNeueFont,
            color: rgb(0, 0, 0),
          });
        }

        // Add Designation
        if (designation) {
          const designationWidth = poppinsMediumFont.widthOfTextAtSize(designation, 10);
          const x = (pageWidth / 2) - (designationWidth / 2); // Center horizontally
          secondPage.drawText(designation, {
            x: x,
            y: 160,
            size: 10,
            font: poppinsMediumFont,
            color: rgb(0, 0, 0),
          });
        }

        // Add ID Card No.
        if (idCardNo) {
          const idCardNoWidth = soraFont.widthOfTextAtSize(idCardNo, 8);
          const x = (pageWidth / 2) - (idCardNoWidth / 2); // Center horizontally
          secondPage.drawText(idCardNo, {
            x: x,
            y: 140,
            size: 8,
            font: soraFont,
            color: rgb(0.25, 0.749, 0.647), // #40bea5
          });
        }

        // Add Blood Group
        if (bloodGroup) {
          const bloodGroupWidth = soraSemiBoldFont.widthOfTextAtSize(bloodGroup, 8);
          const x = (pageWidth / 2) - (bloodGroupWidth / 2); // Center horizontally
          secondPage.drawText(bloodGroup, {
            x: x,
            y: 120,
            size: 8,
            font: soraSemiBoldFont,
            color: rgb(1, 1, 1), // white
          });
        }
        
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
      link.download = "id_card.pdf"; // Changed download file name
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
                placeholder="Enter full name"
                focusColor="#4A90E2"
              />
              <InputComponent
                label="Designation"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Enter designation"
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
              <p className="text-[#8888AA] text-sm">Preview will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}