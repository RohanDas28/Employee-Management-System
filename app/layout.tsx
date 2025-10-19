import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AuthProvider from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Employee Management System",
  description: "Full-stack employee management system with attendance, leave, and messaging",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
          <Toaster richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
