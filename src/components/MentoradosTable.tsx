'use client'

import { useState } from 'react'
import type { Mentorado } from '@/lib/supabase'
import { formatNumber, calcGrowth, calcTempoRestante } from '@/lib/utils'

type Props = {
  mentorados: Mentorado[]
  onEdit: (m: Mentorado) => void
  onRefresh: () => void
}

export default function MentoradosTable({ mentorados, onEdit, onRefresh }: Props) {
  const [search, setSearch] = useState('')
  const [turmaFilter, setTurmaFilter] = useState('')
  const [planoFilter, setPlanoFilter] = useState('')
  const [sort, setSort] = useState('nome')

  const filtered = mentorados
    .filter((m) => {
      const q = search.toLowerCase()
      if (q && !m.nome.toLowerCase().includes(q) && !m.instagram.toLowerCase().includes(q) && !m.nicho.toLowerCase().includes(q)) return false
      if (turmaFilter && m.turma !== turmaFilter) return false
      if (planoFilter && m.plano !== Number(planoFilter)) return false
      return true
    })
    .sort((a, b) => {
      switch (sort) {
        case 'nome': return a.nome.localeCompare(b.nome)
        case 'seguidores': return b.seguidores_atual - a.seguidores_atual
        case 'crescimento': return calcGrowth(b.seguidores_atual, b.seguidores_inicial) - calcGrowth(a.seguidores_atual, a.seguidores_inicial)
        case 'posts': return b.posts - a.posts
        default: return 0
      }
    })

  const turmas = [...new Set(mentorados.map((m) => m.turma))].sort()

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
      {/* Filters */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Buscar mentorado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300"
          />
          <select
            value={turmaFilter}
            onChange={(e) => setTurmaFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={planoFilter}
            onChange={(e) => setPlanoFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="">Todos os planos</option>
            <option value="6">6 meses</option>
            <option value="12">12 meses</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="nome">Ordenar: Nome</option>
            <option value="seguidores">Ordenar: Seguidores</option>
            <option value="crescimento">Ordenar: Crescimento</option>
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

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-lg font-medium">Nenhum mentorado encontrado</div>
          <div className="text-sm mt-1">Tente ajustar os filtros ou cadastre um novo mentorado</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Mentorado</th>
                <th className="px-4 py-4 font-medium">Nicho</th>
                <th className="px-4 py-4 font-medium">Turma</th>
                <th className="px-4 py-4 font-medium">Seguidores</th>
                <th className="px-4 py-4 font-medium">Crescimento</th>
                <th className="px-4 py-4 font-medium">Posts 7 Dias</th>
                <th className="px-4 py-4 font-medium">Plano</th>
                <th className="px-4 py-4 font-medium">Tempo Restante</th>
                <th className="px-4 py-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const growth = calcGrowth(m.seguidores_atual, m.seguidores_inicial)
                const tempo = calcTempoRestante(m.data_inicio, m.plano)
                return (
                  <tr
                    key={m.id}
                    onClick={() => onEdit(m)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 overflow-hidden flex-shrink-0">
                          {m.avatar ? (
                            <img src={m.avatar} alt={m.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-600 font-bold">
                              {m.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{m.nome}</div>
                          <div className="text-gray-400 text-xs">@{m.instagram}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{m.nicho}</td>
                    <td className="px-4 py-4">
                      <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-1 rounded-lg">
                        {m.turma}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{formatNumber(m.seguidores_atual)}</div>
                      <div className="text-gray-400 text-xs">tinha {formatNumber(m.seguidores_inicial)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {growth >= 0 ? '🚀' : '📉'} {growth.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{m.posts}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        m.plano === 12
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-purple-50 text-purple-500'
                      }`}>
                        {m.plano}m
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-xs">{tempo}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(m) }}
                        className="text-brand-600 hover:text-brand-800 text-sm font-medium"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
