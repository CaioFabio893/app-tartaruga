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

it('busca leituras novas e conserva a mais precisa até o prazo',async()=>{
 vi.useFakeTimers();let receber:PositionCallback|undefined;const limpar=vi.fn()
 const p=capturarGPS({getCurrentPosition(){},watchPosition(ok,_erro,op){receber=ok;expect(op?.enableHighAccuracy).toBe(true);expect(op?.maximumAge).toBe(0);return 9},clearWatch:limpar},{timeoutMs:100})
 receber?.(pos(-8.12345678,-34.98765432,96));receber?.(pos(-8.12345679,-34.98765431,12));receber?.(pos(-8.12345680,-34.98765430,40));await vi.advanceTimersByTimeAsync(101)
 const r=await p;expect(r.precisaoGpsM).toBe(12);expect(r.latitude).toBe(-8.12345679);expect(limpar).toHaveBeenCalledWith(9);vi.useRealTimers()
})
it('cancela o acompanhamento sem aplicar a leitura anterior',async()=>{
 const c=new AbortController(),limpar=vi.fn();let receber:PositionCallback|undefined
 const p=capturarGPS({getCurrentPosition(){},watchPosition(ok){receber=ok;return 2},clearWatch:limpar},{signal:c.signal})
 receber?.(pos(-8,-34,96));const erro=expect(p).rejects.toThrow('cancelada');c.abort();await erro;expect(limpar).toHaveBeenCalledWith(2)
})
