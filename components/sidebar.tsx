"use client"

import { LayoutGrid, FileText, MessageSquare, Sparkles, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState, useEffect } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(!isMobile)
  const initials = "A"

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  // Don't render the sidebar on mobile when closed
  if (!isOpen && isMobile) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-sidebar text-sidebar-foreground md:hidden"
      >
        <Menu size={24} />
      </button>
    )
  }

  return (
    <div className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out ${isMobile ? 'translate-x-0' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
            {initials}
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-sm text-sidebar-foreground">User</div>
            <div className="text-xs text-sidebar-accent-foreground">Guest</div>
          </div>
        </div>
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent/50 p-1 rounded"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <NavItem
          icon={<LayoutGrid size={20} />}
          label="My Presentations"
          href="/my-presentations"
          active={pathname === "/my-presentations"}
        />
        <NavItem
          icon={<FileText size={20} />}
          label="Templates"
          href="/templates"
          active={pathname === "/templates"}
        />
        <NavItem
          icon={<MessageSquare size={20} />}
          label="AI Chat"
          href="/ai-chat"
          active={pathname === "/ai-chat"}
        />
        <NavItem
          icon={<Sparkles size={20} />}
          label="AI Slide"
          href="/ai-slide"
          active={pathname === "/ai-slide"}
          
        />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="text-xs text-sidebar-accent-foreground font-semibold">Presentations</div>
        <div className="text-sm font-semibold text-sidebar-foreground">0 PPT's</div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, href, active = false, badge }: any) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{badge}</span>}
    </Link>
  )
}
