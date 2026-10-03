/** Nome curto é identidade técnica, não endereço para enviar correspondência. */
export function identidadeLogin(usuario:string,dominio:string):string {
  const nome=usuario.trim().toLowerCase()
  if(!/^[a-z0-9._-]{1,64}$/.test(nome)||!/^[a-z0-9.-]+$/.test(dominio))throw new Error('Informe um nome de usuário válido.')
  return `${nome}@${dominio}`
}
