'use client'

import { useState } from 'react'
import { formatNumber } from '@/lib/utils'

type Post = {
  id: string
  short_code: string
  type: string
  caption: string
  display_url: string
  url: string
  timestamp: string
  likes: number
  comments: number
  video_views: number
  video_plays: number
  video_duration: number | null
}

type PesquisaResult = {
  profile: {
    username: string
    full_name: string
    profile_pic_url: string
    follower_count: number
    following_count: number
    media_count: number
    biography: string
  }
  growth: {
    followers_start: number | null
    followers_change: number
    followers_change_pct: number
    since_date: string | null
    has_history: boolean
  }
  period_days: number
  posts_in_period_count: number
  top_posts: Post[]
}

const PERIOD_OPTIONS = [7, 15, 30, 60, 90] as const

function postViews(p: Post) {
  return Math.max(p.video_plays, p.video_views, 0)
}

function formatDate(iso: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function PesquisaPage() {
  const [username, setUsername] = useState('')
  const [days, setDays] = useState<number>(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PesquisaResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const clean = username.replace('@', '').trim()
    if (clean.length < 2) {
      setError('Digite um @ válido')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/pesquisa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean, days }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Erro ao buscar')
      } else {
        setResult(data)
      }
    } catch {
      setError('Erro ao buscar')
    } finally {
      setLoading(false)
    }
  }

  const growthColor =
    result && result.growth.has_history
      ? result.growth.followers_change >= 0
        ? 'text-green-600'
        : 'text-red-600'
      : 'text-gray-400'

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>🔍</span> Pesquisa
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pesquise qualquer perfil do Instagram para ver crescimento e principais posts.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Perfil do Instagram
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="usuario"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Buscando...' : 'Pesquisar'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Período
              </label>
              <div className="flex flex-wrap gap-2">
                {PERIOD_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      days === d
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d} dias
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {result && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                {result.profile.profile_pic_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.profile.profile_pic_url}
                    alt={result.profile.username}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    @{result.profile.username}
                  </h2>
                  {result.profile.full_name && (
                    <p className="text-sm text-gray-500 uppercase tracking-wide">
                      {result.profile.full_name}
                    </p>
                  )}
                  {result.profile.biography && (
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                      {result.profile.biography}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full sm:w-auto">
                  <div>
                    <p className="text-xs text-gray-500">Seguidores</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatNumber(result.profile.follower_count)}
                    </p>
                    <p className={`text-xs font-semibold ${growthColor}`}>
                      {result.growth.has_history
                        ? `${result.growth.followers_change >= 0 ? '+' : ''}${formatNumber(result.growth.followers_change)} (${result.growth.followers_change_pct.toFixed(1)}%)`
                        : 'sem histórico'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Seguindo</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatNumber(result.profile.following_count)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Posts</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatNumber(result.profile.media_count)}
                    </p>
                  </div>
                </div>
              </div>

              {result.growth.has_history && result.growth.since_date && (
                <p className="text-xs text-gray-400 mt-4">
                  Crescimento comparado a {formatDate(result.growth.since_date)} ({result.period_days} dias)
                </p>
              )}
              {!result.growth.has_history && (
                <p className="text-xs text-amber-600 mt-4">
                  Primeira pesquisa deste perfil. O crescimento começará a aparecer em buscas futuras conforme formamos histórico.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Top {Math.min(20, result.top_posts.length)} posts
                </h3>
                <p className="text-xs text-gray-500">
                  {result.posts_in_period_count} posts nos últimos {result.period_days} dias
                </p>
              </div>

              {result.top_posts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Nenhum post encontrado no período.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {result.top_posts.map((p, i) => {
                    const views = postViews(p)
                    return (
                      <a
                        key={p.id || p.short_code || i}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block rounded-xl overflow-hidden bg-gray-100 aspect-square"
                      >
                        {p.display_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.display_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : null}
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          #{i + 1}
                        </div>
                        {p.type === 'Video' && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                            ▶
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[11px] space-y-0.5">
                          {views > 0 && (
                            <div className="font-semibold">👁 {formatNumber(views)}</div>
                          )}
                          <div className="flex gap-2 text-[10px]">
                            <span>❤ {formatNumber(p.likes)}</span>
                            <span>💬 {formatNumber(p.comments)}</span>
                          </div>
                          <div className="text-[10px] text-gray-300">
                            {formatDate(p.timestamp)}
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
