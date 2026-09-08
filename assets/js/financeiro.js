/* Uma entrada suave por elemento; conteúdo visível mesmo sem JavaScript. */
(() => {
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduzido.matches || !('IntersectionObserver' in window)) return;
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('fin-revelado');
      observador.unobserve(entrada.target);
    });
  }, { threshold: .15 });
  document.querySelectorAll('[data-fin-entrada]').forEach((elemento) => observador.observe(elemento));
})();
