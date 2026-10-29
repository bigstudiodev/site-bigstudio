// Verificação estática do site (sem dependências): node testes/verificar-site.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
const paginas = readdirSync(raiz).filter((f) => f.endsWith('.html'));
const falhas = [];
const checar = (ok, msg) => { if (!ok) falhas.push(msg); };

for (const p of paginas) {
  const html = readFileSync(join(raiz, p), 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const alvo = m[1].split('?')[0];
    if (/^(https?:|mailto:|tel:|data:)/.test(alvo)) continue;
    checar(existsSync(join(raiz, alvo)), `${p}: link quebrado → ${alvo}`);
  }
  checar(/<link rel="canonical"/.test(html), `${p}: sem canonical`);
  checar(/Content-Security-Policy/.test(html), `${p}: sem CSP`);
  checar(!/<script>/.test(html), `${p}: script inline`);
  checar(!/ style="/.test(html), `${p}: estilo inline`);
  checar(!/(token|secret|api[_-]?key|password)\s*[:=]\s*["'][^"']{8,}/i.test(html), `${p}: possível credencial`);
}

// Meu Financeiro fora da vitrine e da navegação pública
for (const p of ['index.html', 'aplicativos.html']) {
  const html = readFileSync(join(raiz, p), 'utf8').replace(/<template[\s\S]*?<\/template>/g, '');
  checar(!/Meu Financeiro/i.test(html.replace(/<meta[^>]*>/g, '')), `${p}: menciona Meu Financeiro`);
}
checar(readFileSync(join(raiz, 'assets/js/produtos.js'), 'utf8').includes('visivel: false'), 'produtos.js: Meu Financeiro deve ter visivel:false');
checar(!readFileSync(join(raiz, 'sitemap.xml'), 'utf8').includes('financeiro'), 'sitemap lista Meu Financeiro');

// Regras comerciais do BigRotas preservadas
const rotas = readFileSync(join(raiz, 'bigrotas.html'), 'utf8');
checar(rotas.includes('R$ 15,00'), 'bigrotas: preço R$ 15,00 ausente');
checar(/5 dias/.test(rotas), 'bigrotas: teste de 5 dias ausente');
const conv = readFileSync(join(raiz, 'assets/js/bigrotas-conversa.js'), 'utf8');
checar(conv.includes('5511960405352') && conv.includes('assinar'), 'bigrotas: WhatsApp/comando alterado');

console.log(falhas.length ? falhas.join('\n') : `OK — ${paginas.length} páginas verificadas`);
process.exit(falhas.length ? 1 : 0);
