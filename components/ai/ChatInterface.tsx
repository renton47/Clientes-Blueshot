'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TOOL_DEFINITIONS } from '@/types/ai'
import { ToolForm } from './ToolForm'
import { MessageBubble } from './MessageBubble'
import type { Client, ClientSettings, AITool, Conversation, Message } from '@/types/database'

interface ChatInterfaceProps {
  client: Client
  settings: ClientSettings | null
  tools: AITool[]
  initialConversations: Conversation[]
}

export function ChatInterface({
  client,
  settings,
  tools,
  initialConversations,
}: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [showToolForm, setShowToolForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Hacer scroll al último mensaje
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Cargar mensajes de la conversación activa
  useEffect(() => {
    if (!activeConversation) {
      setMessages([])
      return
    }

    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConversation.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data ?? []))
  }, [activeConversation, supabase])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [inputMessage])

  async function sendMessage(toolInput?: Record<string, unknown>) {
    const message = toolInput ? `Usando herramienta: ${selectedTool}` : inputMessage.trim()
    if (!message && !toolInput) return
    if (isStreaming) return

    setIsLoading(true)
    setIsStreaming(true)
    setStreamingContent('')
    setError(null)

    const userMessage = inputMessage.trim() || `[Herramienta: ${selectedTool}]`

    // Optimistic UI: agregar mensaje del usuario
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversation?.id ?? '',
      role: 'user',
      content: userMessage,
      metadata: {},
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])
    setInputMessage('')
    setShowToolForm(false)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: activeConversation?.id,
          tool_id: toolInput ? selectedTool : undefined,
          tool_input: toolInput,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Error del servidor')
      }

      // Leer el stream SSE
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let newConvId: string | undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.chunk) {
              fullContent += data.chunk
              setStreamingContent(fullContent)
            } else if (data.done) {
              newConvId = data.conversation_id
            } else if (data.error) {
              throw new Error(data.error)
            }
          } catch { /* línea incompleta, continuar */ }
        }
      }

      // Mensaje completo: actualizar estado
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        conversation_id: newConvId ?? activeConversation?.id ?? '',
        role: 'assistant',
        content: fullContent,
        metadata: {},
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Actualizar conversación activa si era nueva
      if (newConvId && !activeConversation) {
        const { data: newConv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', newConvId)
          .single()

        if (newConv) {
          setActiveConversation(newConv)
          setConversations((prev) => [newConv, ...prev])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el mensaje')
      // Remover el mensaje temporal
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingContent('')
    }
  }

  async function deleteConversation(convId: string) {
    await supabase.from('conversations').delete().eq('id', convId)
    setConversations((prev) => prev.filter((c) => c.id !== convId))
    if (activeConversation?.id === convId) {
      setActiveConversation(null)
      setMessages([])
    }
  }

  async function archiveConversation(convId: string) {
    await supabase.from('conversations').update({ archived: true }).eq('id', convId)
    setConversations((prev) => prev.filter((c) => c.id !== convId))
    if (activeConversation?.id === convId) {
      setActiveConversation(null)
      setMessages([])
    }
  }

  function newConversation() {
    setActiveConversation(null)
    setMessages([])
    setSelectedTool(null)
    setShowToolForm(false)
    setInputMessage('')
  }

  const toolDef = TOOL_DEFINITIONS.find((t) => t.slug === selectedTool)

  return (
    <div className="chat-layout" style={{ height: '100vh', marginLeft: 'var(--sidebar-width)' }}>
      {/* Chat Sidebar — conversaciones */}
      <div className="chat-sidebar" style={{ display: sidebarOpen ? 'flex' : 'none' }}>
        <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', gap: 8 }}
            onClick={newConversation}
          >
            <span>+</span> Nueva conversación
          </button>
        </div>

        {/* Selector de herramientas */}
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
          <div className="sidebar-section-label" style={{ paddingTop: 0 }}>Herramientas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TOOL_DEFINITIONS.map((tool) => (
              <button
                key={tool.slug}
                className={`nav-item ${selectedTool === tool.slug ? 'active' : ''}`}
                style={{ textAlign: 'left', fontSize: 13 }}
                onClick={() => {
                  setSelectedTool(selectedTool === tool.slug ? null : tool.slug)
                  setShowToolForm(selectedTool !== tool.slug)
                  newConversation()
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {tool.category === 'seo' ? '🔍' : tool.category === 'redes' ? '📱' : tool.category === 'shopping' ? '🛒' : '📦'}
                </span>
                <span>{tool.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Historial de conversaciones */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
          <div className="sidebar-section-label">Historial</div>
          {conversations.length === 0 ? (
            <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Aún no tienes conversaciones
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`nav-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
                  style={{ cursor: 'pointer', position: 'relative', paddingRight: 36 }}
                  onClick={() => setActiveConversation(conv)}
                >
                  <span style={{ fontSize: 14 }}>✦</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                    {conv.title}
                  </span>
                  <button
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 14, padding: '2px 4px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conv.id)
                    }}
                    title="Eliminar conversación"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Main */}
      <div className="chat-main">
        {/* Header del chat */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-surface)',
        }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen((v) => !v)}
            title="Toggle sidebar"
          >
            ☰
          </button>
          <div style={{ flex: 1 }}>
            {toolDef ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{toolDef.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{toolDef.description}</div>
              </>
            ) : activeConversation ? (
              <div style={{ fontSize: 14, fontWeight: 600 }}>{activeConversation.title}</div>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600 }}>Blueshot AI</div>
            )}
          </div>
          {activeConversation && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => archiveConversation(activeConversation.id)}
              title="Archivar conversación"
              style={{ fontSize: 12 }}
            >
              Archivar
            </button>
          )}
        </div>

        {/* Área de mensajes */}
        <div className="chat-messages">
          {/* Welcome state */}
          {messages.length === 0 && !showToolForm && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '40px 20px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64,
                background: 'var(--blue-primary)',
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 0 40px rgba(7,98,255,0.3)',
              }}>
                ✦
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Blueshot AI</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400 }}>
                  Tu asistente especializado en e-commerce, SEO y marketing digital.
                  Selecciona una herramienta o escribe tu pregunta.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {TOOL_DEFINITIONS.slice(0, 3).map((tool) => (
                  <button
                    key={tool.slug}
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedTool(tool.slug)
                      setShowToolForm(true)
                    }}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tool form */}
          {showToolForm && selectedTool && (
            <div style={{ maxWidth: 680, width: '100%', margin: '0 auto' }}>
              <ToolForm
                toolSlug={selectedTool}
                onSubmit={(input) => sendMessage(input)}
                onCancel={() => { setShowToolForm(false); setSelectedTool(null) }}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Messages */}
          {!showToolForm && messages.map((message) => (
            <MessageBubble key={message.id} message={message} clientName={client.name} />
          ))}

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <MessageBubble
              message={{
                id: 'streaming',
                conversation_id: '',
                role: 'assistant',
                content: streamingContent,
                metadata: {},
                created_at: new Date().toISOString(),
              }}
              clientName={client.name}
              isStreaming
            />
          )}

          {/* Loading indicator */}
          {isLoading && !isStreaming && (
            <div className="message-bubble" style={{ maxWidth: 800 }}>
              <div className="message-avatar assistant">✦</div>
              <div style={{ padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', borderTopLeftRadius: 4 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--blue-primary)',
                      animation: `pulse-blue 1.2s ease ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius)',
              color: 'var(--error)',
              fontSize: 13,
              maxWidth: 600,
            }}>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        {!showToolForm && (
          <div className="chat-input-area">
            {selectedTool && !showToolForm && (
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-blue">
                  {toolDef?.name}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowToolForm(true)}
                >
                  Abrir formulario
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12 }}
                  onClick={() => setSelectedTool(null)}
                >
                  ×
                </button>
              </div>
            )}
            <div className="chat-input-wrapper">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder={selectedTool ? `Escribe sobre ${toolDef?.name}...` : 'Pregunta algo a Blueshot AI...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                disabled={isStreaming}
                rows={1}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isStreaming}
                style={{ flexShrink: 0 }}
              >
                {isStreaming ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '→'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
              Enter para enviar · Shift+Enter para nueva línea
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
