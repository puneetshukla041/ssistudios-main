"use client";

import React, { useRef, useState } from "react";
import axios from "axios";

export default function ImageSelector() {
  const [image, setImage] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemoveBG = async () => {
    if (!fileInput.current || !fileInput.current.files) return;

    const formData = new FormData();
    formData.append("image", fileInput.current.files[0]);

    try {
      const response = await axios.post("/api/remove-bg", formData, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      setOutput(url);
    } catch (err: any) {
      console.error("API call error:", err);
      alert("Failed to remove background. Check console.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={fileInput}
        type="file"
        accept="image/png, image/jpeg"
        onChange={handleUpload}
      />
      {image && <img src={image} alt="preview" className="max-w-xs" />}
      <button
        onClick={handleRemoveBG}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Remove BG
      </button>
      {output && (
        <div className="flex flex-col items-center mt-4">
          <img src={output} alt="result" className="max-w-xs" />
          <a
            href={output}
            download="output.png"
            className="mt-2 text-blue-700 underline"
          >
            Download PNG
          </a>
        </div>
      )}
    </div>
  );
}
