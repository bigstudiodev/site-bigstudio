# Favela em pixel art (subprojeto)

Cena principal da página inicial, reconstruída inteira em código, num único estilo de pixel art.
Nenhuma imagem é usada: céu, luas, morro com o Cristo, prédios da cidade, casas (muros, reboco,
tijolo aparente, lajes, grades, caixas d'água, escadas externas, obra com vergalhão), postes e
fiação, árvores, varal, mural e moradores são desenhados pelo `favela.js`.

Enquanto a cena não é aprovada, ela vive só aqui. A página inicial do site não é alterada.

## Arquivos

```
favela/
├─ index.html   bancada de desenvolvimento (abra num servidor local)
├─ favela.js    motor e composição da cena
└─ favela.css   estilo da bancada e do componente
```

## Como funciona

- Resolução lógica 720x400, ampliada com `image-rendering: pixelated` (pixels nítidos em qualquer tela).
- Camadas fixas (céu, morro, cidade, casas, postes) são desenhadas uma vez; a cada quadro entram
  estrelas, estrela cadente, avião, nuvens, fios balançando, pássaros, árvores, a luz e a vida de
  cada janela (gente passando, plantas, estante, TV), portas, sala dos computadores, varal com
  moradora, pipa, crianças com bola, morador sentado na laje, gato, cachorro, moto e moradores.
- 14 quadros por segundo. Cada quadro custa ~3 ms (~7 ms com a CPU 4x mais lenta): árvores e nuvens
  são pré-desenhadas; céu e reboco são escritos direto em ImageData.
- Tudo é determinístico (semente fixa): a cena é sempre a mesma.

## Onde mexer

- `CASAS`: posição, tamanho, cor do muro e elementos de cada casa (`janelas`, `caixa`, `grade`,
  `escada`, `obra`, `selo`, `mural`, `computador`, `porta`, `varal`, `pipa`, `caminho`...).
- `MUROS_DIA` e `COR`: paleta. A noite é aplicada por `noite()`.
- `moradores` em `montar()`: quem anda, por qual laje ou rua, em que velocidade.

## Uso no site

```html
<div class="favela" data-big-favela>
  <canvas role="img" aria-label="..."></canvas>
  <button type="button" data-favela-controle hidden>Pausar cena</button>
</div>
<script src="favela/favela.js" defer></script>
```

A cena pausa com o botão, fora da tela e com a aba oculta. Com `prefers-reduced-motion` ela fica
parada num quadro completo e o botão some.
