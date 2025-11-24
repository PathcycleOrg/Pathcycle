"use client"

import { useState } from "react"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import Dashboard from "@/components/pages/dashboard"
import NetworkAnalysis from "@/components/pages/network-analysis"
import Simulator from "@/components/pages/simulator"
import Reports from "@/components/pages/reports"
import OptimalRoute from "@/components/pages/optimal-route"
import Settings from "@/components/pages/settings"

export default function Home() {
  const [currentPage, setCurrentPage] = useState("dashboard")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "network-analysis":
        return <NetworkAnalysis />
      case "simulator":
        return <Simulator />
      case "reports":
        return <Reports />
      case "optimal-route":
        return <OptimalRoute />
      case "settings":
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} />
        {renderPage()}
      </div>
    </div>
  )
}
