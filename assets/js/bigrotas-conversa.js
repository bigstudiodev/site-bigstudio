/* ---------------------------------------------------------
   Links das conversas do BigRotas.
   Número da BIG STUDIO. Formato: 55 + DDD + número, sem símbolos.
   A mensagem de "assinar" precisa ser exatamente essa palavra —
   é o comando que o WhatsApp do BigRotas reconhece para iniciar
   o fluxo de pagamento (preço e chave Pix). Não adicionar texto
   antes ou depois dela.
   --------------------------------------------------------- */
const WHATSAPP = "https://wa.me/5511960405352?text=";
const MENSAGENS = {
  teste: "Oi! Quero testar grátis o BigRotas por 5 dias.",
  assinar: "assinar"
};

document.querySelectorAll("[data-conversa]").forEach((link) => {
  const mensagem = MENSAGENS[link.dataset.conversa];
  link.setAttribute("href", WHATSAPP + encodeURIComponent(mensagem));
});
