/**
 * Mapeamento entre o tipo do dominio (camelCase) e o documento do Firestore (snake_case).
 *
 * Revisao F10: o contrato promete "um dono por campo" e "nenhuma copia sem dono". Um `...doc`
 * spreading em `toDocument` esconderia exatamente o campo a mais que o contrato proibe. Por isso o
 * mapeamento e **explicito e exhaustivo**: toda chave do documento e escrita aqui, e
 * `verificarCampos` acusa chave desconhecida ou faltante.
 *
 * Este arquivo e PURO: nao importa `firebase`, `window` nem rede. `data/` compoe o SDK a partir
 * deste mapeamento; o emulador valida as regras em E04.
 */
import type {
  Abertura,
  Ocorrencia,
  Projeto,
  Transferencia,
  Trilha,
  Visita,
  Ninho,
  Localizacao,
} from './tipos.ts'

export type Documento = Record<string, unknown>

/** Nomes de documento que a interface nunca pode gravar. */
export const CAMPOS_DERIVADOS = ['ovos_totais', 'percentual_vivos', 'tempo_incubacao_dias'] as const
export const CAMPOS_PROJECAO = ['projecao_de', 'projecao_versao', 'projeto_versao_ref'] as const

const localParaDoc = (l: Localizacao): Documento => ({
  praia_id: l.praiaId,
  praia_codigo: l.praiaCodigo,
  local_km: l.localKm,
  bairro: l.bairro,
  referencia: l.referencia,
  latitude: l.latitude,
  longitude: l.longitude,
  datum: l.datum,
  fonte_gps: l.fonteGps,
  precisao_gps_m: l.precisaoGpsM,
  capturado_em: l.capturadoEm,
})

const docParaLocal = (d: Documento): Localizacao => ({
  praiaId: (d.praia_id as string | null) ?? null,
  praiaCodigo: (d.praia_codigo as string | null) ?? null,
  localKm: (d.local_km as string | null) ?? null,
  bairro: (d.bairro as string | null) ?? null,
  referencia: (d.referencia as string | null) ?? null,
  latitude: (d.latitude as number | null) ?? null,
  longitude: (d.longitude as number | null) ?? null,
  datum: (d.datum as Localizacao['datum']) ?? null,
  fonteGps: (d.fonte_gps as Localizacao['fonteGps']) ?? null,
  precisaoGpsM: (d.precisao_gps_m as number | null) ?? null,
  capturadoEm: (d.capturado_em as string | null) ?? null,
})

const trilhaParaDoc = (t: Trilha): Documento => ({
  criado_por: t.criadoPor,
  criado_em: t.criadoEm,
  atualizado_por: t.atualizadoPor,
  atualizado_em: t.atualizadoEm,
  versao: t.versao,
})

const docParaTrilha = (d: Documento): Trilha => ({
  criadoPor: (d.criado_por as string | null) ?? null,
  criadoEm: (d.criado_em as string) ?? '',
  atualizadoPor: (d.atualizado_por as string | null) ?? null,
  atualizadoEm: (d.atualizado_em as string) ?? '',
  versao: typeof d.versao === 'number' ? d.versao : 0,
})

export function ocorrenciaParaDoc(o: Ocorrencia): Documento {
  return {
    id: o.id,
    projeto_id: o.projetoId,
    temporada_id: o.temporadaId,
    responsavel_id: o.responsavelId,
    numero_registro: o.numeroRegistro,
    tipo_ocorrencia: o.tipoOcorrencia,
    tipo_registro: o.tipoRegistro,
    verificacao_praia_realizada: o.verificacaoPraiaRealizada,
    flagrante: o.flagrante,
    data_ocorrencia: o.dataOcorrencia,
    instante_ocorrencia: o.instanteOcorrencia,
    hora_ocorrencia: o.horaOcorrencia,
    noite_referencia: o.noiteReferencia,
    local_origem: localParaDoc(o.localOrigem),
    marcas_encontradas: o.marcasEncontradas,
    marcas_colocadas: o.marcasColocadas,
    marcas_retiradas: o.marcasRetiradas,
    especie_codigo: o.especieCodigo,
    comprimento_casco: o.comprimentoCasco,
    largura_casco: o.larguraCasco,
    tumores: o.tumores,
    coleta_material_biologico: o.coletaMaterialBiologico,
    evidencia_interacao_pesca: o.evidenciaInteracaoPesca,
    tipo_evidencia: o.tipoEvidencia,
    palavras_chave: o.palavrasChave,
    observacoes: o.observacoes,
    ninho_id: o.ninhoId,
    ...trilhaParaDoc(o),
  }
}

