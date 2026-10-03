import {describe,it,expect} from 'vitest'
import {identidadeLogin} from '../../src/services/loginTeste'
describe('identidade de acesso',()=>{
  it('normaliza nome curto sem armazenar senha',()=>{expect(identidadeLogin(' Adriano ','monitoramento-de-tartarugas.web.app')).toBe('adriano@monitoramento-de-tartarugas.web.app')})
  it('recusa nomes com caminho ou domínio fornecido pelo visitante',()=>{for(const nome of ['../outro','a@outro.com','nome com espaço',''])expect(()=>identidadeLogin(nome,'monitoramento-de-tartarugas.web.app')).toThrow()})
})
