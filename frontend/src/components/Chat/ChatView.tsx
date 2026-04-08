import { useState, useEffect, useRef } from 'react'
import { Conversation, Message, createConversation, getConversations, streamChat, deleteConversation, getConversation } from '../../lib/api'
import ChatMessage from './ChatMessage'
import ConversationList from './ConversationList'

interface ChatViewProps {
  selectedModel: string
  selectedProvider: string
}

interface MessageWithTimestamp extends Message {
  timestamp?: Date
}

export default function ChatView({ selectedModel, selectedProvider }: ChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageWithTimestamp[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setConversationsLoading(true)
        const data = await getConversations()
        setConversations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations')
      } finally {
        setConversationsLoading(false)
      }
    }
    loadConversations()
  }, [])

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle new conversation
  const handleNewChat = async () => {
    try {
      setError(null)
      const newConversation = await createConversation('New Chat')
      setConversations([newConversation, ...conversations])
      setCurrentConversation(newConversation)
      setMessages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation')
    }
  }

  // Handle conversation selection
  const handleSelectConversation = async (conversationId: string) => {
    try {
      setError(null)
      const conversation = await getConversation(conversationId)
      setCurrentConversation(conversation)
      setMessages(conversation.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation')
    }
  }

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      setConversations(conversations.filter(c => c.id !== conversationId))
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
        setMessages([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation')
    }
  }

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return
    if (!currentConversation && conversationsLoading) return

    try {
      setError(null)
      const messageText = inputValue.trim()
      setInputValue('')

      // Create conversation if needed
      let conv = currentConversation
      if (!conv) {
        conv = await createConversation('New Chat')
        setConversations([conv, ...conversations])
        setCurrentConversation(conv)
      }

      // Add user message
      const userMessage: MessageWithTimestamp = {
        role: 'user',
        content: messageText,
        model: selectedModel,
        provider: selectedProvider,
        timestamp: new Date()
      }
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)

      // Stream assistant response
      setIsLoading(true)
      let assistantContent = ''

      try {
        const result = await streamChat(
          selectedModel,
          selectedProvider,
          messageText,
          conv.id,
          (chunk) => {
            setMessages(prev => {
              const last = prev[prev.length - 1]
              if (last?.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + chunk }
                ]
              }
              return prev
            })
          }
        )
        assistantContent = result.fullResponse
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get response'
        setError(errorMsg)
        // Still add a failed response message
        assistantContent = `Error: ${errorMsg}`
      }

      // Ensure assistant message is in state
      setMessages(prev => {
        const hasAssistant = prev.some(m => m.role === 'assistant' && m.content === assistantContent)
        if (!hasAssistant) {
          return [
            ...prev,
            {
              role: 'assistant',
              content: assistantContent,
              model: selectedModel,
              provider: selectedProvider,
              timestamp: new Date()
            }
          ]
        }
        return prev
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  // Handle textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  // Suggested prompts
  const suggestedPrompts = [
    'Write a TypeScript function to validate email addresses',
    'Explain how React hooks work',
    'Create a SQL query to find duplicate records',
    'Generate a Python script for data processing',
  ]

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversations Sidebar */}
      <ConversationList
        conversations={conversations}
        selectedId={currentConversation?.id}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
        loading={conversationsLoading}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8">
          {messages.length === 0 && !currentConversation ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-8">
                <div className="text-5xl mb-4">💬</div>
                <h1 className="text-3xl font-bold mb-2">Start a Conversation</h1>
                <p className="text-gray-400 mb-8">Select a model and ask anything</p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-w-2xl">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputValue(prompt)
                      handleNewChat()
                    }}
                    className="text-left p-4 rounded-xl bg-cortex-card border border-cortex-border hover:border-cortex-cyan hover:bg-cortex-border hover:shadow-lg hover:shadow-cortex-cyan/20 transition-all"
                  >
                    <p className="text-sm text-gray-300">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} timestamp={msg.timestamp} />
              ))}
              {isLoading && (
                <div className="flex gap-3 mb-6 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-cortex-purple flex items-center justify-center text-xs font-bold">
                    AI
                  </div>
                  <div className="flex gap-1 items-end">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-8 mb-4 p-4 bg-red-900 bg-opacity-20 border border-red-500 border-opacity-50 rounded-lg text-red-300 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-8 border-t border-cortex-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Shift+Enter for newline)"
                className="flex-1 bg-cortex-card border border-cortex-border rounded-xl p-3 text-sm focus:outline-none focus:border-cortex-cyan focus:ring-1 focus:ring-cortex-cyan resize-none max-h-48 transition-all"
                rows={1}
                disabled={isLoading || !currentConversation && !conversationsLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim() || (!currentConversation && conversationsLoading)}
                className="px-6 py-3 bg-cortex-cyan text-black rounded-xl font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cortex-cyan/20 hover:shadow-cortex-cyan/40"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedProvider}/{selectedModel}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
