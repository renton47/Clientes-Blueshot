// =============================================================================
// TIPOS DEL PORTAL — Estado de UI, sesiones, recursos
// =============================================================================

import type { Client, ClientSettings, Conversation, Message, Resource } from './database'

// -----------------------------------------------------------------------------
// Sesión autenticada
// -----------------------------------------------------------------------------

export interface AuthSession {
  userId: string
  email: string
  client: Client
  settings: ClientSettings | null
}

// -----------------------------------------------------------------------------
// Portal UI state
// -----------------------------------------------------------------------------

export interface DashboardStats {
  totalConversations: number
  totalMessages: number
  totalTokensUsed: number
  recentResources: Resource[]
  recentConversations: Conversation[]
}

// -----------------------------------------------------------------------------
// Chat UI
// -----------------------------------------------------------------------------

export interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
}

export interface ConversationWithLastMessage extends Conversation {
  last_message?: {
    content: string
    created_at: string
    role: string
  }
}

// -----------------------------------------------------------------------------
// Recursos
// -----------------------------------------------------------------------------

export interface ResourceDownloadRequest {
  resourceId: string
}

export interface ResourceDownloadResponse {
  signedUrl: string
  fileName: string
  expiresAt: string
}

// -----------------------------------------------------------------------------
// Auth WordPress
// -----------------------------------------------------------------------------

export interface WPAuthTokenPayload {
  wp_user_id: number
  email: string
  name: string
  iat: number
  exp: number
}

// -----------------------------------------------------------------------------
// API Response wrapper
// -----------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  code?: string
}

export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
