export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toString()
}

export function calcGrowth(atual: number, inicial: number): number {
  if (inicial === 0) return 0
  return ((atual - inicial) / inicial) * 100
}

export function calcTempoRestante(dataInicio: string, planoMeses: number): string {
  const inicio = new Date(dataInicio)
  const fim = new Date(inicio)
  fim.setMonth(fim.getMonth() + planoMeses)
  const agora = new Date()
  const diffMs = fim.getTime() - agora.getTime()
  if (diffMs <= 0) return 'Encerrado'
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (dias > 30) {
    const meses = Math.floor(dias / 30)
    return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  }
  return `${dias} dias`
}
