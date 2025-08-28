"use client";

import { useState, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts, } from "pdf-lib";

export default function Editor() {
  const [name, setName] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  const updatePdf = async (text: string) => {
    const existingPdfBytes = await fetch("/pdf/template.pdf").then((r) =>
      r.arrayBuffer()
    );
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const secondPage = pages[1];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    secondPage.drawText(text, {
      x: 50,
      y: secondPage.getHeight() - 50,
      size: 24,
      font,
      color: rgb(1, 1, 1),
    });
const pdfBytes: Uint8Array = await pdfDoc.save();
const blob = new Blob([pdfBytes], { type: "application/pdf" });

    setPdfUrl(URL.createObjectURL(blob));
  };

  useEffect(() => {
    updatePdf(name);
  }, [name]);

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "modified.pdf";
    a.click();
  };

  return (
    <div className="p-4 space-y-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter name"
        className="border px-2 py-1"
      />
      <button onClick={downloadPdf} className="border px-3 py-1">
        Export PDF
      </button>
      {pdfUrl && (
        <iframe src={pdfUrl} className="w-full h-[600px]" title="PDF Preview" />
      )}
    </div>
  );
}
