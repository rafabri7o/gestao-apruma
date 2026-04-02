'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, type Mentorado } from '@/lib/supabase'
import StatsCards from '@/components/StatsCards'
import MentoradosTable from '@/components/MentoradosTable'
import EditModal from '@/components/EditModal'

export default function Dashboard() {
  const [mentorados, setMentorados] = useState<Mentorado[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Mentorado | null>(null)
  const [updating, setUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const fetchMentorados = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('mentorados')
      .select('*')
      .order('nome')
    if (error) {
      console.error('Erro ao buscar mentorados:', error)
    }
    setMentorados(data || [])
    setLoading(false)
  }, [])

  const updateFromInstagram = useCallback(async () => {
    setUpdating(true)
    try {
      const res = await fetch('/api/update-posts', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        console.log(`Updated ${data.updated}/${data.total} mentorados`)
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
        await fetchMentorados()
      }
    } catch (err) {
      console.error('Error updating from Instagram:', err)
    }
    setUpdating(false)
  }, [fetchMentorados])

  useEffect(() => {
    fetchMentorados().then(() => {
      // Auto-update Instagram data on load
      updateFromInstagram()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral dos seus mentorados</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-gray-400">Atualizado às {lastUpdate}</span>
          )}
          <button
            onClick={updateFromInstagram}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {updating ? (
              <>
                <span className="animate-spin">🔄</span>
                Atualizando...
              </>
            ) : (
              <>
                📸 Atualizar Instagram
              </>
            )}
          </button>
        </div>
      </div>

      <StatsCards mentorados={mentorados} />

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
          <div className="text-3xl mb-3 animate-pulse">⏳</div>
          Carregando mentorados...
        </div>
      ) : (
        <MentoradosTable
          mentorados={mentorados}
          onEdit={setEditing}
          onRefresh={fetchMentorados}
        />
      )}

      {editing && (
        <EditModal
          mentorado={editing}
          onClose={() => setEditing(null)}
          onSave={() => { setEditing(null); fetchMentorados() }}
          onDelete={() => { setEditing(null); fetchMentorados() }}
        />
      )}
    </div>
  )
}
