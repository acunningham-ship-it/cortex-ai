import { useState } from 'react'
import { Pipeline, PipelineStep, Model } from '../../lib/api'

interface PipelineBuilderProps {
  models: Model[]
  onSave: (pipeline: Omit<Pipeline, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

export default function PipelineBuilder({ models, onSave, onCancel }: PipelineBuilderProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<Omit<PipelineStep, 'id'>[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addStep = () => {
    setSteps([
      ...steps,
      {
        name: `Step ${steps.length + 1}`,
        model: models[0]?.name || '',
        provider: models[0]?.provider || '',
        systemPrompt: '',
        inputTemplate: ''
      }
    ])
  }

  const removeStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx))
  }

  const updateStep = (idx: number, field: string, value: string) => {
    const updated = [...steps]
    ;(updated[idx] as any)[field] = value
    setSteps(updated)
  }

  const handleSave = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = 'Name is required'
    if (steps.length === 0) newErrors.steps = 'At least one step is required'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onSave({
        name: name.trim(),
        description: description.trim(),
        steps: steps as PipelineStep[]
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Create Pipeline</h1>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Pipeline Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Code Review Pipeline"
            className={`w-full bg-cortex-card border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 transition-all ${
              errors.name
                ? 'border-red-500 focus:ring-red-500'
                : 'border-cortex-border focus:border-cortex-purple focus:ring-cortex-purple'
            }`}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this pipeline do?"
            className="w-full bg-cortex-card border border-cortex-border rounded-lg p-3 text-sm focus:outline-none focus:border-cortex-purple focus:ring-1 focus:ring-cortex-purple resize-none"
            rows={3}
          />
        </div>

        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pipeline Steps</h2>
            <button
              onClick={addStep}
              className="px-4 py-2 bg-cortex-green text-black rounded-lg font-medium text-sm hover:brightness-110 transition-all"
            >
              + Add Step
            </button>
          </div>

          {errors.steps && (
            <p className="text-red-400 text-xs mb-4">{errors.steps}</p>
          )}

          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="border border-cortex-border rounded-lg p-6 bg-cortex-bg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-cortex-cyan text-black flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => updateStep(idx, 'name', e.target.value)}
                    placeholder="Step name"
                    className="flex-1 bg-cortex-card border border-cortex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cortex-cyan focus:ring-1 focus:ring-cortex-cyan"
                  />
                  <button
                    onClick={() => removeStep(idx)}
                    className="text-red-400 hover:text-red-300 transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Model Selection */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Model</label>
                    <select
                      value={step.model}
                      onChange={(e) => {
                        const model = models.find(m => m.name === e.target.value)
                        if (model) {
                          updateStep(idx, 'model', model.name)
                          updateStep(idx, 'provider', model.provider)
                        }
                      }}
                      className="w-full bg-cortex-card border border-cortex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cortex-cyan focus:ring-1 focus:ring-cortex-cyan"
                    >
                      {models.map(m => (
                        <option key={`${m.provider}/${m.name}`} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Provider</label>
                    <input
                      type="text"
                      value={step.provider}
                      disabled
                      className="w-full bg-cortex-card border border-cortex-border rounded px-3 py-2 text-sm opacity-50"
                    />
                  </div>
                </div>

                {/* System Prompt */}
                <div className="mb-4">
                  <label className="text-xs text-gray-400 block mb-1">
                    System Prompt (Optional)
                  </label>
                  <textarea
                    value={step.systemPrompt}
                    onChange={(e) => updateStep(idx, 'systemPrompt', e.target.value)}
                    placeholder="e.g., 'You are a code reviewer...'"
                    className="w-full bg-cortex-card border border-cortex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cortex-cyan focus:ring-1 focus:ring-cortex-cyan resize-none"
                    rows={2}
                  />
                </div>

                {/* Input Template */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Input Template (Optional)
                  </label>
                  <textarea
                    value={step.inputTemplate}
                    onChange={(e) => updateStep(idx, 'inputTemplate', e.target.value)}
                    placeholder="e.g., 'Review this code:\n{previous_output}'"
                    className="w-full bg-cortex-card border border-cortex-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cortex-cyan focus:ring-1 focus:ring-cortex-cyan resize-none font-mono text-xs"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-cortex-cyan text-black rounded-lg font-medium hover:brightness-110 transition-all"
          >
            Create Pipeline
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-cortex-border text-white rounded-lg font-medium hover:bg-cortex-border hover:brightness-110 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
