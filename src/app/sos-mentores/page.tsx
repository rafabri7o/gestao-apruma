'use client'

import { useState, useEffect, useCallback } from 'react'
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

const levels: Level[] = [
  {
    key: 'atencao-maxima',
    title: 'Atenção Máxima',
    icon: '🔴',
    description: '+90 dias de mentoria, ganhou menos de 10K seguidores, postando pelo menos 5x por semana',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    iconBg: 'bg-red-100',
  },
  {
    key: 'precisa-ajuda',
    title: 'Precisa de Ajuda',
    icon: '🟡',
    description: '+90 dias de mentoria, ganhou menos de 30K seguidores, postando pelo menos 5x por semana',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
  {
    key: 'fique-de-olho',
    title: 'Fique de Olho',
    icon: '🟠',
    description: '+60 dias de mentoria, ganhou menos de 10K seguidores',
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    iconBg: 'bg-orange-100',
  },
]

function getDaysInMentoria(dataInicio: string): number {
  const inicio = new Date(dataInicio)
  const agora = new Date()
  return Math.floor((agora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
}

function classifyMentorados(mentorados: Mentorado[]) {
  const atencaoMaxima: Mentorado[] = []
  const precisaAjuda: Mentorado[] = []
  const fiqueDeOlho: Mentorado[] = []

  const atencaoMaximaIds = new Set<string>()
  const precisaAjudaIds = new Set<string>()

  for (const m of mentorados) {
    const dias = getDaysInMentoria(m.data_inicio)
    const gained = m.seguidores_atual - m.seguidores_inicial
    const postsPerWeek = m.posts // posts field = posts last 7 days

    // Atenção Máxima: 90+ dias, <10K ganhos, postando >=5/semana
    if (dias >= 90 && gained < 10000 && postsPerWeek >= 5) {
      atencaoMaxima.push(m)
      atencaoMaximaIds.add(m.id)
    }
  }

  for (const m of mentorados) {
    if (atencaoMaximaIds.has(m.id)) continue
    const dias = getDaysInMentoria(m.data_inicio)
    const gained = m.seguidores_atual - m.seguidores_inicial
    const postsPerWeek = m.posts

    // Precisa de Ajuda: 90+ dias, <30K ganhos, postando >=5/semana
    if (dias >= 90 && gained < 30000 && postsPerWeek >= 5) {
      precisaAjuda.push(m)
      precisaAjudaIds.add(m.id)
    }
  }

  for (const m of mentorados) {
    if (atencaoMaximaIds.has(m.id) || precisaAjudaIds.has(m.id)) continue
    const dias = getDaysInMentoria(m.data_inicio)
    const gained = m.seguidores_atual - m.seguidores_inicial

    // Fique de Olho: 60+ dias, <10K ganhos
    if (dias >= 60 && gained < 10000) {
      fiqueDeOlho.push(m)
    }
  }

  return { 'atencao-maxima': atencaoMaxima, 'precisa-ajuda': precisaAjuda, 'fique-de-olho': fiqueDeOlho }
}

function MentoradoCard({ m, level }: { m: Mentorado; level: Level }) {
  const dias = getDaysInMentoria(m.data_inicio)
  const gained = m.seguidores_atual - m.seguidores_inicial

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${level.borderColor} ${level.bgColor} transition-all hover:shadow-sm`}>
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
          <div className="text-gray-400">Dias</div>
          <div className="font-bold text-gray-700">{dias}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Ganhou</div>
          <div className={`font-bold ${gained >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {gained >= 0 ? '+' : ''}{formatNumber(gained)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Posts/sem</div>
          <div className="font-bold text-gray-700">{m.posts}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Turma</div>
          <div className="font-bold text-gray-700 truncate max-w-[80px]">{m.turma}</div>
        </div>
      </div>
    </div>
  )
}

export default function SosMentoresPage() {
  const [mentorados, setMentorados] = useState<Mentorado[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMentorados = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('mentorados').select('*').order('nome')
    setMentorados(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMentorados()
  }, [fetchMentorados])

  const classified = classifyMentorados(mentorados)
  const totalAlerts = Object.values(classified).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOS Mentores</h1>
          <p className="text-gray-500 text-sm mt-1">
            Mentorados que precisam de atenção especial
            {!loading && <span className="ml-2 font-medium text-gray-700">({totalAlerts} alertas)</span>}
          </p>
        </div>
      </div>

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
                      <MentoradoCard key={m.id} m={m} level={level} />
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
