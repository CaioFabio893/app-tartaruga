import type { Firestore } from 'firebase/firestore'
import {beforeAll,afterAll,describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {initializeTestEnvironment,assertFails,type RulesTestEnvironment} from '@firebase/rules-unit-testing'
import {doc,getDoc,setDoc,updateDoc,collection,query,where,getDocs,runTransaction,serverTimestamp} from 'firebase/firestore'
import {gravarNuvem,prepararGravacao,carregarNuvem,consultarRelatorioNuvem} from '../../src/data/nuvem'
import {corrigirAnimal,registrarOcorrencia,registrarTransferencia,registrarAbertura,registrarVisita,type EstadoTreino} from '../../src/app/treino'
import { gerarPDF } from '../../src/report/pdf'
import {ocorrenciaBase,transferenciaBase,aberturaBase} from '../auxiliares-agregado'

function estado():EstadoTreino {return {schema:1,revisao:0,operacoes:[],ocorrencias:[],ninhos:[],transferencias:[],aberturas:[],visitas:[],contexto:{projetoId:'p1',nome:'Projeto de teste',usuario:'campo',papel:'campo',revisaoServidor:0}}}
function autoria(){let i=0;return {usuario:'campo',instante:'2026-10-02T22:00:00Z',novoId:()=>`id-${++i}`}}
function criar(){return registrarOcorrencia(estado(),{...ocorrenciaBase,numeroRegistro:null},'I',autoria())}
it('preparação recusa apagar origem e autoria cruzada',()=>{
  const n=criar();expect(prepararGravacao(estado(),n).alteracoes).toHaveLength(2)
  n.ocorrencias[0]!.atualizadoPor='intruso';expect(()=>prepararGravacao(estado(),n)).toThrow('Autoria')
})
describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('nuvem real no emulador, duas pessoas',()=>{
  let env:RulesTestEnvironment
  const banco=(uid:string)=>(env.authenticatedContext(uid).firestore() as unknown as {_delegate:Firestore})._delegate
  beforeAll(async()=>{const host=process.env.FIRESTORE_EMULATOR_HOST!;if(!/^127\.0\.0\.1:\d+$/.test(host))throw new Error('Apenas emulador loopback');env=await initializeTestEnvironment({projectId:'demo-nuvem',firestore:{host:'127.0.0.1',port:Number(host.split(':')[1]),rules:readFileSync('firestore.rules','utf8')}});await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await setDoc(doc(db,'projetos/p1'),{nome:'Teste',ativo:true,revisao_dados:0,ultima_operacao:null});for(const [uid,papel] of [['campo','campo'],['outro','campo'],['consulta','consulta']])await setDoc(doc(db,`projetos/p1/membros/${uid}`),{uid,papel,projeto_id:'p1',ativo:true})})},30000)
  afterAll(async()=>await env?.cleanup())
  it('CD+origem atômicos são lidos por outro aparelho; reenvio não duplica',async()=>{
    const db=banco('campo'),n=criar()
    await gravarNuvem(estado(),n,db);await gravarNuvem(estado(),n,db)
    const outro=env.authenticatedContext('outro').firestore();expect((await getDocs(query(collection(outro,'projetos/p1/ninhos'),where('projeto_id','==','p1')))).size).toBe(1);expect((await getDoc(doc(outro,'projetos/p1'))).data()?.revisao_dados).toBe(1)
  })
  it('versão antiga não sobrescreve; usuário consulta e sem membro não escrevem',async()=>{
    const n=criar();n.operacoes[0]!.id='outra-op';await expect(gravarNuvem(estado(),n,banco('campo'))).rejects.toThrow('Conflito')
    for(const uid of ['intruso','consulta'])await expect(gravarNuvem(estado(),n,banco(uid))).rejects.toBeDefined()
    await assertFails(getDoc(doc(env.authenticatedContext('intruso').firestore(),'projetos/p1/ninhos/id-2')))
  })
  it('origem imutável e escrita direta sem operação são negadas',async()=>{
    const db=banco('campo');await assertFails(updateDoc(doc(db,'projetos/p1/ocorrencias/id-1'),{'local_origem.latitude':1}));await assertFails(setDoc(doc(db,'projetos/p1/ninhos/falso'),{projeto_id:'p1'}))
  })
  it('transferência, abertura zero e visita persistem com auditoria',async()=>{
    let atual=criar();atual.contexto!.revisaoServidor=1;atual.operacoes=[];atual.revisao=0
    let ids=10;const m={usuario:'campo',instante:'2026-10-02T22:00:00Z',novoId:()=>`id-${++ids}`};const db=banco('campo')
    const transferido=registrarTransferencia(atual,{...transferenciaBase,ninhoId:'id-2',destino:'CERCADO',cercadoId:'c1',numeroNinhoCercado:'001'},m);await gravarNuvem(atual,transferido,db)
    atual=transferido;atual.contexto!.revisaoServidor=2
    const aberto=registrarAbertura(atual,{...aberturaBase,ninhoId:'id-2',vivos:0,observacoes:'Incubação concluída, zero vivo observado.'},{historico:'SU',problema:false},m);await gravarNuvem(atual,aberto,db)
    atual=aberto;atual.contexto!.revisaoServidor=3
    const visita=registrarVisita(atual,{projetoId:'p1',ninhoId:'id-2',dataVisita:'2026-10-02',noiteReferencia:'2026-10-02',responsavelId:'campo',condicao:null,eventos:['mare'],observacoes:'Acompanhamento'},m);await gravarNuvem(atual,visita,db)
    const a=(await getDocs(query(collection(db,'projetos/p1/ninhos/id-2/aberturas'),where('projeto_id','==','p1'),where('ninho_id','==','id-2')))).docs[0]!.data();expect(a.vivos).toBe(0);expect((await getDoc(doc(db,'projetos/p1/ocorrencias/id-1'))).data()?.local_origem.latitude).toBe(ocorrenciaBase.localOrigem.latitude)
  })
  it('relatório consulta três datas inclusivas, filtra e gera PDF confirmado da nuvem',async()=>{
    const db=banco('outro'),ctx={...estado().contexto!,usuario:'outro'}
    const e=await carregarNuvem(ctx,db);expect(e.visitas).toHaveLength(1);expect(e.aberturas[0]?.vivos).toBe(0)
    for(const [criterio,dia] of [['OCORR','2026-10-02'],['ECLOS','2026-10-24'],['ABERT','2026-10-25']] as const) {
      const r=await consultarRelatorioNuvem(ctx,{projetoId:'p1',criterio,inicio:dia,fim:dia,filtros:{especieCodigo:'CC'}},db)
      expect(r.registros).toHaveLength(1);expect(r.parcial).toBe(false);expect(r.exclusoes?.foraPeriodo).toBe(null);expect(r.registros[0]!.origem.aberturas[0]!.vivos).toBe(0)
      expect(new TextDecoder().decode((await gerarPDF(r)).slice(0,5))).toBe('%PDF-')
    }
    const r=await consultarRelatorioNuvem(ctx,{projetoId:'p1',criterio:'OCORR',inicio:'2026-10-03',fim:'2026-10-03'},db);expect(r.registros).toHaveLength(0)
  })
  it('todos no servidor inclui vários ninhos e sem datas, preservando isolamento',async()=>{
    const db=banco('campo');const base=await carregarNuvem(estado().contexto!,db);let i=900;const m={usuario:'campo',instante:'2026-10-02T22:00:00Z',novoId:()=>`todos-${++i}`}
    const n=registrarOcorrencia(base,{...ocorrenciaBase,numeroRegistro:null,dataOcorrencia:null,noiteReferencia:null},'I',m);await gravarNuvem(base,n,db)
    const r=await consultarRelatorioNuvem(base.contexto!,{projetoId:'p1',criterio:'OCORR',inicio:null,fim:null,todos:true},db)
    expect(r.registros).toHaveLength(2);expect(r.registros.some(n=>n.linha.dataCriterio===null)).toBe(true);expect(r.parcial).toBe(false)
    const filtrado=await consultarRelatorioNuvem(base.contexto!,{projetoId:'p1',criterio:'OCORR',inicio:null,fim:null,todos:true,filtros:{especieCodigo:'NI'}},db);expect(filtrado.registros).toHaveLength(0);expect(filtrado.exclusoes?.outrosFiltros).toBe(2)
    await expect(consultarRelatorioNuvem(base.contexto!,{projetoId:'outro',criterio:'OCORR',inicio:null,fim:null,todos:true},db)).rejects.toThrow('fora do projeto')
  })
  it('CD com transferência inicial e reservas é atômico; número repetido não duplica',async()=>{
    const db=banco('campo'),base=await carregarNuvem(estado().contexto!,db);let i=100;const m={usuario:'campo',instante:'2026-10-02T22:00:00Z',novoId:()=>`id-${++i}`}
    const n=registrarOcorrencia(base,{...ocorrenciaBase,numeroRegistro:'0007'},'T',m,{...transferenciaBase,numeroNinhoCercado:'0002'})
    await gravarNuvem(base,n,db)
    const atual=await carregarNuvem(estado().contexto!,db)
    expect(atual.ninhos.find(x=>x.id==='id-102')?.versao).toBe(1);expect(atual.transferencias.find(x=>x.ninhoId==='id-102')?.numeroNinhoCercado).toBe('0002')
    const duplicado=registrarOcorrencia(atual,{...ocorrenciaBase,numeroRegistro:'0007'},'I',m)
    await expect(gravarNuvem(atual,duplicado,db)).rejects.toThrow('reservado')
  })
  it('cliente adulterado não grava data inexistente, código inventado ou projeção falsa',async()=>{
    const db=banco('campo'),base=await carregarNuvem(estado().contexto!,db);let i=200;const m={usuario:'campo',instante:'2026-10-02T22:00:00Z',novoId:()=>`id-${++i}`}
    for(const campo of ['data_ocorrencia','tipo_ocorrencia','projecao']) {
      const novo=registrarOcorrencia(base,{...ocorrenciaBase,numeroRegistro:null},'I',m),plano=prepararGravacao(base,novo)
      const escritos=[...plano.alteracoes,...plano.projecoes]
      if(campo==='projecao')plano.projecoes[0]!.dados.datas.OCORR='2026-10-03'
      else plano.alteracoes.find(a=>a.caminho.includes('/ocorrencias/'))!.dados[campo]=campo==='data_ocorrencia'?'2026-02-30':'XX'
      await assertFails(runTransaction(db,async tx=>{
        const anteriores=await Promise.all(escritos.map(a=>tx.get(doc(db,a.caminho))))
        tx.set(doc(db,`${plano.raiz}/operacoes/${plano.operationId}`),{id:plano.operationId,projeto_id:'p1',autor:'campo',tipo:'ocorrencia',referencia_id:plano.referenciaId,revisao:base.contexto!.revisaoServidor+1,conteudo:'cliente adulterado',caminhos:escritos.map(a=>a.caminho),anteriores:Object.fromEntries(escritos.map((a,i)=>[a.caminho,anteriores[i]!.data()??null])),criado_em:m.instante,confirmado_em:serverTimestamp()})
        escritos.forEach(a=>tx.set(doc(db,a.caminho),a.dados));tx.update(doc(db,plano.raiz),{revisao_dados:base.contexto!.revisaoServidor+1,ultima_operacao:plano.operationId})
      }))
    }
  })

  it('ficha preenchida e correção da abertura mantêm segurança e pré-imagem',async()=>{
    const db=banco('campo');let base=await carregarNuvem(estado().contexto!,db);let i=300;const m={usuario:'campo',instante:'2026-10-02T22:00:00Z',novoId:()=>`id-${++i}`}
    const o={...ocorrenciaBase,numeroRegistro:'0010',marcasEncontradas:'0001-A',marcasColocadas:'0002-A',marcasRetiradas:'0001-A',comprimentoCasco:80,larguraCasco:70,coletaMaterialBiologico:['DNA','epibiontes'],evidenciaInteracaoPesca:true,tipoEvidencia:'código recebido pela equipe',palavrasChave:['DNA','PESCA'] as const,observacoes:'Teste de ficha completa no emulador'}
    const novo=registrarOcorrencia(base,{...o,palavrasChave:[...o.palavrasChave]},'T',m,{...transferenciaBase,numeroNinhoCercado:'0010',observacoes:'Manejo documentado'})
    await gravarNuvem(base,novo,db);base=await carregarNuvem(estado().contexto!,db)
    const eclodido=registrarAbertura(base,{...aberturaBase,ninhoId:'id-302',dataAbertura:null,noiteReferenciaAbertura:null,vivos:null,natimortos:null,ovosNaoEclodidos:null,ovosFurados:null},{historico:null,problema:null},m)
    await gravarNuvem(base,eclodido,db);base=await carregarNuvem(estado().contexto!,db)
    const aberto=registrarAbertura(base,{...aberturaBase,ninhoId:'id-302',observacoes:'Incubação concluída, dados da escavação.'},{historico:'SU',problema:false},m,'id-302')
    await gravarNuvem(base,aberto,db);base=await carregarNuvem(estado().contexto!,db)
    expect(base.aberturas.find(a=>a.ninhoId==='id-302')?.versao).toBe(2)
    const op=(await getDoc(doc(db,`projetos/p1/operacoes/${aberto.operacoes.at(-1)!.id}`))).data()!
    expect(op.anteriores['projetos/p1/ninhos/id-302/aberturas/id-302'].vivos).toBe(null);expect(op.confirmado_em).toBeDefined()
  })

  it('espécie identificada depois e primeiro número são auditados, sem mudar origem ou renumerar',async()=>{
    const db=banco('campo');let base=await carregarNuvem(estado().contexto!,db);const o=base.ocorrencias.find(o=>o.id==='id-1')!,origem=JSON.stringify(o.localOrigem);let i=400;const m={usuario:'campo',instante:'2026-10-02T23:00:00Z',novoId:()=>`id-${++i}`}
    const novo=corrigirAnimal(base,o.id,{...o,especieCodigo:'EI',numeroRegistro:'000099',observacoes:'Espécie conferida na abertura, número recebido do controle.'},m)
    await gravarNuvem(base,novo,db);base=await carregarNuvem(estado().contexto!,db)
    const atual=base.ocorrencias.find(o=>o.id==='id-1')!;expect(atual.especieCodigo).toBe('EI');expect(atual.numeroRegistro).toBe('000099');expect(JSON.stringify(atual.localOrigem)).toBe(origem)
    const novamente=corrigirAnimal(base,atual.id,{...atual,observacoes:'Complemento de observação'},m);await gravarNuvem(base,novamente,db)
    expect(()=>corrigirAnimal(base,atual.id,{...atual,numeroRegistro:'100'},m)).toThrow('renumerado')
    const r=await consultarRelatorioNuvem(base.contexto!,{projetoId:'p1',criterio:'OCORR',inicio:'2026-10-02',fim:'2026-10-02',filtros:{especieCodigo:'EI'}},db);expect(r.registros).toHaveLength(1)
  })

  it('papel falsificado no cliente e reuso de operação antiga são negados',async()=>{
    for(const uid of ['consulta','intruso']) {
      const base={...await carregarNuvem(estado().contexto!,banco('campo')),contexto:{...estado().contexto!,usuario:uid,papel:'campo' as const,revisaoServidor:(await getDoc(doc(banco('campo'),'projetos/p1'))).data()!.revisao_dados}}
      let i=0;const novo=registrarOcorrencia(base,{...ocorrenciaBase,numeroRegistro:null},'I',{usuario:uid,instante:'2026-10-02T23:00:00Z',novoId:()=>`${uid}-${++i}`})
      await expect(gravarNuvem(base,novo,banco(uid))).rejects.toBeDefined()
    }
    const caminho='projetos/p1/ocorrencias/futura';await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await setDoc(doc(db,'projetos/p1/operacoes/antiga'),{autor:'campo',caminhos:[caminho],anteriores:{[caminho]:null},revisao:999});await updateDoc(doc(db,'projetos/p1'),{ultima_operacao:'antiga'})})
    const dados=prepararGravacao(estado(),criar()).alteracoes.find(a=>a.caminho.includes('/ocorrencias/'))!.dados
    await assertFails(setDoc(doc(banco('campo'),caminho),{...dados,id:'futura',tipo_ocorrencia:'ML',ninho_id:null,operacao_id:'antiga'}))
  })

})
