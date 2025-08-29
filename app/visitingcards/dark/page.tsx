"use client"

import React, { useEffect, useState } from "react"
import fontkit from "@pdf-lib/fontkit"

interface InputProps {
  label: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  focusColor: string
}

const InputComponent: React.FC<InputProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  focusColor,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-[#E0E0FF] font-medium tracking-wide">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ '--tw-ring-color': focusColor } as React.CSSProperties}
      className="bg-[#2C2C3E] border border-[#3A3A4C] rounded-md p-2 text-sm text-[#F0F0F0] placeholder-[#8888AA] focus:ring-1 focus:ring-[--tw-ring-color] outline-none transition-colors duration-200 ease-in-out"
    />
  </div>
)

export default function Editor() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [designation, setDesignation] = useState("")
  const [phone, setPhone] = useState("") // only number part stored
  const [email, setEmail] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // PDF generation useEffect
  useEffect(() => {
    const generatePdf = async () => {
      setIsLoading(true)
      try {
        const { PDFDocument, rgb } = await import("pdf-lib")
        const existingPdfBytes = await fetch("/pdf/template.pdf").then((res) => res.arrayBuffer())
        const pdfDoc = await PDFDocument.load(existingPdfBytes)

        pdfDoc.registerFontkit(fontkit)

        const pages = pdfDoc.getPages()
        const secondPage = pages[1] || pages[0]

        const poppinsSemiBoldBytes = await fetch("/fonts/Poppins-SemiBold.ttf").then((res) =>
          res.arrayBuffer()
        )
        const poppinsMediumBytes = await fetch("/fonts/Poppins-Medium.ttf").then((res) =>
          res.arrayBuffer()
        )

        const poppinsSemiBold = await pdfDoc.embedFont(poppinsSemiBoldBytes)
        const poppinsMedium = await pdfDoc.embedFont(poppinsMediumBytes)

        let y = secondPage.getHeight() - 30
        const x = 15

        const cap = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
        const fullName = `${cap(firstName)} ${cap(lastName)}`.trim()

        if (fullName) {
          secondPage.drawText(fullName, {
            x,
            y,
            size: 11,
            font: poppinsSemiBold,
            color: rgb(1, 1, 1),
          })
          y -= 12
        }

        const fields: {
          text: string
          fontSize: number
          extraSpacing?: number
          font?: any
          color?: [number, number, number]
        }[] = []

        if (designation)
          fields.push({
            text: designation,
            fontSize: 8,
            extraSpacing: 24,
            font: poppinsMedium,
            color: [0.8, 0.8, 0.8],
          })

        if (phone)
          fields.push({
            text: `+91-${phone}`, // always prepend +91-
            fontSize: 8,
            extraSpacing: 13,
            font: poppinsMedium,
            color: [0.8, 0.8, 0.8],
          })

        if (email)
          fields.push({
            text: email,
            fontSize: 8,
            extraSpacing: 11,
            font: poppinsMedium,
            color: [0.8, 0.8, 0.8],
          })

        fields.forEach((field) => {
          secondPage.drawText(field.text, {
            x,
            y,
            size: field.fontSize,
            font: field.font,
            color: rgb(...(field.color ?? [1, 1, 1])),
          })
          y -= field.extraSpacing ?? 11
        })

        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
      } catch (error) {
        console.error("Failed to generate PDF:", error)
      } finally {
        setIsLoading(false)
      }
    }

    generatePdf()
  }, [firstName, lastName, designation, phone, email])

  const handleExport = () => {
    if (previewUrl) {
      const link = document.createElement("a")
      link.href = previewUrl
      link.download = "updated.pdf"
      link.click()
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#161719] text-white font-sans flex justify-center items-center p-8 mt-[-32] mb-[-40] ml-12 mr-5">
      <div className="flex w-full max-w-[1300px] h-[90vh] gap-6">
        {/* Left form - Sidebar */}
        <div className="w-1/4 bg-[#161719] rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-[#303045] h-full outline outline-white outline-1">
          <h2 className="text-xl font-bold text-[#F0F0F0] tracking-wide border-b border-[#3A3A4C] pb-3">
            Personal Details
          </h2>
          <div className="flex flex-col gap-4 flex-grow overflow-y-auto pr-2">
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
              label="Designation"
              type="text"
              value={designation}
              onChange={(e) => {
                const value = e.target.value
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
                setDesignation(value)
              }}
              placeholder="Enter designation"
              focusColor="#50E3C2"
            />

            {/* Non-editable +91 input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#E0E0FF] font-medium tracking-wide">Phone Number</label>
              <div className="flex items-center bg-[#2C2C3E] border border-[#3A3A4C] rounded-md p-2 text-sm text-[#F0F0F0] placeholder-[#8888AA]">
                <span className="text-[#8888AA] select-none">+91-</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="bg-transparent flex-1 outline-none ml-1 text-sm text-[#F0F0F0] placeholder-[#8888AA]"
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
            />
          </div>
          <button
            onClick={handleExport}
            className="mt-auto w-full bg-gradient-to-r from-[#4A90E2] to-[#BD10E0] text-white text-sm font-medium py-3 rounded-md hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!previewUrl || isLoading}
          >
            {isLoading ? "Generating..." : "Export PDF"}
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
            <p className="text-[#8888AA] text-sm">Preview will appear here...</p>
          )}
        </div>
      </div>
    </div>
  )
}
