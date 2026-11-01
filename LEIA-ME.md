# Site BIG STUDIO — estrutura

## Pastas e arquitetura V3

```text
site-bigstudio/
├─ index.html            apresentação do estúdio e caminhos principais
├─ servicos.html         serviços de desenvolvimento sob consulta
├─ projetos.html         produtos autorais e iniciativas em desenvolvimento
├─ estudio.html          identidade, processo e competências
├─ contato.html          formulário de contato (abre o e-mail preenchido)
├─ barbearias.html       página comercial acessível contextualizada em Serviços
├─ bigrotas.html         produto próprio, acessível em Projetos
├─ aplicativos.html      projetos Meu Tatame e BigLock (Meu Financeiro oculto)
├─ tecnologias.html      detalhamento técnico vinculado ao Estúdio
├─ fivem.html            área em construção vinculada a Projetos
├─ privacidade*.html, termos.html    páginas legais preservadas
├─ meu-financeiro.html   preservada, fora da navegação, vitrine e sitemap
├─ robots.txt, sitemap.xml
├─ testes/verificar-site.mjs
└─ assets/
   ├─ css/estilo.css     estilos base
   ├─ css/glass.css      linguagem visual e cabeçalho
   ├─ css/inicio.css     hero e fachada original da home
   ├─ css/v3.css         componentes editoriais V3, páginas e acessibilidade
   ├─ css/v3-home.css    ajustes de layout da home V3
   ├─ js/menu.js         menu responsivo e acessível
   ├─ js/produtos.js     cadastro de produtos (visivel:false oculta o produto)
   └─ img/               recursos visuais existentes
```

## Sistema Glass (V2.0)

Classes em `glass.css`: `.glass` + variação `--produto | --servico | --tech | --info`, estado `.estado` (`--disponivel | --pesquisa`) e grade `.areas`. Adicione `data-revelar` para a entrada suave. Sem `backdrop-filter` o card usa fundo opaco; `prefers-reduced-motion` desliga os movimentos.

## Arquitetura e navegação V3

A navegação principal é composta exclusivamente por **Início / Serviços / Projetos / Estúdio / Contato**. Produtos individuais, segmentos específicos e áreas experimentais são acessados nas categorias correspondentes, com indicação do estágio real.

- **Serviços:** sites e sistemas, aplicativos, automação e inteligência artificial sob avaliação de viabilidade. A solução para Barbearias é um exemplo contextual de sites e sistemas, não um destaque na home ou no menu.
- **Projetos:** BIG Rotas (disponível); Meu Tatame e BigLock (em desenvolvimento); FiveM (em construção). Não inventar portfólio de clientes ou casos não autorizados.
- **Estúdio:** posicionamento, método e ligação às competências técnicas existentes em `tecnologias.html`.
- **Início:** hero e fachada animada originais da Base 3 (quatro moradores, duas janelas e pausa); três frentes de serviços, três produtos autorais, método, contato e atualizações. Cena experimental `favela/` permanece fora da produção.
- **Barbearias:** `barbearias.html` e oferta preservadas (R$ 450 de implantação; R$ 150 por barbeiro/mês; multi-profissional em validação). Domínio .com.br tratado separadamente, demonstração não publicada.
- **Menu responsivo:** até 1099 px, menu móvel; a partir de 1100 px, navegação desktop. Não modificar `menu.js` isoladamente do CSS.

O site é estático e a navegação/rodapé são repetidos em cada HTML. Ao adicionar páginas, sincronize ambas as estruturas, sitemap, canonical, CSP e testes.

## Segurança

Todas as páginas têm CSP por meta tag (sem script ou estilo inline). Ao usar um recurso novo de terceiros ou outra API, inclua o host na CSP de cada página. O GitHub Pages não permite cabeçalhos HTTP próprios.

## Regras da estrutura

- **CSS por responsabilidade.** Tokens e base em `estilo.css`; componentes legados em `glass.css`; hero em `inicio.css`; organização V3 em `v3.css` e ajustes da home em `v3-home.css`. Evite regras globais desnecessárias.
- **Produtos e serviços são distintos.** O cadastro `produtos.js` alimenta a vitrine de aplicativos; BIG Rotas e Barbearias mantêm páginas específicas já existentes. A V3 reúne o acesso sob Projetos ou Serviços, sem criar um item principal por produto.
- **Sem framework e sem build.** É HTML puro: abre no navegador e publica em qualquer lugar, inclusive GitHub Pages de graça.
- **Menu e rodapé são repetidos** em cada HTML. Manter os cinco destinos sincronizados, com links de acessibilidade e rodapé.

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
