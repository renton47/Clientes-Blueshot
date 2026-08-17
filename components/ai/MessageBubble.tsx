'use client'

import { useState } from 'react'
import type { Message } from '@/types/database'

interface MessageBubbleProps {
  message: Message
  clientName: string
  isStreaming?: boolean
}

// Renderizado simple de Markdown a HTML para el chat
function renderMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Code block
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Horizontal rule
    .replace(/^---$/gm, '<hr>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<') || line.trim() === '') return line
      return line
    })
}

export function MessageBubble({ message, clientName, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  if (message.role === 'system') return null

  const isUser = message.role === 'user'

  const initials = clientName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function copyContent() {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`message-bubble ${isUser ? 'user' : ''}`}
      style={{ maxWidth: 800, width: '100%', alignSelf: isUser ? 'flex-end' : 'flex-start' }}
    >
      <div className={`message-avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? initials : '✦'}
      </div>
      <div className="message-content">
        <div
          className={`message-text ${isStreaming ? 'streaming-cursor' : ''}`}
          dangerouslySetInnerHTML={{
            __html: isUser
              ? message.content.replace(/\n/g, '<br>')
              : renderMarkdown(message.content),
          }}
        />
        {!isUser && !isStreaming && (
          <div className="message-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={copyContent}
              style={{ fontSize: 12, padding: '4px 8px' }}
              title="Copiar respuesta"
            >
              {copied ? '✓ Copiado' : '⎘ Copiar'}
            </button>
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {new Date(message.created_at).toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
