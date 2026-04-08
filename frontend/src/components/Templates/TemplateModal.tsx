import { useState } from 'react'
import { Template, Model } from '../../lib/api'

interface TemplateModalProps {
  template: Template
  models: Model[]
  onClose: () => void
  onRunTemplate: (
    id: string,
    model: string,
    provider: string,
    variables: Record<string, string>,
    onChunk?: (chunk: string) => void
  ) => Promise<string>
}

export default function TemplateModal({
  template,
  models,
  onClose,
  onRunTemplate
}: TemplateModalProps) {
  const [selectedModel, setSelectedModel] = useState(
    models.find(m => m.name === template.model)?.name || models[0]?.name || ''
  )
  const [selectedProvider, setSelectedProvider] = useState(
    models.find(m => m.name === selectedModel)?.provider || ''
  )
  const [variables, setVariables] = useState<Record<string, string>>(
    template.variables.reduce((acc, v) => ({ ...acc, [v]: '' }), {})
  )
  const [result, setResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    try {
      setError(null)
      setIsLoading(true)
      setResult('')

      const response = await onRunTemplate(
        template.id,
        selectedModel,
        selectedProvider,
        variables,
        (chunk) => {
          setResult(prev => (prev || '') + chunk)
        }
      )
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run template')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-cortex-card border border-cortex-border rounded-lg w-full max-w-2xl max-h-96 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cortex-border flex items-center justify-between">
          <h2 className="text-xl font-bold">{template.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Model Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => {
                const model = models.find(m => m.name === e.target.value)
                if (model) {
                  setSelectedModel(model.name)
                  setSelectedProvider(model.provider)
                }
              }}
              className="w-full bg-cortex-bg border border-cortex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cortex-cyan focus:ring-1 focus:ring-cortex-cyan"
              disabled={isLoading}
            >
              {models.map(m => (
                <option key={`${m.provider}/${m.name}`} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Variables */}
          {template.variables.length > 0 && (
            <div>
              <label className="text-sm font-medium block mb-2">Variables</label>
              <div className="space-y-3">
                {template.variables.map(varName => (
                  <div key={varName}>
                    <label className="text-xs text-gray-400 block mb-1">
                      {varName}
                    </label>
                    <input
                      type="text"
                      value={variables[varName] || ''}
                      onChange={(e) =>
                        setVariables({
                          ...variables,
                          [varName]: e.target.value
                        })
                      }
                      placeholder={`Enter ${varName}`}
                      className="w-full bg-cortex-bg border border-cortex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cortex-cyan focus:ring-1 focus:ring-cortex-cyan"
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div>
              <label className="text-sm font-medium block mb-2">Result</label>
              <div className="bg-cortex-bg border border-cortex-border rounded p-3 text-sm text-gray-300 max-h-32 overflow-y-auto">
                {result}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cortex-border flex gap-3">
          <button
            onClick={handleRun}
            disabled={isLoading || template.variables.some(v => !variables[v]?.trim())}
            className="flex-1 py-2 px-4 bg-cortex-cyan text-black rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Running...' : 'Run Template'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-cortex-border text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
