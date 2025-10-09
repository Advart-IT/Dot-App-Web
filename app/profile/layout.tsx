"use client"

import { ReactNode, useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Log when the layout component is mounted or re-rendered
  useEffect(() => {
    console.log("Profile Layout mounted or re-rendered")
  }, [])

  // Log when the sidebar state changes
  useEffect(() => {
    console.log("Profile Sidebar state changed", { isSidebarOpen })
  }, [isSidebarOpen])

  const handleToggleSidebar = () => {
    console.log("Profile Sidebar toggle clicked")
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar isOpen={isSidebarOpen} onToggle={handleToggleSidebar} />

      <main
        className={`
          flex-1 overflow-y-auto transition-all duration-300 ease-in-out
          bg-[#FAFAFA] ${isSidebarOpen ? 'ml-64' : 'ml-16'}
        `}
      >
        {children}
      </main>
    </div>
  )
}