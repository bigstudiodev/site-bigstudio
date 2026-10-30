/* Favela animada do hero: pausa fora da tela, com a aba oculta ou por escolha de quem visita.
   Com movimento reduzido, a cena fica estática e o botão some. */
(() => {
  const cena = document.querySelector('[data-favela]');
  if (!cena) return;
  const controle = cena.querySelector('[data-favela-controle]');
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visivel = !('IntersectionObserver' in window);
  let pausada = false;

  function sincronizar() {
    const permitido = !reduzido.matches;
    cena.classList.toggle('fv-rodando', permitido && visivel && !document.hidden && !pausada);
    controle.hidden = !permitido;
    controle.textContent = pausada ? 'Retomar cena' : 'Pausar cena';
    controle.setAttribute('aria-pressed', String(pausada));
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
