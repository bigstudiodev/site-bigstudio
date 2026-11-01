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

// Página Barbearias: preservar a oferta e a honestidade sobre o estágio, sem destaque no menu
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
// V3: o menu tem cinco áreas, sem produtos ou segmentos destacados.
const menuEsperado = ['index.html', 'servicos.html', 'projetos.html', 'estudio.html', 'contato.html'];
for (const p of paginas) {
  const html = readFileSync(join(raiz, p), 'utf8');
  const menu = html.match(/<nav class="menu" id="menu-principal"[\\s\\S]*?<\\/nav>/)?.[0] || '';
  const destinos = [...menu.matchAll(/<a\\b[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  checar(JSON.stringify(destinos) === JSON.stringify(menuEsperado), `${p}: navegação V3 inconsistente`);
  checar(!menu.includes('href="barbearias.html"'), `${p}: Barbearias não deve estar no menu principal`);
  checar(html.includes('href="#conteudo-principal"') && html.includes('id="conteudo-principal"'), `${p}: falta atalho para conteúdo principal`);
  checar(html.includes('v3-footer-links') && html.includes('assets/css/v3.css?v=1'), `${p}: rodapé/estilo V3 ausente`);
}
const sMapa = readFileSync(join(raiz, 'sitemap.xml'), 'utf8');
for (const p of ['servicos.html', 'projetos.html', 'estudio.html']) {
  checar(existsSync(join(raiz, p)) && sMapa.includes('/' + p), `V3: falta a página ${p} no sitemap`);
}
checar(readFileSync(join(raiz, 'contato.html'), 'utf8').includes('<option>Barbearias</option>'), 'contato: falta a opção Barbearias');


// V3: serviços e produtos separados, sem destaque individual de Barbearias
const inicioV3 = readFileSync(join(raiz, 'index.html'), 'utf8');
const servicosV3 = readFileSync(join(raiz, 'servicos.html'), 'utf8');
const projetosV3 = readFileSync(join(raiz, 'projetos.html'), 'utf8');
const estudioV3 = readFileSync(join(raiz, 'estudio.html'), 'utf8');
checar((inicioV3.match(/class="v3-service-card"/g) || []).length === 3, 'home V3: esperados três grupos de serviços');
checar((inicioV3.match(/class="v3-project-card"/g) || []).length === 3, 'home V3: esperados três produtos autorais');
checar(!inicioV3.includes('href="barbearias.html"') && !inicioV3.includes('card-b3'), 'home V3: Barbearias não deve ter destaque próprio');
checar(servicosV3.includes('href="barbearias.html"') && /multi-profissionais|múltiplos profissionais/.test(servicosV3), 'Serviços V3: caminho contextual e ressalva de Barbearias ausentes');
checar(!projetosV3.includes('href="barbearias.html"'), 'Projetos V3: Barbearias deve permanecer em Serviços');
checar(projetosV3.includes('href="bigrotas.html"') && projetosV3.includes('Meu Tatame') && projetosV3.includes('BigLock'), 'Projetos V3: produtos incompletos');
checar(projetosV3.includes('Em desenvolvimento') && projetosV3.includes('Em construção'), 'Projetos V3: estágios ausentes');
checar(estudioV3.includes('href="tecnologias.html"'), 'Estúdio V3: falta caminho de competências');
checar((inicioV3.match(/class="morador"/g) || []).length === 4, 'home V3: fachada com quatro moradores');
checar(inicioV3.includes('class="cena-controle"') && inicioV3.includes('assets/js/fachada.js'), 'home V3: fachada/controle de pausa ausentes');
checar((inicioV3.match(/janela-viva/g) || []).length === 2, 'home V3: duas janelas animadas esperadas');
checar(inicioV3.includes('data-atualizacoes'), 'home V3: atualizações removidas');
checar(!inicioV3.includes('assets/js/favela.js') && !inicioV3.includes('favela/favela.js'), 'home V3: cena experimental não aprovada');
checar(readFileSync(join(raiz, 'assets/js/menu.js'), 'utf8').includes('(max-width: 1099px)'), 'menu: breakpoint JS desatualizado');

console.log(falhas.length ? falhas.join('\n') : `OK — ${paginas.length} páginas verificadas`);
process.exit(falhas.length ? 1 : 0);
