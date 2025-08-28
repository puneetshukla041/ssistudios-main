"use client";

import React, { useState, useEffect } from 'react';

// The pdf-lib library is dynamically loaded by the component.
// This is necessary because it's not a standard npm module in this environment.
declare global {
  interface Window {
    PDFLib: any;
  }
}

// Define the state for the form fields and font customizations.
type EditorState = {
  name: string;
  designation: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  fontName: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
};

// Define the fonts we will use, mapping a simple name to PDF-Lib's built-in fonts.
const fontMap = {
  'normal': {
    name: 'Helvetica',
    getFont: (doc: any) => doc.embedFont('Helvetica'),
  },
  'bold': {
    name: 'Helvetica-Bold',
    getFont: (doc: any) => doc.embedFont('Helvetica-Bold'),
  },
  'italic': {
    name: 'Helvetica-Oblique',
    getFont: (doc: any) => doc.embedFont('Helvetica-Oblique'),
  },
  'bold-italic': {
    name: 'Helvetica-BoldOblique',
    getFont: (doc: any) => doc.embedFont('Helvetica-BoldOblique'),
  },
};

// Define the coordinates for the text fields on the PDF page.
// The Y-axis is measured from the bottom of the page.
const textPositions = {
  name: { x: 50, y: 800, defaultSize: 20 },
  designation: { x: 50, y: 775, defaultSize: 14 },
  phone: { x: 50, y: 750, defaultSize: 14 },
  email: { x: 50, y: 725, defaultSize: 14 },
};

