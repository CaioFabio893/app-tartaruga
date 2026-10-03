import { describe, it, expect } from 'vitest'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, doc, getDocFromServer, terminate } from 'firebase/firestore'
import { carregarNuvem, gravarNuvem, consultarRelatorioNuvem } from '../../src/data/nuvem'
import { registrarOcorrencia, registrarAbertura, registrarVisita } from '../../src/app/treino'
import { ocorrenciaBase, aberturaBase } from '../auxiliares-agregado'
import { gerarPDF } from '../../src/report/pdf'

// Opt-in separado: nunca executar escrita real na suíte comum ou dentro do emulador.
describe.skipIf(process.env.P03_VALIDAR_PRODUCAO!=='monitoramento-de-tartarugas')('produção isolada, mesma conta em dois clientes',()=>{
  it('Auth e gravação real confirmada; relatório por intervalo; projeto principal sem dados sintéticos',async()=>{
    if(process.env.FIRESTORE_EMULATOR_HOST||!process.env.P03_SENHA)throw new Error('Use a senha apenas em variável temporária, fora do emulador.')
    const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,appId:import.meta.env.VITE_FIREBASE_APP_ID,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID}
    if(config.projectId!=='monitoramento-de-tartarugas')throw new Error('Projeto diferente do autorizado.')
    const a=initializeApp(config,'prova-p03-a'),b=initializeApp(config,'prova-p03-b'),db=getFirestore(a),outro=getFirestore(b)
    try {
      const email='adriano@monitoramento-de-tartarugas.web.app'
      await expect(signInWithEmailAndPassword(getAuth(a),email,'senha-invalida-de-teste')).rejects.toBeDefined()
      const u=(await signInWithEmailAndPassword(getAuth(a),email,process.env.P03_SENHA)).user
      await signInWithEmailAndPassword(getAuth(b),email,process.env.P03_SENHA)
      const projetoId='validacao-p03-interna',m=(await getDocFromServer(doc(db,`projetos/${projetoId}/membros/${u.uid}`))).data()!
      expect(m.papel).toBe('campo')
      const ctx={projetoId,usuario:u.uid,papel:'campo' as const,nome:'Validação técnica isolada — não é ficha de campo',revisaoServidor:0}
      let base=await carregarNuvem(ctx,db)
      const autoria={usuario:u.uid,instante:new Date().toISOString(),novoId:()=>crypto.randomUUID()}
      const dados=registrarOcorrencia(base,{...ocorrenciaBase,projetoId,numeroRegistro:null,temporadaId:null,responsavelId:u.uid,flagrante:false,horaOcorrencia:null,tumores:null,especieCodigo:'NI',localOrigem:{...ocorrenciaBase.localOrigem,praiaId:null,praiaCodigo:null,localKm:null,bairro:null,referencia:null,latitude:null,longitude:null,datum:null,fonteGps:null,precisaoGpsM:null,capturadoEm:null},observacoes:'DADOS SINTÉTICOS — validação técnica P03, isolada das fichas oficiais.'},'I',autoria)
      const ninho=dados.ninhos.at(-1)!.id
      await gravarNuvem(base,dados,db);await gravarNuvem(base,dados,db)
      base=await carregarNuvem(ctx,outro);expect(base.ninhos.some(n=>n.id===ninho)).toBe(true)
      const aberto=registrarAbertura(base,{...aberturaBase,projetoId,ninhoId:ninho,responsavelId:u.uid,vivos:0,natimortos:0,ovosNaoEclodidos:0,ovosFurados:0,observacoes:'DADOS SINTÉTICOS — contagens zero usadas apenas em teste técnico.'},{historico:'SU',problema:false},autoria)
      await gravarNuvem(base,aberto,outro);base=await carregarNuvem(ctx,db)
      const visitado=registrarVisita(base,{projetoId,ninhoId:ninho,dataVisita:'2026-10-25',noiteReferencia:'2026-10-25',responsavelId:u.uid,condicao:null,eventos:[],observacoes:'DADOS SINTÉTICOS — visita técnica.'},autoria)
      await gravarNuvem(base,visitado,db)
      for(const [criterio,dia] of [['OCORR','2026-10-02'],['ECLOS','2026-10-24'],['ABERT','2026-10-25']] as const) {
        const r=await consultarRelatorioNuvem(ctx,{projetoId,criterio,inicio:dia,fim:dia},outro)
        expect(r.parcial).toBe(false);expect(r.registros.some(n=>n.ficha.ninho.id===ninho)).toBe(true);expect((await gerarPDF(r)).length).toBeGreaterThan(1000)
      }
      const oficial=await carregarNuvem({...ctx,projetoId:'monitoramento-de-tartarugas'},db)
      expect(oficial.ocorrencias).toHaveLength(0)
      const semLogin=initializeApp(config,'prova-p03-sem-login'),negado=getFirestore(semLogin)
      try{await expect(getDocFromServer(doc(negado,'projetos/monitoramento-de-tartarugas'))).rejects.toBeDefined()}finally{await terminate(negado);await deleteApp(semLogin)}
    }finally{await Promise.all([signOut(getAuth(a)),signOut(getAuth(b))]);await Promise.all([terminate(db),terminate(outro)]);await Promise.all([deleteApp(a),deleteApp(b)])}
  },60000)
})
