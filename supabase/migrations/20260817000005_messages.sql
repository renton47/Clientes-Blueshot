-- =============================================================================
-- MIGRACIÓN 005: TABLA MESSAGES
-- Mensajes de cada conversación
-- =============================================================================

-- Tipo enum para roles de mensaje
DO $$ BEGIN
  CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role            public.message_role NOT NULL,
  content         TEXT NOT NULL,
  -- Metadata flexible: tokens usados, modelo, tool_input, etc.
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);

COMMENT ON TABLE public.messages IS 'Mensajes individuales de conversaciones con Blueshot AI';
COMMENT ON COLUMN public.messages.metadata IS 'JSONB con datos adicionales: tokens, modelo, tool_input, etc.';
