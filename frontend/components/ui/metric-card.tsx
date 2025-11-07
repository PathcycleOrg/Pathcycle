import type React from "react"
interface MetricCardProps {
  label: string
  value: string
  highlight?: "primary" | "secondary" | "accent" | "danger"
  icon?: React.ReactNode
}

export default function MetricCard({ label, value, highlight = "primary", icon }: MetricCardProps) {
  const colorClasses = {
    primary: "text-pathcycle-primary",
    secondary: "text-pathcycle-secondary",
    accent: "text-pathcycle-accent",
    danger: "text-pathcycle-danger",
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-pathcycle-gray-100">
      <h3 className="text-sm font-medium text-pathcycle-gray-400 uppercase tracking-wider">{label}</h3>
      <p className={`text-3xl font-bold mt-1 ${colorClasses[highlight]}`}>{value}</p>
      {icon && <div className="mt-2">{icon}</div>}
    </div>
  )
}
