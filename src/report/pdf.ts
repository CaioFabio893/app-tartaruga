import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { camposExportacao, texto, totalObservado, type Relatorio } from './relatorio'

/** A4, fonte local padrão; sem imagem, serviço ou fonte remota. */
export async function gerarPDF(r: Relatorio): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle('Monitoramento de ninhos — relatório')
  doc.setSubject(`Critério ${r.consulta.criterio}; ${r.parcial ? 'PARCIAL' : 'sincronização confirmada'}`)
  doc.setCreationDate(new Date(r.geradoEm))
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const negrito = await doc.embedFont(StandardFonts.HelveticaBold)
  let pagina: PDFPage; let y = 0; let contexto: string | null = null
  const margem = 42, largura = 511
  const substituidos = new Set<string>()
  function seguro(s: string, fonte: PDFFont): string {
    return [...s.normalize('NFC')].map(c => {
      if (c === '\n' || c === '\r' || c === '\t') return ' '
      try { fonte.encodeText(c); return c } catch { substituidos.add(c); return '?' }
    }).join('')
  }
  function novaPagina() {
    pagina = doc.addPage([595.28, 841.89]); y = 760
    pagina.drawRectangle({ x: 0, y: 785, width: 595.28, height: 57, color: rgb(.043, .235, .286) })
    pagina.drawText('MONITORAMENTO DE NINHOS', { x: margem, y: 813, size: 11, font: negrito, color: rgb(1, 1, 1) })
    pagina.drawText(r.fonte.demonstracao ? 'DEMONSTRAÇÃO • PARCIAL • LAYOUT PROPOSTO' : r.parcial ? 'PARCIAL • LAYOUT PROPOSTO' : 'LAYOUT PROPOSTO',
      { x: margem, y: 798, size: 8, font: normal, color: rgb(1, 1, 1) })
    if(contexto) {
      let cabecalho=seguro(contexto,normal)
      if(normal.widthOfTextAtSize(cabecalho,8)>largura) {
        while(normal.widthOfTextAtSize(cabecalho+'...',8)>largura)cabecalho=cabecalho.slice(0,-1)
        cabecalho+='...'
      }
      pagina.drawText(cabecalho,{x:margem,y:768,size:8,font:normal,color:rgb(.07,.19,.23)});y=742
    }
  }
  function linhas(s: string, fonte: PDFFont, tamanho: number): string[] {
    const saida: string[] = []
    for (const paragrafo of s.split(/\r?\n/)) {
      let atual = ''
      for (const c of seguro(paragrafo, fonte)) {
        if (fonte.widthOfTextAtSize(atual + c, tamanho) > largura && atual) {
          const espaco = atual.lastIndexOf(' ')
          if (espaco > atual.length / 2) { saida.push(atual.slice(0, espaco)); atual = atual.slice(espaco + 1) + c }
          else { saida.push(atual); atual = c }
        } else atual += c
      }
      saida.push(atual)
    }
    return saida
  }
  function escrever(s: string, titulo = false) {
    const tamanho = titulo ? 12 : 9, fonte = titulo ? negrito : normal, altura = titulo ? 20 : 14
    if (titulo && y < 105) novaPagina()
    for (const linha of linhas(s, fonte, tamanho)) {
      if (y < 66) novaPagina()
      pagina.drawText(linha, { x: margem, y, size: tamanho, font: fonte, color: rgb(.07, .19, .23) }); y -= altura
    }
    y -= titulo ? 4 : 3
  }
  novaPagina()
  escrever(r.projetoNome, true)
  escrever(`Período: ${texto(r.consulta.inicio)} a ${texto(r.consulta.fim)} | Critério: ${r.consulta.criterio}`)
  escrever(`Gerado em: ${r.geradoEm} | Fórmula: ${r.versaoFormula} | Incluídos: ${r.registros.length}`)
  escrever(`Filtros: ${Object.entries(r.consulta.filtros ?? {}).filter(([,v]) => v != null && v !== '').map(([k,v]) => `${k} = ${v}`).join('; ') || 'nenhum adicional'}`)
  if (r.exclusoes) escrever(`Exclusões no conjunto conhecido: data ausente ${r.exclusoes.dataAusente}; data divergente ${r.exclusoes.dataAmbigua}; fora do período ${r.exclusoes.foraPeriodo}; outros filtros ${r.exclusoes.outrosFiltros}.`)
  for (const aviso of r.avisos) escrever(aviso)
  escrever('Totais observados (não representam valores ausentes)', true)
  const rotulos = {vivos:'Vivos',natimortos:'Natimortos',ovosNaoEclodidos:'Ovos não eclodidos',ovosFurados:'Ovos furados',ovosTotais:'Total de ovos'}
  for (const campo of ['vivos', 'natimortos', 'ovosNaoEclodidos', 'ovosFurados', 'ovosTotais'] as const) {
    const t = totalObservado(r, campo)
    escrever(`${rotulos[campo]}: ${texto(t.valor)} | ${t.observados} com valor, ${t.ausentes} sem valor${t.motivo?' | '+t.motivo:''}`)
  }
  escrever('Resumo dos registros', true)
  escrever('Registro | Data | Praia / km | Espécie | Situação / histórico | Vivos | Total | % vivos')
  if (!r.registros.length) escrever('Nenhum ninho atende aos filtros escolhidos.')
  for (const { linha: l } of r.registros) escrever([l.numeroRegistro, l.dataCriterio,
    `${texto(l.praiaCodigo)} / ${texto(l.localKm)}`, l.especieCodigo, `${texto(l.situacao)} / ${texto(l.historicoNinho)}`,
    l.vivos, l.ovosTotais, l.percentualVivos].map(texto).join(' | '))
  for (const registro of r.registros) {
    contexto=`Ficha ${texto(registro.linha.numeroRegistro)} • ${registro.ficha.ninho.codigoInterno}`
    novaPagina()
    const f = registro.ficha, o = registro.origem.ocorrencia!
    escrever(`Ficha ${texto(o.numeroRegistro)} • ${f.ninho.codigoInterno}`, true)
    escrever(`Projeto: ${r.consulta.projetoId} | Temporada: ${texto(o.temporadaId)} | Responsável: ${texto(o.responsavelId)}`)
    escrever('Campos da ficha de campo', true)
    for (const [campo, valor] of Object.entries(camposExportacao(registro))) {
      if ((campo === 'NAO_VIAVEIS' && o.especieCodigo !== 'DC') || (campo === 'N_NINHO' && f.ninho.situacao !== 'T') ||
        (['PRAIA_DEST_P', 'LOCAL_KM_P'].includes(campo) && f.ninho.situacao !== 'P')) continue
      escrever(`${campo}: ${texto(typeof valor === 'number' && ['LATITUDE','LONGITUDE'].includes(campo) ? valor.toFixed(5) : valor)}`)
    }
    escrever('Localização original e atual', true)
    for (const [nome, local] of [['Original', o.localOrigem], ['Atual (derivada)', f.posicaoAtual.local]] as const) {
      escrever(`${nome}: praia ${texto(local.praiaCodigo)}; km ${texto(local.localKm)}; ${texto(local.referencia)}`)
      escrever(`Latitude ${texto(local.latitude?.toFixed(5))}; longitude ${texto(local.longitude?.toFixed(5))}; datum ${texto(local.datum)}; precisão GPS ${texto(local.precisaoGpsM)} m; fonte ${texto(local.fonteGps)}`)
    }
    escrever('Histórico de transferências', true)
    if (!f.transferenciasOrdenadas.length) escrever('Nenhuma transferência registrada no conjunto fornecido.')
    for (const t of f.transferenciasOrdenadas) {
      escrever(`${t.dataTransferencia} | ${texto(t.instanteTransferencia)} | ${t.destino} | TEMP_TRANSF ${texto(t.tempoTransferencia)} | OVOS_TRANS ${texto(t.ovosTransferencia)}`)
      escrever(`Destino: ${JSON.stringify(t.localDestino)}; cercado ${texto(t.cercadoId)}; N_NINHO ${texto(t.numeroNinhoCercado)}; responsável ${texto(t.responsavelId)}; OBS ${texto(t.observacoes)}`)
    }
    escrever('Visitas de acompanhamento (acréscimo do projeto)', true)
    if (!registro.origem.visitas?.length) escrever('Nenhuma visita fornecida no conjunto do relatório.')
    for (const v of registro.origem.visitas ?? []) escrever(`${v.dataVisita} | responsável ${texto(v.responsavelId)} | condição ${texto(v.condicao)} | eventos ${texto(v.eventos)} | OBS ${texto(v.observacoes)}`)
    escrever('Registros de eclosão e abertura (origem preservada)', true)
    if (!registro.origem.aberturas.length) escrever('Nenhum registro de eclosão/abertura no conjunto fornecido.')
    for (const a of registro.origem.aberturas) {
      escrever(`ID ${a.id}; DATA_ECLOS ${texto(a.dataEclosao)}; noite ${texto(a.noiteReferenciaEclosao)}; DATA_ABERT ${texto(a.dataAbertura)}; noite ${texto(a.noiteReferenciaAbertura)}`)
      escrever(`VIVOS ${texto(a.vivos)}; NATIMORTOS ${texto(a.natimortos)}; OVOS_N_ECL ${texto(a.ovosNaoEclodidos)}; OVOS_FURAD ${texto(a.ovosFurados)}`)
      escrever(`Responsável ${texto(a.responsavelId)}; primeiro filhote ${texto(a.horaPrimeiroFilhote)}; último ${texto(a.horaUltimoFilhote)}; OBS ${texto(a.observacoes)}`)
    }
    escrever('Avisos e motivos de campos vazios', true)
    for (const motivo of registro.linha.motivos) escrever(motivo)
    if (!registro.linha.motivos.length) escrever('Nenhum aviso adicional.')
  }
  if (substituidos.size) {
    contexto=null
    novaPagina(); escrever('Limitação de caracteres da fonte local', true)
    escrever(`${substituidos.size} caracteres distintos não suportados foram substituídos por ?. O JSON conserva o texto original integral. Não usar este PDF como cópia integral desses textos.`)
  }
  const paginas = doc.getPages()
  paginas.forEach((p, i) => {
    p.drawLine({ start: { x: margem, y: 45 }, end: { x: 553, y: 45 }, thickness: .5, color: rgb(.7,.7,.7) })
    p.drawText(`Página ${i + 1} de ${paginas.length} | ${r.consulta.inicio} a ${r.consulta.fim} | ${r.consulta.criterio} | Gerado ${r.geradoEm.slice(0,10)}`, {x: margem, y: 29, size: 8, font: normal})
  })
  return doc.save()
}
