import { useState, useEffect } from 'react'
import { Usage, getUsage, getModels, Model } from '../../lib/api'
import StatCard from './StatCard'
import TokenChart from './TokenChart'
import UsageTable from './UsageTable'

export default function DashboardView() {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [usageData, modelsData] = await Promise.all([
          getUsage(),
          getModels()
        ])
        setUsage(usageData)
        setModels(modelsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="h-full p-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-32 bg-cortex-card bg-opacity-50 rounded-lg animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 bg-cortex-card bg-opacity-50 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  const tokensPerModel = usage?.modelsUsed.reduce((acc, model) => {
    // Simplified calculation for demo
    const baseTokens = Math.floor(Math.random() * 50000) + 10000
    return { ...acc, [model]: baseTokens }
  }, {} as Record<string, number>) || {}

  const estimatedSavings = usage ? usage.totalTokens * 0.00001 * 100 : 0 // Rough estimate: $0.01 per 1M tokens vs cloud pricing

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {usage && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Requests"
              value={usage.totalRequests.toLocaleString()}
              icon="📊"
              trend="+12% from last week"
            />
            <StatCard
              label="Total Tokens"
              value={(usage.totalTokens / 1000).toFixed(1) + 'K'}
              icon="⚡"
              trend="+8% from last week"
            />
            <StatCard
              label="Models Used"
              value={usage.modelsUsed.length.toString()}
              icon="🤖"
              trend={usage.modelsUsed.join(', ')}
            />
            <StatCard
              label="Est. Savings"
              value={'$' + estimatedSavings.toFixed(2)}
              icon="💰"
              trend="vs cloud APIs"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Token Chart */}
          <div className="bg-cortex-card border border-cortex-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Tokens by Model</h2>
            {Object.keys(tokensPerModel).length > 0 ? (
              <TokenChart data={tokensPerModel} />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Models Info */}
          <div className="bg-cortex-card border border-cortex-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Available Models</h2>
            {models.length > 0 ? (
              <div className="space-y-3">
                {models.slice(0, 6).map(model => (
                  <div
                    key={`${model.provider}/${model.name}`}
                    className="flex items-center justify-between p-3 bg-cortex-bg rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{model.name}</p>
                      <p className="text-xs text-gray-500">{model.provider}</p>
                    </div>
                    <div className="text-right">
                      {model.size && (
                        <p className="text-xs text-gray-400">{model.size}</p>
                      )}
                      {model.parameters && (
                        <p className="text-xs text-gray-500">{model.parameters}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-500">
                No models available
              </div>
            )}
          </div>
        </div>

        {/* Usage Table */}
        <div className="bg-cortex-card border border-cortex-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <UsageTable />
        </div>
      </div>
    </div>
  )
}
