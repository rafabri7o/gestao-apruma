'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, type Mentorado } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'

type Level = {
  key: string
  title: string
  icon: string
  description: string
  borderColor: string
  bgColor: string
  badgeBg: string
  badgeText: string
  iconBg: string
}

type Abordagem = {
  mentorado_id: string
  box_index: number
  marked_at: string
}

const levels: Level[] = [
  {
    key: 'atencao-maxima',
    title: 'Atenção Máxima',
    icon: '🔴',
    description: 'Postaram menos de 1 publicação nos últimos 7 dias',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    iconBg: 'bg-red-100',
  },
  {
    key: 'de-um-toque',
    title: 'Dê um Toque',
    icon: '🟡',
    description: 'Postaram menos de 3 publicações nos últimos 7 dias',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
]

const TOTAL_BOXES = 10

function classifyMentorados(mentorados: Mentorado[]) {
  const atencaoMaxima: Mentorado[] = []
  const deUmToque: Mentorado[] = []
  const atencaoIds = new Set<string>()

  for (const m of mentorados) {
    if (m.posts < 1) {
      atencaoMaxima.push(m)
      atencaoIds.add(m.id)
    }
  }

  for (const m of mentorados) {
    if (atencaoIds.has(m.id)) continue
    if (m.posts < 3) {
      deUmToque.push(m)
    }
  }

  return { 'atencao-maxima': atencaoMaxima, 'de-um-toque': deUmToque }
}

function AbordagemBoxes({
  mentoradoId,
  abordagens,
  onToggle,
}: {
  mentoradoId: string
  abordagens: Abordagem[]
  onToggle: (mentoradoId: string, boxIndex: number) => void
}) {
  const markedByIndex = useMemo(() => {
    const map = new Map<number, string>()
    for (const a of abordagens) {
      if (a.mentorado_id === mentoradoId) {
        map.set(a.box_index, a.marked_at)
      }
    }
    return map
  }, [abordagens, mentoradoId])

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: TOTAL_BOXES }, (_, i) => {
        const markedAt = markedByIndex.get(i)
        const isMarked = !!markedAt
        const formattedDate = markedAt
          ? new Date(markedAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''

        return (
          <div key={i} className="relative group">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(mentoradoId, i) }}
              className={`w-6 h-6 rounded border-2 transition-all flex items-center justify-center text-xs ${
                isMarked
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-white border-gray-300 hover:border-brand-400'
              }`}
            >
              {isMarked && '✓'}
            </button>
            {isMarked && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {formattedDate}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MentoradoCard({
  m,
  level,
  abordagens,
  onToggle,
}: {
  m: Mentorado
  level: Level
  abordagens: Abordagem[]
  onToggle: (mentoradoId: string, boxIndex: number) => void
}) {
  const gained = m.seguidores_atual - m.seguidores_inicial

  return (
    <div className={`p-4 rounded-xl border ${level.borderColor} ${level.bgColor} transition-all hover:shadow-sm`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white overflow-hidden flex-shrink-0 shadow-sm">
          {m.avatar && m.avatar.includes('supabase') ? (
            <img
              src={m.avatar}
              alt={m.nome}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nome)}&background=E8DEF8&color=6B21A8&size=96` }}
            />
          ) : (
            <img
              src={m.instagram ? `/api/avatar/${m.instagram}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nome)}&background=E8DEF8&color=6B21A8&size=96`}
              alt={m.nome}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nome)}&background=E8DEF8&color=6B21A8&size=96` }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">{m.nome}</div>
          <div className="text-xs text-gray-500">@{m.instagram}</div>
        </div>

        <div className="flex items-center gap-3 text-xs flex-shrink-0">
          <div className="text-center">
            <div className="text-gray-400">Posts/sem</div>
            <div className={`font-bold ${m.posts === 0 ? 'text-red-600' : 'text-amber-600'}`}>{m.posts}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Seguidores</div>
            <div className="font-bold text-gray-700">{formatNumber(m.seguidores_atual)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Ganhou</div>
            <div className={`font-bold ${gained >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {gained >= 0 ? '+' : ''}{formatNumber(gained)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Turma</div>
            <div className="font-bold text-gray-700 truncate max-w-[80px]">{m.turma}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-3">
        <span className="text-xs text-gray-500 flex-shrink-0">Abordagens:</span>
        <AbordagemBoxes mentoradoId={m.id} abordagens={abordagens} onToggle={onToggle} />
      </div>
    </div>
  )
}

export default function SosCsPage() {
  const [mentorados, setMentorados] = useState<Mentorado[]>([])
  const [abordagens, setAbordagens] = useState<Abordagem[]>([])
  const [loading, setLoading] = useState(true)
  const [turmaFilter, setTurmaFilter] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [mentRes, abrRes] = await Promise.all([
      supabase.from('mentorados').select('*').order('nome'),
      supabase.from('sos_abordagens').select('mentorado_id, box_index, marked_at'),
    ])
    setMentorados(mentRes.data || [])
    setAbordagens(abrRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleToggle = useCallback(async (mentoradoId: string, boxIndex: number) => {
    const existing = abordagens.find(
      (a) => a.mentorado_id === mentoradoId && a.box_index === boxIndex
    )

    if (existing) {
      await supabase
        .from('sos_abordagens')
        .delete()
        .eq('mentorado_id', mentoradoId)
        .eq('box_index', boxIndex)

      setAbordagens((prev) =>
        prev.filter((a) => !(a.mentorado_id === mentoradoId && a.box_index === boxIndex))
      )
    } else {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('sos_abordagens')
        .insert({ mentorado_id: mentoradoId, box_index: boxIndex, marked_at: now })

      if (!error) {
        setAbordagens((prev) => [
          ...prev,
          { mentorado_id: mentoradoId, box_index: boxIndex, marked_at: now },
        ])
      }
    }
  }, [abordagens])

  const turmas = useMemo(() => [...new Set(mentorados.map((m) => m.turma))].sort(), [mentorados])

  const filtered = useMemo(() => {
    if (!turmaFilter) return mentorados
    return mentorados.filter((m) => m.turma === turmaFilter)
  }, [mentorados, turmaFilter])

  const classified = classifyMentorados(filtered)
  const totalAlerts = Object.values(classified).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOS CS</h1>
          <p className="text-gray-500 text-sm mt-1">
            Mentorados com poucas publicações na semana
            {!loading && <span className="ml-2 font-medium text-gray-700">({totalAlerts} alertas)</span>}
          </p>
        </div>
      </div>

      {!loading && (
        <div className="mb-6">
          <select
            value={turmaFilter}
            onChange={(e) => setTurmaFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-colors bg-white"
          >
            <option value="">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
          <div className="text-3xl mb-3 animate-pulse">⏳</div>
          Analisando mentorados...
        </div>
      ) : (
        <div className="space-y-8">
          {levels.map((level) => {
            const list = classified[level.key as keyof typeof classified]
            return (
              <div key={level.key} className="animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${level.iconBg} flex items-center justify-center text-lg`}>
                    {level.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">{level.title}</h2>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${level.badgeBg} ${level.badgeText}`}>
                        {list.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{level.description}</p>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="text-sm">Nenhum mentorado neste nível</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {list.map((m) => (
                      <MentoradoCard key={m.id} m={m} level={level} abordagens={abordagens} onToggle={handleToggle} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
