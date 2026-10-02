/**
 * Datas do calendario do projeto. Regra mais sensivel do dominio.
 * Fonte: DOMAIN_RULES.md secao 3, com pagina do manual.
 *
 * O manual diz: DATA_OCORR recebe "sempre a data da noite em questao, desconsiderando-se a mudanca de data
 * real a partir da 0:00h. A mudanca de data somente sera efetuada apos as 12:00h" (p. 1). DATA_ECLOS
 * reforça: "filhotes emergidos ate as 12:00h consideram-se com a data de eclosao na noite anterior" (p. 3).
 * DATA_ABERT segue o mesmo padrao (p. 4).
 *
 * Nenhum calculo aqui usa UTC nem Date nativo para decidir a data de campo.
 */

/** Limite do manual: 12:00 pertence a noite anterior; apos 12:00 comeca a nova data. */
export const LIMITE_NOITE_HORAS = 12

/** Mesmo limite em segundos desde a meia-noite, para comparar o instante completo. */
const LIMITE_NOITE_SEGUNDOS = LIMITE_NOITE_HORAS * 3600

const DIA_MS = 86_400_000

/** Data civil 'YYYY-MM-DD' a partir de ano/mes/dia, sem passar por fuso. */
function paraDataCampo(ano: number, mes: number, dia: number): string {
  const m = String(mes).padStart(2, '0')
  const d = String(dia).padStart(2, '0')
  return `${ano}-${m}-${d}`
}

/**
 * Converte 'YYYY-MM-DD' em dia civil sequencial, sem fuso.
 * Retorna null para entrada invalida.
 */
export function paraDia(data: string | null | undefined): number | null {
  if (typeof data !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.trim())
  if (!m) return null
  const ano = Number(m[1])
  const mes = Number(m[2])
  const dia = Number(m[3])
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  return Math.floor(Date.UTC(ano, mes - 1, dia) / DIA_MS)
}

/** Inverso de `paraDia`. Retorna null para dia fora da faixa representavel. */
export function deParaDia(dia: number): string | null {
  if (!Number.isFinite(dia)) return null
  const d = new Date(dia * DIA_MS)
  return paraDataCampo(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

/** Soma dias a uma data de campo, sem fuso. */
export function somarDias(data: string, dias: number): string {
  const base = paraDia(data)
  if (base === null) throw new Error(`data invalida: ${data}`)
  const novo = deParaDia(base + dias)
  if (novo === null) throw new Error(`data fora de faixa: ${data}`)
  return novo
}

/** Diferenca em dias inteiros: `ate - de`. Positivo quando `ate` e posterior. */
export function diferencasDias(de: string, ate: string): number {
  const a = paraDia(de)
  const b = paraDia(ate)
  if (a === null || b === null) throw new Error(`data invalida: ${de} .. ${ate}`)
  return b - a
}

/** Compara duas datas de campo. Retorna null se alguma for invalida. */
export function compararDatas(a: string | null, b: string | null): number | null {
  const da = paraDia(a)
  const db = paraDia(b)
  if (da === null || db === null) return null
  return da === db ? 0 : da < db ? -1 : 1
}

/** `data` esta dentro do periodo inclusivo [inicio, fim]? Periodo vazio ou data vazia => false. */
export function dentroDoPeriodo(
  data: string | null,
  inicio: string | null,
  fim: string | null,
): boolean {
  if (!data || !inicio || !fim) return false
  const d = paraDia(data)
  const i = paraDia(inicio)
  const f = paraDia(fim)
  if (d === null || i === null || f === null) return false
  if (i > f) return false
  return d >= i && d <= f
}

export interface PartesDataHora {
  ano: number
  mes: number
  dia: number
  horas: number
  minutos: number
  segundos: number
  offsetMinutos: number
}

/**
 * Extrai as partes de um instante ISO 8601 **com offset**, usando apenas os numeros do texto.
 * Evita Date para nao introduzir fuso do ambiente.
 */
export function partesInstante(instante: string | null): PartesDataHora | null {
  if (typeof instante !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})$/.exec(
    instante.trim(),
  )
  if (!m) return null
  const [, ano, mes, dia, horas, minutos, segundos, offset] = m
  if (!ano || !mes || !dia || !horas || !minutos || !segundos || !offset) return null

  let offsetMinutos = 0
  if (offset !== 'Z') {
    const sinal = offset.startsWith('-') ? -1 : 1
    const oh = Number(offset.slice(1, 3))
    const om = Number(offset.slice(4, 6))
    offsetMinutos = sinal * (oh * 60 + om)
  }

  return {
    ano: Number(ano),
    mes: Number(mes),
    dia: Number(dia),
    horas: Number(horas),
    minutos: Number(minutos),
    segundos: Number(segundos),
    offsetMinutos,
  }
}

/**
 * Data de referencia da noite a partir do instante real da ocorrencia.
 *
 * Regra (DOMAIN_RULES.md 3.2): ate 12:00 inclusive pertence a noite que comecou no dia anterior;
 * depois das 12:00 pertence ao proprio dia.
 *
 * Exemplo: '2026-10-03T01:30:00-03:00' (madrugada do dia 3) pertence a noite de '2026-10-02'.
 */
export function dataReferenciaNoite(instante: string | null): string | null {
  const p = partesInstante(instante)
  if (!p) return null

  const diaCivil = paraDia(paraDataCampo(p.ano, p.mes, p.dia))
  if (diaCivil === null) return null

  // Compara o instante completo, nao apenas a hora: 12:00:00 pertence a noite anterior,
  // mas 12:00:01 ja e depois das 12:00h e abre a nova data (p. 1).
  const segundosDoDia = p.horas * 3600 + p.minutos * 60 + p.segundos
  const referencia = segundosDoDia <= LIMITE_NOITE_SEGUNDOS ? diaCivil - 1 : diaCivil
  return deParaDia(referencia)
}

/**
 * Sugere TEMP_TRANSF a partir do horario do ninho enterrado, quando o horario da postura nao e
 * conhecido (p. 3): ate as 09:00 da manha => 'B'; depois das 09:00 => 'C'.
 *
 * Devolve apenas sugestao: o usuario confirma (DOMAIN_RULES.md 4.8).
 */
export function sugerirTempoTransferencia(instanteEscavacao: string | null): 'B' | 'C' | null {
  const p = partesInstante(instanteEscavacao)
  if (!p) return null
  return p.horas < 9 ? 'B' : 'C'
}

/**
 * DATA_ABERT normalmente ocorre no dia posterior a eclosao, pela manha (ate 09:00) ou a tarde
 * (apos 16:00) (p. 4). Retorna 'ok' | 'invalida' | 'sem_eclosao'.
 */
export function validarDataAbertura(
  dataEclosao: string | null,
  dataAbertura: string | null,
): 'ok' | 'invalida' | 'sem_eclosao' {
  if (!dataAbertura) return 'sem_eclosao'
  if (!dataEclosao) return 'ok'
  const cmp = compararDatas(dataAbertura, dataEclosao)
  if (cmp === null) return 'invalida'
  return cmp < 0 ? 'invalida' : 'ok'
}
