const EMAIL = "desenvolver.vee@gmail.com"; // e-mail da BIG STUDIO

// ?assunto=Barbearias (vindo da página de Barbearias) já deixa o assunto escolhido; valor desconhecido é ignorado
const assuntoUrl = new URLSearchParams(window.location.search).get("assunto");
if (assuntoUrl) {
  const campoAssunto = document.getElementById("assunto");
  const opcao = Array.from(campoAssunto.options).find(function(o){ return o.value === assuntoUrl; });
  if (opcao) campoAssunto.value = opcao.value;
}

document.getElementById("enviar").addEventListener("click", function(){
  const nome = document.getElementById("nome").value.trim();
  const assunto = document.getElementById("assunto").value;
  const mensagem = document.getElementById("mensagem").value.trim();

  const corpo = "Nome: " + (nome || "-") + "\n\n" + (mensagem || "-");
  window.location.href = "mailto:" + EMAIL
    + "?subject=" + encodeURIComponent("[Site] " + assunto)
    + "&body=" + encodeURIComponent(corpo);
});
