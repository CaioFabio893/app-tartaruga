import {expect,it} from 'vitest'
import tabua from '../src/features/mares/recife-2026.json'
import {dataRecife,eventosDoDia,mudarDia,proximoEvento} from '../src/domain/mares'
it('contém todos os dias do ano oficial e extremos cronológicos alternados',()=>{
  const datas=Object.keys(tabua.dias)
  expect(datas).toHaveLength(365)
  expect(datas[0]).toBe('2026-01-01');expect(datas.at(-1)).toBe('2026-12-31')
  for(const data of datas){const eventos=eventosDoDia(tabua.dias,data);expect([3,4]).toContain(eventos.length);expect(eventos.map(e=>e.hora)).toEqual([...new Set(eventos.map(e=>e.hora))].sort());for(let i=1;i<eventos.length;i++)expect(eventos[i]!.tipo).not.toBe(eventos[i-1]!.tipo)}
})
it('preserva valores conferidos nas páginas 82 e 84',()=>{
  expect(eventosDoDia(tabua.dias,'2026-01-12')).toEqual([{hora:'05:23',altura:.89,tipo:'baixa'},{hora:'11:19',altura:1.70,tipo:'alta'},{hora:'17:51',altura:.85,tipo:'baixa'},{hora:'23:55',altura:1.69,tipo:'alta'}])
  expect(eventosDoDia(tabua.dias,'2026-10-03')).toEqual([{hora:'02:46',altura:.68,tipo:'baixa'},{hora:'09:16',altura:1.74,tipo:'alta'},{hora:'15:29',altura:.93,tipo:'baixa'},{hora:'21:34',altura:1.80,tipo:'alta'}])
})
it('usa data e próxima maré de Recife independentemente do fuso do aparelho',()=>{
  expect(dataRecife(new Date('2026-10-04T01:00:00Z'))).toBe('2026-10-03')
  expect(proximoEvento(tabua.dias,new Date('2026-10-04T01:00:00Z'))).toMatchObject({data:'2026-10-04',hora:'04:36',tipo:'baixa'})
  expect(proximoEvento(tabua.dias,new Date('2026-10-03T12:16:00Z'))).toMatchObject({hora:'09:16',tipo:'alta'})
})
it('não extrapola anos indisponíveis e navega pelos limites do calendário',()=>{
  expect(eventosDoDia(tabua.dias,'2027-01-01')).toEqual([])
  expect(proximoEvento(tabua.dias,new Date('2027-01-01T12:00:00Z'))).toBeNull()
  expect(mudarDia('2026-01-31',1)).toBe('2026-02-01');expect(mudarDia('2026-03-01',-1)).toBe('2026-02-28')
})
