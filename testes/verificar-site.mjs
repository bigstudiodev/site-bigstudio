// Verificação estática do site (sem dependências): node testes/verificar-site.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
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

// Página Barbearias: oferta, honestidade sobre o estágio, sem demonstração publicada e navegação em todas as páginas
const barb = readFileSync(join(raiz, 'barbearias.html'), 'utf8');
checar(barb.includes('R$ 450') && barb.includes('R$ 150'), 'barbearias: valores da oferta ausentes');
checar(/\.com\.br/.test(barb) && /não (está )?incluído/i.test(barb), 'barbearias: falta avisar que o domínio .com.br não está incluído');
checar(/Em validação/.test(barb) && /multi-profissional/i.test(barb), 'barbearias: falta ressalva do estágio multi-profissional');
checar(!/(localhost|127\.0\.0\.1|[A-Za-z]:\\|file:\/\/)/.test(barb), 'barbearias: aponta para caminho local');
checar(!/<iframe|Demonstração interativa:\s*<a|href="[^"]*demo/i.test(barb), 'barbearias: não deve haver link/embed de demonstração ainda');
checar(!/em nome (da|do)/i.test(barb), 'barbearias: não definir titularidade do domínio (regra comercial não decidida)');
checar(/Login individual e permissões específicas para cada barbeiro/.test(barb) && /ainda estão em validação/.test(barb), 'barbearias: login individual deve constar como em validação');
checar(barb.includes('data-demo-reservado'), 'barbearias: falta o espaço reservado da demonstração');
checar(/contato\.html\?assunto=Barbearias/.test(barb), 'barbearias: falta chamada para o contato');
checar(readFileSync(join(raiz, 'sitemap.xml'), 'utf8').includes('/barbearias.html'), 'sitemap: sem barbearias.html');
for (const p of paginas) checar(readFileSync(join(raiz, p), 'utf8').includes('<a href="barbearias.html"'), `${p}: menu sem link para Barbearias`);
checar(readFileSync(join(raiz, 'index.html'), 'utf8').includes('class="card-b3 card-ciano" href="barbearias.html"'), 'index: falta o destaque de Barbearias');
checar(readFileSync(join(raiz, 'contato.html'), 'utf8').includes('<option>Barbearias</option>'), 'contato: falta a opção Barbearias');


// Home Base 3: seis cards, fachada original e ausência da cena experimental
const inicioBase3 = readFileSync(join(raiz, 'index.html'), 'utf8');
checar((inicioBase3.match(/class="card-b3 card-/g) || []).length === 6, 'home Base 3: esperados seis cards');
checar((inicioBase3.match(/class="morador"/g) || []).length === 4, 'home Base 3: fachada com quatro moradores');
checar(inicioBase3.includes('class="cena-controle"') && inicioBase3.includes('assets/js/fachada.js'), 'home Base 3: controle de pausa ou fachada ausente');
checar((inicioBase3.match(/janela-viva/g) || []).length === 2, 'home Base 3: duas janelas animadas esperadas');
checar(!inicioBase3.includes('assets/js/favela.js') && !inicioBase3.includes('favela/favela.js'), 'home Base 3: não importar cena experimental');
checar(readFileSync(join(raiz, 'assets/css/inicio.css'), 'utf8').includes('.card-ciano'), 'home Base 3: cor do card Barbearias ausente');
checar(readFileSync(join(raiz, 'assets/js/menu.js'), 'utf8').includes('(max-width: 1099px)'), 'menu: breakpoint JS desatualizado');

console.log(falhas.length ? falhas.join('\n') : `OK — ${paginas.length} páginas verificadas`);
process.exit(falhas.length ? 1 : 0);
