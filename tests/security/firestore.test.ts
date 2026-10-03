import { readFileSync } from 'node:fs'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, collection, query, where, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'

// Teste separado depende do emulador. Execucao sem emulador nao é evidencia de regras.
describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('regras reais no emulador local', () => {
  let env: RulesTestEnvironment
  const membro = (uid: string, papel: string, ativo = true) => ({uid, projeto_id: 'p1', papel, ativo,
    nome: uid, email: uid + '@example.test', criado_em: '2026-10-02', atualizado_em: '2026-10-02',
    criado_por: 'coord', atualizado_por: 'coord', versao: 1})
  beforeAll(async () => {
    const host = process.env.FIRESTORE_EMULATOR_HOST!
    if (!/^127\.0\.0\.1:\d+$/.test(host)) throw new Error('Testes permitidos apenas no emulador local loopback')
    env = await initializeTestEnvironment({projectId: 'demo-tartarugas', firestore: {
      host: '127.0.0.1', port: Number(host.split(':')[1]), rules: readFileSync('firestore.rules','utf8') }})
    await env.clearFirestore()
    await env.withSecurityRulesDisabled(async c => {
      const db = c.firestore()
      await setDoc(doc(db,'projetos/p1'),{id: 'p1', nome: 'Teste', ativo: true})
      for (const [uid,papel,ativo] of [['coord','coordenacao',true], ['campo','campo',true], ['consulta','consulta',true], ['inativo','campo',false]] as const) await setDoc(doc(db,'projetos/p1/membros/'+uid),membro(uid,papel,ativo))
      await setDoc(doc(db,'projetos/p1/ninhos/n1'),{projeto_id:'p1',ocorrencia_id:'o1'})
      await setDoc(doc(db,'projetos/p1/ninhos/n1/aberturas/a1'),{projeto_id:'p1',ninho_id:'n1'})
      await setDoc(doc(db,'projetos/p1/ninhos/n1/aberturas/cruzada'),{projeto_id:'p2',ninho_id:'n1'})
      await setDoc(doc(db,'projetos/p1/consultas/q1'),{projeto_id:'p1',criterio:'ECLOS',data_criterio:'2026-10-02'})
      await setDoc(doc(db,'projetos/p2/ninhos/n2'),{projeto_id:'p2'})
    })
  },30000)
  afterAll(async () => { await env?.cleanup() })
  it('sem login, sem membro e membro inativo não leem', async () => {
    for (const db of [env.unauthenticatedContext().firestore(),env.authenticatedContext('intruso').firestore(),env.authenticatedContext('inativo').firestore()]) await assertFails(getDoc(doc(db,'projetos/p1/ninhos/n1')))
  })
  it('todos os papéis ativos leem seu projeto, sem atravessar outro', async () => {
    for (const uid of ['consulta','campo','coord']) {
      const db = env.authenticatedContext(uid).firestore()
      await assertSucceeds(getDoc(doc(db,'projetos/p1/ninhos/n1')))
      await assertFails(getDoc(doc(db,'projetos/p2/ninhos/n2')))
    }
  })
  it('leitor vê apenas seu vínculo; coordenação pode listar membros', async () => {
    const db = env.authenticatedContext('consulta').firestore()
    await assertSucceeds(getDoc(doc(db,'projetos/p1/membros/consulta')))
    await assertFails(getDoc(doc(db,'projetos/p1/membros/campo')))
    await assertFails(getDocs(collection(db,'projetos/p1/membros')))
    await assertSucceeds(getDocs(collection(env.authenticatedContext('coord').firestore(),'projetos/p1/membros')))
  })
  it('cliente não cria primeira coordenação nem promove a si ou terceiros', async () => {
    const db = env.authenticatedContext('campo').firestore()
    await assertFails(updateDoc(doc(db,'projetos/p1/membros/campo'),{papel:'coordenacao'}))
    await assertFails(setDoc(doc(env.authenticatedContext('intruso').firestore(),'projetos/p1/membros/intruso'),membro('intruso','coordenacao')))
    await assertFails(setDoc(doc(env.authenticatedContext('coord').firestore(),'projetos/p1/membros/novo-admin'),membro('novo-admin','coordenacao')))
  })
  it('coordenação cadastra campo/consulta, com auditoria e versão válidas', async () => {
    const db = env.authenticatedContext('coord').firestore()
    await assertSucceeds(setDoc(doc(db,'projetos/p1/membros/novo-campo'),membro('novo-campo','campo')))
    await assertFails(updateDoc(doc(db,'projetos/p1/membros/novo-campo'),{papel:'consulta',versao:1}))
    await assertSucceeds(updateDoc(doc(db,'projetos/p1/membros/novo-campo'),{papel:'consulta',versao:2}))
    await assertFails(deleteDoc(doc(db,'projetos/p1/membros/novo-campo')))
  })
  it('dados cruzados e coleções desconhecidas negados, campo não escreve antes de E05', async () => {
    const db = env.authenticatedContext('campo').firestore()
    await assertSucceeds(getDoc(doc(db,'projetos/p1/ninhos/n1/aberturas/a1')))
    await assertFails(getDoc(doc(db,'projetos/p1/ninhos/n1/aberturas/cruzada')))
    await assertFails(setDoc(doc(db,'projetos/p1/ninhos/novo'),{projeto_id:'p1'}))
    await assertFails(setDoc(doc(db,'projetos/p1/qualquer/coisa'),{projeto_id:'p1'}))
    await assertFails(getDocs(collection(db,'projetos')))
  })
  it('projeção filtrada é legível apenas pelo membro do projeto', async () => {
    const db = env.authenticatedContext('consulta').firestore()
    const q = query(collection(db,'projetos/p1/consultas'),where('projeto_id','==','p1'),where('criterio','==','ECLOS'),where('data_criterio','>=','2026-10-01'),where('data_criterio','<=','2026-10-31'))
    expect((await assertSucceeds(getDocs(q))).size).toBe(1)
    await assertFails(getDoc(doc(env.authenticatedContext('intruso').firestore(),'projetos/p1/consultas/q1')))
  })
})
