'use client'

import { useState } from 'react'
import { supabase, type Mentorado } from '@/lib/supabase'

type Props = {
  mentorado: Mentorado
  onClose: () => void
  onSave: () => void
  onDelete: () => void
}

export default function EditModal({ mentorado, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState({
    nome: mentorado.nome,
    instagram: mentorado.instagram,
    nicho: mentorado.nicho,
    turma: mentorado.turma,
    plano: mentorado.plano,
    seguidores_inicial: mentorado.seguidores_inicial,
    seguidores_atual: mentorado.seguidores_atual,
    posts: mentorado.posts,
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('mentorados')
      .update({
        ...form,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mentorado.id)
    setSaving(false)
    if (error) {
      alert('Erro ao salvar: ' + error.message)
      return
    }
    alert('Mentorado atualizado!')
    onSave()
  }

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${mentorado.nome}?`)) return
    const { error } = await supabase
      .from('mentorados')
      .delete()
      .eq('id', mentorado.id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
      return
    }
    alert('Mentorado excluído!')
    onDelete()
  }

  const inputClass = 'w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar Mentorado</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className={labelClass}>Nome</label>
            <input className={inputClass} value={form.nome} onChange={(e) => handleChange('nome', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Instagram</label>
            <input className={inputClass} value={form.instagram} onChange={(e) => handleChange('instagram', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Nicho</label>
            <input className={inputClass} value={form.nicho} onChange={(e) => handleChange('nicho', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Turma</label>
              <select className={inputClass} value={form.turma} onChange={(e) => handleChange('turma', e.target.value)}>
                <option value="Turma 1">Turma 1</option>
                <option value="Turma 2">Turma 2</option>
                <option value="Turma 3">Turma 3</option>
                <option value="Turma 4">Turma 4</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Plano</label>
              <select className={inputClass} value={form.plano} onChange={(e) => handleChange('plano', Number(e.target.value))}>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Seguidores Inicial</label>
              <input type="number" className={inputClass} value={form.seguidores_inicial} onChange={(e) => handleChange('seguidores_inicial', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Seguidores Atual</label>
              <input type="number" className={inputClass} value={form.seguidores_atual} onChange={(e) => handleChange('seguidores_atual', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Posts</label>
              <input type="number" className={inputClass} value={form.posts} onChange={(e) => handleChange('posts', Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            🗑️ Excluir
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
