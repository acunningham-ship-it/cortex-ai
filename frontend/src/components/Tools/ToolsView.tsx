import { useState, useEffect } from 'react'

interface Tool {
  id: string
  name: string
  description: string
  available: boolean
}

interface ToolOutput {
  toolId: string
  output: string
  loading: boolean
  error?: string
}

export default function ToolsView() {
  const [tools, setTools] = useState<Tool[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [selectedTools, setSelectedTools] = useState<[string | null, string | null]>([null, null])
  const [isComparison, setIsComparison] = useState(false)
  const [input, setInput] = useState('')
  const [outputs, setOutputs] = useState<Record<string, ToolOutput>>({})
  const [loading, setLoading] = useState(false)

  // Demo tools (since /api/tools doesn't exist yet)
  useEffect(() => {
    const mockTools: Tool[] = [
      {
        id: 'grep',
        name: 'grep',
        description: 'Search text patterns in files',
        available: true
      },
      {
        id: 'sed',
        name: 'sed',
        description: 'Stream editor for text transformation',
        available: true
      },
      {
        id: 'awk',
        name: 'awk',
        description: 'Text processing and data extraction',
        available: true
      },
      {
        id: 'jq',
        name: 'jq',
        description: 'JSON query and manipulation',
        available: false
      },
      {
        id: 'curl',
        name: 'curl',
        description: 'Transfer data from URLs',
        available: true
      },
      {
        id: 'git',
        name: 'git',
        description: 'Version control operations',
        available: true
      }
    ]
    setTools(mockTools)
  }, [])

  const runTool = async (toolId: string) => {
    if (!input.trim()) return

    setLoading(true)
    setOutputs(prev => ({
      ...prev,
      [toolId]: { toolId, output: '', loading: true }
    }))

    // Simulate tool execution with mock responses
    setTimeout(() => {
      const mockResponses: Record<string, string> = {
        grep: `$ grep "pattern" file.txt\nmatched_line_1\nmatched_line_2\nmatched_line_3\n\n3 matches found`,
        sed: `$ sed 's/old/new/g' file.txt\nModified content with replacements\nProcessed 5 substitutions\nOutput written successfully`,
        awk: `$ awk '{print $1, $NF}' data.txt\nfield1 field10\nfield2 field20\nfield3 field30\n\nProcessed 3 records`,
        jq: `Tool unavailable - please install jq`,
        curl: `$ curl https://api.example.com/data\n{\n  "status": "success",\n  "data": {...},\n  "timestamp": "2024-04-08T12:18:00Z"\n}\nResponse time: 145ms`,
        git: `$ git log --oneline -5\nf7b998d Expand test suite to 24 tests\n2eae909 Improve README and docs\nfaaab78 Fix usage API\nee9657b Fix pipeline endpoints\n4f0454b Add examples and tests`
      }

      const response = mockResponses[toolId] || `Executed: ${input}`

      setOutputs(prev => ({
        ...prev,
        [toolId]: { toolId, output: response, loading: false }
      }))
      setLoading(false)
    }, 800)
  }

  const handleRunSingle = async () => {
    if (!selectedTool) return
    await runTool(selectedTool)
  }

  const handleRunComparison = async () => {
    if (!selectedTools[0] || !selectedTools[1]) return
    setLoading(true)
    await runTool(selectedTools[0])
    await runTool(selectedTools[1])
    setLoading(false)
  }

  const handleSelectComparisonTool = (index: 0 | 1, toolId: string) => {
    const newSelected: [string | null, string | null] = [...selectedTools]
    newSelected[index] = toolId === newSelected[index] ? null : toolId
    setSelectedTools(newSelected)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-cortex-bg">
      {/* Header */}
      <div className="border-b border-cortex-border p-6 bg-gradient-to-r from-cortex-bg to-cortex-card">
        <h1 className="text-2xl font-bold mb-2">CLI AI Tools</h1>
        <p className="text-sm text-gray-400">Send prompts to CLI tools and see results</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setIsComparison(false)
                setOutputs({})
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                !isComparison
                  ? 'bg-cortex-cyan text-black'
                  : 'bg-cortex-border text-gray-300 hover:bg-cortex-border hover:brightness-110'
              }`}
            >
              Single Tool
            </button>
            <button
              onClick={() => {
                setIsComparison(true)
                setOutputs({})
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isComparison
                  ? 'bg-cortex-cyan text-black'
                  : 'bg-cortex-border text-gray-300 hover:bg-cortex-border hover:brightness-110'
              }`}
            >
              Compare Tools
            </button>
          </div>

          {/* Input Area */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Prompt/Input</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a command or prompt to send to the tool..."
              className="w-full bg-cortex-card border border-cortex-border rounded-lg p-4 text-sm focus:outline-none focus:border-cortex-cyan focus:ring-1 focus:ring-cortex-cyan resize-none"
              rows={4}
            />
          </div>

          {!isComparison ? (
            // Single Tool Mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Select Tool</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {tools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id)}
                      className={`p-4 rounded-lg border transition-all text-left ${
                        selectedTool === tool.id
                          ? 'border-cortex-cyan bg-cortex-cyan bg-opacity-10'
                          : 'border-cortex-border bg-cortex-card hover:border-cortex-cyan'
                      } ${!tool.available ? 'opacity-50' : ''}`}
                    >
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{tool.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            tool.available ? 'bg-cortex-green' : 'bg-gray-500'
                          }`}
                        />
                        <span className="text-xs text-gray-500">
                          {tool.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTool && (
                <button
                  onClick={handleRunSingle}
                  disabled={!input.trim() || loading}
                  className="px-6 py-3 bg-cortex-cyan text-black rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Running...' : 'Run Tool'}
                </button>
              )}

              {/* Output */}
              {selectedTool && outputs[selectedTool] && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">Output</label>
                  <div className="bg-cortex-card border border-cortex-border rounded-lg p-4 font-mono text-xs text-gray-200 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                    {outputs[selectedTool].loading ? (
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    ) : (
                      outputs[selectedTool].output
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Comparison Mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Select Tools to Compare</label>
                <div className="grid md:grid-cols-2 gap-6">
                  {[0, 1].map((index) => (
                    <div key={index}>
                      <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Tool {index + 1}</h3>
                      <div className="space-y-2">
                        {tools.map(tool => (
                          <button
                            key={tool.id}
                            onClick={() =>
                              handleSelectComparisonTool(index as 0 | 1, tool.id)
                            }
                            className={`w-full p-3 rounded-lg border transition-all text-left text-sm ${
                              selectedTools[index] === tool.id
                                ? 'border-cortex-cyan bg-cortex-cyan bg-opacity-10'
                                : 'border-cortex-border bg-cortex-card hover:border-cortex-cyan'
                            } ${!tool.available ? 'opacity-50' : ''}`}
                          >
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-xs text-gray-500">{tool.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTools[0] && selectedTools[1] && (
                <button
                  onClick={handleRunComparison}
                  disabled={!input.trim() || loading}
                  className="px-6 py-3 bg-cortex-cyan text-black rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Running...' : 'Compare Tools'}
                </button>
              )}

              {/* Comparison Output */}
              {selectedTools[0] && selectedTools[1] && (
                <div className="grid md:grid-cols-2 gap-6">
                  {selectedTools.map((toolId, index) => (
                    <div key={index} className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        {tools.find(t => t.id === toolId)?.name} Output
                      </label>
                      <div className="bg-cortex-card border border-cortex-border rounded-lg p-4 font-mono text-xs text-gray-200 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                        {toolId && outputs[toolId] ? (
                          outputs[toolId].loading ? (
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                          ) : (
                            outputs[toolId].output
                          )
                        ) : (
                          <span className="text-gray-500">No output yet</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
