# Site BIG STUDIO — estrutura

## Pastas

```
site-bigstudio/
├─ index.html           início (Base 3: hero com a favela, painel, cinco cards, projetos)
├─ aplicativos.html     vitrine: Meu Tatame e BigLock (Meu Financeiro oculto)
├─ tecnologias.html     competências técnicas do estúdio
├─ bigrotas.html        BigRotas (página própria, regras comerciais intocadas)
├─ fivem.html           área em construção
├─ contato.html         formulário (abre o e-mail preenchido)
├─ privacidade*.html, termos.html   páginas legais (conteúdo preservado)
├─ meu-financeiro.html  preservada, fora da navegação/vitrine/sitemap
├─ robots.txt, sitemap.xml
├─ testes/verificar-site.mjs   node testes/verificar-site.mjs
└─ assets/
   ├─ css/estilo.css    base e tokens originais
   ├─ css/glass.css     V2.0: tokens Dark Glass, sistema Glass e cabeçalho em pílula
   ├─ css/inicio.css    só a página inicial (hero cinematográfico, painel, cards)
   ├─ js/movimento.js   revelação das seções e luz nos cards
   ├─ js/produtos.js    ficha dos produtos (visivel:false oculta da vitrine)
   ├─ css/favela.css    GERADO: camadas e animações da favela do hero
   ├─ js/favela.js      pausa da favela (botão, fora da tela, aba oculta, movimento reduzido)
   └─ img/favela/       GERADO: camadas da favela (base, luzes, céu, nuvens, moradores, pipa)
ferramentas/gerar-favela.py   gera a favela animada a partir da arte Base 3
```

## Sistema Glass (V2.0)

Classes em `glass.css`: `.glass` + variação `--produto | --servico | --tech | --info`, estado `.estado` (`--disponivel | --pesquisa`) e grade `.areas`. Adicione `data-revelar` para a entrada suave. Sem `backdrop-filter` o card usa fundo opaco; `prefers-reduced-motion` desliga os movimentos.

## Página inicial (Base 3)

A favela do hero é a própria cena principal, construída em camadas a partir da arte aprovada (Base 3):
céu com estrelas, nuvens que passam só sobre o céu, construções, a luz de cada janela (46 janelas com
ritmo próprio), moradores andando nas lajes e uma criança soltando pipa. A marca aparece na cena só como
o selo pixelado pintado numa parede; o letreiro "BIG STUDIO" da arte original foi removido.

Para mudar a cena, edite `ferramentas/gerar-favela.py` e rode:

    python3 ferramentas/gerar-favela.py caminho/para/base3.png

Ele regera `assets/img/favela/`, `assets/css/favela.css` e o trecho entre `<!-- favela:inicio -->` e
`<!-- favela:fim -->` no `index.html`. A animação antiga (`fachada.css`/`fachada.js`) saiu do hero e
continua no repositório para reversão.

## Segurança

Todas as páginas têm CSP por meta tag (sem script ou estilo inline). Ao usar um recurso novo de terceiros ou outra API, inclua o host na CSP de cada página. O GitHub Pages não permite cabeçalhos HTTP próprios.

## Regras da estrutura

- **Um só CSS.** Cor, fonte e espaçamento moram em `estilo.css`, no bloco de tokens do topo. Mudou lá, mudou no site inteiro.
- **Produto não vira página.** Todo produto é uma entrada em `produtos.js`. As páginas só têm o espaço onde os cards entram (`data-lista="app" | "fivem"`). Exceção: o BigRotas tem página própria e não entra como card.
- **Sem framework e sem build.** É HTML puro: abre no navegador e publica em qualquer lugar, inclusive GitHub Pages de graça.
- **Menu e rodapé são repetidos** em cada arquivo. É o preço de não ter build; se um dia incomodar, dá para trocar por um gerador estático.

## Adicionar um produto

Abra `assets/js/produtos.js`, copie um bloco e edite:

```js
{
  nome: "Nome do produto",
  categoria: "fivem",              // app | fivem
  etiqueta: "Pronto · entrega em X dias",
  resumo: "Uma linha do que ele faz.",
  pontos: ["Ponto 1", "Ponto 2", "Ponto 3"],
  tom: "azul"                      // azul | amarelo | rosa
}
```

## O que ainda falta preencher

- Domínio próprio (opcional; hoje o site vive no endereço do GitHub Pages)

- Página FiveM está em construção. Os três exemplos continuam guardados em `produtos.js`; quando ela voltar, é só recolocar o `<div class="grade" data-lista="fivem"></div>`
- Domínio próprio, fonte oficial da marca (se existir) e hospedagem local das fontes, pendentes de confirmação

## Publicar

Duas opções, o site funciona igual nas duas:

- **GitHub Pages** — de graça, indicado enquanto o site for só HTML estático
- **Railway** — vale quando o site precisar dividir ambiente com algo que roda no servidor

### GitHub Pages

1. Criar repositório na organização da BIG STUDIO
2. Subir a pasta inteira
3. Settings → Pages → Branch `main` → `/root`
4. Depois apontar o domínio próprio, se tiver

## Card de link e favicon

- `assets/img/selo.svg` — ícone da aba
- `assets/img/card-link.png` — imagem que aparece ao colar o link no Discord, WhatsApp ou X
- O endereço do site está fixo nas tags `og:` das 5 páginas como `https://bigstudiodev.github.io/site-bigstudio/`. Se um dia entrar domínio próprio, trocar essa URL nas 5 páginas.

## BigRotas

Página única, sem catálogo: o botão **Falar com o BigRotas** abre direto a conversa.
O link fica no `<script>` no fim de `bigrotas.html`, na constante `CONVERSA` — trocar o número antes de publicar.

## Atualizações (Etapa 2D — feed público do Control Center)

O site consome, só por leitura (GET), o feed público do Control Center:
`GET /api/public/atualizacoes` e `GET /api/public/projetos/<slug>/atualizacoes`.
Nada de login, WhatsApp, banco ou escrita entra pelo site — isso é tudo
responsabilidade do Control Center.

- `assets/js/config.js` — só a URL base pública (`CONTROL_CENTER_PUBLIC_API_BASE_URL`).
  Hoje está `null` **de propósito**, porque o Control Center ainda não tem
  endereço de produção — enquanto for `null`, nenhuma chamada de rede é
  feita e a seção de Atualizações simplesmente não aparece. Preencher essa
  constante é o único passo necessário para ligar o feed depois.
- `assets/js/atualizacoes.js` — o cliente: basta um `<div data-atualizacoes>`
  na página (ver comentário no topo do arquivo para as opções). Já usado em
  `index.html`, `aplicativos.html` (feed geral) e `bigrotas.html` (filtrado
  pelo projeto, slug `big-rotas`).
- Qualquer falha (API fora do ar, erro HTTP, JSON inválido) só mostra um
  texto discreto ("Atualizações indisponíveis no momento.") — nunca quebra
  a página nem trava o GitHub Pages.

**Pendência para quando o Control Center for publicado:** configurar no
backend (`CONTROL_CENTER_PUBLIC_CORS_ORIGIN`) a origem do GitHub Pages
deste site, hoje `https://bigstudiodev.github.io` (sem caminho — é a
origem de `https://bigstudiodev.github.io/site-bigstudio/`, e muda se um
domínio próprio entrar no lugar, ver seção "Card de link e favicon" acima).
Sem isso, o navegador bloqueia a resposta por CORS mesmo com a API no ar.
