import { NextRequest, NextResponse } from "next/server"
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
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

    // Split rentalData: left column gets up to 25, right column gets the rest
    const leftCol = rentalData.slice(0, 25)
    const rightCol = rentalData.slice(25)
    // Pad rightCol to match leftCol length
    while (rightCol.length < leftCol.length) {
      rightCol.push({ roomNo: '', name: '', price: '' })
    }

    // Helper to build table rows
    function buildTableRows(data: any[]) {
      return data.map((rental, idx) => `
        <tr style="height:38px;">
          <td style="border:1px solid #888;padding:0 8px;text-align:center;height:24px;max-width:200px;line-height:24px;vertical-align:middle;">${rental.roomNo}</td>
          <td style="border:1px solid #888;padding:0 8px;height:24px;line-height:24px;vertical-align:middle;">${rental.name}</td>
          <td style="border:1px solid #888;padding:0 8px;text-align:right;height:24px;line-height:24px;vertical-align:middle;">${rental.price}</td>
          <td style="border:1px solid #888;padding:0 8px;text-align:right;height:24px;line-height:24px;vertical-align:middle;"></td>
        </tr>
      `).join('')
    }

    // Build the summary table HTML
    const summaryTable = `
      <div style="display:flex;gap:0px;justify-content:center;margin:0px;margin-top:120px;position:relative;">
        <div style="position:absolute;top:-40px;left:0;right:0;text-align:left;font-size:20px;font-weight:bold;">
          ${rentalData[0] ? (rentalData[0].burmeseMonthNumber + ' လပိုင်း' + rentalData[0].burmeseYear) : ''}
        </div>
        <table style="border-collapse:collapse;min-width:467px;max-width:100%;font-size:15px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="border:1px solid #888;padding:4px 8px;">No.</th>
              <th style="border:1px solid #888;padding:4px 8px;">အမည်</th>
              <th style="border:1px solid #888;padding:4px 8px;">အခန်းခ</th>
              <th style="border:1px solid #888;padding:4px 8px;">ပေးပြီး</th>
            </tr>
          </thead>
          <tbody>
            ${buildTableRows(leftCol)}
          </tbody>
        </table>
        <table style="border-collapse:collapse;min-width:320px;max-width:380px;font-size:15px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="border:1px solid #888;padding:4px 8px;">No.</th>
              <th style="border:1px solid #888;padding:4px 8px;">အမည်</th>
              <th style="border:1px solid #888;padding:4px 8px;">အခန်းခ</th>
              <th style="border:1px solid #888;padding:4px 8px;">ပေးပြီး</th>
            </tr>
          </thead>
          <tbody>
            ${buildTableRows(rightCol)}
          </tbody>
        </table>
      </div>
      <div style="page-break-after:always;"></div>
    `

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
      max-width: 794px;
      margin: 0px 0px 0px 0px;
      border-radius: 0px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 1fr;
      gap: 24px;
      justify-content: center;
      page-break-inside: avoid;
    }
    .receipt {
      border: 1px solid #d1d5db;
      padding: 10px 10px 10px 10px;
      width: 350px;
      height: 260px;
      margin: 0px 0px 0px 13px;
      background: #f9fafb;
      border-radius: 5px;
      box-shadow: 0 2px 8px #0001;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-sizing: border-box;
      page-break-inside: avoid;
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
    .page-break {
      break-after: page;
      page-break-after: always;
      height: 0;
      width: 0;
      margin: 0;
      padding: 0;
      border: none;
    }
  </style>
</head>
<body>
  ${summaryTable}
  <div>
    ${(() => {
      let html = '';
      for (let i = 0; i < rentalData.length; i += 8) {
        html += `<div class="container">`;
        for (let j = i; j < i + 8 && j < rentalData.length; j++) {
          const rental = rentalData[j];
          html += `
            <div class="receipt">
              <div class="header"><span class="value">${rental.burmeseMonthNumber} လပိုင်း ${rental.burmeseYear}</span></div>
              <div class="header"><span class="value">အခန်းခ လစဉ်ပြေစာ</span></div>
              <div class="row"><span class="label">ငှားရမ်းသူ</span> <span class="value">${rental.name}</span></div>
              <div class="row"><span class="label">အခန်းနံပါတ်</span> <span class="value">${rental.roomNo}</span></div>
              <div class="row"><span class="label">အခန်းခ</span> <span class="value">${toBurmeseNumber(rental.price)}</span></div>
            </div>
          `;
        }
        html += `</div>`;
        if (i + 8 < rentalData.length) {
          html += `<div class="page-break"></div>`;
        }
      }
      return html;
    })()}
  </div>
</body>
</html>`

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    })
    await browser.close()
    function toBurmeseNumber(str: string | number): string {
      const burmeseDigits = ['၀','၁','၂','၃','၄','၅','၆','၇','၈','၉'];
      return String(str).replace(/\d/g, d => burmeseDigits[parseInt(d, 10)]);
    }
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
