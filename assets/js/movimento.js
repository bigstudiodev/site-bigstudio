/* Camada de movimento discreta: entrada suave das seções e luz nos cards.
   Sem bibliotecas. Respeita prefers-reduced-motion. Sem JS, tudo fica visível. */
(() => {
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const raiz = document.documentElement;

  // 1. entrada suave: elementos [data-revelar] aparecem ao entrar na tela
  const alvos = document.querySelectorAll('[data-revelar]');
  if (alvos.length) {
    if (reduzido.matches || !('IntersectionObserver' in window)) {
      alvos.forEach((el) => el.classList.add('visivel'));
    } else {
      raiz.classList.add('js-movimento');
      const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add('visivel');
          observador.unobserve(entrada.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      alvos.forEach((el) => observador.observe(el));
    }
  }

  // 2. iluminação dinâmica: só em dispositivos com ponteiro fino
  if (reduzido.matches || !window.matchMedia('(hover: hover)').matches) return;
  let quadro = 0;
  document.addEventListener('pointermove', (evento) => {
    const card = evento.target.closest?.('.glass, .cartao, .frentes .caminho');
    if (!card || quadro) return;
    quadro = requestAnimationFrame(() => {
      const caixa = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${evento.clientX - caixa.left}px`);
      card.style.setProperty('--my', `${evento.clientY - caixa.top}px`);
      quadro = 0;
    });
  }, { passive: true });
})();
