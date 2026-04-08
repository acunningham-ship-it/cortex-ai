interface TokenChartProps {
  data: Record<string, number>
}

export default function TokenChart({ data }: TokenChartProps) {
  const entries = Object.entries(data)
  if (entries.length === 0) return null

  const maxValue = Math.max(...entries.map(([, v]) => v))
  const colors = ['#00d4ff', '#00ff88', '#7c3aed', '#fbbf24', '#f87171', '#60a5fa']

  return (
    <div className="space-y-4">
      {entries.map(([model, value], idx) => (
        <div key={model}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium truncate">{model}</p>
            <p className="text-sm text-gray-400">{(value / 1000).toFixed(0)}K</p>
          </div>

          <div className="w-full bg-cortex-border rounded-full h-3 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(value / maxValue) * 100}%`,
                backgroundColor: colors[idx % colors.length]
              }}
            />
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-cortex-border">
        <p className="text-xs text-gray-500 mb-2">Total Usage</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-400">Total:</p>
            <p className="text-lg font-semibold">
              {(entries.reduce((sum, [, v]) => sum + v, 0) / 1000000).toFixed(2)}M
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Average:</p>
            <p className="text-lg font-semibold">
              {(entries.reduce((sum, [, v]) => sum + v, 0) / entries.length / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
