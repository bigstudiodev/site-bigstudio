/* Pausa fora da tela, com a aba oculta ou por escolha de quem visita. */
(() => {
  const cena = document.querySelector('.fachada-cena');
  if (!cena) return;
  const controle = cena.querySelector('.cena-controle');
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visivel = !('IntersectionObserver' in window);
  let pausada = false;

  function sincronizar() {
    const permitido = !reduzido.matches;
    cena.classList.toggle('cena-pronta', permitido);
    cena.classList.toggle('cena-rodando', permitido && visivel && !document.hidden && !pausada);
    controle.hidden = !permitido;
    controle.textContent = pausada ? 'Retomar cena' : 'Pausar cena';
  }

  controle.addEventListener('click', () => {
    pausada = !pausada;
    sincronizar();
  });
  document.addEventListener('visibilitychange', sincronizar);
  reduzido.addEventListener('change', sincronizar);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entrada]) => {
      visivel = entrada.isIntersecting;
      sincronizar();
    }, { threshold: 0 }).observe(cena);
  }
  sincronizar();
})();
