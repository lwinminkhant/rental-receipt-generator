import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Room Rental Receipt Generator",
  description: "Generate professional rental receipts from spreadsheet data",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>    
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
