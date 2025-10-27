"use client"

import { ReactNode, useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { useInfluencerReview } from "@/hooks/influencerReviewContext"

export default function InfluencerLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { hasInReviewItems } = useInfluencerReview()

  useEffect(() => {
    console.log("Influencer Layout mounted or re-rendered")
  }, [])

  useEffect(() => {
    console.log("Sidebar state changed", { isSidebarOpen })
  }, [isSidebarOpen])

  const handleToggleSidebar = () => {
    console.log("Sidebar toggle clicked")
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen overflow-hidden">
  {/* pass explicit prop from context to ensure layout-level sidebar receives the value */}
  <AppSidebar isOpen={isSidebarOpen} onToggle={handleToggleSidebar} hasInReviewProp={hasInReviewItems} />

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