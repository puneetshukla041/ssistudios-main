// Editor.tsx
'use client'
import React, { useEffect, useState } from "react";
import fontkit from "@pdf-lib/fontkit";
import Header from "@/components/dashboard/Header";
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
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
          {icon}
        </span>
      )}
    </div>
  </div>
);

export default function Editor() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // PDF generation useEffect
  useEffect(() => {
    const generatePdf = async () => {
      setIsLoading(true);
      try {
        const { PDFDocument, rgb } = await import("pdf-lib");
        const existingPdfBytes = await fetch("/pdf/template.pdf").then((res) =>
          res.arrayBuffer()
        );
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        pdfDoc.registerFontkit(fontkit);

        const pages = pdfDoc.getPages();
        const secondPage = pages[1] || pages[0];

        const poppinsSemiBoldBytes = await fetch(
          "/fonts/Poppins-SemiBold.ttf"
        ).then((res) => res.arrayBuffer());
        const poppinsMediumBytes = await fetch(
          "/fonts/Poppins-Medium.ttf"
        ).then((res) => res.arrayBuffer());

        const poppinsSemiBold = await pdfDoc.embedFont(poppinsSemiBoldBytes);
        const poppinsMedium = await pdfDoc.embedFont(poppinsMediumBytes);

        let y = secondPage.getHeight() - 30;
        const x = 15;

        const cap = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
        const fullName = `${cap(firstName)} ${cap(lastName)}`.trim();

        if (fullName) {
          secondPage.drawText(fullName, {
            x,
            y,
            size: 11,
            font: poppinsSemiBold,
            color: rgb(1, 1, 1),
          });
          y -= 12;
        }

        const fields: {
          text: string;
          fontSize: number;
          extraSpacing?: number;
          font?: any;
          color?: [number, number, number];
        }[] = [];

        if (designation)
          fields.push({
            text: designation,
            fontSize: 8,
            extraSpacing: 24,
            font: poppinsMedium,
            color: [0.8, 0.8, 0.8],
          });

        if (phone)
          fields.push({
            text: `+91-${phone}`,
            fontSize: 8,
            extraSpacing: 13,
            font: poppinsMedium,
            color: [0.8, 0.8, 0.8],
          });

        if (email)
          fields.push({
            text: email,
            fontSize: 8,
            extraSpacing: 11,
            font: poppinsMedium,
            color: [0.8, 0.8, 0.8],
          });

        fields.forEach((field) => {
          secondPage.drawText(field.text, {
            x,
            y,
            size: field.fontSize,
            font: field.font,
            color: rgb(...(field.color ?? [1, 1, 1])),
          });
          y -= field.extraSpacing ?? 11;
        });

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
  }, [firstName, lastName, designation, phone, email]);

const handleExport = async () => {
  if (!previewUrl) return;
  setIsLoading(true);

  try {
    // Step 1: Fetch the generated PDF blob from previewUrl
    const response = await fetch(previewUrl);
    const blob = await response.blob();

    // Step 2: Convert PDF blob to Base64 for S3
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const fileName = `updated-${Date.now()}.pdf`;

    // Replace these with your actual user data from auth/session
    const userId = "USER_ID_HERE";
    const username = "USERNAME_HERE";

    // Step 3: Upload to API
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64: base64,
        fileName,
        folder: "visiting-card-dark-theme",
        mimeType: "application/pdf",
        userId,
        username,
      }),
    });

    const data = await res.json();

    if (res.ok && data.url) {
      console.log("PDF uploaded to S3:", data.url);
      alert(`PDF successfully uploaded to S3:\n${data.url}`);

      // Optional: download locally
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      throw new Error(data.error || "S3 upload failed");
    }
  } catch (error) {
    console.error("Export failed:", error);
    alert("Failed to export PDF. Check console for details.");
  } finally {
    setIsLoading(false);
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

        {/* Left form - Sidebar */}
        <div className="w-2/5 bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col gap-8 border border-gray-700/50 h-full">
          <div className="pb-4 border-b border-gray-700">
            <h2 className="text-3xl font-extrabold text-white tracking-wide">
              Personal Details
            </h2>
            <p className="text-gray-400 mt-1 text-sm">
              Fill in your information to generate your updated PDF.
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
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
            <InputComponent
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              focusColor="#4A90E2"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
            <InputComponent
              label="Designation"
              type="text"
              value={designation}
              onChange={(e) => {
                const value = e.target.value
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
                setDesignation(value);
              }}
              placeholder="Enter designation"
              focusColor="#50E3C2"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2a2 2 0 002 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 002-2V7a3 3 0 013-3z" />
                </svg>
              }
            />

            {/* Non-editable +91 input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-300 font-medium tracking-wide">
                Phone Number
              </label>
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg py-2 pl-4 text-sm text-white placeholder-gray-500 focus-within:ring-1 focus-within:ring-[#BD10E0] outline-none transition-all duration-200 ease-in-out hover:border-gray-500">
                <span className="text-gray-500 select-none mr-2">+91-</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="bg-transparent flex-1 outline-none text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>

            <InputComponent
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              focusColor="#BD10E0"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              }
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
  {isLoading ? (
    <span className="flex items-center justify-center">
      <svg
        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      Generating...
    </span>
  ) : (
    "Export PDF"
  )}
</button>

        </div>
        {/* Preview - Main Canvas */}
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