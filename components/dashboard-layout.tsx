"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { Sidebar } from "./sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">{children}</main>
      </div>
    </SessionProvider>
  )
}
