import { useEffect, useRef, useState, type ReactNode } from 'react'
import { capturarGPS, type CapturaGPS } from '../../services/gps'
import { corrigirAnimal, registrarOcorrencia, registrarTransferencia, registrarAbertura, registrarVisita, type EstadoTreino } from '../../app/treino'
import { PALAVRAS_CHAVE, ESPECIES, TIPOS_OCORRENCIA, SITUACOES, HISTORICOS_NINHO, TEMPOS_TRANSFERENCIA, RESPOSTA_TUMORES, type Localizacao, type Ocorrencia, type Transferencia } from '../../domain/tipos'

type Valores=Record<string,string>
const s=(v:unknown)=>v==null?'':String(v)
const vazio=(v:string|undefined)=>v?.trim()||null
function palavras(v:string|undefined):Ocorrencia['palavrasChave'] {const lista=v?.trim()?v.split(',').map(s=>s.trim()).filter(Boolean):[];if(lista.some(p=>!(PALAVRAS_CHAVE as readonly string[]).includes(p)))throw new Error('Use palavras-chave exatas do manual: '+PALAVRAS_CHAVE.join(', '));return lista as Ocorrencia['palavrasChave']}
function numero(v:string|undefined,inteiro=false):number|null {
  if(!v?.trim()) return null
  if(inteiro && !/^\d+$/.test(v)) throw new Error('Contagem deve ser inteira não negativa ou vazia.')
  const n=Number(v);if(!Number.isFinite(n) || (inteiro && !Number.isSafeInteger(n))) throw new Error('Número inválido. Confira os campos preenchidos.')
  return n
}
const booleano=(v:string|undefined)=>v==='true'?true:v==='false'?false:null
function local(v:Valores,p=''):Localizacao {
  const latitude=numero(v[p+'latitude']),longitude=numero(v[p+'longitude'])
  if(latitude!==null && Math.abs(latitude)>90 || longitude!==null && Math.abs(longitude)>180) throw new Error('Coordenadas fora do intervalo geográfico.')
  const datum=vazio(v[p+'datum']) as Localizacao['datum']
  if((latitude!==null || longitude!==null) && !datum) throw new Error('Informe o datum das coordenadas.')
  return {praiaId:null,praiaCodigo:vazio(v[p+'praia']),localKm:vazio(v[p+'km']),bairro:vazio(v[p+'bairro']),referencia:vazio(v[p+'referencia']),latitude,longitude,
    datum,fonteGps:latitude!==null||longitude!==null?'manual':null,precisaoGpsM:null,capturadoEm:null}
}
function autoria(estado:EstadoTreino) {return {usuario:estado.contexto?.usuario??'usuario-treino-local',instante:new Date().toISOString(),novoId:()=>crypto.randomUUID()}}
function Campo({nome,chave,v,mudar,tipo='text',opcoes}: {nome:string;chave:string;v:Valores;mudar:(k:string,val:string)=>void;tipo?:string;opcoes?:readonly (string|readonly [string,string])[]}) {
  return <label>{nome}{opcoes?<select aria-label={nome} value={v[chave]??''} onChange={e=>mudar(chave,e.target.value)}><option value="">Sem valor / não informado</option>{opcoes.map(o=>typeof o==='string'?<option key={o}>{o}</option>:<option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>:tipo==='textarea'?<textarea aria-label={nome} value={v[chave]??''} onChange={e=>mudar(chave,e.target.value)} rows={3}/>:<input aria-label={nome} type={tipo} step={tipo==='number'?'any':undefined} value={v[chave]??''} onChange={e=>mudar(chave,e.target.value)}/>}</label>
}
const simNao=[['true','Sim'],['false','Não']] as const
function Local({v,mudar,p=''}:{v:Valores;mudar:(k:string,val:string)=>void;p?:string}) {
  return <><Campo nome={p?'Código da praia de destino':'Código da praia (informado pela coordenação)'} chave={p+'praia'} v={v} mudar={mudar}/>
    <Campo nome={p?'Trecho de destino (km)':'Trecho da praia (km)'} chave={p+'km'} v={v} mudar={mudar}/>
    <Campo nome={p?'Bairro de destino':'Bairro'} chave={p+'bairro'} v={v} mudar={mudar}/>
    <Campo nome={p?'Referência de destino':'Local / referência'} chave={p+'referencia'} v={v} mudar={mudar}/>
    <Campo nome={p?'Latitude de destino':'Latitude original'} chave={p+'latitude'} v={v} mudar={mudar} tipo="number"/>
    <Campo nome={p?'Longitude de destino':'Longitude original'} chave={p+'longitude'} v={v} mudar={mudar} tipo="number"/>
    <Campo nome={p?'Datum de destino':'Datum original'} chave={p+'datum'} v={v} mudar={mudar} opcoes={['SIRGAS2000','WGS84']}/></>
}
function CamposTransferencia({v,mudar,cercado}:{v:Valores;mudar:(k:string,val:string)=>void;cercado:boolean}) {
  return <><Campo nome="Data de transferência (campo)" chave="dataTransferencia" v={v} mudar={mudar} tipo="date"/>
    <Campo nome="Tempo de transferência (TEMP_TRANSF)" chave="tempoTransferencia" v={v} mudar={mudar} opcoes={TEMPOS_TRANSFERENCIA}/>
    <Campo nome="Ovos observados na transferência (OVOS_TRANS)" chave="ovosTransferencia" v={v} mudar={mudar} tipo="number"/>
    {cercado&&<><Campo nome="Identificador do cercado fornecido pela equipe" chave="cercadoId" v={v} mudar={mudar}/><Campo nome="Número dentro do cercado (N_NINHO)" chave="numeroNinhoCercado" v={v} mudar={mudar}/></>}
    <Local v={v} mudar={mudar} p="destino-"/>
    <Campo nome="Observações da transferência" chave="obsTransferencia" v={v} mudar={mudar} tipo="textarea"/></>
}
function transferencia(v:Valores,cercado:boolean,estado:EstadoTreino) {
  const data=vazio(v.dataTransferencia);if(!data) throw new Error('Informe a data de transferência.')
  const destino=local(v,'destino-')
  if(!cercado && !destino.praiaCodigo) throw new Error('Informe o código de praia de destino fornecido pela coordenação. O aplicativo não inventa códigos.')
  return {destino:cercado?'CERCADO' as const:'PRAIA' as const,cercadoId:cercado?vazio(v.cercadoId):null,localDestino:destino,
    dataTransferencia:data,instanteTransferencia:null,noiteReferencia:data,tempoTransferencia:vazio(v.tempoTransferencia) as Transferencia['tempoTransferencia'],
    ovosTransferencia:numero(v.ovosTransferencia,true),numeroNinhoCercado:cercado?vazio(v.numeroNinhoCercado):null,sequencia:null,
    responsavelId:estado.contexto?.usuario??'usuario-treino-local',observacoes:vazio(v.obsTransferencia)}
}
function Base({titulo,salvar,cancelar,children,nuvem=false}: {nuvem?:boolean;titulo:string;salvar:()=>Promise<void>;cancelar:()=>void;children:ReactNode}) {
  const [erro,setErro]=useState(''),[ocupado,setOcupado]=useState(false)
  return <section className="cartao formulario-treino"><h2>{titulo}</h2><p className="mensagem aviso">{nuvem?'Dados do projeto: a confirmação de gravação depende do servidor.':'Treino local: não registre fichas oficiais. Nada é enviado ao Firebase.'} Vazio não significa zero. Códigos de praia dependem da coordenação.</p>
    <form onSubmit={e=>{e.preventDefault();setErro('');setOcupado(true);void salvar().catch(e=>setErro(e instanceof Error?e.message:'Falha ao salvar o treino.')).finally(()=>setOcupado(false))}}>
      <fieldset disabled={ocupado}>{children}</fieldset>{erro&&<p className="mensagem erro" role="alert">{erro}</p>}
      <div className="acoes"><button className="btn prim" disabled={ocupado}>{nuvem?'Salvar no projeto':'Salvar no aparelho'}</button><button className="btn" disabled={ocupado} type="button" onClick={cancelar}>Cancelar formulário</button></div>
    </form></section>
}
export interface PropsTreino {estado:EstadoTreino;aoSalvar:(novo:EstadoTreino)=>Promise<void>;cancelar:()=>void}
export function NovaVisita({estado,aoSalvar,cancelar,ninhoId}:PropsTreino&{ninhoId:string}) {
  const [v,setV]=useState<Valores>({});const mudar=(k:string,val:string)=>setV(a=>({...a,[k]:val}))
  async function salvar(){const data=vazio(v.data);if(!data)throw new Error('Informe a data da visita.');await aoSalvar(registrarVisita(estado,{projetoId:estado.contexto?.projetoId??'projeto-demo',ninhoId,dataVisita:data,noiteReferencia:data,responsavelId:estado.contexto?.usuario??'usuario-treino-local',condicao:vazio(v.condicao),eventos:v.evento?[v.evento as 'predacao'|'mare'|'perda_marcacao'|'outro']:[],observacoes:vazio(v.observacoes)},autoria(estado)))}
  return <Base nuvem={!!estado.contexto} titulo="Visita de acompanhamento" salvar={salvar} cancelar={cancelar}><div className="filtros"><Campo nome="Data da visita (campo)" chave="data" v={v} mudar={mudar} tipo="date"/><Campo nome="Condição observada (texto do projeto)" chave="condicao" v={v} mudar={mudar}/><Campo nome="Evento observado (acréscimo do projeto)" chave="evento" v={v} mudar={mudar} opcoes={['predacao','mare','perda_marcacao','outro']}/><Campo nome="Observações da visita" chave="observacoes" v={v} mudar={mudar} tipo="textarea"/></div><p className="ajuda">A visita não escolhe nem altera automaticamente o histórico oficial do ninho.</p></Base>
}
export function NovaOcorrencia({estado,aoSalvar,cancelar}:PropsTreino) {
  const [v,setV]=useState<Valores>({}),[gps,setGps]=useState<CapturaGPS|null>(null),[capturando,setCapturando]=useState(false),[erroGps,setErroGps]=useState('')
  const controle=useRef<AbortController|null>(null)
  useEffect(()=>()=>controle.current?.abort(),[])
  const mudar=(k:string,val:string)=>{if(['latitude','longitude','datum'].includes(k)){controle.current?.abort();setGps(null)}setV(a=>({...a,[k]:val}))}
  async function localizar(){const c=new AbortController();controle.current=c;setCapturando(true);setErroGps('');try{const g=await capturarGPS(undefined,{signal:c.signal});if(!c.signal.aborted){setGps(g);setV(a=>({...a,latitude:s(g.latitude),longitude:s(g.longitude),datum:g.datum}))}}catch(e){if(!c.signal.aborted)setErroGps(e instanceof Error?e.message:'GPS indisponível.')}finally{if(controle.current===c)setCapturando(false)}}
  const cd=v.tipo==='CD',transferida=cd&&(v.situacao==='T'||v.situacao==='P')
  async function salvar() {
    if(!v.tipo||!v.natureza) throw new Error('Escolha tipo de ocorrência e natureza.')
    const o:Parameters<typeof registrarOcorrencia>[1]={projetoId:estado.contexto?.projetoId??'projeto-demo',temporadaId:estado.contexto?vazio(v.temporada):'temporada-demo-2026',responsavelId:estado.contexto?.usuario??'usuario-treino-local',numeroRegistro:vazio(v.numeroRegistro),
      tipoOcorrencia:v.tipo as Ocorrencia['tipoOcorrencia'],tipoRegistro:v.natureza as Ocorrencia['tipoRegistro'],verificacaoPraiaRealizada:booleano(v.verificada),flagrante:booleano(v.flagrante),
      dataOcorrencia:vazio(v.dataOcorrencia),instanteOcorrencia:null,horaOcorrencia:v.flagrante==='true'?vazio(v.horaOcorrencia):null,noiteReferencia:vazio(v.dataOcorrencia),localOrigem:{...local(v),...(gps??{})},
      marcasEncontradas:vazio(v.marcasEncontradas),marcasColocadas:vazio(v.marcasColocadas),marcasRetiradas:vazio(v.marcasRetiradas),especieCodigo:vazio(v.especie) as Ocorrencia['especieCodigo'],
      comprimentoCasco:numero(v.comprimento),larguraCasco:numero(v.largura),tumores:vazio(v.tumores) as Ocorrencia['tumores'],coletaMaterialBiologico:vazio(v.coleta)?v.coleta!.split(',').map(s=>s.trim()).filter(Boolean):null,evidenciaInteracaoPesca:booleano(v.pesca),tipoEvidencia:vazio(v.tipoEvidencia),
      palavrasChave:palavras(v.palavras),observacoes:vazio(v.observacoes)}
    await aoSalvar(registrarOcorrencia(estado,o,cd?vazio(v.situacao) as typeof SITUACOES[number]:null,autoria(estado),transferida?transferencia(v,v.situacao==='T',estado):null))
  }
  return <Base nuvem={!!estado.contexto} titulo="Nova ocorrência" salvar={salvar} cancelar={cancelar}><h3>Ocorrência e localização original</h3><div className="filtros">
    <Campo nome="Tipo de ocorrência" chave="tipo" v={v} mudar={mudar} opcoes={TIPOS_OCORRENCIA}/>
    <Campo nome="Natureza" chave="natureza" v={v} mudar={mudar} opcoes={['REPRODUTIVO','NAO_REPRODUTIVO']}/>
    <Campo nome="Data da ocorrência (noite de campo)" chave="dataOcorrencia" v={v} mudar={mudar} tipo="date"/>
    <Campo nome="Número do controle geral (preserva zeros iniciais)" chave="numeroRegistro" v={v} mudar={mudar}/>
    {estado.contexto&&<Campo nome="Identificador da temporada fornecido pela equipe (opcional)" chave="temporada" v={v} mudar={mudar}/>}
    <Campo nome="Verificação da praia realizada" chave="verificada" v={v} mudar={mudar} opcoes={simNao}/>
    {cd&&<Campo nome="Situação de conservação" chave="situacao" v={v} mudar={mudar} opcoes={SITUACOES}/>}
    <Local v={v} mudar={mudar}/></div><div className="acoes"><button className="btn" type="button" disabled={capturando} onClick={()=>void localizar()}>{capturando?'Obtendo localização…':'Capturar localização original'}</button>{gps&&<span className="ajuda">GPS WGS84 · precisão {gps.precisaoGpsM} m · {gps.capturadoEm}</span>}</div>{erroGps&&<p className="mensagem erro" role="alert">{erroGps}</p>}<p className="ajuda">A data informada já deve corresponder à noite de campo. Desova localizada depois pode ter data de ocorrência vazia. A localização original não poderá ser sobrescrita por manejo.</p>
    <h3>Tartaruga</h3><div className="filtros"><Campo nome="Espécie" chave="especie" v={v} mudar={mudar} opcoes={ESPECIES}/><Campo nome="Flagrante da tartaruga" chave="flagrante" v={v} mudar={mudar} opcoes={simNao}/>
    {v.flagrante==='true'&&<><Campo nome="Hora da ocorrência (sem horário de verão)" chave="horaOcorrencia" v={v} mudar={mudar} tipo="time"/><Campo nome="Tumores" chave="tumores" v={v} mudar={mudar} opcoes={RESPOSTA_TUMORES}/>
    <Campo nome="Marcas encontradas" chave="marcasEncontradas" v={v} mudar={mudar}/><Campo nome="Marcas colocadas" chave="marcasColocadas" v={v} mudar={mudar}/><Campo nome="Marcas retiradas" chave="marcasRetiradas" v={v} mudar={mudar}/>
    <Campo nome="Comprimento do casco (unidade a confirmar)" chave="comprimento" v={v} mudar={mudar} tipo="number"/><Campo nome="Largura do casco (unidade a confirmar)" chave="largura" v={v} mudar={mudar} tipo="number"/></>}
    <Campo nome="Coleta biológica (itens separados por vírgula; vazio se não observada)" chave="coleta" v={v} mudar={mudar}/>
    <Campo nome="Evidência de interação com pesca" chave="pesca" v={v} mudar={mudar} opcoes={simNao}/>
    {v.pesca==='true'&&<Campo nome="Tipo de evidência fornecido pela coordenação" chave="tipoEvidencia" v={v} mudar={mudar}/>}
    <Campo nome="Palavras-chave do manual (separadas por vírgula)" chave="palavras" v={v} mudar={mudar}/>
    <Campo nome="Observações da ocorrência" chave="observacoes" v={v} mudar={mudar} tipo="textarea"/></div>
    {transferida&&<><h3>Transferência inicial (salva junto com a ocorrência)</h3><div className="filtros"><CamposTransferencia v={v} mudar={mudar} cercado={v.situacao==='T'}/></div></>}
  </Base>
}
export function NovaTransferencia({estado,aoSalvar,cancelar,ninhoId}:PropsTreino&{ninhoId:string}) {
  const [v,setV]=useState<Valores>({});const mudar=(k:string,val:string)=>setV(a=>({...a,[k]:val}))
  async function salvar(){if(!v.destino)throw new Error('Escolha o destino.');await aoSalvar(registrarTransferencia(estado,{...transferencia(v,v.destino==='CERCADO',estado),ninhoId,projetoId:estado.contexto?.projetoId??'projeto-demo'},autoria(estado)))}
  return <Base nuvem={!!estado.contexto} titulo="Nova transferência" salvar={salvar} cancelar={cancelar}><div className="filtros"><Campo nome="Destino da transferência" chave="destino" v={v} mudar={mudar} opcoes={['PRAIA','CERCADO']}/><CamposTransferencia v={v} mudar={mudar} cercado={v.destino==='CERCADO'}/></div><p className="ajuda">Sem classificação automática de TEMP_TRANSF. Confirme a categoria conforme o manual. A origem permanece preservada.</p></Base>
}
export function FormularioAbertura({estado,aoSalvar,cancelar,ninhoId}:PropsTreino&{ninhoId:string}) {
  const ninho=estado.ninhos.find(n=>n.id===ninhoId)!
  const especie=estado.ocorrencias.find(o=>o.id===ninho.ocorrenciaId)?.especieCodigo
  const registros=estado.aberturas.filter(a=>a.ninhoId===ninhoId)
  const [id,setId]=useState(estado.contexto?registros[0]?.id??'':''),[v,setV]=useState<Valores>({historico:s(ninho.historicoNinho),problema:s(ninho.problemaIncubacao)})
  const mudar=(k:string,val:string)=>setV(a=>({...a,[k]:val}))
  useEffect(()=>{if(estado.contexto&&registros[0])escolher(registros[0].id)},[])
  function escolher(novoId:string) {
    setId(novoId);const a=registros.find(x=>x.id===novoId)
    setV({historico:s(ninho.historicoNinho),problema:s(ninho.problemaIncubacao),dataEclosao:s(a?.dataEclosao),dataAbertura:s(a?.dataAbertura),
      vivos:s(a?.vivos),natimortos:s(a?.natimortos),ovosNaoEclodidos:s(a?.ovosNaoEclodidos),ovosFurados:s(a?.ovosFurados),naoViaveis:s(a?.naoViaveis),observacoes:s(a?.observacoes)})
  }
  async function salvar() {
    const anterior=registros.find(x=>x.id===id)
    const a:Parameters<typeof registrarAbertura>[1]={projetoId:estado.contexto?.projetoId??'projeto-demo',ninhoId,dataEclosao:vazio(v.dataEclosao),instanteEclosao:vazio(v.dataEclosao)===anterior?.dataEclosao?anterior.instanteEclosao:null,noiteReferenciaEclosao:vazio(v.dataEclosao),
      dataAbertura:vazio(v.dataAbertura),instanteAbertura:vazio(v.dataAbertura)===anterior?.dataAbertura?anterior.instanteAbertura:null,noiteReferenciaAbertura:vazio(v.dataAbertura),horaPrimeiroFilhote:anterior?.horaPrimeiroFilhote??null,horaUltimoFilhote:anterior?.horaUltimoFilhote??null,
      vivos:numero(v.vivos,true),natimortos:numero(v.natimortos,true),ovosNaoEclodidos:numero(v.ovosNaoEclodidos,true),ovosFurados:numero(v.ovosFurados,true),naoViaveis:especie==='DC'?numero(v.naoViaveis,true):null,
      responsavelId:estado.contexto?.usuario??'usuario-treino-local',observacoes:vazio(v.observacoes)}
    await aoSalvar(registrarAbertura(estado,a,{historico:vazio(v.historico) as AberturaHistorico,problema:booleano(v.problema)},autoria(estado),id||null))
  }
  type AberturaHistorico=typeof HISTORICOS_NINHO[number]|null
  return <Base nuvem={!!estado.contexto} titulo="Eclosão e abertura" salvar={salvar} cancelar={cancelar}><label>Registro de abertura<select aria-label="Registro de abertura" value={id} onChange={e=>escolher(e.target.value)}><option value="" disabled={!!estado.contexto&&registros.length>0}>Novo registro</option>{registros.map(a=><option key={a.id} value={a.id}>{a.id} · {a.dataAbertura??a.dataEclosao??'sem data'}</option>)}</select></label>
    <p className="ajuda">Para corrigir dados, escolha o registro existente; a versão anterior será preservada. Várias aberturas com contagens podem deixar derivados indeterminados, sem escolha automática.</p><div className="filtros">
      <Campo nome="Data da eclosão (noite de campo)" chave="dataEclosao" v={v} mudar={mudar} tipo="date"/><Campo nome="Data da abertura (noite de campo)" chave="dataAbertura" v={v} mudar={mudar} tipo="date"/>
      <Campo nome="Vivos" chave="vivos" v={v} mudar={mudar} tipo="number"/><Campo nome="Natimortos" chave="natimortos" v={v} mudar={mudar} tipo="number"/>
      <Campo nome="Ovos não eclodidos" chave="ovosNaoEclodidos" v={v} mudar={mudar} tipo="number"/><Campo nome="Ovos furados" chave="ovosFurados" v={v} mudar={mudar} tipo="number"/>
      {especie==='DC'&&<Campo nome="Ovos não viáveis (DC)" chave="naoViaveis" v={v} mudar={mudar} tipo="number"/>}
      <Campo nome="Histórico do ninho" chave="historico" v={v} mudar={mudar} opcoes={HISTORICOS_NINHO}/><Campo nome="Problema durante a incubação" chave="problema" v={v} mudar={mudar} opcoes={simNao}/>
      <Campo nome="Observações de abertura / histórico" chave="observacoes" v={v} mudar={mudar} tipo="textarea"/>
    </div><p className="ajuda">Total, percentual e incubação serão calculados por v2. Não digite valores derivados. Eclosão pode ser registrada antes da escavação, deixando todas as contagens vazias.</p>
  </Base>
}

export function CorrigirAnimal({estado,aoSalvar,cancelar,ocorrenciaId}:PropsTreino&{ocorrenciaId:string}) {
  const o=estado.ocorrencias.find(o=>o.id===ocorrenciaId)!
  const [v,setV]=useState<Valores>({numeroRegistro:s(o.numeroRegistro),especie:s(o.especieCodigo),marcasEncontradas:s(o.marcasEncontradas),marcasColocadas:s(o.marcasColocadas),marcasRetiradas:s(o.marcasRetiradas),comprimento:s(o.comprimentoCasco),largura:s(o.larguraCasco),tumores:s(o.tumores),coleta:o.coletaMaterialBiologico?.join(', ')??'',pesca:s(o.evidenciaInteracaoPesca),tipoEvidencia:s(o.tipoEvidencia),palavras:o.palavrasChave.join(', '),observacoes:s(o.observacoes)})
  const mudar=(k:string,val:string)=>setV(a=>({...a,[k]:val}))
  async function salvar(){await aoSalvar(corrigirAnimal(estado,o.id,{numeroRegistro:vazio(v.numeroRegistro),especieCodigo:vazio(v.especie) as Ocorrencia['especieCodigo'],marcasEncontradas:vazio(v.marcasEncontradas),marcasColocadas:vazio(v.marcasColocadas),marcasRetiradas:vazio(v.marcasRetiradas),comprimentoCasco:numero(v.comprimento),larguraCasco:numero(v.largura),tumores:vazio(v.tumores) as Ocorrencia['tumores'],coletaMaterialBiologico:vazio(v.coleta)?v.coleta!.split(',').map(s=>s.trim()).filter(Boolean):null,evidenciaInteracaoPesca:booleano(v.pesca),tipoEvidencia:vazio(v.tipoEvidencia),palavrasChave:palavras(v.palavras),observacoes:vazio(v.observacoes)},autoria(estado)))}
  return <Base nuvem={!!estado.contexto} titulo="Complementar dados da tartaruga" salvar={salvar} cancelar={cancelar}><p className="ajuda">Espécie também pode ser identificada pelos filhotes ou na abertura. A correção preserva a versão anterior; localização, datas e tipo da ocorrência original permanecem imutáveis. Use apenas o número atribuído pelo controle geral, sem renumerar.</p><div className="filtros">
    <Campo nome="Espécie" chave="especie" v={v} mudar={mudar} opcoes={ESPECIES}/>
    <Campo nome="Número atribuído pelo controle geral" chave="numeroRegistro" v={v} mudar={mudar}/>
    <Campo nome="Marcas encontradas" chave="marcasEncontradas" v={v} mudar={mudar}/><Campo nome="Marcas colocadas" chave="marcasColocadas" v={v} mudar={mudar}/><Campo nome="Marcas retiradas" chave="marcasRetiradas" v={v} mudar={mudar}/>
    <Campo nome="Comprimento do casco (unidade a confirmar)" chave="comprimento" v={v} mudar={mudar} tipo="number"/><Campo nome="Largura do casco (unidade a confirmar)" chave="largura" v={v} mudar={mudar} tipo="number"/>
    <Campo nome="Tumores" chave="tumores" v={v} mudar={mudar} opcoes={RESPOSTA_TUMORES}/>
    <Campo nome="Coleta biológica (itens separados por vírgula)" chave="coleta" v={v} mudar={mudar}/>
    <Campo nome="Evidência de interação com pesca" chave="pesca" v={v} mudar={mudar} opcoes={simNao}/><Campo nome="Tipo de evidência fornecido pela coordenação" chave="tipoEvidencia" v={v} mudar={mudar}/>
    <Campo nome="Palavras-chave do manual (separadas por vírgula)" chave="palavras" v={v} mudar={mudar}/><Campo nome="Observações da ocorrência / motivo da correção" chave="observacoes" v={v} mudar={mudar} tipo="textarea"/>
    </div></Base>
}
