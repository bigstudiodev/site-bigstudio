/* =========================================================
   BIG STUDIO — cadastro de produtos
   Para adicionar um produto: copie um bloco abaixo e edite.
   Campos: nome, categoria (app | fivem), resumo,
           pontos (3 itens), etiqueta, tom (azul | amarelo | rosa)
   Nada mais precisa ser mexido — os cards são montados sozinhos.
   ========================================================= */

const PRODUTOS = [
  {
    nome: "Meu Financeiro",
    categoria: "app",
    etiqueta: "Android · em desenvolvimento",
    resumo: "As contas da casa organizadas no celular.",
    pontos: [
      "Lançamentos à vista ou parcelados",
      "Aviso quando a conta vence ou atrasa",
      "Categorias criadas por você"
    ],
    tom: "azul",
    url: "meu-financeiro.html",
    chamada: "Conhecer o app"
  },
  {
    nome: "Meu Tatame",
    categoria: "app",
    etiqueta: "Android · em desenvolvimento",
    resumo: "Agenda e chamada para academias de luta.",
    pontos: [
      "Os treinos do dia, por unidade",
      "Chamada que funciona sem internet",
      "Turmas, professores e alunos no lugar"
    ],
    tom: "amarelo"
  },
  {
    nome: "BigLock",
    categoria: "app",
    etiqueta: "PC e Android · em desenvolvimento",
    resumo: "Suas senhas guardadas offline.",
    pontos: [
      "Abre por PIN ou senha mestre",
      "Os dados ficam no seu aparelho",
      "Backup exportado criptografado"
    ],
    tom: "rosa"
  },

  /* --- FiveM: exemplos para você trocar pelos reais --- */
  {
    nome: "Base com tema próprio",
    categoria: "fivem",
    etiqueta: "Pronta · trocar pelo nome real",
    resumo: "Servidor montado com identidade visual exclusiva, não é base revendida.",
    pontos: [
      "Tema, HUD e telas desenhados do zero",
      "Scripts integrados entre si",
      "Entregue instalada e testada"
    ],
    tom: "azul"
  },
  {
    nome: "Addons",
    categoria: "fivem",
    etiqueta: "Pronto · trocar pelo nome real",
    resumo: "Peças que entram no servidor que já está rodando.",
    pontos: [
      "Instala sem quebrar o que existe",
      "Ajustado ao framework do seu servidor",
      "Documentação de instalação junto"
    ],
    tom: "amarelo"
  },
  {
    nome: "Scripts sob medida",
    categoria: "fivem",
    etiqueta: "Sob encomenda",
    resumo: "Sistema feito do zero a partir da regra que você define.",
    pontos: [
      "Lógica fechada antes de virar código",
      "Feito para não pesar no servidor",
      "Entrega com documentação"
    ],
    tom: "rosa"
  }
];

/* --------- montagem dos cards (não precisa editar) -------- */
function montarCartao(p){
  const artigo = document.createElement("article");
  artigo.className = "cartao" + (p.tom && p.tom !== "azul" ? " tom-" + p.tom : "");

  const etiqueta = document.createElement("span");
  etiqueta.className = "etiqueta";
  etiqueta.textContent = p.etiqueta;

  const titulo = document.createElement("h3");
  titulo.textContent = p.nome;

  const resumo = document.createElement("p");
  resumo.className = "resumo";
  resumo.textContent = p.resumo;

  const lista = document.createElement("ul");
  (p.pontos || []).forEach(function(ponto){
    const item = document.createElement("li");
    item.textContent = ponto;
    lista.appendChild(item);
  });

  artigo.append(etiqueta, titulo, resumo, lista);

  if (p.url) {
    const link = document.createElement("a");
    link.className = "cartao-link";
    link.href = p.url;
    link.textContent = (p.chamada || "Conhecer") + " →";
    artigo.appendChild(link);
  }

  return artigo;
}

document.addEventListener("DOMContentLoaded", function(){
  document.querySelectorAll("[data-lista]").forEach(function(alvo){
    const categoria = alvo.getAttribute("data-lista");
    PRODUTOS
      .filter(function(p){ return p.categoria === categoria; })
      .forEach(function(p){ alvo.appendChild(montarCartao(p)); });
  });
});
