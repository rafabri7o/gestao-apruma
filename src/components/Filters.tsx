'use client'

type Props = {
  search: string
  turmaFilter: string
  planoFilter: string
  growthFilter: string
  sort: string
  turmas: string[]
  onSearchChange: (v: string) => void
  onTurmaChange: (v: string) => void
  onPlanoChange: (v: string) => void
  onGrowthChange: (v: string) => void
  onSortChange: (v: string) => void
  onRefresh: () => void
  hideTurmaFilter?: boolean
}

export default function Filters({
  search, turmaFilter, planoFilter, growthFilter, sort, turmas,
  onSearchChange, onTurmaChange, onPlanoChange, onGrowthChange, onSortChange, onRefresh,
  hideTurmaFilter,
}: Props) {
  const selectClass = 'px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in">
      <div className="flex items-center gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar mentorado..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300"
        />
        {!hideTurmaFilter && (
          <select value={turmaFilter} onChange={(e) => onTurmaChange(e.target.value)} className={selectClass}>
            <option value="">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <select value={planoFilter} onChange={(e) => onPlanoChange(e.target.value)} className={selectClass}>
          <option value="">Todos os planos</option>
          <option value="6">6 meses</option>
          <option value="12">12 meses</option>
        </select>
        <select value={growthFilter} onChange={(e) => onGrowthChange(e.target.value)} className={selectClass}>
          <option value="">Todos os ganhos</option>
          <option value="100k">🏆 Ganhou +100 mil seguidores</option>
          <option value="30k">🔥 Ganhou +30 mil seguidores</option>
          <option value="10k">💪 Ganhou +10 mil seguidores</option>
          <option value="under10k">🆘 Ganhou -10 mil seguidores</option>
        </select>
        <select value={sort} onChange={(e) => onSortChange(e.target.value)} className={selectClass}>
          <option value="nome">Ordenar: Nome</option>
          <option value="seguidores">Ordenar: Seguidores</option>
          <option value="crescimento">Ordenar: Seguidores Ganhos</option>
          <option value="posts">Ordenar: Posts 7 Dias</option>
        </select>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
          title="Atualizar"
        >
          🔄
        </button>
      </div>
    </div>
  )
}
