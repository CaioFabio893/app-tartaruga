/**
 * Fuso do projeto e entrada de horario local (revisao F11).
 *
 * O manual manda "desconsiderar o horario de verao" em HORA_OCORR (p. 1). Isso nao e o mesmo que
 * "converter para UTC": a hora de campo e a **leitura do relogio local** no momento da observacao.
 *
 * Contrato:
 * 1. **Entrada local obrigatoria**: nada entra no dominio como `Date`/`toISOString()`. O app grava
 *    data, hora e deslocamento observados (`EntradaLocal`), e o instante ISO com offset e montado
 *    aqui. `new Date()` nao aparece neste arquivo nem nos testes.
 * 2. **Sem fuso padrao fixo**: o fuso vive em `projeto.fuso` (nome IANA). Enquanto for `null`, o app
 *    nao converte e sinaliza — nunca assume -03:00 por convenience.
 * 3. **Sem promessa de DST**: este modulo **nao** reconstrói o deslocamento histórico de uma data a
 *    partir da zona. Quem fornece o deslocamento e a observacao (GPS/relogio). O que a zona faz aqui e
 *    *conferir* o deslocamento registrado, devolvendo aviso quando ele discorda. A conversao de
 *    horario de verao para HORA_OCORR continua pendente de evidencia.
 * 4. **Ordenacao** pode usar UTC (comparar instantes e seguro); **datas de campo** nunca (DOMAIN_RULES 5.5).
 */
import { dataReferenciaNoite, paraDia } from './datas.ts'
import type { DataCampo, Instante } from './tipos.ts'

/** Data e hora do relogio local do projeto, com o deslocamento observado no momento. */
export interface EntradaLocal {
  /** 'YYYY-MM-DD' no calendario do projeto. */
  data: DataCampo
  /** 'HH:MM' ou 'HH:MM:SS'. Sem horario de verao (p. 1). */
  hora: string
  /** Deslocamento em minutos observado no momento, ex.: -180 para -03:00. */
  offsetMinutos: number
}

export interface ProblemaFuso {
  ok: boolean
  motivo: string | null
}

const problema = (motivo: string): ProblemaFuso => ({ ok: false, motivo })
const conforme: ProblemaFuso = { ok: true, motivo: null }

const HORA = /^(\d{2}):(\d{2})(?::(\d{2}))?$/

/**
 * Monta o instante ISO do projeto a partir da entrada local. Retorna null quando a entrada nao e
 * valida — inclusive quando o deslocamento esta fora da faixa real de fusos.
 */
export function instanteDoProjeto(entrada: EntradaLocal | null | undefined): Instante | null {
  if (!entrada) return null
  const { data, hora, offsetMinutos } = entrada
  if (paraDia(data) === null) return null
  if (!Number.isSafeInteger(offsetMinutos) || Math.abs(offsetMinutos) > 14 * 60) {
    return null
  }
  const m = HORA.exec(hora.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  const seg = Number(m[3] ?? '0')
  if (h > 23 || min > 59 || seg > 59) return null

  const sinal = offsetMinutos < 0 ? '-' : '+'
  const abs = Math.abs(offsetMinutos)
  const oh = String(Math.floor(abs / 60)).padStart(2, '0')
  const om = String(abs % 60).padStart(2, '0')
  return `${data}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}${sinal}${oh}:${om}`
}

/**
 * Fuso IANA suportado pelo ambiente? `null` quando o nome e invalido. Nao faz conversao: apenas
 * habilita a conferencia de deslocamento.
 */
export function fusoConhecido(fuso: string | null | undefined): string | null {
  if (!fuso || typeof fuso !== 'string' || !fuso.trim()) return null
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: fuso.trim() })
    return fuso.trim()
  } catch {
    return null
  }
}

/**
 * Deslocamento, em minutos, que a zona teria no instante informado. Usado so para **conferir** o
 * deslocamento registrado: divergencia vira aviso, nunca conversao silenciosa (F11).
 */