const App: React.FC = () => {
  // Use a single state object to manage all form data and font options.
  const [editorState, setEditorState] = useState<EditorState>({
    name: 'Arvind Singh',
    designation: 'Sr. Zonal Sales Manager',
    phoneCountryCode: '+91',
    phoneNumber: '9820504079',
    email: 'arvind.singh@ssinnovations.org',
    fontName: 'Helvetica',
    fontSize: textPositions.name.defaultSize,
    fontWeight: 'normal',
    fontStyle: 'normal',
  });

  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [nameError, setNameError] = useState<string>('');
  const [exportError, setExportError] = useState<string>('');
  const [pdfLibLoaded, setPdfLibLoaded] = useState<boolean>(false);

  // Dynamically load the pdf-lib library.
  useEffect(() => {
    const loadPdfLib = async () => {
      if (window.PDFLib) {
        setPdfLibLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      script.onload = () => {
        setPdfLibLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load pdf-lib script.');
        setExportError('Failed to load PDF library. Please try again.');
      };
      document.body.appendChild(script);
    };

    loadPdfLib();
  }, []);

  // Handle form field changes, updating the state accordingly.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditorState(prevState => ({ ...prevState, [name]: value }));
  };

  // Validate the name field (first letter of first and last name must match).
  const validateName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) {
      setNameError('Please enter both first and last names.');
      return false;
    }
    const firstNameInitial = parts[0][0];
    const lastNameInitial = parts[parts.length - 1][0];
    if (firstNameInitial.toLowerCase() !== lastNameInitial.toLowerCase()) {
      setNameError('The first letter of the first and last name must match.');
      return false;
    }
    setNameError('');
    return true;
  };

  // Function to generate the PDF and update the live preview.
  const generatePdf = async () => {
    if (!pdfLibLoaded) {
      setLoading(true);
      return;
    }

    try {
      const { PDFDocument, rgb } = window.PDFLib;
      setLoading(true);
      
      const response = await fetch('/pdf/template.pdf');
      if (!response.ok) {
        throw new Error('Template PDF not found or failed to load.');
      }
      const existingPdfBytes = await response.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const pages = pdfDoc.getPages();
      if (pages.length < 2) {
        throw new Error('The PDF template does not have a second page.');
      }
      const page = pages[1];

      // Determine the font to use based on the selected weight and style.
      let fontKey = editorState.fontWeight === 'bold' ? 'bold' : 'normal';
      if (editorState.fontStyle === 'italic') {
        fontKey = editorState.fontWeight === 'bold' ? 'bold-italic' : 'italic';
      }
      const selectedFont = await fontMap[fontKey as keyof typeof fontMap].getFont(pdfDoc);
      const { name, designation, phoneCountryCode, phoneNumber, email, fontSize } = editorState;
      const fullPhoneNumber = `${phoneCountryCode}${phoneNumber.startsWith('+') ? '' : ' '}${phoneNumber}`;

      // Draw the text fields onto the PDF page in white.
      page.drawText(name, {
        x: textPositions.name.x,
        y: textPositions.name.y,
        size: fontSize,
        font: await fontMap[editorState.fontWeight === 'bold' ? 'bold' : 'normal'].getFont(pdfDoc), // Use bold for name
        color: rgb(1, 1, 1), // White color
      });

      page.drawText(designation, {
        x: textPositions.designation.x,
        y: textPositions.designation.y,
        size: textPositions.designation.defaultSize,
        font: selectedFont,
        color: rgb(1, 1, 1),
      });

      page.drawText(fullPhoneNumber, {
        x: textPositions.phone.x,
        y: textPositions.phone.y,
        size: textPositions.phone.defaultSize,
        font: selectedFont,
        color: rgb(1, 1, 1),
      });

      page.drawText(email, {
        x: textPositions.email.x,
        y: textPositions.email.y,
        size: textPositions.email.defaultSize,
        font: selectedFont,
        color: rgb(1, 1, 1),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setExportError('');

    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setPdfUrl('');
      setExportError(err.message || 'An unexpected error occurred while generating the PDF.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pdfLibLoaded) {
      validateName(editorState.name);
      generatePdf();
    }
  }, [editorState, pdfLibLoaded]);

  const handleExport = async () => {
    if (!pdfLibLoaded) {
      setExportError('PDF library not loaded yet. Please wait a moment and try again.');
      return;
    }
    
    try {
      const { PDFDocument, rgb } = window.PDFLib;
      setLoading(true);
      setExportError('');

      const response = await fetch('/pdf/template.pdf');
      if (!response.ok) {
        throw new Error('Template PDF not found or failed to load.');
      }
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      if (pages.length < 2) {
        throw new Error('The PDF template does not have a second page.');
      }
      const page = pages[1];
      
      const { name, designation, phoneCountryCode, phoneNumber, email, fontSize } = editorState;
      const fullPhoneNumber = `${phoneCountryCode}${phoneNumber.startsWith('+') ? '' : ' '}${phoneNumber}`;

      let fontKey = editorState.fontWeight === 'bold' ? 'bold' : 'normal';
      if (editorState.fontStyle === 'italic') {
        fontKey = editorState.fontWeight === 'bold' ? 'bold-italic' : 'italic';
      }
      const selectedFont = await fontMap[fontKey as keyof typeof fontMap].getFont(pdfDoc);

      page.drawText(name, {
        x: textPositions.name.x,
        y: textPositions.name.y,
        size: fontSize,
        font: await fontMap[editorState.fontWeight === 'bold' ? 'bold' : 'normal'].getFont(pdfDoc),
        color: rgb(1, 1, 1),
      });
      page.drawText(designation, {
        x: textPositions.designation.x,
        y: textPositions.designation.y,
        size: textPositions.designation.defaultSize,
        font: selectedFont,
        color: rgb(1, 1, 1),
      });
      page.drawText(fullPhoneNumber, {
        x: textPositions.phone.x,
        y: textPositions.phone.y,
        size: textPositions.phone.defaultSize,
        font: selectedFont,
        color: rgb(1, 1, 1),
      });
      page.drawText(email, {
        x: textPositions.email.x,
        y: textPositions.email.y,
        size: textPositions.email.defaultSize,
        font: selectedFont,
        color: rgb(1, 1, 1),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `edited-document-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (err: any) {
      console.error('Error exporting PDF:', err);
      setExportError(err.message || 'An unexpected error occurred during export.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 p-6 font-inter text-gray-800">
      {/* Input Form Section */}
      <div className="lg:w-1/2 w-full p-4 bg-white rounded-xl shadow-lg mb-6 lg:mb-0 lg:mr-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-indigo-700">PDF Editor</h1>
        <p className="text-sm text-gray-500 mb-6">Edit the content and see a live preview on the right. All changes are reflected instantly.</p>

        {/* Name Input */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={editorState.name}
            onChange={handleInputChange}
            className={`w-full p-3 border ${nameError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            placeholder="e.g., John Smith"
          />
          {nameError && <p className="mt-1 text-sm text-red-500">{nameError}</p>}
        </div>

        {/* Designation Input */}
        <div className="mb-4">
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
          <input
            type="text"
            id="designation"
            name="designation"
            value={editorState.designation}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Lead Developer"
          />
        </div>

        {/* Phone Number Group */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="phoneCountryCode"
              name="phoneCountryCode"
              value={editorState.phoneCountryCode}
              onChange={handleInputChange}
              className="w-1/4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+CC"
            />
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={editorState.phoneNumber}
              onChange={handleInputChange}
              className="w-3/4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., 9876543210"
            />
          </div>
        </div>

        {/* Email ID Input */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
          <input
            type="email"
            id="email"
            name="email"
            value={editorState.email}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., email@company.com"
          />
        </div>

        {/* Font Customization Section */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Font Customization</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Font Size */}
            <div>
              <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <select
                id="fontSize"
                name="fontSize"
                value={editorState.fontSize}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i} value={10 + i}>{10 + i} pt</option>
                ))}
              </select>
            </div>
            {/* Font Weight */}
            <div>
              <label htmlFor="fontWeight" className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
              <select
                id="fontWeight"
                name="fontWeight"
                value={editorState.fontWeight}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            {/* Font Style */}
            <div>
              <label htmlFor="fontStyle" className="block text-sm font-medium text-gray-700 mb-1">Style</label>
              <select
                id="fontStyle"
                name="fontStyle"
                value={editorState.fontStyle}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="mt-6 w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
          disabled={loading || !!nameError}
        >
          {loading ? 'Processing...' : 'Export PDF'}
        </button>
        {exportError && <p className="mt-4 text-sm text-red-500 text-center">{exportError}</p>}
      </div>

      {/* Live Preview Section */}
      <div className="lg:w-1/2 w-full p-4 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-indigo-700">Live Preview</h2>
        <div className="relative w-full aspect-[8.5/11] bg-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center w-full h-full text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-indigo-500"></div>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-full"
              frameBorder="0"
            ></iframe>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
