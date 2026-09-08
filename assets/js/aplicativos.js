/* Os cartões são montados pelo cadastro de produtos antes da observação. */
document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('app-revelado');
      observador.unobserve(entrada.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll('.app-cartao').forEach((cartao) => observador.observe(cartao));
});
