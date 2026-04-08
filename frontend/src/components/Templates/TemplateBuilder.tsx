import { useState } from 'react'
import { Template, Model } from '../../lib/api'

interface TemplateBuilderProps {
  models: Model[]
  onSave: (template: Omit<Template, 'id'>) => void
  onCancel: () => void
}

const CATEGORIES = [
  'Code Generation',
  'Documentation',
  'Testing',
  'Code Review',
  'Debugging',
  'Optimization',
  'Refactoring',
  'Other'
]

export default function TemplateBuilder({ models, onSave, onCancel }: TemplateBuilderProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [content, setContent] = useState('')
  const [variables, setVariables] = useState<string[]>([])
  const [newVariable, setNewVariable] = useState('')
  const [model, setModel] = useState(models[0]?.name || '')
  const [provider, setProvider] = useState(models[0]?.provider || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable.trim())) {
      setVariables([...variables, newVariable.trim()])
      setNewVariable('')
    }
  }

  const removeVariable = (v: string) => {
    setVariables(variables.filter(x => x !== v))
  }

  const handleSave = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = 'Name is required'
    if (!content.trim()) newErrors.content = 'Template content is required'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        content: content.trim(),
        variables,
        model,
        provider
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Create Template</h1>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Template Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Unit Test Generator"
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
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this template for?"
            className="w-full bg-cortex-card border border-cortex-border rounded-lg p-3 text-sm focus:outline-none focus:border-cortex-purple focus:ring-1 focus:ring-cortex-purple"
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-cortex-card border border-cortex-border rounded-lg p-3 text-sm focus:outline-none focus:border-cortex-purple focus:ring-1 focus:ring-cortex-purple"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Suggested Model</label>
          <select
            value={model}
            onChange={(e) => {
              const m = models.find(x => x.name === e.target.value)
              if (m) {
                setModel(m.name)
                setProvider(m.provider)
              }
            }}
            className="w-full bg-cortex-card border border-cortex-border rounded-lg p-3 text-sm focus:outline-none focus:border-cortex-purple focus:ring-1 focus:ring-cortex-purple"
          >
            {models.map(m => (
              <option key={`${m.provider}/${m.name}`} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Variables */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Variables</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              placeholder="e.g., className, functionName"
              className="flex-1 bg-cortex-card border border-cortex-border rounded-lg p-3 text-sm focus:outline-none focus:border-cortex-purple focus:ring-1 focus:ring-cortex-purple"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addVariable()
                }
              }}
            />
            <button
              onClick={addVariable}
              className="px-4 py-3 bg-cortex-green text-black rounded-lg font-medium text-sm hover:brightness-110 transition-all"
            >
              Add
            </button>
          </div>

          {variables.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {variables.map(v => (
                <div
                  key={v}
                  className="flex items-center gap-2 px-3 py-1 bg-cortex-purple bg-opacity-20 text-cortex-purple rounded-full"
                >
                  <span className="text-sm">{v}</span>
                  <button
                    onClick={() => removeVariable(v)}
                    className="text-xs hover:text-cortex-purple"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Content */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Template Content *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your prompt template here. Use {variableName} for variables."
            className={`w-full bg-cortex-card border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 transition-all resize-none font-mono ${
              errors.content
                ? 'border-red-500 focus:ring-red-500'
                : 'border-cortex-border focus:border-cortex-purple focus:ring-cortex-purple'
            }`}
            rows={10}
          />
          {errors.content && (
            <p className="text-red-400 text-xs mt-1">{errors.content}</p>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Use curly braces to reference variables: {'{'}variableName{'}'}
          </p>
        </div>

        {/* Preview */}
        {content && variables.length > 0 && (
          <div className="mb-8 p-4 bg-cortex-bg border border-cortex-border rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Preview:</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
              {content.replace(/\{(\w+)\}/g, (_, varName) =>
                variables.includes(varName) ? `[${varName}]` : `{${varName}}`
              )}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-cortex-cyan text-black rounded-lg font-medium hover:brightness-110 transition-all"
          >
            Create Template
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-cortex-border text-white rounded-lg font-medium hover:brightness-110 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
