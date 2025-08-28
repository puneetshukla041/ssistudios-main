"use client";

import { useState, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function Editor() {
  const [name, setName] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [editedPdf, setEditedPdf] = useState<Uint8Array | null>(null);

  // Load and edit PDF whenever name changes
  useEffect(() => {
    const loadPdf = async () => {
      const existingPdfBytes = await fetch("/pdf/template.pdf").then((res) =>
        res.arrayBuffer()
      );

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const secondPage = pages[1]; // page index starts at 0
      const { height } = secondPage.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      if (name.trim() !== "") {
        secondPage.drawText(name, {
          x: 30,
          y: height - 50,
          size: 18,
          font,
          color: rgb(1, 1, 1), // white text
        });
      }

      const pdfBytes = await pdfDoc.save();
      setEditedPdf(pdfBytes);
      setPdfUrl(URL.createObjectURL(new Blob([pdfBytes], { type: "application/pdf" })));
    };

    loadPdf();
  }, [name]);

  const handleExport = () => {
    if (editedPdf) {
      const blob = new Blob([editedPdf], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "edited.pdf";
      link.click();
    }
  };

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <input
        type="text"
        placeholder="Enter name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="p-2 border rounded w-64"
      />

      {/* PDF Preview */}
      <div className="border rounded-lg shadow-md w-[400px] h-[500px] overflow-auto bg-gray-900">
        {pdfUrl && (
          <Document file={pdfUrl}>
            <Page pageNumber={2} width={380} />
          </Document>
        )}
      </div>

      <button
        onClick={handleExport}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow"
      >
        Export PDF
      </button>
    </div>
  );
}
