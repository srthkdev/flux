'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-sidebar-background">
        <div className="h-14 border-b border-border flex items-center px-4">
          <span className="font-semibold">FormPilot</span>
        </div>
        
        <div className="p-2">
          <nav className="space-y-1">
            <div className="sidebar-section">Workspaces</div>
            <Link 
              href="/"
              className={cn(
                "sidebar-item",
                pathname === "/" && "active"
              )}
            >
              <svg className="sidebar-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              My workspace
            </Link>
          </nav>

          <nav className="mt-4 space-y-1">
            <div className="sidebar-section">Product</div>
            <Link 
              href="/templates"
              className={cn(
                "sidebar-item",
                pathname === "/templates" && "active"
              )}
            >
              <svg className="sidebar-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
              </svg>
              Templates
            </Link>
            <Link 
              href="/whats-new"
              className={cn(
                "sidebar-item",
                pathname === "/whats-new" && "active"
              )}
            >
              <svg className="sidebar-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              What's new
            </Link>
            <Link 
              href="/roadmap"
              className={cn(
                "sidebar-item",
                pathname === "/roadmap" && "active"
              )}
            >
              <svg className="sidebar-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
              Roadmap
            </Link>
          </nav>

          <nav className="mt-4 space-y-1">
            <div className="sidebar-section">Help</div>
            <Link 
              href="/get-started"
              className={cn(
                "sidebar-item",
                pathname === "/get-started" && "active"
              )}
            >
              <svg className="sidebar-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r="1" />
              </svg>
              Get started
            </Link>
            <Link 
              href="/guides"
              className={cn(
                "sidebar-item",
                pathname === "/guides" && "active"
              )}
            >
              <svg className="sidebar-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              How-to guides
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 