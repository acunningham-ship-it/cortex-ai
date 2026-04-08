export default function UsageTable() {
  // Sample data for demonstration
  const recentRequests = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60000),
      model: 'llama2',
      provider: 'ollama',
      inputTokens: 245,
      outputTokens: 187,
      latency: '2.3s'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 12 * 60000),
      model: 'mistral',
      provider: 'ollama',
      inputTokens: 512,
      outputTokens: 324,
      latency: '4.1s'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 28 * 60000),
      model: 'neural-chat',
      provider: 'ollama',
      inputTokens: 189,
      outputTokens: 142,
      latency: '1.8s'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 45 * 60000),
      model: 'llama2',
      provider: 'ollama',
      inputTokens: 334,
      outputTokens: 256,
      latency: '3.2s'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 62 * 60000),
      model: 'mistral',
      provider: 'ollama',
      inputTokens: 423,
      outputTokens: 318,
      latency: '3.8s'
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cortex-border">
            <th className="text-left py-3 px-4 font-medium text-gray-400">Time</th>
            <th className="text-left py-3 px-4 font-medium text-gray-400">Model</th>
            <th className="text-right py-3 px-4 font-medium text-gray-400">Input</th>
            <th className="text-right py-3 px-4 font-medium text-gray-400">Output</th>
            <th className="text-right py-3 px-4 font-medium text-gray-400">Total</th>
            <th className="text-right py-3 px-4 font-medium text-gray-400">Latency</th>
          </tr>
        </thead>
        <tbody>
          {recentRequests.map(req => (
            <tr
              key={req.id}
              className="border-b border-cortex-border hover:bg-cortex-bg transition-all"
            >
              <td className="py-3 px-4 text-gray-300">
                {req.timestamp.toLocaleTimeString()}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cortex-green" />
                  <span className="text-gray-300">{req.model}</span>
                  <span className="text-xs text-gray-500">({req.provider})</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right text-gray-400">
                {req.inputTokens}
              </td>
              <td className="py-3 px-4 text-right text-gray-400">
                {req.outputTokens}
              </td>
              <td className="py-3 px-4 text-right text-cortex-cyan font-medium">
                {req.inputTokens + req.outputTokens}
              </td>
              <td className="py-3 px-4 text-right text-gray-400">
                {req.latency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
