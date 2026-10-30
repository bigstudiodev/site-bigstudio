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
- A composição segue a planta da Base 3, em camadas de distância: céu e lua; cidade e morro do
  Cristo com névoa; casario denso subindo o morro (gerado, pequeno e azulado); árvores; casas do
  meio (com face lateral, laje, telha, puxadinho, caixa d'água, vergalhão, parabólica, toldo, ar-
  condicionado, pichação); frente (terraço, sala dos computadores, escadaria, mural, bandeira).
- Quanto mais longe, mais escura e azulada a cor (`longe()`); casas e moradores têm contorno.
- Moradores são figuras articuladas (`pessoa()`), do tamanho da distância: 20 px no alto do
  morro, 44 a 54 px no primeiro plano (terraço e escadaria).
- Camadas fixas, árvores, nuvens e fiação são pré-desenhadas; cada quadro custa ~8 ms (~46 ms com
  a CPU 4x mais lenta), a 14 quadros por segundo.
- Tudo é determinístico (semente fixa): a cena é sempre a mesma.

## Onde mexer

- `montar()`: `fundo` (casario gerado), `meio` e `frente` (casas posicionadas como na Base 3),
  `janelas` marcantes, `portas`, `arvores`, `postes` e `fios`, moradores `M` e `andando`.
- `desenharTerraco`, `desenharEscadaria`, `desenharComputador`, `desenharVaral`, `desenharPipa`,
  `desenharMoto`: os acontecimentos da cena.
- `C` e `MUROS`: paleta. A noite é aplicada por `noite()`.

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
