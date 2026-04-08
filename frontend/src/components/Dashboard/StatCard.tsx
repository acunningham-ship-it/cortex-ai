interface StatCardProps {
  label: string
  value: string
  icon: string
  trend?: string
}

export default function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-cortex-bg border border-cortex-border rounded-lg p-6 hover:border-cortex-cyan transition-all">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm text-gray-400 font-medium">{label}</h3>
        <div className="text-2xl">{icon}</div>
      </div>

      <p className="text-3xl font-bold mb-2">{value}</p>

      {trend && (
        <p className="text-xs text-gray-500">{trend}</p>
      )}
    </div>
  )
}
