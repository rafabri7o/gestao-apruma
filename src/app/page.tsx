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

  useEffect(() => {
    fetchMentorados()
  }, [fetchMentorados])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral dos seus mentorados</p>
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
