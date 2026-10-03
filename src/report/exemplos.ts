import type { EntradaFicha } from '../domain/agregado'
import type { Abertura, Localizacao, Ninho, Ocorrencia, Transferencia } from '../domain/tipos'

// Identificadores técnicos fictícios. Nenhum código de praia/cercado oficial é inventado.
const trilha = { criadoPor: 'equipe-demo', atualizadoPor: 'equipe-demo', criadoEm: '2026-10-01T18:00:00-03:00', atualizadoEm: '2026-10-01T18:00:00-03:00', versao: 1 }
const local: Localizacao = { praiaId: null, praiaCodigo: null, localKm: '3', bairro: 'Área demonstrativa',
  referencia: 'Local fictício para testar o relatório', latitude: -12.34567, longitude: -38.12345,
  datum: 'WGS84', fonteGps: 'manual', precisaoGpsM: null, capturadoEm: null }

export function dadosDemonstracao(): EntradaFicha[] {
  return Array.from({ length: 5 }, (_, i) => {
    const id = String(i + 1)
    const ocorrencia: Ocorrencia = { ...trilha, id: `oc-demo-${id}`, projetoId: 'projeto-demo',
      temporadaId: 'temporada-demo-2026', responsavelId: 'equipe-demo', numeroRegistro: `000${id}`,
      tipoOcorrencia: 'CD', tipoRegistro: 'REPRODUTIVO', verificacaoPraiaRealizada: true, flagrante: false,
      dataOcorrencia: i === 3 ? null : `2026-08-0${id}`, instanteOcorrencia: null, horaOcorrencia: null,
      noiteReferencia: i === 3 ? null : `2026-08-0${id}`, localOrigem: { ...local, localKm: id },
      marcasEncontradas: null, marcasColocadas: null, marcasRetiradas: null, especieCodigo: i === 2 ? 'DC' : 'CC',
      comprimentoCasco: null, larguraCasco: null, tumores: null, coletaMaterialBiologico: null,
      evidenciaInteracaoPesca: null, tipoEvidencia: null, palavrasChave: [],
      observacoes: i === 3 ? 'Demonstração: desova localizada depois; data da postura desconhecida.' : 'Demonstração: dados inteiramente fictícios.', ninhoId: `ninho-demo-${id}` }
    const ninho: Ninho = { ...trilha, id: ocorrencia.ninhoId!, projetoId: 'projeto-demo',
      temporadaId: ocorrencia.temporadaId, ocorrenciaId: ocorrencia.id, codigoInterno: `DEMO-${id.padStart(3, '0')}`,
      situacao: i === 1 ? 'P' : 'I', historicoNinho: i === 4 ? null : 'SU', problemaIncubacao: false,
      estadoAcompanhamento: i === 4 ? 'ATIVO' : 'ABERTO' }
    const abertura: Abertura = { ...trilha, id: `abertura-demo-${id}`, projetoId: ninho.projetoId, ninhoId: ninho.id,
      dataEclosao: `2026-10-0${id}`, instanteEclosao: null, noiteReferenciaEclosao: `2026-10-0${id}`,
      dataAbertura: i === 4 ? null : `2026-10-0${i + 2}`, instanteAbertura: null,
      noiteReferenciaAbertura: i === 4 ? null : `2026-10-0${i + 2}`,
      horaPrimeiroFilhote: null, horaUltimoFilhote: null, vivos: i === 4 ? null : i === 2 ? 0 : 80 + i,
      natimortos: i === 4 ? null : 2, ovosNaoEclodidos: i === 4 ? null : 10,
      ovosFurados: i === 4 ? null : 0, naoViaveis: i === 2 ? 4 : null, responsavelId: 'equipe-demo',
      observacoes: i === 4 ? 'Emergência observada; escavação ainda não realizada.' : 'Contagens de exemplo; não representam dados de campo.' }
    const transferencia: Transferencia = { ...trilha, id: `transferencia-demo-${id}`, projetoId: ninho.projetoId,
      ninhoId: ninho.id, destino: 'PRAIA', cercadoId: null,
      localDestino: { ...local, localKm: '8', latitude: -12.3458, longitude: -38.1236 },
      dataTransferencia: '2026-08-03', instanteTransferencia: null, noiteReferencia: '2026-08-03',
      tempoTransferencia: 'B', ovosTransferencia: 93, numeroNinhoCercado: null, sequencia: 1,
      responsavelId: 'equipe-demo', observacoes: 'Transferência fictícia para testar a preservação da origem.' }
    return { ocorrencia, ninho, transferencias: i === 1 ? [transferencia] : [], aberturas: [abertura] }
  })
}
