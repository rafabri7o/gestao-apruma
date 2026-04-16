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

type DailyPoint = {
  date: string
  followers: number
  following: number
  posts: number
  followers_change: number
  following_change: number
  posts_change: number
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
  daily_series: DailyPoint[]
  is_tracked: boolean
}

const PERIOD_OPTIONS = [7, 15, 30, 60, 90] as const

function postViews(p: Post) {
  return Math.max(p.video_plays, p.video_views, 0)
}

function proxiedImage(url: string) {
  if (!url) return ''
  if (/cdninstagram\.com|fbcdn\.net/i.test(url)) {
    return `/api/pesquisa/image?url=${encodeURIComponent(url)}`
  }
  return url
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

function formatShortDate(d: string) {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return d
  }
}

function formatWeekday(d: string) {
  try {
    return new Date(d + 'T00:00:00')
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
  } catch {
    return ''
  }
}

function FollowersChart({ points }: { points: DailyPoint[] }) {
  if (points.length < 2) return null
  const width = 800
  const height = 200
  const padX = 40
  const padY = 20
  const values = points.map((p) => p.followers)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = (width - padX * 2) / (points.length - 1)
  const path = points
    .map((p, i) => {
      const x = padX + i * stepX
      const y = height - padY - ((p.followers - min) / range) * (height - padY * 2)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  const areaPath = `${path} L ${(padX + (points.length - 1) * stepX).toFixed(1)} ${height - padY} L ${padX} ${height - padY} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="followersGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(124 58 237)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(124 58 237)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#followersGradient)" />
      <path d={path} fill="none" stroke="rgb(124 58 237)" strokeWidth="2" />
      <text x={padX} y={padY - 4} fontSize="10" fill="#9ca3af">
        {formatNumber(max)}
      </text>
      <text x={padX} y={height - 4} fontSize="10" fill="#9ca3af">
        {formatNumber(min)}
      </text>
    </svg>
  )
}

function ChangeCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-gray-400">--</span>
  const color = value > 0 ? 'text-green-600' : 'text-red-600'
  const sign = value > 0 ? '+' : ''
  return (
    <span className={`${color} font-medium`}>
      {sign}
      {value.toLocaleString('pt-BR')}
    </span>
  )
}

export default function PesquisaPage() {
  const [username, setUsername] = useState('')
  const [days, setDays] = useState<number>(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PesquisaResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [togglingTrack, setTogglingTrack] = useState(false)

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

  const handleToggleTrack = async () => {
    if (!result) return
    setTogglingTrack(true)
    try {
      const res = await fetch('/api/pesquisa/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: result.profile.username,
          track: !result.is_tracked,
        }),
      })
      if (res.ok) {
        setResult({ ...result, is_tracked: !result.is_tracked })
      }
    } finally {
      setTogglingTrack(false)
    }
  }

  const growthColor =
    result && result.growth.has_history
      ? result.growth.followers_change >= 0
        ? 'text-green-600'
        : 'text-red-600'
      : 'text-gray-400'

  const dailyReversed = result ? [...result.daily_series].reverse() : []

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>🔍</span> Pesquisa
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pesquise qualquer perfil do Instagram. Marque como rastreado pra capturar snapshot diário automaticamente.
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
                    src={proxiedImage(result.profile.profile_pic_url)}
                    alt={result.profile.username}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      @{result.profile.username}
                    </h2>
                    <button
                      onClick={handleToggleTrack}
                      disabled={togglingTrack}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        result.is_tracked
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {togglingTrack
                        ? '...'
                        : result.is_tracked
                          ? '✓ Rastreando diariamente'
                          : '+ Rastrear diariamente'}
                    </button>
                  </div>
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
              {!result.growth.has_history && !result.is_tracked && (
                <p className="text-xs text-amber-600 mt-4">
                  Sem histórico ainda. Clique em &ldquo;Rastrear diariamente&rdquo; pra capturar snapshot todo dia automaticamente.
                </p>
              )}
            </div>

            {result.daily_series.length >= 2 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Evolução de seguidores ({result.period_days} dias)
                </h3>
                <FollowersChart points={result.daily_series} />
              </div>
            )}

            {result.daily_series.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Métricas diárias</h3>
                <div className="overflow-x-auto -mx-4 sm:-mx-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                        <th className="text-left px-4 py-2 font-medium">Data</th>
                        <th className="text-right px-4 py-2 font-medium">Seguidores</th>
                        <th className="text-right px-4 py-2 font-medium">Δ</th>
                        <th className="text-right px-4 py-2 font-medium">Seguindo</th>
                        <th className="text-right px-4 py-2 font-medium">Δ</th>
                        <th className="text-right px-4 py-2 font-medium">Posts</th>
                        <th className="text-right px-4 py-2 font-medium">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyReversed.map((d) => (
                        <tr key={d.date} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-gray-700">
                            <span className="text-gray-400 mr-2">{formatWeekday(d.date)}</span>
                            {formatShortDate(d.date)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">
                            {d.followers.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <ChangeCell value={d.followers_change} />
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">
                            {d.following.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <ChangeCell value={d.following_change} />
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">
                            {d.posts.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <ChangeCell value={d.posts_change} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.daily_series.length < result.period_days && (
                  <p className="text-xs text-gray-400 mt-3">
                    {result.daily_series.length} dia(s) registrado(s). O histórico cresce conforme o rastreamento diário acumula.
                  </p>
                )}
              </div>
            )}

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
                            src={proxiedImage(p.display_url)}
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
