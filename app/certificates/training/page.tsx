"use client"
import React, { useEffect, useState } from "react";
import fontkit from "@pdf-lib/fontkit";
import Header from "@/components/dashboard/Header";
import { Calendar } from "lucide-react"; // ✅ Calendar icon

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [programName, setProgramName] = useState("Surgeon Training Program"); // ✅ Default filled
  const [operationText, setOperationText] = useState(
    "to operate the SSI Mantra Surgical Robotic System"
  );

  // ✅ Format today's date as DD/MM/YYYY
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [doi, setDoi] = useState(formatDate(new Date())); // ✅ Defaults to today
  const [certificateNo, setCertificateNo] = useState(""); // ✅ Added certificate number
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Handle DOI input with auto slash (DD/MM/YYYY)
  const handleDoiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5, 9);
    setDoi(v);
  };

  // ✅ PDF generation
  useEffect(() => {
    const generatePdf = async () => {
      setIsLoading(true);
      try {
        const { PDFDocument, rgb } = await import("pdf-lib");
        const existingPdfBytes = await fetch("/certificates/certificate1.pdf").then((res) =>
          res.arrayBuffer()
        );
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        pdfDoc.registerFontkit(fontkit);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // ✅ Load Sora Regular & SemiBold
        const soraBytes = await fetch("/fonts/Sora-Regular.ttf").then((res) =>
          res.arrayBuffer()
        );
        const soraFont = await pdfDoc.embedFont(soraBytes);

        const soraSemiBoldBytes = await fetch("/fonts/Sora-SemiBold.ttf").then((res) =>
          res.arrayBuffer()
        );
        const soraSemiBoldFont = await pdfDoc.embedFont(soraSemiBoldBytes);

        let y = firstPage.getHeight() - 180;
        const x = 55;

        const cap = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
        const fullName = `${cap(firstName)} ${cap(lastName)}`.trim();

        if (fullName) {
          firstPage.drawText(fullName, {
            x,
            y,
            size: 18,
            font: soraFont,
            color: rgb(0, 0, 0),
          });
        }

        if (hospitalName) {
          firstPage.drawText(hospitalName, {
            x,
            y: y - 20,
            size: 8,
            font: soraSemiBoldFont,
            color: rgb(0, 0, 0),
          });
        }

        if (programName) {
          firstPage.drawText(programName, {
            x,
            y: y - 76,
            size: 7,
            font: soraSemiBoldFont,
            color: rgb(0, 0, 0),
          });
        }

        if (operationText) {
          firstPage.drawText(operationText, {
            x,
            y: y - 100,
            size: 7,
            font: soraSemiBoldFont,
            color: rgb(0, 0, 0),
          });
        }

        // ✅ Add DOI at bottom (slightly left + above margin)
        if (doi) {
          const fontSize = 7;
          const margin = 40;
          const textWidth = soraSemiBoldFont.widthOfTextAtSize(doi, fontSize);
          const pageWidth = firstPage.getWidth();

          firstPage.drawText(doi, {
            x: Math.max(margin, (pageWidth - textWidth) / 2) - 65,
            y: margin + 37,
            size: fontSize,
            font: soraSemiBoldFont,
            color: rgb(0, 0, 0),
            maxWidth: pageWidth - margin * 2,
          });
        }

        // ✅ Add Certificate No. at top-right corner
if (certificateNo) {
  const fontSize = 7;
  const margin = 40;
  const textWidth = soraSemiBoldFont.widthOfTextAtSize(certificateNo, fontSize);
  const pageWidth = firstPage.getWidth();

  firstPage.drawText(certificateNo, {
    x: pageWidth - textWidth - margin - 105, // ✅ align right with margin
    y: margin + 38,                    // ✅ bottom margin
    size: fontSize,
    font: soraSemiBoldFont,
    color: rgb(0, 0, 0),
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
  }, [firstName, lastName, hospitalName, programName, operationText, doi, certificateNo]); // ✅ Added certificateNo dep

  const handleExport = () => {
    if (previewUrl) {
      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = "certificate.pdf";
      link.click();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#161719] text-white font-sans flex justify-center items-center p-8 mt-[-32] mb-[-40] ml-12 mr-5">
      <div className="flex flex-col w-full h-full max-w-[1300px]">
        {/* Header at top center */}
        <div className="w-full flex justify-center mb-8">
          <Header />
        </div>
        <div className="flex w-full max-w-[1300px] h-[90vh] gap-6">
          {/* Left form */}
          <div className="w-2/5 bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col gap-8 border border-gray-700/50 h-full">
            <div className="pb-4 border-b border-gray-700">
              <h2 className="text-3xl font-extrabold text-white tracking-wide">
                Certificate Details
              </h2>
              <p className="text-gray-400 mt-1 text-sm">
                Enter your name to generate your certificate.
              </p>
            </div>
            <div className="flex flex-col gap-6 flex-grow overflow-y-auto pr-2">
              <InputComponent
                label="First Name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                focusColor="#4A90E2"
              />
              <InputComponent
                label="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                focusColor="#4A90E2"
              />
              <InputComponent
                label="Hospital Name"
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="Enter hospital name"
                focusColor="#4A90E2"
              />
              <InputComponent
                label="Program Name"
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="Enter program name"
                focusColor="#4A90E2"
              />
              <InputComponent
                label="Operation Text"
                type="text"
                value={operationText}
                onChange={(e) => setOperationText(e.target.value)}
                placeholder="Enter operation text"
                focusColor="#4A90E2"
              />

              {/* ✅ DOI Input */}
              <InputComponent
                label="DOI (DD/MM/YYYY)"
                type="text"
                value={doi}
                onChange={handleDoiChange}
                placeholder="DD/MM/YYYY"
                focusColor="#4A90E2"
                icon={<Calendar size={16} />}
              />

              {/* ✅ Certificate No. Input */}
              <InputComponent
                label="Certificate No."
                type="text"
                value={certificateNo}
                onChange={(e) => setCertificateNo(e.target.value)}
                placeholder="Enter certificate number"
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

          {/* Preview */}
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
