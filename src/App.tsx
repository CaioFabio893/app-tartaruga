import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { criarTreino, carregarTreino, gravarTreino, fichasDoTreino, type EstadoTreino } from './app/treino'
import { montarFichaNinho, montarResumo } from './domain/agregado'
import { camposExportacao, gerarCSV, gerarJSON, montarRelatorio, texto, totalObservado, type Relatorio } from './report/relatorio'
import { getAuth } from 'firebase/auth'
import { obterFirebase } from './services/firebase'
import { CRITERIOS, type Criterio } from './domain/consultas'
import { ESPECIES, SITUACOES, HISTORICOS_NINHO } from './domain/tipos'
import { carregarProjeto, gravarProjeto, sincronizarProjeto, manterRemoto, consultarRelatorioProjeto, copiaCompletaProjeto } from './app/nuvem'
import { registrarCacheInterface } from './services/pwa'
import { carregarGestao, lerGestaoLocal } from './app/gestao'
import { aplicarAno, alertaPrevisao, diaDoAparelho, rotuloNinho, indicadorArmazenamento } from './domain/gestao'
import type { EstadoGestao } from './data/gestao'
import './styles/base.css'
import './styles/interface.css'

const telas = ['Ninhos', 'Mapa', 'Ocorrências', 'Relatórios', 'Cadastros'] as const
type Tela = typeof telas[number]
const Acesso = lazy(() => import('./features/acesso/Acesso'))
const CorrigirAnimal=lazy(()=>import('./features/treino/Formularios').then(m=>({default:m.CorrigirAnimal})))
const NovaOcorrencia=lazy(()=>import('./features/treino/Formularios').then(m=>({default:m.NovaOcorrencia})))
const NovaTransferencia=lazy(()=>import('./features/treino/Formularios').then(m=>({default:m.NovaTransferencia})))
const FormularioAbertura=lazy(()=>import('./features/treino/Formularios').then(m=>({default:m.FormularioAbertura})))
const NovaVisita=lazy(()=>import('./features/treino/Formularios').then(m=>({default:m.NovaVisita})))
const MapaCoordenadas=lazy(()=>import('./features/mapa/MapaCoordenadas'))
const OrganizarNinho=lazy(()=>import('./features/gestao/OrganizarNinho'))
const Armazenamento=lazy(()=>import('./features/gestao/Armazenamento'))
const caminhos = ['M4 16c2-8 14-8 16 0M3 17h18M7 17v3m10-3v3', 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15', 'M6 4h12v17H6zM9 9h6m-6 4h6m-6 4h4', 'M5 3h10l4 4v14H5zM9 17v-4m3 4v-7m3 7v-5', 'M4 6h16M4 12h16M4 18h16M8 4v4m8 2v4M8 16v4']
function Icone({ indice }: { indice: number }) { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={caminhos[indice]} /></svg> }
function baixar(conteudo: string | Uint8Array, mime: string, nome: string) {
  const blob = new Blob([typeof conteudo === 'string' ? conteudo : new Uint8Array(conteudo)], { type: mime })
  const url = URL.createObjectURL(blob); const link = document.createElement('a')
  link.href = url; link.download = nome; document.body.append(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function App({inicial,aoSair}:{inicial?:EstadoTreino;aoSair?:()=>void}={}) {
  const nuvem=!!inicial?.contexto
  const [tela, setTela] = useState<Tela>('Relatórios'), [online, setOnline] = useState(navigator.onLine)
  const [inicio, setInicio] = useState('2026-10-01'), [fim, setFim] = useState('2026-10-31')
  const [todos,setTodos]=useState(true)
  const [criterio, setCriterio] = useState<Criterio>('OCORR')
  const [especie, setEspecie] = useState(''), [situacao, setSituacao] = useState(''), [historico, setHistorico] = useState('')
  const [praia, setPraia] = useState(''), [temporada, setTemporada] = useState('')
  const [erro, setErro] = useState(''), [ocupado, setOcupado] = useState(false)
  const [selecionado, setSelecionado] = useState<string | null>(null), [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [estado,setEstado]=useState(()=>inicial??criarTreino()),[localPronto,setLocalPronto]=useState(!!inicial),[avisoLocal,setAvisoLocal]=useState('')
  const [formulario,setFormulario]=useState<'ocorrencia'|'transferencia'|'abertura'|'visita'|'animal'|null>(null)
  const [avisoCache,setAvisoCache]=useState('')
  const [gestao,setGestao]=useState<EstadoGestao>({ninhos:{},config:null,confirmada:false,revisao:0})
  const [ano,setAno]=useState(String(new Date().getFullYear())),[anoRelatorio,setAnoRelatorio]=useState('todos'),[organizando,setOrganizando]=useState(false)
  const pendente=nuvem && ['pendente','conflito','erro'].includes(estado.statusNuvem??'')
  const dados=useMemo(()=>fichasDoTreino(estado),[estado])
  const todas=useMemo(()=>({registros:dados.map(origem=>{const ficha=montarFichaNinho(origem);return {origem,ficha,linha:montarResumo({criterio:'OCORR',fichas:[ficha]})[0]!}})}),[dados])
  const ficha = todas.registros.find(r => r.ficha.ninho.id === selecionado)
  const anos=[...new Set([new Date().getFullYear(),...Object.values(gestao.ninhos).map(g=>g.ano)])].sort((a,b)=>b-a)
  const visiveis=todas.registros.filter(r=>ano==='sem-ano'?!gestao.ninhos[r.ficha.ninho.id]:String(gestao.ninhos[r.ficha.ninho.id]?.ano)===ano)
  const semAno=todas.registros.filter(r=>!gestao.ninhos[r.ficha.ninho.id]).length
  const hoje=diaDoAparelho(),alertas=visiveis.flatMap(r=>{const a=alertaPrevisao(r,gestao.ninhos[r.ficha.ninho.id],hoje);return a?[{r,a}]:[]})
  useEffect(()=>{let ativo=true;void carregarGestao(estado).then(g=>{if(ativo)setGestao(g)}).catch(async e=>{try{const g=await lerGestaoLocal(estado);if(ativo)setGestao(g)}catch{}if(ativo)setAvisoLocal('Organização anual não conferida: '+(e instanceof Error?e.message:'falha de leitura.'))});return()=>{ativo=false}},[estado,online])
  useEffect(() => {
    const atualizar = () => {setOnline(navigator.onLine);if(navigator.onLine&&nuvem&&estado.contexto)void sincronizarProjeto(estado.contexto).then(e=>{setEstado(e);setRelatorio(null);setAvisoLocal(e.mensagemNuvem??'Dados conferidos no servidor.')}).catch(e=>setErro(e instanceof Error?e.message:'Falha ao conferir pendências.'))}
    window.addEventListener('online', atualizar); window.addEventListener('offline', atualizar)
    return () => { window.removeEventListener('online', atualizar); window.removeEventListener('offline', atualizar) }
  }, [nuvem,estado.contexto])
  useEffect(()=>{
    let ativo=true
    void (inicial?Promise.resolve(inicial):carregarTreino()).then(e=>{if(ativo){setEstado(e);setLocalPronto(true)}}).catch(e=>{if(ativo)setErro(e instanceof Error?e.message:'Armazenamento indisponível.')})
    const canal=typeof BroadcastChannel==='undefined'?null:new BroadcastChannel('ninhos-treino')
    if(canal)canal.onmessage=()=>{if(ativo){setRelatorio(null);setAvisoLocal('Outra aba alterou os dados. Confira a atualização antes de salvar; seu formulário está preservado.')}}
    return ()=>{ativo=false;canal?.close()}
  },[])
  useEffect(()=>{let ativo=true;let parar:(()=>void)|undefined;void registrarCacheInterface(m=>{if(ativo)setAvisoCache(m)}).then(p=>{if(ativo)parar=p;else p()}).catch(()=>{if(ativo)setAvisoCache('Cache da interface não confirmado. Use conexão para reabrir o aplicativo. Dados locais não foram apagados.')});return()=>{ativo=false;parar?.()}},[])
  async function salvarLocal(novo:EstadoTreino) {
    const confirmado=nuvem?await gravarProjeto(estado,novo):novo
    if(!nuvem)await gravarTreino(novo,estado.revisao)
    const criado=confirmado.ninhos.find(n=>!estado.ninhos.some(a=>a.id===n.id));if(criado){setSelecionado(criado.id);setTela('Ninhos');setOrganizando(true)}setEstado(confirmado);setFormulario(null);setRelatorio(null);setAvisoLocal(nuvem?(confirmado.mensagemNuvem??'Alteração preservada; confira o estado de sincronização.'):'✓ Salvo no aparelho. Não sincronizado com o projeto real.');setErro('')
    if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel('ninhos-treino');c.postMessage('alterado');c.close()}
  }
  async function recarregarLocal(){try{setEstado(nuvem?await carregarProjeto(estado.contexto!):await carregarTreino());setLocalPronto(true);setRelatorio(null);setAvisoLocal(nuvem?'Confira o estado de sincronização exibido acima.':'Treino local atualizado. Não sincronizado.');setErro('')}catch(e){setErro(e instanceof Error?e.message:'Falha na leitura local.')}}
  function navegar(proxima: Tela) { if(formulario||organizando){setErro('Conclua ou cancele o formulário antes de mudar de tela. Seu rascunho foi preservado.');return}setTela(proxima);setSelecionado(null);setErro('') }
  function alterar() { setRelatorio(null); setErro('') }
  async function previa() {
    setOcupado(true);setRelatorio(null)
    try {
      const consulta={todos,projetoId:estado.contexto?.projetoId??'projeto-demo',criterio,inicio,fim,filtros:{praiaCodigo:praia||null,temporadaId:temporada||null,especieCodigo:especie?especie as typeof ESPECIES[number]:null,situacao:situacao?situacao as typeof SITUACOES[number]:null,historicoNinho:historico?historico as typeof HISTORICOS_NINHO[number]:null}}
      const confirmado=nuvem&&navigator.onLine&&!pendente
      const antes=confirmado?await (await import('./data/gestao')).conferirRevisoesGestao(estado.contexto!):null
      const preparado=confirmado?await consultarRelatorioProjeto(estado.contexto!,consulta):montarRelatorio({projetoNome:estado.contexto?.nome??'Projeto demonstrativo',dados,consulta,fonte:{demonstracao:!nuvem,online:navigator.onLine,sincronizacaoConfirmada:false,conjuntoCompleto:true},geradoEm:new Date().toISOString()})
      if(nuvem){const u=getAuth(obterFirebase().app).currentUser;if(u?.displayName)preparado.nomesResponsaveis={[u.uid]:u.displayName}}
      const organizacao=await carregarGestao(estado);setGestao(organizacao)
      if(antes){const depois=await (await import('./data/gestao')).conferirRevisoesGestao(estado.contexto!);if(antes.dados!==depois.dados||antes.gestao!==depois.gestao||organizacao.revisao!==depois.gestao)throw new Error('Dados ou organização mudaram durante a prévia. Gere novamente antes de exportar.')}
      setRelatorio(aplicarAno(preparado,organizacao.ninhos,anoRelatorio,organizacao.confirmada))
      setErro('')
    } catch(e){setErro(e instanceof Error?e.message:'Não foi possível preparar o relatório.')}
    finally{setOcupado(false)}
  }
  async function sincronizar(){setOcupado(true);try{const e=await sincronizarProjeto(estado.contexto!,true);setEstado(e);setRelatorio(null);setAvisoLocal(e.mensagemNuvem??'Dados conferidos.')}catch(e){setErro(e instanceof Error?e.message:'Falha na sincronização.')}finally{setOcupado(false)}}
  async function adotarRemoto(){setOcupado(true);try{const e=await manterRemoto(estado.contexto!);setEstado(e);setRelatorio(null);setSelecionado(null);setAvisoLocal(e.mensagemNuvem??'Rascunho arquivado.')}catch(e){setErro(e instanceof Error?e.message:'Falha na conferência do remoto.')}finally{setOcupado(false)}}
  async function exportar(formato: 'PDF' | 'JSON' | 'CSV' | 'Excel') {
    if (!relatorio) return
    setOcupado(true); setErro('')
    try {
      const atual = !navigator.onLine && relatorio.fonte.online ? { ...relatorio, parcial: true,
        fonte: { ...relatorio.fonte, online: false }, avisos: [...relatorio.avisos, 'Exportação offline: parcial.'] } : relatorio
      const nome = `ninhos-${atual.anoOrganizacao??'todos'}-${atual.consulta.todos?"todos-":""}${atual.parcial?"parcial":"confirmado"}-${criterio.toLowerCase()}-${inicio}-${fim}`
      if (formato === 'PDF') { const { gerarPDF } = await import('./report/pdf'); baixar(await gerarPDF(atual), 'application/pdf', nome + '.pdf') }
      else if (formato === 'Excel') {const {gerarXLSX}=await import('./report/xlsx');baixar(gerarXLSX(atual),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',nome+'.xlsx')}
      else if (formato === 'JSON') baixar(gerarJSON(atual), 'application/json;charset=utf-8', nome + '.json')
      else baixar(gerarCSV(atual), 'text/csv;charset=utf-8', nome + '.csv')
    } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao exportar.') }
    finally { setOcupado(false) }
  }
  return <div className="app-shell">
    <a className="pular" href="#conteudo">Ir para o conteúdo</a>
    <aside className="lateral"><div className="marca"><Icone indice={0} /><strong>Monitoramento<br />de Ninhos</strong></div>
      <nav aria-label="Navegação principal">{telas.map((t, i) => <button key={t} aria-current={tela === t ? 'page' : undefined} disabled={ocupado} onClick={() => navegar(t)}><Icone indice={i} /><span>{t}</span></button>)}</nav>
      <p className="lateral-nota">Projeto social<br /><small>{nuvem?estado.contexto?.nome:"Maré e Areia"}</small></p>
    </aside>
    <main id="conteudo" className="conteudo"><header className="cabecalho"><div><p className="sobretitulo">{nuvem?estado.contexto?.nome:"PROJETO DEMONSTRATIVO"}</p><h1>{ficha ? rotuloNinho(ficha,gestao.ninhos[ficha.ficha.ninho.id]) : tela}</h1></div><span className="selo">{online ? '◉ Conexão disponível' : '○ Sem internet'}</span></header>
      {!nuvem&&<div className="mensagem aviso"><strong>⚑ Modo de treino: não cadastre fichas oficiais.</strong> Exemplos fictícios e suas alterações ficam apenas neste aparelho. Nada é sincronizado, mesmo após login. Todas as exportações são parciais.</div>}
      <div className="status-local">{aoSair&&<button className="btn" disabled={!!formulario||organizando} onClick={aoSair}>Sair</button>}<span>{localPronto?(nuvem?(estado.statusNuvem==='confirmada'?'Dados confirmados no servidor':estado.statusNuvem==='cache'?'Cópia local · não conferida no servidor':'Alteração pendente · não sincronizada'):`${estado.operacoes.length} alterações locais · não sincronizadas`):'Preparando armazenamento de treino…'}</span><button className="btn" disabled={!!formulario||organizando} onClick={()=>void recarregarLocal()}>Conferir dados</button><button className="btn" onClick={()=>void (async()=>{try{baixar(JSON.stringify(nuvem?{...await copiaCompletaProjeto(estado.contexto!),organizacao:gestao}: {organizacao:gestao,modo:nuvem?'PROJETO':'TREINO_LOCAL',parcial:!nuvem||!online||estado.statusNuvem!=='confirmada',estado},null,2),'application/json',nuvem?'backup-projeto.json':'backup-treino-local.json')}catch(e){setErro(e instanceof Error?e.message:'Falha ao exportar cópia.')}})()}>Exportar cópia JSON</button></div>
      {pendente&&<div className="mensagem aviso"><p>{estado.mensagemNuvem} Exporte uma cópia JSON antes de resolver o conflito.</p><div className="acoes"><button className="btn" disabled={!online||ocupado||!!formulario} onClick={()=>void sincronizar()}>Tentar sincronizar</button><button className="btn" disabled={!online||ocupado||!!formulario} onClick={()=>void adotarRemoto()}>Manter remoto e arquivar rascunho</button></div></div>}
      {avisoLocal&&<p className="mensagem" role="status">{avisoLocal}</p>}
      {avisoCache&&<p className="mensagem" role="status">{avisoCache}</p>}
      {erro && <div className="mensagem erro" role="alert">{erro}</div>}
      {indicadorArmazenamento(gestao.config).pertoLimite&&<p className="mensagem aviso" role="status">Uso da nuvem acima de 80% na medição de {gestao.config?.medido_em}. Confira “Cadastros” → Armazenamento. Esta medição é manual; consulte o console para o uso atual.</p>}
      {!ficha&&(tela==='Ninhos'||tela==='Mapa')&&<section className="cartao"><label>Ano dos ninhos<select value={ano} onChange={e=>setAno(e.target.value)}>{anos.map(a=><option key={a} value={a}>{a}</option>)}<option value="sem-ano">Sem ano definido ({semAno})</option></select></label><p>{visiveis.length} ninhos nesta seleção. O mapa exibe somente este ano. {semAno>0&&'Registros antigos aguardam organização: escolha “Sem ano definido”, abra a ficha e informe ano e número.'}</p>{!gestao.confirmada&&nuvem&&<p className="mensagem aviso">Organização anual em cópia local; não confirmada no servidor.</p>}{alertas.length>0&&<div className="mensagem aviso"><strong>Acompanhamento · data do aparelho {hoje}</strong>{alertas.map(({r,a})=><p key={r.ficha.ninho.id}><button className="btn" onClick={()=>setSelecionado(r.ficha.ninho.id)}>{rotuloNinho(r,gestao.ninhos[r.ficha.ninho.id])}</button> {a.texto}</p>)}<small>Previsões informadas pela equipe. Alertas aparecem ao abrir o aplicativo.</small></div>}</section>}
      {organizando&&ficha&&<Suspense fallback={<p>Carregando organização…</p>}><OrganizarNinho estado={estado} id={ficha.ficha.ninho.id} atual={gestao.ninhos[ficha.ficha.ninho.id]} cancelar={()=>setOrganizando(false)} aoSalvar={g=>{setGestao(g);setOrganizando(false);setRelatorio(null);setAno(String(g.ninhos[ficha.ficha.ninho.id]!.ano));setAvisoLocal(g.confirmada?'Ano e número confirmados no servidor.':'Organização salva somente no treino local.')}}/></Suspense>}
      {!ficha&&(tela==='Ninhos'||tela==='Ocorrências')&&<div className="acoes"><button className="btn prim" disabled={!localPronto||!!formulario||organizando||pendente||ocupado||estado.contexto?.papel==='consulta'} onClick={()=>setFormulario('ocorrencia')}>Registrar ocorrência</button><span className="ajuda">Só CD cria ninho.</span></div>}
      {formulario&&<Suspense fallback={<p role="status">Carregando formulário…</p>}>{formulario==='ocorrencia'?<NovaOcorrencia estado={estado} aoSalvar={salvarLocal} cancelar={()=>setFormulario(null)}/>:selecionado&&formulario==='transferencia'?<NovaTransferencia estado={estado} ninhoId={selecionado} aoSalvar={salvarLocal} cancelar={()=>setFormulario(null)}/>:selecionado&&formulario==='visita'?<NovaVisita estado={estado} ninhoId={selecionado} aoSalvar={salvarLocal} cancelar={()=>setFormulario(null)}/>:ficha&&formulario==='animal'?<CorrigirAnimal estado={estado} ocorrenciaId={ficha.origem.ocorrencia!.id} aoSalvar={salvarLocal} cancelar={()=>setFormulario(null)}/>:selecionado&&<FormularioAbertura estado={estado} ninhoId={selecionado} aoSalvar={salvarLocal} cancelar={()=>setFormulario(null)}/>}</Suspense>}
      {ficha ? <><div className="acoes"><button className="btn" disabled={!!formulario||organizando} onClick={() => setSelecionado(null)}>← Voltar à lista</button><button className="btn" disabled={!localPronto||!!formulario||organizando||pendente||ocupado||estado.contexto?.papel==='consulta'} onClick={()=>setFormulario('transferencia')}>Registrar transferência</button><button className="btn" disabled={!localPronto||!!formulario||organizando||pendente||ocupado||estado.contexto?.papel==='consulta'} onClick={()=>setFormulario('visita')}>Registrar visita</button><button className="btn prim" disabled={!localPronto||!!formulario||organizando||pendente||ocupado||estado.contexto?.papel==='consulta'} onClick={()=>setFormulario('abertura')}>Eclosão / abertura</button><button className="btn" disabled={!localPronto||!!formulario||organizando||pendente||ocupado||estado.contexto?.papel==='consulta'} onClick={()=>setFormulario('animal')}>Complementar tartaruga / registro</button></div>
        <section className="cartao"><h2>Organização do ninho</h2><p>Ano {texto(gestao.ninhos[ficha.ficha.ninho.id]?.ano)} · número anual {texto(gestao.ninhos[ficha.ficha.ninho.id]?.numero)}</p><p>Previsão da equipe: {texto(gestao.ninhos[ficha.ficha.ninho.id]?.previsao_eclosao)} · origem: {texto(gestao.ninhos[ficha.ficha.ninho.id]?.nota_previsao)}</p><button className="btn" disabled={!!formulario||organizando||pendente||ocupado||estado.contexto?.papel==='consulta'} onClick={()=>setOrganizando(true)}>Organizar ano, número e previsão</button></section><section className="cartao"><h2>Localização original e atual</h2><div className="grade-dupla">{[['Original', ficha.origem.ocorrencia!.localOrigem], ['Atual, derivada do histórico', ficha.ficha.posicaoAtual.local]].map(([nome, local]) => {
          const l = local as typeof ficha.ficha.posicaoAtual.local
          return <div key={String(nome)}><h3>{String(nome)}</h3><p>Praia: {texto(l.praiaCodigo)} · km {texto(l.localKm)}</p><p>{texto(l.referencia)}</p><p>Latitude {texto(l.latitude?.toFixed(7))}<br />Longitude {texto(l.longitude?.toFixed(7))}<br />Datum {texto(l.datum)}</p></div> })}</div></section>
        <section className="cartao"><h2>Ficha de campo</h2><dl className="campos">{Object.entries(camposExportacao(ficha)).filter(([k]) => !(k === 'NAO_VIAVEIS' && ficha.linha.especieCodigo !== 'DC') && !(k === 'N_NINHO' && ficha.linha.situacao !== 'T')).map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{texto(v)}</dd></div>)}</dl></section>
        <section className="cartao"><h2>Transferências</h2>{ficha.origem.transferencias.length ? ficha.origem.transferencias.map(t => <p key={t.id}>{t.dataTransferencia} · {t.destino} · km {texto(t.localDestino.localKm)} · ovos {texto(t.ovosTransferencia)}<br />{texto(t.observacoes)}</p>) : <p>Nenhuma transferência registrada.</p>}<h2>Avisos</h2>{ficha.linha.motivos.map((m,i) => <p key={i}>{m}</p>)}</section>
      </> : tela === 'Relatórios' ? <>
        <p className="introducao">Gere um relatório de todos os ninhos ou selecione um período. O PDF reúne o resumo e as fichas de todos os ninhos incluídos.</p>
        <section className="cartao"><h2>Filtros do relatório</h2><form onSubmit={e => { e.preventDefault(); void previa() }}><fieldset disabled={ocupado}><div className="filtros">
          <label>Ano de organização<select value={anoRelatorio} onChange={e=>{setAnoRelatorio(e.target.value);alterar()}}><option value="todos">Todos os anos</option>{anos.map(a=><option key={a} value={a}>{a}</option>)}<option value="sem-ano">Sem ano definido</option></select></label><label>Abrangência<select aria-label="Abrangência" value={todos?"todos":"periodo"} onChange={e=>{setTodos(e.target.value==="todos");alterar()}}><option value="todos">Todos os ninhos (inclui sem datas)</option><option value="periodo">Todos os ninhos do período</option></select></label>
          {!todos&&<><label>Data inicial<input required type="date" value={inicio} onChange={e => { setInicio(e.target.value); alterar() }} /></label>
          <label>Data final<input required type="date" value={fim} onChange={e => { setFim(e.target.value); alterar() }} /></label>
          <label>Selecionar pela data de<select aria-label="Selecionar pela data de" value={criterio} onChange={e => { setCriterio(e.target.value as Criterio); alterar() }}>{CRITERIOS.map(c => <option key={c} value={c}>{c === 'OCORR' ? 'Ocorrência' : c === 'ECLOS' ? 'Eclosão' : 'Abertura'}</option>)}</select></label></>}
          <label>Espécie<select aria-label="Espécie" value={especie} onChange={e => { setEspecie(e.target.value); alterar() }}><option value="">Todas</option>{ESPECIES.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Situação<select aria-label="Situação" value={situacao} onChange={e => { setSituacao(e.target.value); alterar() }}><option value="">Todas</option>{SITUACOES.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Histórico<select aria-label="Histórico" value={historico} onChange={e => { setHistorico(e.target.value); alterar() }}><option value="">Todos</option>{HISTORICOS_NINHO.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Código da praia<input value={praia} placeholder="Todas as praias" onChange={e => { setPraia(e.target.value); alterar() }} /><small>Lista oficial ainda não fornecida.</small></label>
          <label>Temporada<select aria-label="Temporada" value={temporada} onChange={e => { setTemporada(e.target.value); alterar() }}><option value="">Todas</option>{!nuvem&&<option value="temporada-demo-2026">2026 · demonstração</option>}{nuvem&&[...new Set(estado.ocorrencias.map(o=>o.temporadaId).filter((s):s is string=>!!s))].map(s=><option key={s} value={s}>{s}</option>)}</select></label>
          </div><div className="acoes"><button className="btn prim" type="submit" disabled={ocupado}>Gerar prévia</button><span className="ajuda">{todos?"Todos os ninhos do projeto, conforme filtros":"Datas inclusivas; ninhos sem a data escolhida ficam fora"}</span></div></fieldset></form></section>
        {!relatorio ? <section className="cartao vazio"><Icone indice={3} /><h2>Confira antes de exportar</h2><p>Gere a prévia para ver exatamente quais ninhos estarão nos arquivos.</p></section> : <section className="cartao" aria-live="polite" aria-busy={ocupado}><div className="titulo-acoes"><h2>Prévia · {relatorio.registros.length} {relatorio.registros.length===1?'ninho':'ninhos'}</h2><span className="selo parcial">{relatorio.parcial?'⚑ Parcial':'✓ Dados confirmados'} · layout proposto</span></div>
          {!!relatorio.exclusoes?.dataAmbigua&&<p className="mensagem aviso">{relatorio.exclusoes.dataAmbigua} ninhos excluídos por datas divergentes. Confira os registros; nenhuma data foi escolhida automaticamente.</p>}
          <div className="metricas">{(['vivos','ovosTotais'] as const).map(c => { const t = totalObservado(relatorio,c); return <div key={c}><small>{c === 'vivos' ? 'Vivos observados' : 'Total de ovos observado'}</small><strong>{texto(t.valor)}</strong><small>{t.ausentes} ninhos sem valor</small></div> })}<div><small>Excluídos por data ausente</small><strong>{texto(relatorio.exclusoes?.dataAusente)}</strong><small>Antes do filtro anual</small></div></div>
          {!relatorio.registros.length ? <p className="vazio">Nenhum ninho atende aos filtros. Ajuste o período ou os filtros.</p> : <div className="tabela-rolagem" tabIndex={0} aria-label="Resumo dos ninhos, role horizontalmente para ver todas as colunas"><table><caption>Mesmo conjunto usado no Excel, PDF, JSON e CSV</caption><thead><tr>{['Registro','Data escolhida','Espécie','Situação','Histórico','Vivos','Natimortos','Não ecl.','Furados','Total','% vivos','Incubação (dias)'].map(c => <th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{relatorio.registros.map(r => <tr key={r.ficha.ninho.id}>{[r.linha.numeroRegistro,r.linha.dataCriterio,r.linha.especieCodigo,r.linha.situacao,r.linha.historicoNinho,r.linha.vivos,r.linha.natimortos,r.linha.ovosNaoEclodidos,r.linha.ovosFurados,r.linha.ovosTotais,r.linha.percentualVivos,r.linha.tempoIncubacaoDias].map((v,i) => <td key={i}>{texto(v)}</td>)}</tr>)}</tbody></table></div>}
          <div className="acoes">{(['Excel','PDF','JSON','CSV'] as const).map(f => <button key={f} className={`btn ${f === 'PDF' ? 'prim' : ''}`} disabled={ocupado} onClick={() => void exportar(f)}>Baixar {f}</button>)}{ocupado && <span role="status">Preparando arquivo…</span>}</div><p className="ajuda">Excel: cada ninho em uma coluna, com todos os campos e históricos. PDF: resumo e fichas completas. JSON: insumos originais. CSV: importe números de registro como texto para preservar zeros iniciais.</p>
        </section>}
      </> : tela === 'Ninhos' || tela === 'Mapa' ? <><p className="introducao">{tela === 'Mapa' ? 'Consulte os ninhos no mapa e na lista. A margem de erro do GPS acompanha a posição quando disponível.' : 'Abra a ficha para consultar ocorrência, tartaruga, transferências e abertura.'}</p><div className="lista-ninhos">{visiveis.map(r => <button className="cartao cartao-ninho" key={r.ficha.ninho.id} onClick={() => setSelecionado(r.ficha.ninho.id)}><span className="titulo-acoes"><strong>{rotuloNinho(r,gestao.ninhos[r.ficha.ninho.id])}</strong><span className="selo">{r.ficha.ninho.estadoAcompanhamento}</span></span><span>Registro {texto(r.linha.numeroRegistro)} · espécie {texto(r.linha.especieCodigo)}</span><span>Praia {texto(r.ficha.posicaoAtual.local.praiaCodigo)} · km {texto(r.ficha.posicaoAtual.local.localKm)}</span>{tela === 'Mapa' && <span>Latitude {texto(r.ficha.posicaoAtual.local.latitude?.toFixed(7))} · longitude {texto(r.ficha.posicaoAtual.local.longitude?.toFixed(7))}</span>}<span className="link-texto">Abrir ficha →</span></button>)}</div></> : tela === 'Ocorrências' ? <section className="cartao vazio"><Icone indice={2} /><h2>Registros de ocorrência</h2><p>Confira abaixo os registros e seu estado de sincronização. Ocorrências sem desova não criam ninho.</p><button className="btn" onClick={() => navegar('Ninhos')}>Consultar ninhos</button></section> : <section className="cartao"><h2>{nuvem?"Informações do projeto":"Cadastros da demonstração"}</h2><dl className="campos"><div><dt>Projeto</dt><dd>{estado.contexto?.nome??"Projeto demonstrativo"}</dd></div><div><dt>Temporada</dt><dd>{nuvem?"Informada pela equipe no cadastro da ocorrência":"2026 · demonstração"}</dd></div><div><dt>Espécies do manual</dt><dd>{ESPECIES.join(' · ')}</dd></div><div><dt>Praias e evidências</dt><dd>Lista oficial pendente da coordenação.</dd></div></dl><p>A coordenação fornece o acesso e autoriza os membros. Papéis administrativos dependem de provisionamento autorizado. Nenhum papel administrativo é atribuído nesta tela.</p></section>}
      {ficha&&<section className="cartao"><h2>Acompanhamento</h2>{ficha.origem.visitas?.length?ficha.origem.visitas.map(v=><p key={v.id}>{v.dataVisita} · {texto(v.condicao)} · {texto(v.eventos)}<br/>{texto(v.observacoes)}</p>):<p>Nenhuma visita registrada no treino.</p>}</section>}
      {!nuvem&&tela === 'Cadastros' && !ficha && <Suspense fallback={<p role="status">Carregando acesso…</p>}><Acesso /></Suspense>}
      {tela==='Cadastros'&&!ficha&&<Suspense fallback={<p>Carregando gestão…</p>}><Armazenamento estado={estado} gestao={gestao} atualizar={async()=>{await recarregarLocal();setGestao(await carregarGestao(estado))}}/></Suspense>}{tela==='Ocorrências'&&!ficha&&<section className="cartao"><h2>Ocorrências guardadas no aparelho</h2><div className="tabela-rolagem"><table><thead><tr><th scope="col">Registro</th><th scope="col">Tipo</th><th scope="col">Data de campo</th><th scope="col">Espécie</th><th scope="col">Ninho</th></tr></thead><tbody>{estado.ocorrencias.map(o=><tr key={o.id}><td>{texto(o.numeroRegistro)}</td><td>{o.tipoOcorrencia}</td><td>{texto(o.dataOcorrencia)}</td><td>{texto(o.especieCodigo)}</td><td>{o.ninhoId?<button className="btn" disabled={!!formulario||organizando} onClick={()=>setSelecionado(o.ninhoId)}>Abrir ninho</button>:'Sem ninho'}</td></tr>)}</tbody></table></div></section>}
      {tela==='Mapa'&&!ficha&&<Suspense fallback={<p role="status">Carregando posições…</p>}><MapaCoordenadas registros={visiveis} organizacao={gestao.ninhos} abrir={setSelecionado}/></Suspense>}
      <footer className="rodape-app">{nuvem?'Dados do projeto protegidos por acesso autorizado · sem fotos ou upload':'Treino local · dados fictícios · sem fotos ou upload'}</footer>
    </main>
  </div>
}
export default App



