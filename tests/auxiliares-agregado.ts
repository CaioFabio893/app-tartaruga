/**
 * Fixtures compartilhadas dos testes de agregado. Nao e teste: vitest so coleta `*.test.ts`.
 */
import { montarFichaNinho, type FichaNinho } from '../src/domain/agregado.ts'
import type { Abertura, Localizacao, Ninho, Ocorrencia, Transferencia } from '../src/domain/tipos.ts'

export const localOrigem: Localizacao = {
  praiaId: 'pr1',
  praiaCodigo: '001',
  localKm: '3',
  bairro: 'Centro',
  referencia: 'perto das pedras',
  latitude: -12.34567,
  longitude: -38.12345,
  datum: 'SIRGAS2000',
  fonteGps: 'dispositivo',
  precisaoGpsM: 4,
  capturadoEm: '2026-10-02T21:41:00-03:00',
}

export const ocorrenciaBase: Ocorrencia = {
  id: 'o1',
  projetoId: 'p1',
  temporadaId: 't2026',
  responsavelId: 'u1',
  numeroRegistro: '007',
  tipoOcorrencia: 'CD',
  tipoRegistro: 'REPRODUTIVO',
  verificacaoPraiaRealizada: null,
  flagrante: true,
  dataOcorrencia: '2026-10-02',
  instanteOcorrencia: '2026-10-02T21:40:00-03:00',
  horaOcorrencia: '21:40',
  noiteReferencia: '2026-10-02',
  localOrigem,
  marcasEncontradas: null,
  marcasColocadas: null,
  marcasRetiradas: null,
  especieCodigo: 'CC',
  comprimentoCasco: null,
  larguraCasco: null,
  tumores: 'N',
  coletaMaterialBiologico: null,
  evidenciaInteracaoPesca: false,
  tipoEvidencia: null,
  palavrasChave: [],
  observacoes: null,
  ninhoId: 'n1',
  criadoPor: 'u1',
  criadoEm: '2026-10-02T21:45:00-03:00',
  atualizadoPor: 'u1',
  atualizadoEm: '2026-10-02T21:45:00-03:00',
  versao: 1,
}

export const ninhoBase: Ninho = {
  id: 'n1',
  projetoId: 'p1',
  temporadaId: 't2026',
  ocorrenciaId: 'o1',
  codigoInterno: 'N-0001',
  situacao: 'T',
  historicoNinho: 'SU',
  problemaIncubacao: false,
  estadoAcompanhamento: 'ATIVO',
  criadoPor: 'u1',
  criadoEm: '2026-10-02T21:45:00-03:00',
  atualizadoPor: 'u1',
  atualizadoEm: '2026-10-02T21:45:00-03:00',
  versao: 1,
}

export const transferenciaBase: Transferencia = {
  id: 't1',
  projetoId: 'p1',
  ninhoId: 'n1',
  destino: 'CERCADO',
  cercadoId: 'c1',
  localDestino: { ...localOrigem, praiaCodigo: null, localKm: null },
  dataTransferencia: '2026-10-03',
  instanteTransferencia: '2026-10-03T08:00:00-03:00',
  noiteReferencia: '2026-10-02',
  tempoTransferencia: 'C',
  ovosTransferencia: 92,
  numeroNinhoCercado: '12',
  sequencia: 1,
  responsavelId: 'u1',
  observacoes: null,
  criadoPor: 'u1',
  criadoEm: '2026-10-03T08:05:00-03:00',
  atualizadoPor: 'u1',
  atualizadoEm: '2026-10-03T08:05:00-03:00',
  versao: 1,
}

export const aberturaBase: Abertura = {
  id: 'a1',
  projetoId: 'p1',
  ninhoId: 'n1',
  dataEclosao: '2026-10-24',
  instanteEclosao: '2026-10-24T23:10:00-03:00',
  noiteReferenciaEclosao: '2026-10-24',
  dataAbertura: '2026-10-25',
  instanteAbertura: '2026-10-25T08:00:00-03:00',
  noiteReferenciaAbertura: '2026-10-25',
  horaPrimeiroFilhote: null,
  horaUltimoFilhote: null,
  vivos: 55,
  natimortos: 2,
  ovosNaoEclodidos: 4,
  ovosFurados: 3,
  naoViaveis: null,
  responsavelId: 'u1',
  observacoes: null,
  criadoPor: 'u1',
  criadoEm: '2026-10-25T08:30:00-03:00',
  atualizadoPor: 'u1',
  atualizadoEm: '2026-10-25T08:30:00-03:00',
  versao: 1,
}

/** Ficha completa de referencia: CD, transferida para o cercado, abertura unica com contagens. */
export function construirFicha(): FichaNinho {
  return montarFichaNinho({
    ninho: ninhoBase,
    ocorrencia: ocorrenciaBase,
    transferencias: [transferenciaBase],
    aberturas: [aberturaBase],
  })
}
