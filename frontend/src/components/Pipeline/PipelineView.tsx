import { useState, useEffect } from 'react'
import { Pipeline, getPipelines, createPipeline, runPipeline } from '../../lib/api'
import { useModels } from '../../hooks/useModels'
import PipelineBuilder from './PipelineBuilder'

export default function PipelineView() {
  const [pipelines, setpipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [pipelineInput, setPipelineInput] = useState('')
  const [pipelineResults, setPipelineResults] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { models } = useModels()

  useEffect(() => {
    const loadPipelines = async () => {
      try {
        setLoading(true)
        const data = await getPipelines()
        setpipelines(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pipelines')
      } finally {
        setLoading(false)
      }
    }
    loadPipelines()
  }, [])

  const handleCreatePipeline = async (pipeline: Omit<Pipeline, 'id' | 'createdAt'>) => {
    try {
      setError(null)
      const newPipeline = await createPipeline(pipeline)
      setpipelines([...pipelines, newPipeline])
      setSelectedPipeline(newPipeline)
      setIsCreating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pipeline')
    }
  }

  const handleRunPipeline = async () => {
    if (!selectedPipeline || !pipelineInput.trim()) return

    try {
      setError(null)
      setIsRunning(true)
      const results = await runPipeline(selectedPipeline.id, pipelineInput.trim())
      setPipelineResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run pipeline')
    } finally {
      setIsRunning(false)
    }
  }

  if (isCreating) {
    return (
      <PipelineBuilder
        models={models}
        onSave={handleCreatePipeline}
        onCancel={() => setIsCreating(false)}
      />
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Pipelines List */}
      <div className="w-80 bg-cortex-card border-r border-cortex-border flex flex-col overflow-hidden">
        <div className="p-4 border-b border-cortex-border">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-4 bg-cortex-purple text-white rounded-lg font-medium text-sm hover:bg-cortex-purple hover:brightness-110 transition-all"
          >
            + New Pipeline
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-16 bg-cortex-border bg-opacity-50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : pipelines.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No pipelines yet. Create one to get started!
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {pipelines.map(pipeline => (
                <button
                  key={pipeline.id}
                  onClick={() => {
                    setSelectedPipeline(pipeline)
                    setPipelineResults([])
                    setPipelineInput('')
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedPipeline?.id === pipeline.id
                      ? 'bg-cortex-purple bg-opacity-10 border border-cortex-purple'
                      : 'border border-cortex-border hover:border-cortex-purple hover:bg-cortex-border'
                  }`}
                >
                  <p className="font-medium text-sm">{pipeline.name}</p>
                  <p className="text-xs text-gray-500 truncate">{pipeline.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{pipeline.steps.length} steps</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedPipeline ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4">⚙️</div>
              <h2 className="text-2xl font-bold mb-2">No Pipeline Selected</h2>
              <p className="text-gray-400">Create or select a pipeline to get started</p>
            </div>
          </div>
        ) : (
          <>
            {/* Pipeline Info */}
            <div className="p-6 border-b border-cortex-border">
              <h2 className="text-2xl font-bold mb-2">{selectedPipeline.name}</h2>
              <p className="text-gray-400 text-sm">{selectedPipeline.description}</p>
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Pipeline Steps</h3>
                <div className="space-y-4">
                  {selectedPipeline.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="border border-cortex-border rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-cortex-cyan text-black flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <h4 className="font-medium">{step.name}</h4>
                        <span className="text-xs text-gray-500 ml-auto">
                          {step.provider}/{step.model}
                        </span>
                      </div>

                      {step.systemPrompt && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-400 mb-1">System Prompt:</p>
                          <p className="text-sm text-gray-300 bg-cortex-bg p-2 rounded">
                            {step.systemPrompt}
                          </p>
                        </div>
                      )}

                      {step.inputTemplate && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Input Template:</p>
                          <p className="text-sm text-gray-300 bg-cortex-bg p-2 rounded font-mono">
                            {step.inputTemplate}
                          </p>
                        </div>
                      )}

                      {pipelineResults[idx] && (
                        <div className="mt-3 pt-3 border-t border-cortex-border">
                          <p className="text-xs text-gray-400 mb-1">Output:</p>
                          <p className="text-sm text-cortex-green">
                            {pipelineResults[idx]}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="mb-6">
                <label className="text-sm font-medium block mb-2">
                  Pipeline Input
                </label>
                <textarea
                  value={pipelineInput}
                  onChange={(e) => setPipelineInput(e.target.value)}
                  placeholder="Enter initial input for the pipeline..."
                  className="w-full bg-cortex-border border border-cortex-border rounded-lg p-3 text-sm focus:outline-none focus:border-cortex-purple focus:ring-1 focus:ring-cortex-purple resize-none"
                  rows={4}
                  disabled={isRunning}
                />
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Run Button */}
            <div className="p-6 border-t border-cortex-border">
              <button
                onClick={handleRunPipeline}
                disabled={isRunning || !pipelineInput.trim()}
                className="w-full py-3 px-4 bg-cortex-purple text-white rounded-lg font-medium hover:bg-cortex-purple hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isRunning ? 'Running Pipeline...' : 'Run Pipeline'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
