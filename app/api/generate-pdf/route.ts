import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"
import fs from "fs/promises"
import path from "path"

// Function to get the font
async function getFontBase64() {
  const fontPath = path.resolve("./public/fonts/NotoSansMyanmar.js")
  try {
    const fontFile = await fs.readFile(fontPath, "utf-8")
    const match = fontFile.match(/var font = '([^']+)'/)
    if (match && match[1]) {
      return match[1]
    }
    throw new Error("Font data not found in file")
  } catch (error) {
    console.error("Error reading font file:", error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rentalData } = await req.json()
    if (!Array.isArray(rentalData)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const fontBase64 = await getFontBase64()

    const html = `<!DOCTYPE html>
<html lang="my">
<head>
  <meta charset="UTF-8">
  <title>Myanmar Rental Receipts</title>
  <style>
    @font-face {
      font-family: 'Noto Sans Myanmar';
      src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
      font-weight: normal;
      font-style: normal;
    }
    body {
      font-family: 'Noto Sans Myanmar', sans-serif;
      margin: 10;
      padding: 0;
      background:rgba(222, 255, 100, 0.81);
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 px;
      background: #fff;
      border-radius: 0px;
      box-shadow: 0 4px 24px #0002;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      justify-content: center;
    }
    .receipt {
      border: 1px solid #d1d5db;
      padding: 10px 10px 10px 10px;
      width: 95%;
      margin: 0px 0px 0px 0px;
      background: #f9fafb;
      border-radius: 5px;
      box-shadow: 0 2px 8px #0001;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .header {
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 8px;
      color: #3730a3;
    }
    .row {
      margin: 4px 0;
      font-size: 15px;
      display: flex;
      align-items: center;
    }
    .label {
      display: inline-block;
      width: 110px;
      color: #4b5563;
      font-weight: 500;
    }
    .value {
      color: #1e293b;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="container">
    ${rentalData
      .map(
        (rental: any) => `
      <div class="receipt">
        <div class="header"><span class="value">${rental.month} ${rental.year}</span></div>
        <div class="header"><span class="value">အခန်းခ လစဉ်ပြေစာ</span></div>
        <div class="row"><span class="label">ငှားရမ်းသူ:</span> <span class="value">${rental.name}</span></div>
        <div class="row"><span class="label">အခန်းနံပါတ်:</span> <span class="value">${rental.roomNo}</span></div>
        <div class="row"><span class="label">အခန်းခ:</span> <span class="value">${rental.price}</span></div>
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>`

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    })
    await browser.close()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=rental-receipts.pdf",
      },
    })
  } catch (err) {
    if (err instanceof Error) {
      console.error("PDF generation error:", err.stack || err.message)
    } else {
      console.error("PDF generation error:", err)
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
