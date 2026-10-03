import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it } from 'vitest'

it('fragmento externo da ficha não introduz HTML executável no protótipo', () => {
  const app = { innerHTML: '', querySelectorAll: () => [] }
  const nav = { innerHTML: '' }, etapa = { innerHTML: '' }
  runInNewContext(readFileSync('design-preview/app.js', 'utf8'), {
    location: { hash: '#/ficha/<img src=x onerror=alert(1)>' },
    document: {
      getElementById: (id: string) => id === 'app' ? app : id === 'et' ? etapa : null,
      querySelector: () => nav,
      querySelectorAll: () => [],
    },
    addEventListener: () => {},
  })
  expect(app.innerHTML).toContain('Ficha &lt;img src=x onerror=alert(1)&gt;')
  expect(app.innerHTML).not.toContain('<img')
})
