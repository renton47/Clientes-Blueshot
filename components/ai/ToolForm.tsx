'use client'

import { useState } from 'react'
import type { ToolSlug } from '@/types/ai'

interface ToolFormProps {
  toolSlug: string
  onSubmit: (input: Record<string, unknown>) => void
  onCancel: () => void
  isLoading: boolean
}

export function ToolForm({ toolSlug, onSubmit, onCancel, isLoading }: ToolFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  function update(field: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(formData)
  }

  function field(id: string, label: string, placeholder: string, required = false, type: 'input' | 'textarea' = 'input') {
    return (
      <div className="form-group" key={id}>
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--blue-primary)' }}>*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            id={id}
            className="form-textarea"
            placeholder={placeholder}
            value={(formData[id] as string) ?? ''}
            onChange={(e) => update(id, e.target.value)}
            required={required}
            style={{ minHeight: 80 }}
          />
        ) : (
          <input
            id={id}
            type="text"
            className="form-input"
            placeholder={placeholder}
            value={(formData[id] as string) ?? ''}
            onChange={(e) => update(id, e.target.value)}
            required={required}
          />
        )}
      </div>
    )
  }

  const forms: Record<string, React.ReactNode> = {
    product_copy: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {field('name', 'Nombre del producto', 'Ej: Audífonos Bluetooth Pro X200', true)}
        {field('brand', 'Marca', 'Ej: Sony, Samsung, marca propia...')}
        {field('model', 'Modelo', 'Ej: WH-1000XM5')}
        {field('features', 'Características', 'Ej: Cancelación de ruido, 30h batería, carga rápida...', true, 'textarea')}
        {field('benefits', 'Beneficios', 'Qué problema resuelve, por qué es mejor...', false, 'textarea')}
        {field('target_audience', 'Público objetivo', 'Ej: Profesionales que trabajan desde casa')}
        {field('price', 'Precio (referencial)', 'Ej: $89.990')}
        {field('additional_info', 'Información adicional', 'Cualquier dato extra relevante', false, 'textarea')}
      </div>
    ),
    seo_product: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {field('product_name', 'Nombre del producto', 'Ej: Zapatillas Running Trail Nike React', true)}
        {field('category', 'Categoría', 'Ej: Calzado / Zapatillas')}
        {field('description', 'Descripción del producto', 'Describe el producto con el máximo detalle posible', true, 'textarea')}
        {field('target_keywords', 'Keywords objetivo (opcional)', 'Palabras clave que ya tienes en mente', false, 'textarea')}
        {field('competitor_info', 'Información de la competencia (opcional)', 'Competidores directos, sus keywords, etc.', false, 'textarea')}
      </div>
    ),
    google_shopping: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {field('product_name', 'Nombre del producto', 'Ej: Televisor Samsung 55" QLED 4K', true)}
        {field('brand', 'Marca', 'Ej: Samsung')}
        {field('gtin', 'GTIN / EAN / UPC', '13 dígitos si lo tienes')}
        {field('category', 'Categoría', 'Ej: Televisores > Smart TV')}
        {field('description', 'Descripción', 'Descripción completa del producto', true, 'textarea')}
        {field('price', 'Precio', 'Ej: 599990')}
        <div className="form-group">
          <label className="form-label">Moneda</label>
          <select
            className="form-select"
            value={(formData.currency as string) ?? 'CLP'}
            onChange={(e) => update('currency', e.target.value)}
          >
            <option value="CLP">CLP — Peso Chileno</option>
            <option value="USD">USD — Dólar</option>
            <option value="ARS">ARS — Peso Argentino</option>
            <option value="PEN">PEN — Sol Peruano</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Condición</label>
          <select
            className="form-select"
            value={(formData.condition as string) ?? 'new'}
            onChange={(e) => update('condition', e.target.value)}
          >
            <option value="new">Nuevo</option>
            <option value="used">Usado</option>
            <option value="refurbished">Reacondicionado</option>
          </select>
        </div>
      </div>
    ),
    social_copy: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {field('product_name', 'Producto o servicio', 'Ej: Crema hidratante con ácido hialurónico', true)}
        {field('description', 'Descripción', 'Características, beneficios, qué lo hace especial', true, 'textarea')}
        {field('promotion', 'Promoción (opcional)', 'Ej: 20% de descuento, envío gratis...')}
        <div className="form-group">
          <label className="form-label">Plataformas <span style={{ color: 'var(--blue-primary)' }}>*</span></label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
            {['instagram', 'facebook', 'linkedin'].map((platform) => {
              const selected = ((formData.platforms as string[]) ?? []).includes(platform)
              return (
                <label
                  key={platform}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${selected ? 'var(--blue-primary)' : 'var(--border)'}`,
                    background: selected ? 'var(--blue-glow)' : 'transparent',
                    color: selected ? 'var(--blue-primary)' : 'var(--text-secondary)',
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ display: 'none' }}
                    checked={selected}
                    onChange={(e) => {
                      const current = (formData.platforms as string[]) ?? []
                      update('platforms', e.target.checked
                        ? [...current, platform]
                        : current.filter((p) => p !== platform))
                    }}
                  />
                  {platform === 'instagram' ? '📸' : platform === 'facebook' ? '👥' : '💼'}
                  {' '}
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </label>
              )
            })}
          </div>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={(formData.hashtags as boolean) ?? true}
              onChange={(e) => update('hashtags', e.target.checked)}
            />
            <span className="form-label" style={{ margin: 0 }}>Incluir hashtags</span>
          </label>
        </div>
      </div>
    ),
    product_optimization: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {field('existing_content', 'Pega aquí tu ficha de producto actual', 'Incluye título, descripción, bullets, meta tags... todo lo que tengas', true, 'textarea')}
        <div className="form-group">
          <label className="form-label">Tipo de contenido</label>
          <select
            className="form-select"
            value={(formData.content_type as string) ?? 'product'}
            onChange={(e) => update('content_type', e.target.value)}
          >
            <option value="product">Producto</option>
            <option value="category">Categoría</option>
            <option value="page">Página</option>
          </select>
        </div>
      </div>
    ),
  }

  const currentForm = forms[toolSlug]

  if (!currentForm) {
    return (
      <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 14 }}>
        Herramienta no encontrada: {toolSlug}
      </div>
    )
  }

  const toolNames: Record<string, string> = {
    product_copy: '📦 Ficha de Producto',
    seo_product: '🔍 SEO de Producto',
    google_shopping: '🛒 Google Shopping',
    social_copy: '📱 Copy para Redes Sociales',
    product_optimization: '⚡ Optimización de Producto',
  }

  return (
    <div className="card" style={{ margin: '20px 0' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{toolNames[toolSlug]}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Completa los campos para generar el contenido optimizado
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {currentForm}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                Generando...
              </>
            ) : (
              '✦ Generar con IA'
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
