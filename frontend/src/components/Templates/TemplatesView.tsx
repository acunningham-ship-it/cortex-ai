import { useState, useEffect } from 'react'
import { Template, getTemplates, createTemplate, deleteTemplate, runTemplate } from '../../lib/api'
import { useModels } from '../../hooks/useModels'
import TemplateModal from './TemplateModal'
import TemplateBuilder from './TemplateBuilder'

export default function TemplatesView() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { models } = useModels()

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true)
        const data = await getTemplates()
        setTemplates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }
    loadTemplates()
  }, [])

  const handleCreateTemplate = async (template: Omit<Template, 'id'>) => {
    try {
      setError(null)
      const newTemplate = await createTemplate(template)
      setTemplates([...templates, newTemplate])
      setIsCreating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id)
      setTemplates(templates.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setShowModal(true)
  }

  if (isCreating) {
    return (
      <TemplateBuilder
        models={models}
        onSave={handleCreateTemplate}
        onCancel={() => setIsCreating(false)}
      />
    )
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-cortex-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Prompt Templates</h1>
            <p className="text-gray-400">Pre-built prompts for common tasks</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-cortex-green text-black rounded-lg font-medium hover:brightness-110 transition-all"
          >
            + New Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="h-48 bg-cortex-border bg-opacity-30 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">No Templates Yet</h2>
            <p className="text-gray-400 mb-6">Create your first template to get started</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-cortex-green text-black rounded-lg font-medium hover:brightness-110 transition-all"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div
                key={template.id}
                className="bg-cortex-card border border-cortex-border rounded-lg p-6 hover:border-cortex-green transition-all group"
              >
                {/* Category Badge */}
                {template.category && (
                  <div className="inline-block px-3 py-1 bg-cortex-cyan bg-opacity-10 text-cortex-cyan text-xs rounded-full mb-3">
                    {template.category}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {template.name}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-3 h-16">
                  {template.description}
                </p>

                {/* Variables */}
                {template.variables.length > 0 && (
                  <div className="mb-4 p-3 bg-cortex-bg rounded">
                    <p className="text-xs text-gray-400 mb-2">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map(v => (
                        <span
                          key={v}
                          className="text-xs bg-cortex-purple bg-opacity-20 text-cortex-purple px-2 py-1 rounded"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 py-2 px-3 bg-cortex-green text-black rounded text-sm font-medium hover:brightness-110 transition-all"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="py-2 px-3 bg-red-500 bg-opacity-10 text-red-400 rounded text-sm font-medium hover:bg-opacity-20 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Modal */}
      {selectedTemplate && showModal && (
        <TemplateModal
          template={selectedTemplate}
          models={models}
          onClose={() => {
            setShowModal(false)
            setSelectedTemplate(null)
          }}
          onRunTemplate={runTemplate}
        />
      )}
    </div>
  )
}
