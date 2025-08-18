"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RentalData {
  roomNo: string
  name: string
  price: string
}

export default function RentalReceiptGenerator() {
  const [rentalData, setRentalData] = useState<RentalData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())
      const data: RentalData[] = []

      // Skip header row and parse CSV data
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(",").map((col) => col.trim().replace(/"/g, ""))
        if (columns.length >= 3) {
          data.push({
            roomNo: columns[0],
            name: columns[1],
            price: columns[2],
          })
        }
      }

      setRentalData(data)
      toast({
        title: "File uploaded successfully",
        description: `Loaded ${data.length} rental records`,
      })
    } catch (error) {
      toast({
        title: "Error uploading file",
        description: "Please check your file format and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generatePDF = async () => {
    if (rentalData.length === 0) {
      toast({
        title: "No data available",
        description: "Please upload a file first",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const jsPDF = (await import("jspdf")).default

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const margin = 10
      const receiptWidth = (pageWidth - margin * 3) / 2 // Two columns with margins
      const receiptHeight = 50
      const receiptsPerRow = 2
      const receiptsPerPage = 10 // 5 rows × 2 columns

      let currentPage = 1
      let currentRow = 0
      let currentCol = 0

      // Add Myanmar font support to jsPDF
      pdf.setFont("NotoSansMyanmar-Regular")

      rentalData.forEach((rental, index) => {
        // Calculate position
        const x = margin + currentCol * (receiptWidth + margin)
        const y = margin + currentRow * (receiptHeight + margin)

        // Check if we need a new page
        if (y + receiptHeight > pageHeight - margin) {
          pdf.addPage()
          currentPage++
          currentRow = 0
          currentCol = 0
        }

        // Recalculate position for new page
        const finalX = margin + currentCol * (receiptWidth + margin)
        const finalY = margin + currentRow * (receiptHeight + margin)

        // Draw receipt border
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.5)
        pdf.rect(finalX, finalY, receiptWidth, receiptHeight)

        // Draw header
        pdf.setFontSize(8)
        pdf.text("0 လ၊ ၂၀၂၅", finalX + receiptWidth / 2, finalY + 8, { align: "center" })
        pdf.setFontSize(10)
        pdf.text("အခန်းခ လစဉ်ပြေစာ", finalX + receiptWidth / 2, finalY + 15, { align: "center" })

        // Draw separator line
        pdf.line(finalX + 5, finalY + 18, finalX + receiptWidth - 5, finalY + 18)

        // Draw content
        pdf.setFontSize(8)
        const contentY = finalY + 25
        const lineHeight = 5

        // Tenant name
        pdf.text("ငှားရမ်းသူ:", finalX + 5, contentY)
        pdf.text(rental.name, finalX + 25, contentY)

        // Room number
        pdf.text("အခန်းနံပါတ်:", finalX + 5, contentY + lineHeight)
        pdf.text(rental.roomNo, finalX + 25, contentY + lineHeight)

        // Price
        pdf.text("အခန်းခ:", finalX + 5, contentY + lineHeight * 2)
        pdf.text(rental.price, finalX + 25, contentY + lineHeight * 2)

        // Move to next position
        currentCol++
        if (currentCol >= receiptsPerRow) {
          currentCol = 0
          currentRow++
        }
      })

      pdf.save("rental-receipts.pdf")

      toast({
        title: "PDF generated successfully",
        description: `Generated ${rentalData.length} receipts`,
      })
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        title: "Error generating PDF",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSampleData = () => {
    const sampleData: RentalData[] = [
      { roomNo: "A1", name: "မင်းခန့်", price: "50000" },
      { roomNo: "A2", name: "မင်းခန့် စုမ", price: "50000" },
      { roomNo: "A4", name: "ညိုစောင်း", price: "50000" },
      { roomNo: "A5", name: "စက်ဆောင်း", price: "50000" },
      { roomNo: "A6", name: "ကမ်းမောင်း", price: "50000" },
      { roomNo: "B1", name: "ဝိုင်းဝိုင်း", price: "50000" },
      { roomNo: "B2", name: "လူးသာင်း", price: "50000" },
      { roomNo: "B3", name: "ဇင်လှင်း", price: "50000" },
    ]
    setRentalData(sampleData)
    toast({
      title: "Sample data loaded",
      description: `Added ${sampleData.length} sample records`,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Room Rental Receipt Generator</h1>
          <p className="text-gray-600">Generate professional rental receipts from your spreadsheet data</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Data
              </CardTitle>
              <CardDescription>Upload a CSV file with Room No., Name, and Price columns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">CSV File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
              </div>
              <div className="text-sm text-gray-500">Expected format: Room No., Name, Price</div>
              <Button variant="outline" onClick={addSampleData} className="w-full bg-transparent">
                Load Sample Data
              </Button>
            </CardContent>
          </Card>

          {/* Generate Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Receipts
              </CardTitle>
              <CardDescription>Create PDF receipts in 2-column format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                {rentalData.length > 0 ? `${rentalData.length} records loaded` : "No data loaded yet"}
              </div>
              <Button onClick={generatePDF} disabled={isLoading || rentalData.length === 0} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? "Generating..." : "Generate PDF"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Data Preview */}
        {rentalData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>Preview of loaded rental data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {rentalData.slice(0, 12).map((rental, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-white">
                    <div className="text-sm font-medium">Room: {rental.roomNo}</div>
                    <div className="text-sm text-gray-600">Name: {rental.name}</div>
                    <div className="text-sm text-gray-600">Price: {rental.price}</div>
                  </div>
                ))}
              </div>
              {rentalData.length > 12 && (
                <div className="text-sm text-gray-500 mt-2">And {rentalData.length - 12} more records...</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

