"use client";

import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function BusinessCardEditor() {
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const previewRef1 = useRef<HTMLDivElement>(null);
  const previewRef2 = useRef<HTMLDivElement>(null);

  // Capitalize first letters
  const formatFullName = (name: string) =>
    name
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
      .join(" ");

  // High-resolution export
const handleExportPDF = async () => {
  if (!previewRef1.current || !previewRef2.current) return;

  const scale = 4; // Increase this for higher resolution

  // Calculate PDF page size based on scaled canvas
  const pdfWidth = 350;
  const pdfHeight = 200;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [pdfWidth, pdfHeight],
  });

  // Export first card
  const canvas1 = await html2canvas(previewRef1.current, {
    backgroundColor: "#1f1f1f",
    useCORS: true,
    scale, // high-res scale
  });
  const imgData1 = canvas1.toDataURL("image/png");
  pdf.addImage(imgData1, "PNG", 0, 0, pdfWidth, pdfHeight);

  // Export second card
  const canvas2 = await html2canvas(previewRef2.current, {
    backgroundColor: "#1f1f1f",
    useCORS: true,
    scale, // high-res scale
  });
  const imgData2 = canvas2.toDataURL("image/png");
  pdf.addPage();
  pdf.addImage(imgData2, "PNG", 0, 0, pdfWidth, pdfHeight);

  pdf.save("BusinessCards.pdf");
};



  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        padding: 16,
        gap: 16,
        backgroundColor: "#111111",
        color: "#fff",
      }}
    >
      {/* Left Sidebar */}
      <div style={{ width: "25%", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #444",
              backgroundColor: "#222",
              color: "#fff",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Designation</label>
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Software Engineer"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #444",
              backgroundColor: "#222",
              color: "#fff",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 12345 67890"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #444",
              backgroundColor: "#222",
              color: "#fff",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #444",
              backgroundColor: "#222",
              color: "#fff",
            }}
          />
        </div>
      </div>

      {/* Preview Cards */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        {/* First Card */}
        <div
          ref={previewRef1}
          style={{
            position: "relative",
            width: 350,
            height: 200,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #333",
            backgroundColor: "#1f1f1f",
          }}
        >
          <img
            src="/visitingcards/darkpreview.jpg"
            alt="Card 1"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Second Card with live text */}
        <div
          ref={previewRef2}
          style={{
            position: "relative",
            width: 350,
            height: 200,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #333",
            backgroundColor: "#1f1f1f",
          }}
        >
          <img
            src="/visitingcards/darkpreview2.jpg"
            alt="Card 2"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: 18, color: "#ffffff" }}>
              {formatFullName(fullName)}
            </span>
            <span style={{ fontSize: 12, color: "#cccccc" }}>{designation}</span>
            <span style={{ fontSize: 12, color: "#cccccc" }}>{phone}</span>
            <span style={{ fontSize: 12, color: "#cccccc" }}>{email}</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ width: "25%", display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          onClick={handleExportPDF}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            backgroundColor: "#1e40af",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Export Both as PDF
        </button>
      </div>
    </div>
  );
}
