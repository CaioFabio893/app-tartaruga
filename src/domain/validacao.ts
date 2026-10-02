/**
 * Regras condicionais e validacao. Fonte: DOMAIN_RULES.md secao 2 e 6.
 *
 * Estas funcoes nao gravam nada: devolvem problemas encontrados com o campo, o motivo e a
 * referencia da regra. A interface usa isso para exibir e bloquear; o Firestore nao depende
 * delas (ver SECURITY.md: regra de acesso e coisa separada).
 */
import { PALAVRAS_CHAVE, type PalavraChave } from './tipos.ts'

export interface Problema {
  campo: string
  mensagem: string
  /** Regra que fundamenta a mensagem, para rastreabilidade. */
  regra: string
  /** 'erro' impede salvar; 'aviso' exige ciência do usuário. */
  gravidade: 'erro' | 'aviso'
}

const erro = (campo: string, mensagem: string, regra: string): Problema => ({
  campo,
  mensagem,
  regra,
  gravidade: 'erro',
})
const aviso = (campo: string, mensagem: string, regra: string): Problema => ({
  campo,
  mensagem,
  regra,
  gravidade: 'aviso',
})

/** So CD cria ninho. ML, SD, ND e PI nao criam ninho (DOMAIN_RULES.md 2.1). */
export function ocorrenciaCriaNinho(tipoOcorrencia: string): boolean {
  return tipoOcorrencia === 'CD'
}

/**
 * SD so e valido depois de verificada a praia e descartada a interrupcao por perturbacao externa
 * (p. 2). Sem esse registro, o app nao aceita SD.
 */
export function validarTipoOcorrencia(tipoOcorrencia: string, verificacaoPraiaRealizada: boolean | null): Problema[] {
  if (tipoOcorrencia === 'SD' && verificacaoPraiaRealizada !== true) {
    return [
      erro(
        'verificacao_praia_realizada',
        'Sem Desova exige a verificacao da praia registrada, descartada a possibilidade de ' +
          'processo interrompido (que seria PI).',
        'DOMAIN_RULES.md 2.2 (p. 2)',
      ),
    ]
  }
  return []
}

/** SITUACAO e sempre preenchida quando TIPO_OCORR = CD (p. 2). */
export function validarSituacao(tipoOcorrencia: string, situacao: string | null): Problema[] {
  if (tipoOcorrencia === 'CD' && !situacao) {
    return [erro('situacao', 'SITUACAO e sempre preenchida quando TIPO_OCORR = CD.', 'DOMAIN_RULES.md 2.5 (p. 2)')]
  }
  return []
}

/** HIST_NINHO so existe com CD (p. 4) e sempre com complemento em OBS (p. 4). */
export function validarHistoricoNinho(
  tipoOcorrencia: string,
  historicoNinho: string | null,
  observacoes: string | null,
): Problema[] {
  const problemas: Problema[] = []
  if (historicoNinho && tipoOcorrencia !== 'CD') {
    problemas.push(
      erro('historico_ninho', 'HIST_NINHO so e preenchido quando TIPO_OCORR = CD.', 'DOMAIN_RULES.md 6.3 (p. 4)'),
    )
  }
  if (historicoNinho === 'OT' && !observacoes?.trim()) {
    problemas.push(
      erro('observacoes', 'HIST_NINHO = OT exige explicar a interferencia em OBS.', 'DOMAIN_RULES.md 6.3 (p. 4)'),
    )
  }
  return problemas
}

/** TUMORES e sempre preenchido no flagrante; fora dele e null, o que difere de 'I' (p. 2). */
export function validarTumores(flagrante: boolean, tumores: string | null): Problema[] {
  if (flagrante && !tumores) {
    return [erro('tumores', 'No flagrante, TUMORES e sempre preenchido (S, N ou I).', 'DOMAIN_RULES.md 6.2 (p. 2)')]
  }
  return []
}

