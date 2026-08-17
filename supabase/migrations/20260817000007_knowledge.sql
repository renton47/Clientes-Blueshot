-- =============================================================================
-- MIGRACIÓN 007: TABLAS KNOWLEDGE (preparado para RAG)
-- Base de conocimiento de Blueshot con arquitectura para embeddings
-- =============================================================================

-- Tipo de documento
DO $$ BEGIN
  CREATE TYPE public.document_scope AS ENUM ('global', 'client');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.embedding_status AS ENUM ('pending', 'processed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Documentos de conocimiento
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,
  -- global: disponible para todos | client: privado del cliente
  document_type    public.document_scope NOT NULL DEFAULT 'global',
  -- Solo se usa cuando document_type = 'client'
  client_id        UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  category         TEXT,
  metadata         JSONB DEFAULT '{}',
  embedding_status public.embedding_status NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Garantizar que documentos de cliente tienen client_id
  CONSTRAINT chk_client_document CHECK (
    document_type = 'global' OR (document_type = 'client' AND client_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_type ON public.knowledge_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_client_id ON public.knowledge_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_embedding ON public.knowledge_documents(embedding_status);

CREATE TRIGGER knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Chunks de texto para RAG
-- NOTA MVP: La columna embedding (vector) se agrega cuando se active la extensión pgvector
-- Por ahora se almacena como texto plano para no requerir configuración adicional
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  chunk_index   INTEGER NOT NULL,
  token_count   INTEGER,
  metadata      JSONB DEFAULT '{}',
  -- El embedding se almacenará aquí cuando se habilite pgvector:
  -- embedding    vector(1536),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_chunk_position UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id ON public.knowledge_chunks(document_id);

COMMENT ON TABLE public.knowledge_documents IS 'Base de conocimiento de Blueshot: global (para todos) y privada (por cliente)';
COMMENT ON TABLE public.knowledge_chunks IS 'Chunks de documentos preparados para RAG/vector search (pgvector)';
COMMENT ON COLUMN public.knowledge_chunks.metadata IS 'Incluirá el embedding cuando se habilite pgvector en Supabase';
