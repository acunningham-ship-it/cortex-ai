import { Conversation } from '../../lib/api'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNewChat: () => void
  loading: boolean
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  onNewChat,
  loading
}: ConversationListProps) {
  return (
    <div className="w-64 bg-cortex-card border-r border-cortex-border flex flex-col overflow-hidden">
      {/* New Chat Button */}
      <div className="p-4 border-b border-cortex-border">
        <button
          onClick={onNewChat}
          className="w-full py-2 px-4 bg-cortex-green text-black rounded-lg font-medium text-sm hover:bg-cortex-green hover:brightness-110 transition-all"
        >
          + New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-12 bg-cortex-border bg-opacity-50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No conversations yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`flex items-center gap-2 p-3 rounded-lg transition-all group ${
                  selectedId === conv.id
                    ? 'bg-cortex-cyan bg-opacity-10 border border-cortex-cyan'
                    : 'hover:bg-cortex-border hover:bg-opacity-50 border border-transparent'
                }`}
              >
                <button
                  onClick={() => onSelect(conv.id)}
                  className="flex-1 text-left overflow-hidden"
                >
                  <p className="text-sm font-medium truncate">
                    {conv.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(conv.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                  title="Delete conversation"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
