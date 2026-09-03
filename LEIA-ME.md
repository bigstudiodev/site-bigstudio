# Site BIG STUDIO — estrutura

## Pastas

```
site-bigstudio/
├─ index.html          início
├─ aplicativos.html    Meu Financeiro, Meu Tatame, BigLock
├─ bigrotas.html      BigRotas (só o botão da conversa)
├─ fivem.html          bases, addons e scripts
├─ contato.html        formulário (abre o e-mail preenchido)
└─ assets/
   ├─ css/estilo.css   todo o visual do site
   ├─ js/produtos.js   ficha de todos os produtos
   └─ img/             imagens (vazio por enquanto)
```

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
- Imagens dos produtos (a estrutura de card ainda não tem imagem — dá para incluir quando você tiver prints)

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
