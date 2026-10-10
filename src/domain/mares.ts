export interface EventoMare {hora:string;altura:number}
export type DiasMare=Record<string,EventoMare[]>
export function dataRecife(instante=new Date()):string {
  const partes=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Recife',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instante)
  const valor=(tipo:string)=>partes.find(p=>p.type===tipo)!.value
  return `${valor('year')}-${valor('month')}-${valor('day')}`
}
export function mudarDia(data:string,passo:number):string {
  const d=new Date(data+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+passo)
  return d.toISOString().slice(0,10)
}
/** Classifica extremos publicados comparando com o vizinho; não gera previsão. */
export function eventosDoDia(dias:DiasMare,data:string) {
  const eventos=dias[data]??[]
  return eventos.map((evento,i)=>{
    const anterior=eventos[i-1]??dias[mudarDia(data,-1)]?.at(-1)
    const seguinte=eventos[i+1]??dias[mudarDia(data,1)]?.[0]
    const tipo=anterior?evento.altura>anterior.altura?'alta':'baixa':seguinte?evento.altura>seguinte.altura?'alta':'baixa':null
    return {...evento,tipo}
  })
}
export function proximoEvento(dias:DiasMare,instante:Date) {
  const hoje=dataRecife(instante)
  for(const data of [hoje,mudarDia(hoje,1)])for(const evento of eventosDoDia(dias,data)) {
    if(new Date(`${data}T${evento.hora}:00-03:00`).getTime()>=instante.getTime())return {...evento,data}
  }
  return null
}
