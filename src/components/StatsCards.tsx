import type { Mentorado } from '@/lib/supabase'
import { calcGrowth } from '@/lib/utils'

type Props = {
  mentorados: Mentorado[]
}

export default function StatsCards({ mentorados }: Props) {
  const total = mentorados.length

  const gained100k = mentorados.filter((m) => (m.seguidores_atual - m.seguidores_inicial) >= 100000).length
  const gained30k = mentorados.filter((m) => (m.seguidores_atual - m.seguidores_inicial) >= 30000).length
  const gained10k = mentorados.filter((m) => (m.seguidores_atual - m.seguidores_inicial) >= 10000).length
  const gainedUnder10k = mentorados.filter((m) => (m.seguidores_atual - m.seguidores_inicial) < 10000).length

  const cards = [
    { label: 'Total Mentorados', value: total, color: 'bg-brand-600', icon: '👥', badge: 'Mentorados' },
    { label: 'Ganhou +100 mil seguidores', value: gained100k, color: 'bg-green-500', icon: '🏆', badge: null },
    { label: 'Ganhou +30 mil seguidores', value: gained30k, color: 'bg-brand-600', icon: '🔥', badge: null },
    { label: 'Ganhou +10 mil seguidores', value: gained10k, color: 'bg-brand-400', icon: '💪', badge: null },
    { label: 'Ganhou menos de 10 mil', value: gainedUnder10k, color: 'bg-red-500', icon: '🆘', badge: null },
  ]

  return (
    <div className="grid grid-cols-5 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl p-6 card-hover shadow-sm border border-gray-100 animate-fade-in"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">{card.icon}</span>
            {card.badge && (
              <span className={`${card.color} text-white text-xs font-bold px-2 py-1 rounded-lg`}>
                {card.badge}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900">{card.value}</div>
          <div className="text-sm text-gray-500 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
