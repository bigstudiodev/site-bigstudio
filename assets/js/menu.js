/* Navegação móvel por disclosure; os links permanecem disponíveis sem JS. */
(() => {
  const topo = document.querySelector('.topo');
  const botao = topo?.querySelector('.menu-toggle');
  const menu = topo?.querySelector('.menu');
  if (!botao || !menu) return;

  const mobile = window.matchMedia('(max-width: 819px)');
  const abrir = botao.querySelector('[data-menu-abrir]');
  const fechar = botao.querySelector('[data-menu-fechar]');

  function definirAberto(aberto, devolverFoco = false) {
    botao.setAttribute('aria-expanded', String(aberto));
    botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    abrir.hidden = aberto;
    fechar.hidden = !aberto;
    menu.hidden = mobile.matches && !aberto;
    if (devolverFoco || (!aberto && mobile.matches && menu.contains(document.activeElement))) botao.focus();
  }

  function ajustarTela() {
    const focoNoMenu = menu.contains(document.activeElement);
    const focoNoBotao = document.activeElement === botao;
    botao.hidden = !mobile.matches;
    definirAberto(false, mobile.matches && focoNoMenu);
    if (!mobile.matches && focoNoBotao) topo.querySelector('.marca').focus();
  }

  botao.addEventListener('click', () => definirAberto(botao.getAttribute('aria-expanded') !== 'true'));
  topo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && mobile.matches && botao.getAttribute('aria-expanded') === 'true') {
      evento.preventDefault();
      definirAberto(false, true);
    }
  });
  menu.addEventListener('click', (evento) => {
    if (mobile.matches && evento.target.closest('a')) definirAberto(false);
  });
  document.addEventListener('pointerdown', (evento) => {
    if (mobile.matches && !topo.contains(evento.target)) definirAberto(false);
  });
  document.addEventListener('focusin', (evento) => {
    if (mobile.matches && !topo.contains(evento.target)) definirAberto(false);
  });
  mobile.addEventListener('change', ajustarTela);
  topo.classList.add('menu-pronto');
  ajustarTela();
})();
