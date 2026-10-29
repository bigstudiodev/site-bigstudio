const EMAIL = "desenvolver.vee@gmail.com"; // e-mail da BIG STUDIO

document.getElementById("enviar").addEventListener("click", function(){
  const nome = document.getElementById("nome").value.trim();
  const assunto = document.getElementById("assunto").value;
  const mensagem = document.getElementById("mensagem").value.trim();

  const corpo = "Nome: " + (nome || "-") + "\n\n" + (mensagem || "-");
  window.location.href = "mailto:" + EMAIL
    + "?subject=" + encodeURIComponent("[Site] " + assunto)
    + "&body=" + encodeURIComponent(corpo);
});
