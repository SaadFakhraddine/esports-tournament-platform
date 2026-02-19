"use client"

import { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"

interface DashboardLayoutProps {
  children: ReactNode
  userRole?: string
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
