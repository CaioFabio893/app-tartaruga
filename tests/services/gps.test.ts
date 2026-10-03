import { expect,it,vi } from 'vitest'
import { capturarGPS } from '../../src/services/gps'
const pos=(lat=0,lon=0,accuracy=0)=>({coords:{latitude:lat,longitude:lon,accuracy},timestamp:1790960400000}) as GeolocationPosition
it('preserva coordenadas/precisão zero observadas e datum real da API',async()=>{
  const r=await capturarGPS({getCurrentPosition(ok){ok(pos())}})
  expect(r.latitude).toBe(0);expect(r.longitude).toBe(0);expect(r.precisaoGpsM).toBe(0)
  expect(r.datum).toBe('WGS84');expect(r.fonteGps).toBe('dispositivo')
})
it('negação, ausência e coordenadas inválidas não preenchem campos',async()=>{
  await expect(capturarGPS(null)).rejects.toThrow('indisponível')
  await expect(capturarGPS({getCurrentPosition(_ok,erro){erro?.({code:1} as GeolocationPositionError)}})).rejects.toThrow('negada')
  await expect(capturarGPS({getCurrentPosition(ok){ok(pos(91))}})).rejects.toThrow('inválidas')
})
it('timeout encerra espera mesmo se a API não responder',async()=>{
  vi.useFakeTimers()
  const p=capturarGPS({getCurrentPosition(){}},{timeoutMs:10})
  const rejeicao=expect(p).rejects.toThrow('demorou')
  await vi.advanceTimersByTimeAsync(11);await rejeicao;vi.useRealTimers()
})
it('cancelamento ignora resposta tardia',async()=>{
  const c=new AbortController();let resposta:PositionCallback|undefined
  const p=capturarGPS({getCurrentPosition(ok){resposta=ok}},{signal:c.signal})
  const rejeicao=expect(p).rejects.toThrow('cancelada');c.abort();resposta?.(pos());await rejeicao
})
