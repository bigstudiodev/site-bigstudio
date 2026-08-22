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
