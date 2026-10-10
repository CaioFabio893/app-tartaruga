import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { capturarGPS, type CapturaGPS } from '../../services/gps'
import { corrigirAnimal, corrigirCadastro, registrarOcorrencia, registrarTransferencia, registrarAbertura, registrarVisita, type EstadoTreino } from '../../app/treino'
import { PALAVRAS_CHAVE, ESPECIES, SITUACOES, HISTORICOS_NINHO, TEMPOS_TRANSFERENCIA, RESPOSTA_TUMORES, type Localizacao, type Ocorrencia, type Transferencia } from '../../domain/tipos'

import { lerRascunho } from './rascunho'
import { ErroCampo, campoDaMensagem, nomesCampos, validarCadastro, validarCampos } from './validacaoCadastro'

type Valores=Record<string,string>
const ErrosContexto=createContext<Record<string,string>>({})
const s=(v:unknown)=>v==null?'':String(v)
const vazio=(v:string|undefined)=>v?.trim()||null
function palavras(v:string|undefined):Ocorrencia['palavrasChave'] {const lista=v?.trim()?v.split(',').map(s=>s.trim()).filter(Boolean):[];if(lista.some(p=>!(PALAVRAS_CHAVE as readonly string[]).includes(p)))throw new Error('Use palavras-chave exatas do manual: '+PALAVRAS_CHAVE.join(', '));return lista as Ocorrencia['palavrasChave']}
function numero(v:string|undefined,inteiro=false):number|null {
  if(!v?.trim()) return null
  if(inteiro && !/^\d+$/.test(v)) throw new Error('Contagem deve ser inteira não negativa ou vazia.')
  const n=Number(v.replace(',','.'));if(!Number.isFinite(n) || (inteiro && !Number.isSafeInteger(n))) throw new Error('Número inválido. Confira os campos preenchidos.')
  return n
}
const booleano=(v:string|undefined)=>v==='true'?true:v==='false'?false:null
function local(v:Valores,p=''):Localizacao {
  const latitude=numero(v[p+'latitude']),longitude=numero(v[p+'longitude'])
  if(latitude!==null && Math.abs(latitude)>90 || longitude!==null && Math.abs(longitude)>180) throw new Error('Coordenadas fora do intervalo geográfico.')
  const datum=vazio(v[p+'datum']) as Localizacao['datum']
  if((latitude!==null || longitude!==null) && !datum) throw new Error('Informe o datum das coordenadas.')
  return {praiaId:null,praiaCodigo:vazio(v[p+'praia']),localKm:vazio(v[p+'km']),bairro:vazio(v[p+'bairro']),referencia:vazio(v[p+'referencia']),latitude,longitude,
    datum,fonteGps:v[p+'fonteGps']==='dispositivo'?'dispositivo':latitude!==null||longitude!==null?'manual':null,precisaoGpsM:v[p+'fonteGps']==='dispositivo'?numero(v[p+'precisaoGpsM']):null,capturadoEm:v[p+'fonteGps']==='dispositivo'?vazio(v[p+'capturadoEm']):null}
}
function autoria(estado:EstadoTreino) {return {usuario:estado.contexto?.usuario??'usuario-treino-local',instante:new Date().toISOString(),novoId:()=>crypto.randomUUID()}}
function Campo({nome,chave,v,mudar,tipo='text',opcoes}: {nome:string;chave:string;v:Valores;mudar:(k:string,val:string)=>void;tipo?:string;opcoes?:readonly (string|readonly [string,string])[]}) {
  const erros=useContext(ErrosContexto),erro=erros[chave],id='campo-'+chave
  const rotulo=nomesCampos[chave]??(chave==='destino-praia'?'PRAIA_DEST_P':chave==='destino-km'?'LOCAL_KM_P':nome)
  const ajuda:Record<string,string>={numeroRegistro:'Use o número fornecido pelo controle geral. Preserve zeros iniciais. Pode completar depois.',dataOcorrencia:'Informe a noite de campo. Deixe vazio se a desova só foi localizada depois e a data não é conhecida.',praia:'Use o código fornecido pela coordenação. Se ainda não foi fornecido, deixe vazio.',comprimento:'Medida em cm. Deixe vazio quando não foi observada.',largura:'Medida em cm. Deixe vazio quando não foi observada.',especie:'Pode ser identificada pela tartaruga, pelos filhotes ou na abertura. NI significa não identificada.',situacao:'Obrigatório para CD. I: in situ; T: cercado; P: praia. Uma transferência posterior é registrada na ficha.',natureza:'Escolha a natureza do registro conforme a observação.',tipo:'Obrigatório. Apenas CD (Com Desova) cria um ninho.',tumores:'Obrigatório no flagrante: S = sim, N = não, I = indeterminado.',palavras:'Escolha apenas termos do manual, sem acento e no singular.',motivo:'Obrigatório na edição. Explique o que estava errado; os valores anteriores ficam no histórico.'}
  const atributos={id,'aria-label':rotulo,'aria-invalid':!!erro,'aria-describedby':erro?id+'-erro':ajuda[chave]?id+'-ajuda':undefined,'data-campo':chave}
  return <label htmlFor={id}>{rotulo}{opcoes?<select {...atributos} value={v[chave]??''} onChange={e=>mudar(chave,e.target.value)}><option value="">Sem valor / não informado</option>{opcoes.map(o=>typeof o==='string'?<option key={o}>{o}</option>:<option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>:tipo==='textarea'?<textarea {...atributos} value={v[chave]??''} onChange={e=>mudar(chave,e.target.value)} rows={3}/>:<input {...atributos} type={tipo==='number'?'text':tipo} inputMode={tipo==='number'?'decimal':undefined} value={v[chave]??''} onChange={e=>mudar(chave,e.target.value)}/>} {ajuda[chave]&&<small id={id+'-ajuda'} className="ajuda">{ajuda[chave]}</small>}{erro&&<span id={id+'-erro'} className="erro-campo">{rotulo}: {erro}</span>}</label>
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
function GPSDestino({v,mudar}:{v:Valores;mudar:(k:string,val:string)=>void}) {
  const [ocupado,setOcupado]=useState(false),[erro,setErro]=useState('');const controle=useRef<AbortController|null>(null)
  useEffect(()=>()=>controle.current?.abort(),[])
  const manual=(k:string,val:string)=>{if(['destino-latitude','destino-longitude','destino-datum'].includes(k)){controle.current?.abort();mudar('destino-fonteGps','');mudar('destino-precisaoGpsM','');mudar('destino-capturadoEm','')}mudar(k,val)}
  async function buscar(){const c=new AbortController();controle.current=c;setOcupado(true);setErro('');try{const g=await capturarGPS(undefined,{signal:c.signal});if(!c.signal.aborted)for(const [k,val] of Object.entries(g))mudar('destino-'+k,String(val))}catch(e){if(!c.signal.aborted)setErro(e instanceof Error?e.message:'GPS indisponível.')}finally{if(controle.current===c)setOcupado(false)}}
  return <><Local v={v} mudar={manual} p="destino-"/><div className="gps-destino"><button type="button" className="btn" disabled={ocupado} onClick={()=>void buscar()}>{ocupado?'Buscando melhor leitura…':'Capturar latitude e longitude do destino'}</button>{ocupado&&<button type="button" className="btn" onClick={()=>controle.current?.abort()}>Cancelar captura</button>}{v['destino-fonteGps']==='dispositivo'&&<p>GPS WGS84: margem de erro informada pelo aparelho {v['destino-precisaoGpsM']} m. Coordenadas preservadas sem arredondar.</p>}{erro&&<p role="alert">{erro}</p>}<p className="ajuda">Fique no local exato do destino, ao ar livre. A captura busca a melhor leitura por até 30 segundos. Confira a margem de erro; o GPS sozinho pode não localizar os ovos.</p></div></>
}
function CamposTransferencia({v,mudar,cercado}:{v:Valores;mudar:(k:string,val:string)=>void;cercado:boolean}) {
  return <><Campo nome="Data de transferência (campo)" chave="dataTransferencia" v={v} mudar={mudar} tipo="date"/>
    <Campo nome="Tempo de transferência (TEMP_TRANSF)" chave="tempoTransferencia" v={v} mudar={mudar} opcoes={TEMPOS_TRANSFERENCIA}/>
    <Campo nome="Ovos observados na transferência (OVOS_TRANS)" chave="ovosTransferencia" v={v} mudar={mudar} tipo="number"/>
    {cercado&&<><Campo nome="Identificador do cercado fornecido pela equipe" chave="cercadoId" v={v} mudar={mudar}/><Campo nome="Número dentro do cercado (N_NINHO)" chave="numeroNinhoCercado" v={v} mudar={mudar}/></>}
    <GPSDestino v={v} mudar={mudar}/>
    <Campo nome="Observações da transferência" chave="obsTransferencia" v={v} mudar={mudar} tipo="textarea"/></>
}
function transferencia(v:Valores,cercado:boolean,estado:EstadoTreino):Omit<Transferencia,'id'|'ninhoId'|'projetoId'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'> {
  const data=vazio(v.dataTransferencia);if(!data) throw new Error('Informe a data de transferência.')
  const destino=local(v,'destino-')
  if(!cercado && !destino.praiaCodigo) throw new Error('Informe o código de praia de destino fornecido pela coordenação. O aplicativo não inventa códigos.')
  return {destino:cercado?'CERCADO' as const:'PRAIA' as const,cercadoId:cercado?vazio(v.cercadoId):null,localDestino:destino,
    dataTransferencia:data,instanteTransferencia:null,noiteReferencia:data,tempoTransferencia:vazio(v.tempoTransferencia) as Transferencia['tempoTransferencia'],
    ovosTransferencia:numero(v.ovosTransferencia,true),numeroNinhoCercado:cercado?vazio(v.numeroNinhoCercado):null,sequencia:null,
    responsavelId:estado.contexto?.usuario??'usuario-treino-local',observacoes:vazio(v.obsTransferencia)}
}
function Base({titulo,salvar,cancelar,children,nuvem=false,etapas,validar}: {nuvem?:boolean;titulo:string;salvar:()=>Promise<void>;cancelar:()=>void;children?:ReactNode;etapas?:{titulo:string;ajuda:string;conteudo:ReactNode}[];validar?:()=>Record<string,string>}) {
  const [erro,setErro]=useState(''),[ocupado,setOcupado]=useState(false),[passo,setPasso]=useState(0),[erros,setErros]=useState<Record<string,string>>({})
  const form=useRef<HTMLFormElement>(null),cabecalho=useRef<HTMLHeadingElement>(null)
  const foco=useRef<string|null>(null)
  useEffect(()=>{if(foco.current){form.current?.querySelector<HTMLElement>('[data-campo="'+foco.current+'"]')?.focus();foco.current=null}else cabecalho.current?.focus()},[passo,erros])
  function conferir(todos=false){const falhas=validar?.()??{},visiveis=[...form.current?.querySelectorAll<HTMLElement>('[data-campo]')??[]].filter(el=>!el.closest('[hidden]')).map(el=>el.dataset.campo!)
    const relevantes=Object.fromEntries(Object.entries(falhas).filter(([k])=>todos||visiveis.includes(k)))
    setErros(relevantes);const primeiro=Object.keys(relevantes)[0]
    if(primeiro){if(etapas){const i=[...form.current?.querySelectorAll<HTMLElement>('[data-etapa]')??[]].findIndex(el=>!!el.querySelector('[data-campo="'+primeiro+'"]'));if(i>=0)setPasso(i)}foco.current=primeiro;setErro('Confira o campo indicado abaixo. O que você preencheu foi preservado.');return false}setErro('');return true
  }
  async function enviar(){if(!conferir(true))return;setOcupado(true);try{await salvar()}catch(e){const mensagem=e instanceof Error?e.message:'Não foi possível salvar. Tente novamente; os dados estão preservados.';setErro(mensagem);let chave=e instanceof ErroCampo?e.campo:campoDaMensagem(mensagem);if(chave){foco.current=chave;setErros({[chave]:mensagem});if(etapas){const i=[...form.current?.querySelectorAll<HTMLElement>('[data-etapa]')??[]].findIndex(el=>!!el.querySelector('[data-campo="'+chave+'"]'));if(i>=0)setPasso(i)}}}finally{setOcupado(false)}}
  return <section className="cartao formulario-treino"><h2>{titulo}</h2><p className="ajuda">{nuvem?'A sincronização será confirmada pelo servidor.':'Treino local: dados salvos apenas neste aparelho.'} Deixe vazio o que não foi observado. Zero só quando foi observado.</p>
    <ErrosContexto.Provider value={erros}><form ref={form} noValidate onChange={e=>{const chave=(e.target as HTMLElement).dataset.campo;if(chave&&erros[chave])setErros(a=>{const novo={...a};delete novo[chave];return novo})}} onSubmit={e=>{e.preventDefault();if(etapas&&passo<etapas.length-1){if(conferir())setPasso(p=>p+1)}else void enviar()}}>
      {etapas&&<><p className="progresso-etapas" role="status">Etapa {passo+1} de {etapas.length}</p><h3 ref={cabecalho} tabIndex={-1}>{etapas[passo]!.titulo}</h3><p>{etapas[passo]!.ajuda}</p></>}
      {erro&&<p className="mensagem erro" role="alert">{erro}</p>}
      <fieldset disabled={ocupado}>{etapas?etapas.map((etapa,i)=><div key={i} data-etapa={i} hidden={i!==passo}>{etapa.conteudo}</div>):children}</fieldset>
      <div className="acoes">{etapas&&passo>0&&<button className="btn" disabled={ocupado} type="button" onClick={()=>{setPasso(p=>p-1);setErro('')}}>Voltar</button>}<button className="btn prim" disabled={ocupado}>{ocupado?'Salvando…':etapas&&passo<etapas.length-1?'Continuar':nuvem?'Salvar no projeto':'Salvar no aparelho'}</button><button className="btn" disabled={ocupado} type="button" onClick={cancelar}>Cancelar formulário</button></div>
    </form></ErrosContexto.Provider></section>
}
export interface PropsTreino {estado:EstadoTreino;aoSalvar:(novo:EstadoTreino)=>Promise<void>;cancelar:()=>void}
export function NovaVisita({estado,aoSalvar,cancelar,ninhoId}:PropsTreino&{ninhoId:string}) {
  const [v,setV]=useState<Valores>({});const mudar=(k:string,val:string)=>setV(a=>({...a,[k]:val}))
  async function salvar(){const data=vazio(v.data);if(!data)throw new Error('Informe a data da visita.');await aoSalvar(registrarVisita(estado,{projetoId:estado.contexto?.projetoId??'projeto-demo',ninhoId,dataVisita:data,noiteReferencia:data,responsavelId:estado.contexto?.usuario??'usuario-treino-local',condicao:vazio(v.condicao),eventos:v.evento?[v.evento as 'predacao'|'mare'|'perda_marcacao'|'outro']:[],observacoes:vazio(v.observacoes)},autoria(estado)))}
  return <Base nuvem={!!estado.contexto} titulo="Visita de acompanhamento" validar={()=>validarCampos(v)} salvar={salvar} cancelar={cancelar}><div className="filtros"><Campo nome="Data da visita (campo)" chave="data" v={v} mudar={mudar} tipo="date"/><Campo nome="Condição observada (texto do projeto)" chave="condicao" v={v} mudar={mudar}/><Campo nome="Evento observado (acréscimo do projeto)" chave="evento" v={v} mudar={mudar} opcoes={['predacao','mare','perda_marcacao','outro']}/><Campo nome="Observações da visita" chave="observacoes" v={v} mudar={mudar} tipo="textarea"/></div><p className="ajuda">A visita não escolhe nem altera automaticamente o histórico oficial do ninho.</p></Base>
}
export function NovaOcorrencia({estado,aoSalvar,cancelar,ocorrenciaId}:PropsTreino&{ocorrenciaId?:string}) {
  const original=estado.ocorrencias.find(o=>o.id===ocorrenciaId),edicao=!!original
  const chaveRascunho=`ninhos-rascunho-p15:${estado.contexto?.usuario??'treino'}:${estado.contexto?.projetoId??'demo'}:${ocorrenciaId??'novo'}`
  const [avisoRascunho,setAvisoRascunho]=useState('')
  const [v,setV]=useState<Valores>(()=>{try{const salvo=lerRascunho(localStorage.getItem(chaveRascunho),original?.versao??null);if(salvo)return salvo}catch{}return original?{tipo:original.tipoOcorrencia,natureza:original.tipoRegistro,temporada:s(original.temporadaId),numeroRegistro:s(original.numeroRegistro),dataOcorrencia:s(original.dataOcorrencia),verificada:s(original.verificacaoPraiaRealizada),situacao:s(estado.ninhos.find(n=>n.id===original.ninhoId)?.situacao),praia:s(original.localOrigem.praiaCodigo),km:s(original.localOrigem.localKm),bairro:s(original.localOrigem.bairro),referencia:s(original.localOrigem.referencia),latitude:s(original.localOrigem.latitude),longitude:s(original.localOrigem.longitude),datum:s(original.localOrigem.datum),especie:s(original.especieCodigo),flagrante:s(original.flagrante),horaOcorrencia:s(original.horaOcorrencia),tumores:s(original.tumores),marcasEncontradas:s(original.marcasEncontradas),marcasColocadas:s(original.marcasColocadas),marcasRetiradas:s(original.marcasRetiradas),comprimento:s(original.comprimentoCasco),largura:s(original.larguraCasco),coleta:original.coletaMaterialBiologico?.join(', ')??'',pesca:s(original.evidenciaInteracaoPesca),tipoEvidencia:s(original.tipoEvidencia),palavras:original.palavrasChave.join(', '),observacoes:s(original.observacoes)}:{}})
  useEffect(()=>{try{localStorage.setItem(chaveRascunho,JSON.stringify({versao:original?.versao??null,valores:v}));setAvisoRascunho('Rascunho guardado neste aparelho. Ainda não cadastrado nem sincronizado.')}catch{setAvisoRascunho('Não foi possível guardar o rascunho. Mantenha o formulário aberto até salvar.')}},[v,chaveRascunho,original?.versao])
  const [gps,setGps]=useState<CapturaGPS|null>(null),[capturando,setCapturando]=useState(false),[erroGps,setErroGps]=useState('')
  const controle=useRef<AbortController|null>(null)
  useEffect(()=>()=>controle.current?.abort(),[])
  const mudar=(k:string,val:string)=>{if(['latitude','longitude','datum'].includes(k)){controle.current?.abort();setGps(null)}setV(a=>({...a,[k]:val}))}
  async function localizar(){const c=new AbortController();controle.current=c;setCapturando(true);setErroGps('');try{const g=await capturarGPS(undefined,{signal:c.signal});if(!c.signal.aborted){setGps(g);setV(a=>({...a,latitude:s(g.latitude),longitude:s(g.longitude),datum:g.datum}))}}catch(e){if(!c.signal.aborted)setErroGps(e instanceof Error?e.message:'GPS indisponível. Você pode informar as coordenadas manualmente.')}finally{if(controle.current===c)setCapturando(false)}}
  const cd=v.tipo==='CD',transferida=cd&&(v.situacao==='T'||v.situacao==='P')
  async function salvar(){
    const o:Parameters<typeof registrarOcorrencia>[1]={projetoId:estado.contexto?.projetoId??'projeto-demo',temporadaId:estado.contexto?vazio(v.temporada):'temporada-demo-2026',responsavelId:estado.contexto?.usuario??'usuario-treino-local',numeroRegistro:vazio(v.numeroRegistro),
      tipoOcorrencia:v.tipo as Ocorrencia['tipoOcorrencia'],tipoRegistro:v.natureza as Ocorrencia['tipoRegistro'],verificacaoPraiaRealizada:booleano(v.verificada),flagrante:booleano(v.flagrante),
      dataOcorrencia:vazio(v.dataOcorrencia),instanteOcorrencia:null,horaOcorrencia:v.flagrante==='true'?vazio(v.horaOcorrencia):null,noiteReferencia:vazio(v.dataOcorrencia),localOrigem:{...local(v),...(gps??{})},
      marcasEncontradas:vazio(v.marcasEncontradas),marcasColocadas:vazio(v.marcasColocadas),marcasRetiradas:vazio(v.marcasRetiradas),especieCodigo:vazio(v.especie) as Ocorrencia['especieCodigo'],
      comprimentoCasco:numero(v.comprimento),larguraCasco:numero(v.largura),tumores:vazio(v.tumores) as Ocorrencia['tumores'],coletaMaterialBiologico:vazio(v.coleta)?v.coleta!.split(',').map(s=>s.trim()).filter(Boolean):null,evidenciaInteracaoPesca:booleano(v.pesca),tipoEvidencia:vazio(v.tipoEvidencia),
      palavrasChave:palavras(v.palavras),observacoes:vazio(v.observacoes)}

    if(original){
      if(v.situacao!==s(estado.ninhos.find(n=>n.id===original.ninhoId)?.situacao))throw new ErroCampo('situacao','SITUACAO: use Registrar transferência para registrar um novo manejo. Corrija os dados de uma transferência existente na própria ficha.')
      if(original.dataOcorrencia===o.dataOcorrencia){o.instanteOcorrencia=original.instanteOcorrencia;o.noiteReferencia=original.noiteReferencia}
      if(['praiaCodigo','localKm','bairro','referencia','latitude','longitude','datum'].every(k=>o.localOrigem[k as keyof Localizacao]===original.localOrigem[k as keyof Localizacao]))o.localOrigem=original.localOrigem
      await aoSalvar(corrigirCadastro(estado,original.id,o,v.motivo??'',autoria(estado)))
    }else await aoSalvar(registrarOcorrencia(estado,o,cd?vazio(v.situacao) as typeof SITUACOES[number]:null,autoria(estado),transferida?transferencia(v,v.situacao==='T',estado):null))
    try{localStorage.removeItem(chaveRascunho)}catch{}
  }
  const etapas=[
   {titulo:'Ocorrência',ajuda:'Preencha o tipo e a natureza. Informe a data e o número apenas quando conhecidos.',conteudo:<div className="filtros">
    <Campo nome="Tipo de ocorrência" chave="tipo" v={v} mudar={mudar} opcoes={[["CD","CD — Com Desova"],["ML","ML — Meia Lua"],["SD","SD — Sem Desova"],["ND","ND — Não Determinado"],["PI","PI — Processo de Desova Interrompido"]]}/><Campo nome="Natureza" chave="natureza" v={v} mudar={mudar} opcoes={['REPRODUTIVO','NAO_REPRODUTIVO']}/>
    <Campo nome="Data da ocorrência" chave="dataOcorrencia" v={v} mudar={mudar} tipo="date"/><Campo nome="Número de Registro" chave="numeroRegistro" v={v} mudar={mudar}/>
    {estado.contexto&&<Campo nome="Identificador da temporada fornecido pela equipe (opcional)" chave="temporada" v={v} mudar={mudar}/>}
    <Campo nome="Verificação da praia realizada" chave="verificada" v={v} mudar={mudar} opcoes={simNao}/></div>},
   {titulo:'Localização original',ajuda:'Informe o local da ocorrência. Você pode usar o GPS ou preencher manualmente.',conteudo:<><div className="filtros"><Local v={v} mudar={mudar}/></div><div className="acoes"><button className="btn" type="button" disabled={capturando} onClick={()=>void localizar()}>{capturando?'Buscando melhor leitura…':'Capturar localização original'}</button>{capturando&&<button type="button" className="btn" onClick={()=>controle.current?.abort()}>Cancelar captura</button>}{gps&&<span className="ajuda">GPS WGS84 · margem de erro {gps.precisaoGpsM} m</span>}</div>{erroGps&&<p className="mensagem erro" role="alert">{erroGps}</p>}{edicao&&<p>A correção mantém os valores anteriores no histórico. Não use esta etapa para registrar transferência.</p>}</>},
   {titulo:'Tartaruga',ajuda:'Preencha o que foi observado. Marcas e medidas aparecem quando houve flagrante.',conteudo:<div className="filtros"><Campo nome="Espécie" chave="especie" v={v} mudar={mudar} opcoes={ESPECIES}/><Campo nome="Flagrante da tartaruga" chave="flagrante" v={v} mudar={mudar} opcoes={simNao}/>
    {v.flagrante==='true'&&<><Campo nome="Hora da ocorrência" chave="horaOcorrencia" v={v} mudar={mudar} tipo="time"/><Campo nome="Tumores" chave="tumores" v={v} mudar={mudar} opcoes={RESPOSTA_TUMORES}/><Campo nome="Marcas encontradas" chave="marcasEncontradas" v={v} mudar={mudar}/><Campo nome="Marcas colocadas" chave="marcasColocadas" v={v} mudar={mudar}/><Campo nome="Marcas retiradas" chave="marcasRetiradas" v={v} mudar={mudar}/><Campo nome="Comprimento do casco" chave="comprimento" v={v} mudar={mudar} tipo="number"/><Campo nome="Largura do casco" chave="largura" v={v} mudar={mudar} tipo="number"/></>}
    <Campo nome="Coleta biológica" chave="coleta" v={v} mudar={mudar}/><Campo nome="Evidência de interação com pesca" chave="pesca" v={v} mudar={mudar} opcoes={simNao}/>{v.pesca==='true'&&<Campo nome="Tipo de evidência" chave="tipoEvidencia" v={v} mudar={mudar}/>}</div>},
   ...(!edicao&&cd?[{titulo:'SITUACAO',ajuda:'Se não houve transferência, escolha I. Uma transferência que acontecer depois será registrada pela ficha do ninho.',conteudo:<><div className="filtros"><Campo nome="SITUACAO" chave="situacao" v={v} mudar={mudar} opcoes={[["I","I — Desova in situ (sem transferência)"],["T","T — Desova transferida para o cercado de incubação"],["P","P — Desova transferida para a praia"]]}/></div>{transferida&&<><h4>Transferência já realizada</h4><div className="filtros"><CamposTransferencia v={v} mudar={mudar} cercado={v.situacao==='T'}/></div></>}</>}]:[]),
   {titulo:'Observações',ajuda:'Registre informações objetivas e as palavras-chave aplicáveis. Não é necessário inventar informação para completar campos.',conteudo:<><div className="filtros"><Campo nome="Observações da ocorrência" chave="observacoes" v={v} mudar={mudar} tipo="textarea"/>{edicao&&<Campo nome="Motivo da correção" chave="motivo" v={v} mudar={mudar} tipo="textarea"/>}</div><fieldset className="palavras-chave"><legend>PALAVRAS_CHAVE — escolha se aplicável</legend>{PALAVRAS_CHAVE.map(p=><label key={p}><input type="checkbox" checked={(v.palavras??'').split(',').map(x=>x.trim()).includes(p)} onChange={e=>{const atuais=(v.palavras??'').split(',').map(x=>x.trim()).filter(Boolean);mudar('palavras',(e.target.checked?[...atuais,p]:atuais.filter(x=>x!==p)).join(', '))}}/>{p}</label>)}</fieldset></>},
   {titulo:'Conferir e salvar',ajuda:'Confira os dados. Use Voltar para corrigir antes de salvar.',conteudo:<><dl className="resumo-cadastro">{Object.entries(v).filter(([k,val])=>val&&(!k.startsWith('destino-')||transferida)&&!['fonteGps','capturadoEm','precisaoGpsM'].includes(k)).map(([k,val])=><div key={k}><dt>{nomesCampos[k]??k}</dt><dd>{val}</dd></div>)}</dl>{cd&&<p>Você poderá registrar transferência, visitas e eclosão / abertura depois, pela ficha do ninho.</p>}</>}
  ]
  return <><p role="status" className="ajuda">{avisoRascunho}</p><Base nuvem={!!estado.contexto} titulo={edicao?'Editar cadastro':'Nova ocorrência'} salvar={salvar} cancelar={cancelar} etapas={etapas} validar={()=>validarCadastro(v,edicao)}/></>
}
export function NovaTransferencia({estado,aoSalvar,cancelar,ninhoId,transferenciaId}:PropsTreino&{ninhoId:string;transferenciaId?:string|undefined}) {
 const anterior=estado.transferencias.find(t=>t.id===transferenciaId&&t.ninhoId===ninhoId)
 const [v,setV]=useState<Valores>(()=>anterior?{destino:anterior.destino,dataTransferencia:s(anterior.dataTransferencia),tempoTransferencia:s(anterior.tempoTransferencia),ovosTransferencia:s(anterior.ovosTransferencia),cercadoId:s(anterior.cercadoId),numeroNinhoCercado:s(anterior.numeroNinhoCercado),obsTransferencia:s(anterior.observacoes),...Object.fromEntries([['praia',anterior.localDestino.praiaCodigo],['km',anterior.localDestino.localKm],['bairro',anterior.localDestino.bairro],['referencia',anterior.localDestino.referencia],['latitude',anterior.localDestino.latitude],['longitude',anterior.localDestino.longitude],['datum',anterior.localDestino.datum],['fonteGps',anterior.localDestino.fonteGps],['precisaoGpsM',anterior.localDestino.precisaoGpsM],['capturadoEm',anterior.localDestino.capturadoEm]].map(([k,val])=>['destino-'+k,s(val)]))}:{})
 const mudar=(k:string,val:string)=>setV(a=>({...a,[k]:val}))
 function validar(){const erros=validarCampos(v);if(!v.destino)erros.destino='Selecione PRAIA ou CERCADO.';if(!v.dataTransferencia)erros.dataTransferencia='Informe a data da transferência.';if(v.destino==='CERCADO'){if(!v.cercadoId?.trim())erros.cercadoId='Informe o identificador fornecido pela equipe.';if(!v.numeroNinhoCercado?.trim())erros.numeroNinhoCercado='Informe o número dentro do cercado, preservando zeros.'}if(v.destino==='PRAIA'){if(!v['destino-praia']?.trim())erros['destino-praia']='Informe o código da praia de destino.';if(!v['destino-km']?.trim())erros['destino-km']='Informe o trecho da praia de destino.'}if(anterior&&!v.motivo?.trim())erros.motivo='Explique o erro que está corrigindo.';return erros}
 async function salvar(){const dados=transferencia(v,v.destino==='CERCADO',estado);if(anterior){dados.instanteTransferencia=dados.dataTransferencia===anterior.dataTransferencia?anterior.instanteTransferencia:null;dados.sequencia=anterior.sequencia}await aoSalvar(registrarTransferencia(estado,{...dados,ninhoId,projetoId:estado.contexto?.projetoId??'projeto-demo'},autoria(estado),anterior?.id??null,v.motivo??''))}
 return <Base nuvem={!!estado.contexto} titulo={anterior?'Editar transferência':'Nova transferência'} validar={validar} salvar={salvar} cancelar={cancelar} etapas={[
 {titulo:'Destino da transferência',ajuda:'Selecione o destino que foi observado. A localização original será preservada.',conteudo:<div className="filtros"><Campo nome="Destino da transferência" chave="destino" v={v} mudar={mudar} opcoes={['PRAIA','CERCADO']}/></div>},
 {titulo:'Dados da transferência',ajuda:'Preencha a data, os dados observados e a localização de destino. Deixe vazio o que não foi observado.',conteudo:<div className="filtros"><CamposTransferencia v={v} mudar={mudar} cercado={v.destino==='CERCADO'}/>{anterior&&<Campo nome="Motivo da correção" chave="motivo" v={v} mudar={mudar} tipo="textarea"/>}</div>},
 {titulo:'Conferir e salvar',ajuda:'Confira antes de salvar. TEMP_TRANSF depende da categoria do manual; não é escolhido automaticamente.',conteudo:<dl className="resumo-cadastro">{Object.entries(v).filter(([,val])=>val).map(([k,val])=><div key={k}><dt>{nomesCampos[k]??k}</dt><dd>{val}</dd></div>)}</dl>}
 ]}/>
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
  return <Base nuvem={!!estado.contexto} titulo="Eclosão e abertura" validar={()=>validarCampos(v)} salvar={salvar} cancelar={cancelar}><label>Registro de abertura<select aria-label="Registro de abertura" value={id} onChange={e=>escolher(e.target.value)}><option value="" disabled={!!estado.contexto&&registros.length>0}>Novo registro</option>{registros.map(a=><option key={a.id} value={a.id}>{a.id} · {a.dataAbertura??a.dataEclosao??'sem data'}</option>)}</select></label>
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
  return <Base nuvem={!!estado.contexto} titulo="Complementar dados da tartaruga" validar={()=>validarCampos(v)} salvar={salvar} cancelar={cancelar}><p className="ajuda">Espécie também pode ser identificada pelos filhotes ou na abertura. A correção preserva a versão anterior; localização, datas e tipo da ocorrência original permanecem imutáveis. Use apenas o número atribuído pelo controle geral, sem renumerar.</p><div className="filtros">
    <Campo nome="Espécie" chave="especie" v={v} mudar={mudar} opcoes={ESPECIES}/>
    <Campo nome="Número atribuído pelo controle geral" chave="numeroRegistro" v={v} mudar={mudar}/>
    <Campo nome="Marcas encontradas" chave="marcasEncontradas" v={v} mudar={mudar}/><Campo nome="Marcas colocadas" chave="marcasColocadas" v={v} mudar={mudar}/><Campo nome="Marcas retiradas" chave="marcasRetiradas" v={v} mudar={mudar}/>
    <Campo nome="Comprimento do casco (cm)" chave="comprimento" v={v} mudar={mudar} tipo="number"/><Campo nome="Largura do casco (cm)" chave="largura" v={v} mudar={mudar} tipo="number"/>
    <Campo nome="Tumores" chave="tumores" v={v} mudar={mudar} opcoes={RESPOSTA_TUMORES}/>
    <Campo nome="Coleta biológica (itens separados por vírgula)" chave="coleta" v={v} mudar={mudar}/>
    <Campo nome="Evidência de interação com pesca" chave="pesca" v={v} mudar={mudar} opcoes={simNao}/><Campo nome="Tipo de evidência fornecido pela coordenação" chave="tipoEvidencia" v={v} mudar={mudar}/>
    <Campo nome="Palavras-chave do manual (separadas por vírgula)" chave="palavras" v={v} mudar={mudar}/><Campo nome="Observações da ocorrência / motivo da correção" chave="observacoes" v={v} mudar={mudar} tipo="textarea"/>
    </div></Base>
}