/** HORA_OCORR so existe quando houve flagrante (p. 1). */
export function validarHoraOcorrencia(horaOcorrencia: string | null, flagrante: boolean): Problema[] {
  if (horaOcorrencia && !flagrante) {
    return [erro('hora_ocorrencia', 'HORA_OCORR so e preenchida quando houver flagrante.', 'DOMAIN_RULES.md 3.5 (p. 1)')]
  }
  return []
}

/** Evidencia de pesca verdadeira exige o tipo (p. 2). */
export function validarEvidenciaPesca(evidencia: boolean | null, tipoEvidencia: string | null): Problema[] {
  if (evidencia === true && !tipoEvidencia?.trim()) {
    return [erro('tipo_evidencia', 'Com evidencia de interacao com pesca, citar o TIPO_EVIDENCIA.', 'DOMAIN_RULES.md 6.5 (p. 2)')]
  }
  return []
}

/** Palavras-chave precisam vir da lista fechada, sem acento e no singular (p. 1-2 e p. 5-6). */
export function validarPalavrasChave(valores: readonly string[]): Problema[] {
  const permitidas = new Set<string>(PALAVRAS_CHAVE)
  const problemas: Problema[] = []
  for (const valor of valores) {
    if (!permitidas.has(valor)) {
      problemas.push(
        erro(
          'palavras_chave',
          `Palavra-chave "${valor}" nao esta na lista do manual. Use o termo exato, sem acento e no singular.`,
          'DOMAIN_RULES.md 6.6 (p. 5-6)',
        ),
      )
    }
  }
  return problemas
}

/**
 * TIPO_EVIDENCIA e codigo do SITAMAR (p. 2). Se nao estiver cadastrado, o app nao inventa:
 * avisa que falta o cadastro.
 */
export function validarTipoEvidencia(valor: string | null, codigosConhecidos: readonly string[]): Problema[] {
  if (!valor) return []
  if (!codigosConhecidos.includes(valor)) {
    return [
      aviso(
        'tipo_evidencia',
        `"${valor}" ainda nao esta cadastrado no SITAMAR. Solicite o cadastro a coordenacao do SITAMAR; ` +
          'o app nao cria codigos.',
        'DOMAIN_RULES.md 4.9 (p. 2)',
      ),
    ]
  }
  return []
}

/** Praia sem codigo cadastrado fica pendente, nunca com codigo inventado (p. 1). */
export function validarPraia(praiaCodigo: string | null, codigosConhecidos: readonly string[]): Problema[] {
  if (!praiaCodigo) {
    return [aviso('praia_codigo', 'Praia sem codigo do SITAMAR. Registre o codigo quando a coordenacao fornecer.', 'DOMAIN_RULES.md 4.9 (p. 1)')]
  }
  if (!codigosConhecidos.includes(praiaCodigo)) {
    return [
      aviso('praia_codigo', `Codigo de praia "${praiaCodigo}" nao consta da lista do projeto.`, 'DOMAIN_RULES.md 4.9 (p. 1)'),
    ]
  }
  return []
}

/** Localizacao original e imutavel; destino de cercado exige N_NINHO (p. 3, DOMAIN_RULES.md 4.7). */
export function validarTransferencia(destino: 'CERCADO' | 'PRAIA', numeroNinhoCercado: string | null): Problema[] {
  if (destino === 'CERCADO' && !numeroNinhoCercado?.trim()) {
    return [
      erro(
        'numero_ninho_cercado',
        'Transferencia para o cercado exige o numero do ninho no cercado (N_NINHO).',
        'DOMAIN_RULES.md 4.7 (p. 3)',
      ),
    ]
  }
  if (destino === 'PRAIA' && numeroNinhoCercado?.trim()) {
    return [
      erro(
        'numero_ninho_cercado',
        'N_NINHO so se aplica a transferencia para o cercado.',
        'DOMAIN_RULES.md 4.4 (p. 3)',
      ),
    ]
  }
  return []
}

/** Aninhamento auxiliar usado pelos testes. */
export function temProvaDeGravacao<T extends Problema>(problemas: readonly T[]): boolean {
  return problemas.some((p) => p.gravidade === 'erro')
}

export type { PalavraChave }
