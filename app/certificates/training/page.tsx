"use client"
import React, { useEffect, useState } from "react";
import fontkit from "@pdf-lib/fontkit";
import Header from "@/components/dashboard/Header";
import { Calendar, Cloud, Download, Check } from "lucide-react";
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
  const [programName, setProgramName] = useState("Robotics Training Program");
  const [operationText, setOperationText] = useState(
    "to operate the SSI Mantra Surgical Robotic System"
  );

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [doi, setDoi] = useState(formatDate(new Date()));
  const [certificateNo, setCertificateNo] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "uploading" | "downloading" | "complete" | "error">("idle");


  const handleDoiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5, 9);
    setDoi(v);
  };

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

        if (certificateNo) {
          const fontSize = 7;
          const margin = 40;
          const textWidth = soraSemiBoldFont.widthOfTextAtSize(certificateNo, fontSize);
          const pageWidth = firstPage.getWidth();
          firstPage.drawText(certificateNo, {
            x: pageWidth - textWidth - margin - 105,
            y: margin + 38,
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
  }, [firstName, lastName, hospitalName, programName, operationText, doi, certificateNo]);

  const handleExport = async () => {
    if (!previewUrl) return;

    setExportStatus("uploading");
    setIsLoading(true);

    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Simulate a 2-second upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const uploadFolder = "certificates";
      const fileName = `${certificateNo || "certificate"}.pdf`;

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64,
          fileName: fileName,
          folder: uploadFolder,
          mimeType: "application/pdf",
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setExportStatus("downloading");
        
        // Simulate a 1-second download delay and trigger download
        await new Promise(resolve => setTimeout(resolve, 1000));
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setExportStatus("complete");
        setTimeout(() => setExportStatus("idle"), 2000);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setExportStatus("error");
    } finally {
      setIsLoading(false);
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
              <InputComponent
                label="DOI (DD/MM/YYYY)"
                type="text"
                value={doi}
                onChange={handleDoiChange}
                placeholder="DD/MM/YYYY"
                focusColor="#4A90E2"
                icon={<Calendar size={16} />}
              />
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
              className={`
                mt-auto w-full text-white text-sm font-semibold py-3 rounded-lg 
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed 
                transform hover:scale-[1.01] hover:shadow-2xl hover:brightness-110 
                cursor-pointer
                ${exportStatus === "uploading" ? "bg-gradient-to-r from-[#FFD700] to-[#FFA500]" :
                  exportStatus === "downloading" ? "bg-gradient-to-r from-[#4A90E2] to-[#BD10E0]" :
                  exportStatus === "complete" ? "bg-gradient-to-r from-[#2ECC71] to-[#27AE60]" :
                  "bg-gradient-to-r from-[#4A90E2] to-[#BD10E0]"
                }
              `}
              disabled={!previewUrl || isLoading || exportStatus === "uploading" || exportStatus === "downloading"}
            >
              {(() => {
                switch (exportStatus) {
                  case "uploading":
                    return (
                      <div className="flex items-center justify-center gap-2">
                        <Cloud size={16} className="animate-bounce" />
                        <span>Uploading to AWS...</span>
                      </div>
                    );
                  case "downloading":
                    return (
                      <div className="flex items-center justify-center gap-2">
                        <Download size={16} className="animate-bounce" />
                        <span>Downloading...</span>
                      </div>
                    );
                  case "complete":
                    return (
                      <div className="flex items-center justify-center gap-2">
                        <Check size={16} />
                        <span>Export Complete!</span>
                      </div>
                    );
                  case "error":
                    return "❌ Export Failed";
                  default:
                    return isLoading ? "Generating..." : "Export PDF";
                }
              })()}
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