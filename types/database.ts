// =============================================================================
// TIPOS DE BASE DE DATOS — Generados manualmente según el esquema de Supabase
// Todos los campos con DEFAULT en SQL son opcionales en Insert
// =============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          auth_user_id: string | null
          wordpress_user_id: number | null
          email: string
          name: string
          company_name: string | null
          website_url: string | null
          ecommerce_platform: string | null
          industry: string | null
          country: string | null
          tone_of_voice: string | null
          brand_description: string | null
          created_at: string
          updated_at: string
          active: boolean
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          wordpress_user_id?: number | null
          email: string
          name: string
          company_name?: string | null
          website_url?: string | null
          ecommerce_platform?: string | null
          industry?: string | null
          country?: string | null
          tone_of_voice?: string | null
          brand_description?: string | null
          created_at?: string
          updated_at?: string
          active?: boolean
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      client_settings: {
        Row: {
          id: string
          client_id: string
          language: string
          tone: string | null
          country: string | null
          currency: string | null
          seo_preferences: Json | null
          communication_style: string | null
          additional_instructions: string | null
          monthly_ai_request_limit: number
          monthly_token_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          language?: string
          tone?: string | null
          country?: string | null
          currency?: string | null
          seo_preferences?: Json | null
          communication_style?: string | null
          additional_instructions?: string | null
          monthly_ai_request_limit?: number
          monthly_token_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['client_settings']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          client_id: string
          title: string
          tool_id: string | null
          created_at: string
          updated_at: string
          archived: boolean
        }
        Insert: {
          id?: string
          client_id: string
          title?: string
          tool_id?: string | null
          created_at?: string
          updated_at?: string
          archived?: boolean
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      ai_usage: {
        Row: {
          id: string
          client_id: string
          conversation_id: string | null
          tool_id: string | null
          model: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          estimated_cost_usd: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          conversation_id?: string | null
          tool_id?: string | null
          model: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          estimated_cost_usd?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_usage']['Insert']>
      }
      ai_tools: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          category: string | null
          active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          category?: string | null
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_tools']['Insert']>
      }
      knowledge_documents: {
        Row: {
          id: string
          title: string
          content: string
          document_type: 'global' | 'client'
          client_id: string | null
          category: string | null
          metadata: Json | null
          embedding_status: 'pending' | 'processed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          document_type?: 'global' | 'client'
          client_id?: string | null
          category?: string | null
          metadata?: Json | null
          embedding_status?: 'pending' | 'processed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['knowledge_documents']['Insert']>
      }
      knowledge_chunks: {
        Row: {
          id: string
          document_id: string
          content: string
          chunk_index: number
          token_count: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          content: string
          chunk_index: number
          token_count?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['knowledge_chunks']['Insert']>
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          file_path: string
          file_name: string
          file_size: number | null
          resource_type: 'zip' | 'guide' | 'document' | 'video'
          scope: 'all' | 'client' | 'group'
          client_id: string | null
          group_tag: string | null
          active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          file_path: string
          file_name: string
          file_size?: number | null
          resource_type?: 'zip' | 'guide' | 'document' | 'video'
          scope?: 'all' | 'client' | 'group'
          client_id?: string | null
          group_tag?: string | null
          active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['resources']['Insert']>
      }
      wordpress_installations: {
        Row: {
          id: string
          client_id: string
          url: string
          token: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          url: string
          token: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['wordpress_installations']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      message_role: 'user' | 'assistant' | 'system'
      document_scope: 'global' | 'client'
      resource_type: 'zip' | 'guide' | 'document' | 'video'
      resource_scope: 'all' | 'client' | 'group'
      embedding_status: 'pending' | 'processed' | 'failed'
    }
  }
}


// Tipos de conveniencia
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientSettings = Database['public']['Tables']['client_settings']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type AIUsage = Database['public']['Tables']['ai_usage']['Row']
export type AITool = Database['public']['Tables']['ai_tools']['Row']
export type KnowledgeDocument = Database['public']['Tables']['knowledge_documents']['Row']
export type KnowledgeChunk = Database['public']['Tables']['knowledge_chunks']['Row']
export type Resource = Database['public']['Tables']['resources']['Row']

export type WordPressInstallation = Database['public']['Tables']['wordpress_installations']['Row']
