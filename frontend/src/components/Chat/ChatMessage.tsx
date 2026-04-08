import { Message } from '../../lib/api'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ChatMessageProps {
  message: Message
  timestamp?: Date
}

export default function ChatMessage({ message, timestamp }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const time = timestamp ? timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div className={`flex gap-4 mb-6 animate-fade-in ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cortex-purple to-cortex-cyan flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
          AI
        </div>
      )}

      <div
        className={`max-w-2xl ${
          isUser
            ? 'bg-cortex-cyan bg-opacity-90 text-black rounded-2xl rounded-tr-none shadow-lg'
            : 'bg-cortex-card border border-cortex-border rounded-2xl rounded-tl-none'
        } p-4`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : 'text'
                  const isBlock = !!match

                  return isBlock ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={language}
                      PreTag="div"
                      className="rounded my-2 text-xs"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      {...props}
                      className="bg-cortex-border px-1.5 py-0.5 rounded text-cortex-cyan text-xs"
                    >
                      {children}
                    </code>
                  )
                },
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cortex-cyan hover:underline"
                  >
                    {children}
                  </a>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => <li className="text-sm">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-cortex-cyan pl-4 my-2 italic text-gray-300">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <table className="border-collapse border border-cortex-border my-2 w-full text-sm">
                    {children}
                  </table>
                ),
                thead: ({ children }) => (
                  <thead className="bg-cortex-border">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-cortex-border p-2 text-left">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-cortex-border p-2">{children}</td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 gap-2">
          {message.model && (
            <p className="text-xs text-gray-500 opacity-70">
              {message.provider}/{message.model}
            </p>
          )}
          {time && (
            <p className={`text-xs ${isUser ? 'text-black opacity-60' : 'text-gray-500 opacity-70'}`}>
              {time}
            </p>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cortex-green to-cortex-cyan flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
          YOU
        </div>
      )}
    </div>
  )
}
