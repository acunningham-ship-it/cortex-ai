// API client for Cortex AI backend

export interface Model {
  name: string
  provider: string
  size?: string
  parameters?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  model?: string
  provider?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  content: string
  variables: string[]
  model?: string
  provider?: string
}

export interface Pipeline {
  id: string
  name: string
  description: string
  steps: PipelineStep[]
  createdAt: string
}

export interface PipelineStep {
  id: string
  name: string
  model: string
  provider: string
  systemPrompt: string
  inputTemplate: string
}

export interface Usage {
  totalRequests: number
  totalTokens: number
  modelsUsed: string[]
  uptime: number
}

const API_BASE = '/api'

// Health check
export async function getHealth(): Promise<boolean> {
  try {
    const response = await fetch('/health', { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}

// Models
export async function getModels(): Promise<Model[]> {
  const response = await fetch(`${API_BASE}/models`)
  if (!response.ok) throw new Error('Failed to fetch models')
  return response.json()
}

// Conversations
export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE}/conversations`)
  if (!response.ok) throw new Error('Failed to fetch conversations')
  return response.json()
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE}/conversations/${id}`)
  if (!response.ok) throw new Error('Failed to fetch conversation')
  return response.json()
}

export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete conversation')
}

export async function createConversation(title: string = 'New Chat'): Promise<Conversation> {
  const response = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })
  if (!response.ok) throw new Error('Failed to create conversation')
  return response.json()
}

// Chat streaming — returns {fullResponse, conversationId}
export async function streamChat(
  model: string,
  provider: string,
  message: string,
  conversationId?: string,
  onChunk?: (chunk: string) => void
): Promise<{ fullResponse: string; conversationId?: string }> {
  const body = { model, provider, message, conversationId }

  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Chat failed: ${err}`)
  }

  let fullResponse = ''
  let returnedConvId: string | undefined = conversationId
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  if (!reader) throw new Error('No response body')

  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // Process complete SSE lines
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const dataStr = trimmed.slice(5).trim()
      if (!dataStr) continue
      try {
        const data = JSON.parse(dataStr)
        if (data.error) throw new Error(data.error)
        if (data.chunk) {
          fullResponse += data.chunk
          if (onChunk) onChunk(data.chunk)
        }
        if (data.conversation_id) returnedConvId = data.conversation_id
      } catch {
        // ignore parse errors
      }
    }
  }

  return { fullResponse, conversationId: returnedConvId }
}

// Templates
export async function getTemplates(): Promise<Template[]> {
  const response = await fetch(`${API_BASE}/templates`)
  if (!response.ok) throw new Error('Failed to fetch templates')
  return response.json()
}

export async function createTemplate(template: Omit<Template, 'id'>): Promise<Template> {
  const response = await fetch(`${API_BASE}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template)
  })
  if (!response.ok) throw new Error('Failed to create template')
  return response.json()
}

export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete template')
}

export async function runTemplate(
  id: string,
  model: string,
  provider: string,
  variables: Record<string, string>,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const body = { model, provider, variables }
  const response = await fetch(`${API_BASE}/templates/${id}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) throw new Error('Failed to run template')

  let fullResponse = ''
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) throw new Error('No response body')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    fullResponse += chunk
    if (onChunk) onChunk(chunk)
  }

  return fullResponse
}

// Pipelines
export async function getPipelines(): Promise<Pipeline[]> {
  const response = await fetch(`${API_BASE}/pipelines`)
  if (!response.ok) throw new Error('Failed to fetch pipelines')
  return response.json()
}

export async function createPipeline(pipeline: Omit<Pipeline, 'id' | 'createdAt'>): Promise<Pipeline> {
  const response = await fetch(`${API_BASE}/pipelines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline)
  })
  if (!response.ok) throw new Error('Failed to create pipeline')
  return response.json()
}

export async function runPipeline(
  id: string,
  input: string,
  onChunk?: (stepIndex: number, chunk: string) => void
): Promise<string[]> {
  const response = await fetch(`${API_BASE}/pipelines/${id}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input })
  })

  if (!response.ok) throw new Error('Failed to run pipeline')

  const results: string[] = []
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) throw new Error('No response body')

  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value)
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const data = JSON.parse(line.slice(5))
          if (data.stepIndex !== undefined) {
            results[data.stepIndex] = data.content
            if (onChunk) onChunk(data.stepIndex, data.content)
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  return results
}

// Usage
export async function getUsage(): Promise<Usage> {
  const response = await fetch(`${API_BASE}/usage`)
  if (!response.ok) throw new Error('Failed to fetch usage')
  return response.json()
}
