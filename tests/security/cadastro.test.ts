import {beforeAll,afterAll,describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {initializeTestEnvironment,assertFails,type RulesTestEnvironment} from '@firebase/rules-unit-testing'
import {doc,setDoc,getDoc,updateDoc,type Firestore} from 'firebase/firestore'
import {gravarNuvem,carregarNuvem} from '../../src/data/nuvem'
import {corrigirCadastro,registrarOcorrencia,registrarTransferencia,registrarAbertura,type EstadoTreino} from '../../src/app/treino'
import {prepararExclusao,executarExclusao} from '../../src/data/gestao-exclusao'
import {ocorrenciaBase,transferenciaBase,aberturaBase} from '../auxiliares-agregado'
describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('P15 edição e exclusão individual no emulador',()=>{
 let env:RulesTestEnvironment,i=0
 const ctx=(u='campo')=>({projetoId:'p1',usuario:u,nome:'Teste',papel:u==='coord'?'coordenacao' as const:u==='consulta'?'consulta' as const:'campo' as const,revisaoServidor:0})
 const banco=(u='campo')=>(env.authenticatedContext(u).firestore() as unknown as {_delegate:Firestore})._delegate
 const m=()=>({usuario:'campo',instante:'2026-10-09T12:00:00Z',novoId:()=>`cadastro-${++i}`})
 beforeAll(async()=>{const host=process.env.FIRESTORE_EMULATOR_HOST!;env=await initializeTestEnvironment({projectId:'demo-cadastro',firestore:{host:'127.0.0.1',port:Number(host.split(':')[1]),rules:readFileSync('firestore.rules','utf8')}});await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await setDoc(doc(db,'projetos/p1'),{nome:'Teste',ativo:true,revisao_dados:0,ultima_operacao:null});for(const u of ['campo','coord','consulta'])await setDoc(doc(db,`projetos/p1/membros/${u}`),{uid:u,projeto_id:'p1',ativo:true,papel:ctx(u).papel})});const e:EstadoTreino={schema:1,revisao:0,operacoes:[],ocorrencias:[],ninhos:[],transferencias:[],aberturas:[],visitas:[],contexto:ctx()};await gravarNuvem(e,registrarOcorrencia(e,{...ocorrenciaBase,numeroRegistro:'007'},'I',m()),banco())},30000)
 afterAll(async()=>await env?.cleanup())
 it('corrige origem/data/número com motivo, pré-imagem e reserva; nega escrita direta',async()=>{
  const e=await carregarNuvem(ctx(),banco()),o=e.ocorrencias[0]!,n=corrigirCadastro(e,o.id,{...o,numeroRegistro:'008',dataOcorrencia:'2026-10-01',noiteReferencia:'2026-10-01',localOrigem:{...o.localOrigem,latitude:-8.12345}},'Erros de digitação',m());await gravarNuvem(e,n,banco())
  const novo=await carregarNuvem(ctx(),banco());expect(novo.ocorrencias[0]!.numeroRegistro).toBe('008');expect(novo.ocorrencias[0]!.localOrigem.latitude).toBe(-8.12345)
  const op=(await getDoc(doc(banco(),`projetos/p1/operacoes/${n.operacoes.at(-1)!.id}`))).data()!;expect(op.motivo).toBe('Erros de digitação');expect(op.anteriores[`projetos/p1/ocorrencias/${o.id}`].local_origem.latitude).toBe(o.localOrigem.latitude)
  expect((await getDoc(doc(banco(),'projetos/p1/reservas/N_REGISTRO:t2026/numeros/007'))).exists()).toBe(true)
  await assertFails(updateDoc(doc(banco(),`projetos/p1/ocorrencias/${o.id}`),{'local_origem.latitude':12}))
 })
 it('corrige novamente para número antigo reservado ao mesmo registro, sem liberar reservas',async()=>{const e=await carregarNuvem(ctx(),banco()),o=e.ocorrencias[0]!;await gravarNuvem(e,corrigirCadastro(e,o.id,{...o,numeroRegistro:'007'},'Correção confirmada pela equipe',m()),banco());expect((await carregarNuvem(ctx(),banco())).ocorrencias[0]!.numeroRegistro).toBe('007')})
 it('nega consulta, acesso sem membro, motivo ausente e CD sem ninho; conflito preserva dados',async()=>{const e=await carregarNuvem(ctx(),banco()),o=e.ocorrencias[0]!,n=corrigirCadastro(e,o.id,{...o,observacoes:'Corrigida'},'Teste',m());for(const u of ['consulta','intruso'])await expect(gravarNuvem(e,n,banco(u))).rejects.toBeDefined();const sem=structuredClone(n);(sem.operacoes.at(-1)!.payload as {motivo:string}).motivo='';await expect(gravarNuvem(e,sem,banco())).rejects.toThrow('Motivo');await gravarNuvem(e,n,banco());await expect(gravarNuvem(e,corrigirCadastro(e,o.id,{...o,observacoes:'Versão antiga'},'Teste antigo',m()),banco())).rejects.toThrow('Conflito')})
 it('edita transferência existente preservando ID e origem',async()=>{let e=await carregarNuvem(ctx(),banco());const n=registrarTransferencia(e,{...transferenciaBase,ninhoId:e.ninhos[0]!.id,destino:'CERCADO',cercadoId:'c1',numeroNinhoCercado:'001'},m());await gravarNuvem(e,n,banco());e=await carregarNuvem(ctx(),banco());const t=e.transferencias[0]!;await gravarNuvem(e,registrarTransferencia(e,{...t,numeroNinhoCercado:'002',ovosTransferencia:0},m(),t.id,'Número e contagem incorretos'),banco());const corrigido=await carregarNuvem(ctx(),banco());expect(corrigido.transferencias).toHaveLength(1);expect(corrigido.transferencias[0]!.numeroNinhoCercado).toBe('002');expect(corrigido.transferencias[0]!.ovosTransferencia).toBe(0);expect(corrigido.ocorrencias[0]!.localOrigem).toEqual(e.ocorrencias[0]!.localOrigem)})
 it('corrige vários campos juntos e nega data incompatível com abertura existente',async()=>{
  let e=await carregarNuvem(ctx(),banco()),o=e.ocorrencias[0]!;
  await expect(gravarNuvem(e,corrigirCadastro(e,o.id,{...o,temporadaId:'t2025',numeroRegistro:'0009',dataOcorrencia:'2026-09-28',noiteReferencia:'2026-09-28',horaOcorrencia:'20:30',especieCodigo:'DC',comprimentoCasco:90.5,tumores:'I',evidenciaInteracaoPesca:true,tipoEvidencia:'Fornecido pela equipe',palavrasChave:['PESCA'],localOrigem:{...o.localOrigem,latitude:-8,longitude:-34,datum:'WGS84'}},'Conferência da ficha fonte',m()),banco()),'correção completa antes da abertura').resolves.toBeUndefined();
  e=await carregarNuvem(ctx(),banco());o=e.ocorrencias[0]!;
  await gravarNuvem(e,registrarAbertura(e,{...aberturaBase,ninhoId:e.ninhos[0]!.id,projetoId:'p1',naoViaveis:null},{historico:null,problema:null},m()),banco());
  e=await carregarNuvem(ctx(),banco());o=e.ocorrencias[0]!;
  await expect(gravarNuvem(e,corrigirCadastro(e,o.id,{...o,temporadaId:'t2024',numeroRegistro:'0010',dataOcorrencia:'2026-09-29',noiteReferencia:'2026-09-29',horaOcorrencia:'19:10',especieCodigo:'CC',comprimentoCasco:88.5,larguraCasco:62,marcasEncontradas:'Fictícia',marcasColocadas:'Fictícia',marcasRetiradas:'Fictícia',tumores:'N',coletaMaterialBiologico:['Fictício'],evidenciaInteracaoPesca:false,tipoEvidencia:null,palavrasChave:['DNA'],observacoes:'Conferência fictícia',localOrigem:{...o.localOrigem,latitude:-8.1,longitude:-34.1,praiaCodigo:'002',localKm:'7',bairro:'Fictício',referencia:'Fictícia'}},'Correção também após abertura',m()),banco()),'correção após abertura').resolves.toBeUndefined();
  e=await carregarNuvem(ctx(),banco());o=e.ocorrencias[0]!;
  const n=corrigirCadastro(e,o.id,{...o,observacoes:'Correção válida'},'Conferência',m());
  n.ocorrencias[0]!.dataOcorrencia='2027-12-01';n.ocorrencias[0]!.noiteReferencia='2027-12-01';
  await expect(gravarNuvem(e,n,banco())).rejects.toBeDefined();
 })
 it('exclusão individual não inclui outros ninhos e continua negada ao campo',async()=>{let e=await carregarNuvem(ctx(),banco());await gravarNuvem(e,registrarOcorrencia(e,{...ocorrenciaBase,numeroRegistro:null},'I',m()),banco());e=await carregarNuvem(ctx(),banco());const id=e.ninhos[0]!.id,s={modo:'ninho' as const,ninhoId:id,ano:'',inicio:'',fim:''};await expect(prepararExclusao(ctx(),s,banco())).rejects.toThrow('coordenação');const p=await prepararExclusao(ctx('coord'),s,banco('coord'));expect(p.grupos.map(g=>g.id)).toEqual([id]);await executarExclusao(ctx('coord'),p,'a'.repeat(64),'b'.repeat(64),'Cadastro incorreto fictício',()=>{},banco('coord'));const restante=await carregarNuvem(ctx(),banco());expect(restante.ninhos).toHaveLength(1);expect(restante.ninhos[0]!.id).not.toBe(id)},20000)
})
