"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"

export default function ShootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-64" : "ml-16"
        } md:${sidebarOpen ? "ml-64" : "ml-16"} ml-0`}
      >
        {children}
      </main>
    </div>
  )
}