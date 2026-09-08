/* Ciclo de seis segundos: passagem suave de cores e descanso, sem mover a marca. */
(() => {
  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.topo .marca').forEach((marca) => {
    const blocos = [2, 5, 6].map((n) => marca.querySelector(`.selo i:nth-child(${n})`));
    if (blocos.some((bloco) => !bloco || typeof bloco.animate !== 'function')) return;

    let animacoes = [];

    function sincronizar() {
      if (movimentoReduzido.matches) {
        animacoes.forEach((animacao) => animacao.cancel());
        animacoes = [];
        return;
      }
      if (document.hidden) {
        animacoes.forEach((animacao) => animacao.pause());
        return;
      }
      if (animacoes.length) {
        animacoes.forEach((animacao) => animacao.play());
        return;
      }

      const estilo = getComputedStyle(marca);
      const cores = ['--amarelo', '--azulejo', '--tinta'].map((nome) =>
        estilo.getPropertyValue(nome).trim());

      animacoes = blocos.map((bloco, indice) => {
        const original = getComputedStyle(bloco).backgroundColor;
        return bloco.animate([
          { backgroundColor: original, offset: 0, easing: 'ease-in-out' },
          { backgroundColor: cores[indice], offset: 0.0675, easing: 'ease-in-out' },
          { backgroundColor: original, offset: 0.15 },
          { backgroundColor: original, offset: 1 }
        ], {
          duration: 6000,
          delay: indice * 90,
          iterations: Infinity
        });
      });
    }

    document.addEventListener('visibilitychange', sincronizar);
    movimentoReduzido.addEventListener('change', sincronizar);

    requestAnimationFrame(() => requestAnimationFrame(sincronizar));
  });
})();