export function offsetEsperadoNaZona(fuso: string, instante: Instante): number | null {
  if (!fusoConhecido(fuso)) return null
  const alvo = new Date(instante)
  if (Number.isNaN(alvo.getTime())) return null

  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(alvo)

  const num = (tipo: string): number => Number(partes.find((p) => p.type === tipo)?.value ?? 'NaN')
  const ano = num('year')
  const mes = num('month')
  const dia = num('day')
  const horas = num('hour') % 24
  const minutos = num('minute')
  const segundos = num('second')
  if ([ano, mes, dia, horas, minutos, segundos].some(Number.isNaN)) return null

  const comoUtc = Date.UTC(ano, mes - 1, dia, horas, minutos, segundos)
  return Math.round((comoUtc - alvo.getTime()) / 60000)
}

export interface ConferênciaFuso {
  conferido: boolean
  offsetEsperadoMinutos: number | null
  /** Preenchido quando o deslocamento registrado nao bate com a zona. */
  aviso: string | null
}

/**
 * Confere o deslocamento registrado contra a zona do projeto.
 *
 * `fuso = null` (projeto sem fuso confirmado) devolve `conferido: false` com aviso: e um estado
 * conhecido e tratado, nao um erro silencioso.
 */
export function conferirOffset(fuso: string | null, entrada: EntradaLocal): ConferênciaFuso {
  const zona = fusoConhecido(fuso)
  if (zona === null) {
    return {
      conferido: false,
      offsetEsperadoMinutos: null,
      aviso: 'fuso do projeto nao confirmado: o horario foi gravado como observação local, sem conversao',
    }
  }
  const instante = instanteDoProjeto(entrada)
  if (instante === null) {
    return { conferido: false, offsetEsperadoMinutos: null, aviso: 'entrada local invalida' }
  }
  const esperado = offsetEsperadoNaZona(zona, instante)
  if (esperado === null) {
    return { conferido: false, offsetEsperadoMinutos: null, aviso: 'nao foi possivel conferir o deslocamento' }
  }
  if (esperado !== entrada.offsetMinutos) {
    return {
      conferido: false,
      offsetEsperadoMinutos: esperado,
      aviso:
        `deslocamento registrado (${entrada.offsetMinutos} min) difere do esperado para ${zona} ` +
        `(${esperado} min): revisar o horario antes de usar em HORA_OCORR`,
    }
  }
  return { conferido: true, offsetEsperadoMinutos: esperado, aviso: null }
}

/**
 * Entrada local -> data de referencia de campo, pelo caminho unico do projeto: entrada local,
 * instante com offset e corte de 12:00 (DOMAIN_RULES 3.2 e 3.3).
 */
export function dataReferenciaNoiteDoProjeto(
  entrada: EntradaLocal | null | undefined,
): DataCampo | null {
  const instante = instanteDoProjeto(entrada)
  if (instante === null) return null
  return dataReferenciaNoite(instante)
}

/** Mesma hora de campo (HH:MM) a partir da entrada local, sem horario de verao e sem UTC. */
export function horaDeCampo(entrada: EntradaLocal | null | undefined): string | null {
  const instante = instanteDoProjeto(entrada)
  if (instante === null) return null
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):/.exec(instante)
  return m ? `${m[2]}` : null
}

/**
 * Compara dois instantes para **ordenar** (historico de transferencias, INSTANTE ja gravado). Nunca
 * use isto para decidir data de campo: e UTC, e o calendario do projeto tem corte de 12:00.
 */
export function compararInstantes(a: Instante | null, b: Instante | null): number | null {
  if (!a || !b) return null
  const ta = Date.parse(a)
  const tb = Date.parse(b)
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null
  return ta === tb ? 0 : ta < tb ? -1 : 1
}

export function problemaDeFuso(fuso: string | null): ProblemaFuso {
  if (fuso === null) return problema('fuso do projeto nao confirmado (STATUS.md)')
  if (fusoConhecido(fuso) === null) return problema(`fuso invalido: ${fuso}`)
  return conforme
}
