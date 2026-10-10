import { PALAVRAS_CHAVE } from '../../domain/tipos'
import { paraDia } from '../../domain/datas'
export type ValoresCadastro = Record<string, string>
export const nomesCampos: Record<string,string> = {
 tipo:'Tipo de ocorrência (TIPO_OCORR)', natureza:'Natureza', dataOcorrencia:'Data da ocorrência (DATA_OCORR)', numeroRegistro:'Número de Registro (N_REGISTRO)',
 verificada:'Verificação da praia realizada', situacao:'SITUACAO', praia:'PRAIA', km:'LOCAL_KM', bairro:'BAIRRO', referencia:'LOCAL_ENDERECO', latitude:'LATITUDE', longitude:'LONGITUDE', datum:'DATUM',
 especie:'ESPECIE', flagrante:'Flagrante da tartaruga', horaOcorrencia:'HORA_OCORR', tumores:'TUMORES', marcasEncontradas:'MARCAS_ENC', marcasColocadas:'MARCAS_COL', marcasRetiradas:'MARCAS_RET', comprimento:'COMP_CASCO (cm)', largura:'LARG_CASCO (cm)',
 coleta:'COLETA_MATERIAL_BIOLOGICO', pesca:'EVIDENCIA_INT_PESCA', tipoEvidencia:'TIPO_EVIDENCIA', palavras:'PALAVRAS_CHAVE', observacoes:'OBS', motivo:'Motivo da correção',
 dataTransferencia:'Data de transferência (campo)', tempoTransferencia:'TEMP_TRANSF', ovosTransferencia:'OVOS_TRANS', numeroNinhoCercado:'N_NINHO', cercadoId:'Identificador do cercado', destino:'Destino da transferência',
 dataEclosao:'DATA_ECLOS', dataAbertura:'DATA_ABERT', vivos:'VIVOS', natimortos:'NATIMORTOS', ovosNaoEclodidos:'OVOS_N_ECL', ovosFurados:'OVOS_FURAD', naoViaveis:'NAO_VIAVEIS', historico:'HIST_NINHO', problema:'Problema durante a incubação',
}
export class ErroCampo extends Error { constructor(public campo:string,mensagem:string){super(mensagem)} }
export function campoDaMensagem(mensagem:string):string|undefined {
 return Object.keys(nomesCampos).find(k=>{const rotulo=nomesCampos[k]!;const codigo=rotulo.match(/\(([A-Z_]+)\)/)?.[1]??rotulo.replace(/ \(cm\)$/,'');return mensagem.includes(codigo)})
}
export function validarCampos(v:ValoresCadastro):Record<string,string> {
 const erros:Record<string,string>={}
 const contagens=['ovosTransferencia','vivos','natimortos','ovosNaoEclodidos','ovosFurados','naoViaveis']
 for(const [k,valor] of Object.entries(v)) {
  if(!valor.trim())continue
  if(contagens.includes(k)&&(!/^\d+$/.test(valor)||!Number.isSafeInteger(Number(valor))))erros[k]='Digite uma quantidade inteira, como 80, ou deixe vazio se não foi observada.'
  if(['comprimento','largura'].includes(k)&&(!Number.isFinite(Number(valor.replace(',','.')))||Number(valor.replace(',','.'))<0))erros[k]='Digite uma medida maior ou igual a zero, ou deixe vazio se não foi observada.'
  if(k.includes('latitude')||k.includes('longitude')){const n=Number(valor.replace(',','.')),lim=k.includes('latitude')?90:180;if(!Number.isFinite(n)||Math.abs(n)>lim)erros[k]=`Digite uma coordenada entre -${lim} e ${lim}. Use o sinal e os decimais do GPS.`}
  if(['dataOcorrencia','dataTransferencia','dataEclosao','dataAbertura'].includes(k)&&paraDia(valor)===null)erros[k]='Informe uma data válida no calendário.'
 }
 for(const p of ['', 'destino-'])if(v[p+'latitude']?.trim()||v[p+'longitude']?.trim()){
  if(!v[p+'latitude']?.trim())erros[p+'latitude']='Preencha a latitude que acompanha a longitude.'
  if(!v[p+'longitude']?.trim())erros[p+'longitude']='Preencha a longitude que acompanha a latitude.'
  if(!v[p+'datum'])erros[p+'datum']='Selecione o datum informado pelo GPS: SIRGAS2000 ou WGS84.'
 }
 if(v.flagrante==='true'&&!v.tumores)erros.tumores='No flagrante, selecione S, N ou I conforme a observação.'
 if(v.pesca==='true'&&!v.tipoEvidencia?.trim())erros.tipoEvidencia='Informe o tipo fornecido pela coordenação quando houver evidência de interação com pesca.'
 if(v.palavras?.split(',').map(p=>p.trim()).filter(Boolean).some(p=>!(PALAVRAS_CHAVE as readonly string[]).includes(p)))erros.palavras='Selecione as palavras da lista do manual. Não use termos inventados.'
 if(v.tipo==='SD'&&v.verificada!=='true')erros.verificada='Sem Desova exige verificação da praia. Confira a ocorrência e registre a verificação.'
 if(v.historico&&!v.observacoes?.trim())erros.observacoes='Descreva em OBS o que aconteceu com o ninho para complementar HIST_NINHO.'
 if(v.dataEclosao&&v.dataAbertura&&v.dataAbertura<v.dataEclosao)erros.dataAbertura='A abertura está antes da eclosão. Confira DATA_ABERT e DATA_ECLOS.'
 return erros
}
export function validarCadastro(v:ValoresCadastro,edicao=false):Record<string,string>{
 const ativos={...v}
 if(edicao||v.tipo!=='CD'||!['T','P'].includes(v.situacao??''))for(const k of Object.keys(ativos))if(k.startsWith('destino-')||['dataTransferencia','tempoTransferencia','ovosTransferencia','numeroNinhoCercado','cercadoId'].includes(k))delete ativos[k]
 const erros=validarCampos(ativos)
 if(!v.tipo)erros.tipo='Selecione o tipo de ocorrência. Somente CD cria um ninho.'
 if(!v.natureza)erros.natureza='Selecione a natureza deste registro.'
 if(v.tipo==='CD'&&!v.situacao)erros.situacao='Selecione I, T ou P. Se não houve transferência, escolha in situ (I).'
 if(!edicao&&v.tipo==='CD'&&['T','P'].includes(v.situacao??'')){
  if(!v.dataTransferencia)erros.dataTransferencia='Informe a data em que a transferência ocorreu.'
  if(v.situacao==='T'){
   if(!v.cercadoId?.trim())erros.cercadoId='Informe o identificador do cercado fornecido pela equipe.'
   if(!v.numeroNinhoCercado?.trim())erros.numeroNinhoCercado='Informe N_NINHO, o número dentro do cercado, preservando os zeros iniciais.'
  }else{
   if(!v['destino-praia']?.trim())erros['destino-praia']='Informe PRAIA_DEST_P com o código fornecido pela coordenação.'
   if(!v['destino-km']?.trim())erros['destino-km']='Informe LOCAL_KM_P, o trecho da praia de destino.'
  }
 }
 if(edicao&&!v.motivo?.trim())erros.motivo='Explique brevemente o erro que está corrigindo. O valor anterior será preservado.'
 return erros
}
