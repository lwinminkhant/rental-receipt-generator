"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import dayjs from "dayjs"

interface RentalData {
  roomNo: string
  name: string
  price: string
}

export default function RentalReceiptGenerator() {
  const [rentalData, setRentalData] = useState<RentalData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"))
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

  // Helper to convert to Burmese numerals
  function toBurmeseNumber(str: string) {
    const burmeseDigits = ['၀','၁','၂','၃','၄','၅','၆','၇','၈','၉']
    return str.replace(/\d/g, d => burmeseDigits[parseInt(d, 10)])
  }

  // Helper to get Myanmar month/year
  function getMyanmarMonthYear(ym: string) {
    const [year, month] = ym.split("-")
    const myanmarMonths = [
      "ဇန်နဝါရီ", "ဖေဖော်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်", "ဇူလိုင်", "ဩဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ"
    ]
    return {
      month: myanmarMonths[parseInt(month, 10) - 1] || month,
      year: (parseInt(year, 10) + 0).toString(),
      monthNumber: month
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
      const { month, year, monthNumber } = getMyanmarMonthYear(selectedMonth)
      const burmeseYear = toBurmeseNumber(year)
      const burmeseMonthNumber = toBurmeseNumber(String(parseInt(monthNumber, 10)))
      const enrichedData = rentalData.map(r => ({ ...r, month, year, monthNumber, burmeseYear, burmeseMonthNumber }))
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalData: enrichedData }),
      })
      if (!response.ok) throw new Error("PDF generation failed")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "rental-receipts.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast({
        title: "PDF generated successfully",
        description: `Generated ${rentalData.length} receipts`,
      })
    } catch (error) {
      toast({
        title: "Error generating PDF",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const viewPDF = async () => {
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
      const { month, year, monthNumber } = getMyanmarMonthYear(selectedMonth)
      const burmeseYear = toBurmeseNumber(year)
      const burmeseMonthNumber = toBurmeseNumber(String(parseInt(monthNumber, 10)))
      const enrichedData = rentalData.map(r => ({ ...r, month, year, monthNumber, burmeseYear, burmeseMonthNumber }))
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalData: enrichedData }),
      })
      if (!response.ok) throw new Error("PDF generation failed")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => window.URL.revokeObjectURL(url), 10000)
      toast({
        title: "PDF preview opened",
        description: `Previewed ${rentalData.length} receipts`,
      })
    } catch (error) {
      toast({
        title: "Error viewing PDF",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSampleData = () => {
    console.log('addSampleData called');
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
    console.log('rentalData set:', sampleData)
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
              <div className="space-y-2">
                <Label htmlFor="month-picker">Month</Label>
                <input
                  id="month-picker"
                  type="month"
                  className="border rounded px-2 py-1"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
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
              <Button onClick={viewPDF} disabled={isLoading || rentalData.length === 0} className="w-full mt-2" variant="secondary">
                View PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Data Preview or Empty State */}
        {rentalData.length > 0 ? (
          <>
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
            {/* Receipt Browser Preview */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-center text-indigo-700 mb-4">Receipt Browser Preview</h2>
              <div
                className="container mx-auto bg-white rounded-2xl shadow-lg p-6"
                style={{
                  maxWidth: 2000,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 24,
                  justifyContent: 'center',
                }}
              >
                {rentalData.map((rental, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '24px 20px',
                      width: '100%',
                      marginBottom: 20,
                      background: '#f9fafb',
                      borderRadius: 12,
                      boxShadow: '0 2px 8px #0001',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#3730a3' }}>
                      <span></span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#3730a3' }}>
                      <span>အခန်းခ လစဉ်ပြေစာ</span>
                    </div>
                    <div style={{ margin: '6px 0', fontSize: 15, display: 'flex', alignItems: 'center' }}>
                      <span style={{ display: 'inline-block', width: 110, color: '#4b5563', fontWeight: 500 }}>ငှားရမ်းသူ:</span>
                      <span style={{ color: '#1e293b', fontWeight: 400 }}>{rental.name}</span>
                    </div>
                    <div style={{ margin: '6px 0', fontSize: 15, display: 'flex', alignItems: 'center' }}>
                      <span style={{ display: 'inline-block', width: 110, color: '#4b5563', fontWeight: 500 }}>အခန်းနံပါတ်:</span>
                      <span style={{ color: '#1e293b', fontWeight: 400 }}>{rental.roomNo}</span>
                    </div>
                    <div style={{ margin: '6px 0', fontSize: 15, display: 'flex', alignItems: 'center' }}>
                      <span style={{ display: 'inline-block', width: 110, color: '#4b5563', fontWeight: 500 }}>အခန်းခ:</span>
                      <span style={{ color: '#1e293b', fontWeight: 400 }}>{rental.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-red-500 font-semibold mt-8">No rental data loaded. Please upload a CSV or load sample data.</div>
        )}
      </div>
    </div>
  )
}