export function docParaOcorrencia(d: Documento): Ocorrencia {
  return {
    id: (d.id as string) ?? '',
    projetoId: (d.projeto_id as string) ?? '',
    temporadaId: (d.temporada_id as string | null) ?? null,
    responsavelId: (d.responsavel_id as string | null) ?? null,
    numeroRegistro: (d.numero_registro as string | null) ?? null,
    tipoOcorrencia: d.tipo_ocorrencia as Ocorrencia['tipoOcorrencia'],
    tipoRegistro: (d.tipo_registro as Ocorrencia['tipoRegistro']) ?? 'REPRODUTIVO',
    verificacaoPraiaRealizada: (d.verificacao_praia_realizada as boolean | null) ?? null,
    flagrante: (d.flagrante as boolean | null) ?? null,
    dataOcorrencia: (d.data_ocorrencia as string | null) ?? null,
    instanteOcorrencia: (d.instante_ocorrencia as string | null) ?? null,
    horaOcorrencia: (d.hora_ocorrencia as string | null) ?? null,
    noiteReferencia: (d.noite_referencia as string | null) ?? null,
    localOrigem: docParaLocal((d.local_origem as Documento) ?? {}),
    marcasEncontradas: (d.marcas_encontradas as string | null) ?? null,
    marcasColocadas: (d.marcas_colocadas as string | null) ?? null,
    marcasRetiradas: (d.marcas_retiradas as string | null) ?? null,
    especieCodigo: (d.especie_codigo as Ocorrencia['especieCodigo']) ?? null,
    comprimentoCasco: (d.comprimento_casco as number | null) ?? null,
    larguraCasco: (d.largura_casco as number | null) ?? null,
    tumores: (d.tumores as Ocorrencia['tumores']) ?? null,
    coletaMaterialBiologico: (d.coleta_material_biologico as string[] | null) ?? null,
    evidenciaInteracaoPesca: (d.evidencia_interacao_pesca as boolean | null) ?? null,
    tipoEvidencia: (d.tipo_evidencia as string | null) ?? null,
    palavrasChave: (d.palavras_chave as Ocorrencia['palavrasChave']) ?? [],
    observacoes: (d.observacoes as string | null) ?? null,
    ninhoId: (d.ninho_id as string | null) ?? null,
    ...docParaTrilha(d),
  }
}

export function ninhoParaDoc(n: Ninho): Documento {
  return {
    id: n.id,
    projeto_id: n.projetoId,
    temporada_id: n.temporadaId,
    ocorrencia_id: n.ocorrenciaId,
    codigo_interno: n.codigoInterno,
    situacao: n.situacao,
    historico_ninho: n.historicoNinho,
    problema_incubacao: n.problemaIncubacao,
    estado_acompanhamento: n.estadoAcompanhamento,
    ...trilhaParaDoc(n),
  }
}

export function docParaNinho(d: Documento): Ninho {
  return {
    id: (d.id as string) ?? '',
    projetoId: (d.projeto_id as string) ?? '',
    temporadaId: (d.temporada_id as string | null) ?? null,
    ocorrenciaId: (d.ocorrencia_id as string) ?? '',
    codigoInterno: (d.codigo_interno as string) ?? '',
    situacao: (d.situacao as Ninho['situacao']) ?? null,
    historicoNinho: (d.historico_ninho as Ninho['historicoNinho']) ?? null,
    problemaIncubacao: (d.problema_incubacao as boolean | null) ?? null,
    estadoAcompanhamento:
      (d.estado_acompanhamento as Ninho['estadoAcompanhamento']) ?? 'AGUARDANDO',
    ...docParaTrilha(d),
  }
}

