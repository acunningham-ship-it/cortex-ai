import { useState, useEffect } from 'react'
import { useModels } from './hooks/useModels'
import { useHealth } from './hooks/useHealth'
import ChatView from './components/Chat/ChatView'
import PipelineView from './components/Pipeline/PipelineView'
import TemplatesView from './components/Templates/TemplatesView'
import DashboardView from './components/Dashboard/DashboardView'
import ToolsView from './components/Tools/ToolsView'

type View = 'chat' | 'pipelines' | 'templates' | 'dashboard' | 'tools'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('chat')
  const [selectedModel, setSelectedModel] = useState('llama2')
  const [selectedProvider, setSelectedProvider] = useState('ollama')
  const { models } = useModels()
  const { isHealthy } = useHealth()

  useEffect(() => {
    if (models.length > 0 && !models.find(m => m.name === selectedModel)) {
      setSelectedModel(models[0].name)
      setSelectedProvider(models[0].provider)
    }
  }, [models])

  const navItems = [
    { id: 'chat' as const, label: 'Chat', icon: '💬' },
    { id: 'pipelines' as const, label: 'Pipelines', icon: '⚙️' },
    { id: 'templates' as const, label: 'Templates', icon: '📋' },
    { id: 'dashboard' as const, label: 'Dashboard', icon: '📊' },
    { id: 'tools' as const, label: 'AI Tools', icon: '🔧' },
  ]

  return (
    <div className="flex h-screen bg-cortex-bg text-white">
      {/* Sidebar */}
      <aside className="w-60 bg-gradient-to-b from-cortex-card to-cortex-bg border-r border-cortex-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-cortex-border">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cortex-cyan to-cortex-purple bg-clip-text text-transparent">
            Cortex AI
          </h1>
          <p className="text-xs text-gray-400 mt-1">Local AI Developer</p>
          <div className="mt-2 inline-block px-2 py-1 rounded bg-cortex-purple bg-opacity-20 border border-cortex-purple border-opacity-30">
            <p className="text-xs text-cortex-purple font-semibold">v0.2.0</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all border-l-4 ${
                  currentView === item.id
                    ? 'bg-cortex-cyan bg-opacity-10 text-cortex-cyan border-l-cortex-cyan border border-cortex-cyan'
                    : 'text-gray-300 hover:bg-cortex-border hover:bg-opacity-50 border-l-transparent hover:border-l-cortex-cyan'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Status */}
        <div className="p-4 border-t border-cortex-border">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-cortex-green' : 'bg-red-500'}`} />
            <span>{isHealthy ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 bg-gradient-to-r from-cortex-card to-cortex-border border-b border-cortex-border flex items-center justify-between px-8">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Navigation</p>
            <h2 className="text-xl font-semibold">
              {navItems.find(n => n.id === currentView)?.label}
            </h2>
          </div>

          {/* Model Selector */}
          {currentView === 'chat' && models.length > 0 && (
            <div className="flex items-center gap-4 bg-cortex-card px-4 py-2 rounded-lg border border-cortex-border">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Active Model:</label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  const model = models.find(m => m.name === e.target.value)
                  if (model) {
                    setSelectedModel(model.name)
                    setSelectedProvider(model.provider)
                  }
                }}
                className="bg-cortex-border border border-cortex-cyan rounded px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-cortex-cyan cursor-pointer"
              >
                {models.map(model => (
                  <option key={`${model.provider}/${model.name}`} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden transition-opacity duration-300">
          {currentView === 'chat' && (
            <ChatView
              selectedModel={selectedModel}
              selectedProvider={selectedProvider}
            />
          )}
          {currentView === 'pipelines' && <PipelineView />}
          {currentView === 'templates' && <TemplatesView />}
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'tools' && <ToolsView />}
        </div>
      </main>

      {/* Connection Lost Banner */}
      {!isHealthy && (
        <div className="fixed bottom-4 left-4 bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded-lg text-sm">
          ⚠️ Connection lost to backend. Please check your server.
        </div>
      )}
    </div>
  )
}
