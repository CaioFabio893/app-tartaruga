import {expect,it} from 'vitest'
import {IDBFactory} from 'fake-indexeddb'
import {carregarGestao,lerGestaoLocal,salvarGestao} from '../../src/app/gestao'
import {criarTreino} from '../../src/app/treino'
it('organização de treino persiste separadamente, recusa versão antiga e não promete reserva offline na nuvem',async()=>{
 Object.defineProperty(globalThis,'indexedDB',{value:new IDBFactory(),configurable:true})
 Object.defineProperty(globalThis,'navigator',{value:{onLine:false},configurable:true})
 const e=criarTreino(),id=e.ninhos[0]!.id,entrada={ano:2026,numero:'',previsao_eclosao:null,antecedencia_dias:7,nota_previsao:null}
 const g=await salvarGestao(e,id,entrada,null);expect(g.ninhos[id]!.numero).toBe('001');expect(g.confirmada).toBe(false)
 await expect(salvarGestao(e,id,{...entrada,numero:'005'},null)).rejects.toThrow('outra aba')
 expect((await lerGestaoLocal(e)).ninhos[id]!.numero).toBe('001')
 const nuvem={...e,statusNuvem:'confirmada' as const,contexto:{projetoId:'p',usuario:'campo',papel:'campo' as const,nome:'Teste',revisaoServidor:0}}
 expect(Object.keys((await carregarGestao(nuvem)).ninhos)).toHaveLength(0)
 await expect(salvarGestao(nuvem,id,entrada,null)).rejects.toThrow('conexão')
 expect((await lerGestaoLocal(e)).ninhos[id]!.numero).toBe('001')
})
