'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, type Mentorado } from '@/lib/supabase'
import { useUserRole } from '@/lib/useUserRole'
import { formatNumber } from '@/lib/utils'

type Toque = {
  id: string
  mentorado_id: string
  audio_url: string
  created_by_name: string | null
  created_at: string
  passed_to_mentorado: boolean
  passed_at: string | null
  passed_by_name: string | null
}

type ToqueRead = {
  toque_id: string
}

export default function ToqueDoRafaPage() {
  const [mentorados, setMentorados] = useState<Mentorado[]>([])
  const [toques, setToques] = useState<Toque[]>([])
  const [reads, setReads] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const { role, turma: userTurma, name: userName } = useUserRole()
  const isMentor = role === 'mentor'

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [mentRes, toqueRes, userRes] = await Promise.all([
      supabase.from('mentorados').select('*'),
      supabase.from('toques').select('id, mentorado_id, audio_url, created_by_name, created_at, passed_to_mentorado, passed_at, passed_by_name').order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ])
    setMentorados(mentRes.data || [])
    setToques(toqueRes.data || [])

    const uid = userRes.data.user?.id
    if (uid) {
      setUserId(uid)
      const { data: readData } = await supabase
        .from('toque_reads')
        .select('toque_id')
        .eq('user_id', uid)
      setReads(new Set((readData || []).map((r: ToqueRead) => r.toque_id)))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const markAsRead = useCallback(async (toqueId: string) => {
    if (!userId || reads.has(toqueId)) return
    await supabase.from('toque_reads').insert({ toque_id: toqueId, user_id: userId })
    setReads((prev) => new Set([...prev, toqueId]))
  }, [userId, reads])

  const togglePassed = useCallback(async (toqueId: string, currentValue: boolean) => {
    const now = new Date().toISOString()
    await supabase
      .from('toques')
      .update({
        passed_to_mentorado: !currentValue,
        passed_at: !currentValue ? now : null,
        passed_by_name: !currentValue ? (userName || 'Mentor') : null,
      })
      .eq('id', toqueId)

    setToques((prev) =>
      prev.map((t) =>
        t.id === toqueId
          ? { ...t, passed_to_mentorado: !currentValue, passed_at: !currentValue ? now : null, passed_by_name: !currentValue ? (userName || 'Mentor') : null }
          : t
      )
    )
  }, [userName])

  const mentoradoMap = useMemo(() => {
    const map = new Map<string, Mentorado>()
    for (const m of mentorados) map.set(m.id, m)
    return map
  }, [mentorados])

  // Filter toques by turma for mentors
  const filteredToques = useMemo(() => {
    if (isMentor && userTurma) {
      return toques.filter((t) => {
        const m = mentoradoMap.get(t.mentorado_id)
        return m && m.turma === userTurma
      })
    }
    return toques
  }, [toques, isMentor, userTurma, mentoradoMap])

  const unreadCount = filteredToques.filter((t) => !reads.has(t.id)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toque do Rafa</h1>
          <p className="text-gray-500 text-sm mt-1">
            Direcionamentos em áudio para os mentores
            {!loading && unreadCount > 0 && (
              <span className="ml-2 font-medium text-brand-700">({unreadCount} novo{unreadCount > 1 ? 's' : ''})</span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
          <div className="text-3xl mb-3 animate-pulse">⏳</div>
          Carregando toques...
        </div>
      ) : filteredToques.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 animate-fade-in">
          <div className="text-4xl mb-3">🔔</div>
          <div className="text-lg font-medium">Nenhum toque ainda</div>
          <div className="text-sm mt-1">Os toques aparecerão aqui quando forem gravados no SOS Mentores</div>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {filteredToques.map((t) => {
            const m = mentoradoMap.get(t.mentorado_id)
            if (!m) return null
            const isUnread = !reads.has(t.id)
            const gained = m.seguidores_atual - m.seguidores_inicial

            return (
              <div
                key={t.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnread
                    ? 'bg-brand-50 border-brand-200 shadow-sm'
                    : 'bg-white border-gray-100'
                }`}
              >
                {/* Header with unread badge */}
                <div className="flex items-center gap-3 mb-3">
                  {isUnread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(t.created_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span className="text-xs text-brand-600 font-medium">
                        por {t.created_by_name || 'Rafa'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mentorado card mini */}
                <div className="flex items-center gap-3 mb-3 p-3 bg-white/80 rounded-lg border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-brand-100 overflow-hidden flex-shrink-0">
                    {m.avatar && m.avatar.includes('supabase') ? (
                      <img src={m.avatar} alt={m.nome} className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nome)}&background=E8DEF8&color=6B21A8&size=80` }}
                      />
                    ) : (
                      <img
                        src={m.instagram ? `/api/avatar/${m.instagram}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nome)}&background=E8DEF8&color=6B21A8&size=80`}
                        alt={m.nome} className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nome)}&background=E8DEF8&color=6B21A8&size=80` }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate text-sm">{m.nome}</div>
                    <div className="text-xs text-gray-500">@{m.instagram} · {m.turma}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-shrink-0">
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
                  </div>
                  {m.instagram && (
                    <a
                      href={`https://instagram.com/${m.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-pink-500 hover:text-pink-600"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                  )}
                </div>

                {/* Audio player + passed checkbox */}
                <div className="flex items-center gap-3">
                  <audio
                    controls
                    src={t.audio_url}
                    className="h-10 flex-1 min-w-0"
                    preload="none"
                    onPlay={() => markAsRead(t.id)}
                  />
                  <div className="flex-shrink-0 relative group">
                    <button
                      onClick={() => togglePassed(t.id, t.passed_to_mentorado)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        t.passed_to_mentorado
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] ${
                        t.passed_to_mentorado
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {t.passed_to_mentorado && '✓'}
                      </span>
                      Passado
                    </button>
                    {t.passed_to_mentorado && t.passed_at && (
                      <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div>{new Date(t.passed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        {t.passed_by_name && <div className="text-gray-300">por {t.passed_by_name}</div>}
                        <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