export function transferenciaParaDoc(t: Transferencia): Documento {
  return {
    id: t.id,
    projeto_id: t.projetoId,
    ninho_id: t.ninhoId,
    destino: t.destino,
    cercado_id: t.cercadoId,
    local_destino: localParaDoc(t.localDestino),
    data_transferencia: t.dataTransferencia,
    instante_transferencia: t.instanteTransferencia,
    noite_referencia: t.noiteReferencia,
    tempo_transferencia: t.tempoTransferencia,
    ovos_transferencia: t.ovosTransferencia,
    numero_ninho_cercado: t.numeroNinhoCercado,
    sequencia: t.sequencia,
    responsavel_id: t.responsavelId,
    observacoes: t.observacoes,
    ...trilhaParaDoc(t),
  }
}

export function docParaTransferencia(d: Documento): Transferencia {
  return {
    id: (d.id as string) ?? '',
    projetoId: (d.projeto_id as string) ?? '',
    ninhoId: (d.ninho_id as string) ?? '',
    destino: (d.destino as Transferencia['destino']) ?? 'PRAIA',
    cercadoId: (d.cercado_id as string | null) ?? null,
    localDestino: docParaLocal((d.local_destino as Documento) ?? {}),
    dataTransferencia: (d.data_transferencia as string | null) ?? null,
    instanteTransferencia: (d.instante_transferencia as string | null) ?? null,
    noiteReferencia: (d.noite_referencia as string | null) ?? null,
    tempoTransferencia: (d.tempo_transferencia as Transferencia['tempoTransferencia']) ?? null,
    ovosTransferencia: (d.ovos_transferencia as number | null) ?? null,
    numeroNinhoCercado: (d.numero_ninho_cercado as string | null) ?? null,
    sequencia: (d.sequencia as number | null) ?? null,
    responsavelId: (d.responsavel_id as string | null) ?? null,
    observacoes: (d.observacoes as string | null) ?? null,
    ...docParaTrilha(d),
  }
}

export function visitaParaDoc(v: Visita): Documento {
  return {
    id: v.id,
    projeto_id: v.projetoId,
    ninho_id: v.ninhoId,
    data_visita: v.dataVisita,
    noite_referencia: v.noiteReferencia,
    responsavel_id: v.responsavelId,
    condicao: v.condicao,
    eventos: v.eventos,
    observacoes: v.observacoes,
    ...trilhaParaDoc(v),
  }
}

export function docParaVisita(d: Documento): Visita {
  return {
    id: (d.id as string) ?? '',
    projetoId: (d.projeto_id as string) ?? '',
    ninhoId: (d.ninho_id as string) ?? '',
    dataVisita: (d.data_visita as string) ?? '',
    noiteReferencia: (d.noite_referencia as string | null) ?? null,
    responsavelId: (d.responsavel_id as string | null) ?? null,
    condicao: (d.condicao as string | null) ?? null,
    eventos: (d.eventos as Visita['eventos']) ?? [],
    observacoes: (d.observacoes as string | null) ?? null,
    ...docParaTrilha(d),
  }
}

export function aberturaParaDoc(a: Abertura): Documento {
  return {
    id: a.id,
    projeto_id: a.projetoId,
    ninho_id: a.ninhoId,
    data_eclosao: a.dataEclosao,
    instante_eclosao: a.instanteEclosao,
    noite_referencia_eclosao: a.noiteReferenciaEclosao,
    data_abertura: a.dataAbertura,
    instante_abertura: a.instanteAbertura,
    noite_referencia_abertura: a.noiteReferenciaAbertura,
    hora_primeiro_filhote: a.horaPrimeiroFilhote,
    hora_ultimo_filhote: a.horaUltimoFilhote,
    vivos: a.vivos,
    natimortos: a.natimortos,
    ovos_nao_eclodidos: a.ovosNaoEclodidos,
    ovos_furados: a.ovosFurados,
    nao_viaveis: a.naoViaveis,
    responsavel_id: a.responsavelId,
    observacoes: a.observacoes,
    ...trilhaParaDoc(a),
  }
}

