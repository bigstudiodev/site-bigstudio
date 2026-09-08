/* Ativa cada etapa do fluxo e revela os blocos uma vez ao entrarem na tela. */
(() => {
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const etapas = [...document.querySelectorAll('[data-rota-etapa]')];
  if (!reduzido.matches && etapas.length) {
    let atual = 0;
    etapas[atual].classList.add('ativa');
    window.setInterval(() => {
      etapas[atual].classList.remove('ativa');
      atual = (atual + 1) % etapas.length;
      etapas[atual].classList.add('ativa');
    }, 2200);
  }
  if (reduzido.matches || !('IntersectionObserver' in window)) return;
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('rola-revelado');
      observador.unobserve(entrada.target);
    });
  }, { threshold: .14 });
  document.querySelectorAll('[data-rota-entrada]').forEach((elemento) => observador.observe(elemento));
})();
