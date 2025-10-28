"use client"

import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