export function docParaAbertura(d: Documento): Abertura {
  return {
    id: (d.id as string) ?? '',
    projetoId: (d.projeto_id as string) ?? '',
    ninhoId: (d.ninho_id as string) ?? '',
    dataEclosao: (d.data_eclosao as string | null) ?? null,
    instanteEclosao: (d.instante_eclosao as string | null) ?? null,
    noiteReferenciaEclosao: (d.noite_referencia_eclosao as string | null) ?? null,
    dataAbertura: (d.data_abertura as string | null) ?? null,
    instanteAbertura: (d.instante_abertura as string | null) ?? null,
    noiteReferenciaAbertura: (d.noite_referencia_abertura as string | null) ?? null,
    horaPrimeiroFilhote: (d.hora_primeiro_filhote as string | null) ?? null,
    horaUltimoFilhote: (d.hora_ultimo_filhote as string | null) ?? null,
    vivos: (d.vivos as number | null) ?? null,
    natimortos: (d.natimortos as number | null) ?? null,
    ovosNaoEclodidos: (d.ovos_nao_eclodidos as number | null) ?? null,
    ovosFurados: (d.ovos_furados as number | null) ?? null,
    naoViaveis: (d.nao_viaveis as number | null) ?? null,
    responsavelId: (d.responsavel_id as string | null) ?? null,
    observacoes: (d.observacoes as string | null) ?? null,
    ...docParaTrilha(d),
  }
}

export function projetoParaDoc(p: Projeto): Documento {
  return {
    id: p.id,
    nome: p.nome,
    sigla: p.sigla,
    ativo: p.ativo,
    fuso: p.fuso,
    criado_em: p.criadoEm,
    versao: p.versao,
  }
}

export function docParaProjeto(d: Documento): Projeto {
  return {
    id: (d.id as string) ?? '',
    nome: (d.nome as string) ?? '',
    sigla: (d.sigla as string) ?? '',
    ativo: (d.ativo as boolean) ?? false,
    fuso: (d.fuso as string | null) ?? null,
    criadoEm: (d.criado_em as string) ?? '',
    versao: typeof d.versao === 'number' ? d.versao : 0,
  }
}

export interface DivergenciaMapeamento {
  caminho: string
  tipo: 'desconhecido' | 'ausente'
  chave: string
}

/**
 * Confere um documento contra a lista de chaves que o mapeador escreve. `data/` chama isso no
 * emulador e em migracao: e o que acusa campo duplicado que escapou do tipo.
 */
export function verificarCampos(doc: Documento, esperado: readonly string[]): DivergenciaMapeamento[] {
  const lista = new Set(esperado)
  const achadas: DivergenciaMapeamento[] = []
  for (const chave of Object.keys(doc)) {
    if (!lista.has(chave)) achadas.push({ caminho: '', tipo: 'desconhecido', chave })
  }
  for (const chave of esperado) {
    if (!(chave in doc)) achadas.push({ caminho: '', tipo: 'ausente', chave })
  }
  return achadas
}

/**
 * Chaves esperadas por entidade, para `verificarCampos` e para as regras do Firestore.
 * O que importa sao os nomes das chaves, entao o stub so precisa ter os objetos aninhados
 * presentes: qualquer entidade com `Localizacao` em dentro quebraria o `Object.keys` com `{}`.
 */
const LOCAL_ESTUB = {} as Localizacao

export const CHAVES_ESPERADAS = {
  ocorrencia: () => Object.keys(ocorrenciaParaDoc({ localOrigem: LOCAL_ESTUB } as Ocorrencia)),
  ninho: () => Object.keys(ninhoParaDoc({} as Ninho)),
  transferencia: () => Object.keys(transferenciaParaDoc({ localDestino: LOCAL_ESTUB } as Transferencia)),
  visita: () => Object.keys(visitaParaDoc({} as Visita)),
  abertura: () => Object.keys(aberturaParaDoc({} as Abertura)),
} as const
