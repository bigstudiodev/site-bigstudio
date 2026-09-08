/* =========================================================
   BIG STUDIO — cadastro de produtos
   Para adicionar um produto: copie um bloco abaixo e edite.
   Campos: nome, categoria (app), resumo,
           pontos (3 itens), etiqueta, tom (azul | amarelo | rosa)
   Nada mais precisa ser mexido — os cards são montados sozinhos.
   ========================================================= */

const PRODUTOS = [
  {
    nome: "Meu Financeiro",
    vitrine: "financeiro",
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
    vitrine: "tatame",
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
    vitrine: "biglock",
    categoria: "app",
    etiqueta: "PC e Android · em desenvolvimento",
    resumo: "Suas senhas guardadas offline.",
    pontos: [
      "Abre por PIN ou senha mestre",
      "Os dados ficam no seu aparelho",
      "Backup exportado criptografado"
    ],
    tom: "rosa"
  }
];

/* --------- montagem dos cards (não precisa editar) -------- */
function montarCartao(p, vitrine = false){
  const artigo = document.createElement("article");
  artigo.className = "cartao" + (p.tom && p.tom !== "azul" ? " tom-" + p.tom : "");
  const emVitrine = vitrine && Boolean(p.vitrine);
  const modelo = emVitrine ? document.getElementById("vitrine-" + p.vitrine) : null;
  if (emVitrine) artigo.classList.add("app-cartao", "app-" + p.vitrine);

  const etiqueta = document.createElement("span");
  etiqueta.className = "etiqueta";
  etiqueta.textContent = p.etiqueta;

  const titulo = document.createElement(emVitrine ? "h2" : "h3");
  titulo.textContent = p.nome;

  const resumo = document.createElement("p");
  resumo.className = "resumo";
  resumo.textContent = p.resumo;

  const lista = document.createElement("ul");
  (emVitrine ? (p.pontos || []).slice(0, 2) : (p.pontos || [])).forEach(function(ponto){
    const item = document.createElement("li");
    item.textContent = ponto;
    lista.appendChild(item);
  });

  artigo.append(etiqueta, titulo, resumo);
  if (modelo) artigo.appendChild(modelo.content.cloneNode(true));
  artigo.appendChild(lista);

  if (p.url) {
    const link = document.createElement("a");
    link.className = "cartao-link";
    link.href = p.url;
    link.textContent = (p.chamada || "Conhecer") + " →";
    artigo.appendChild(link);
  } else if (emVitrine) {
    const estado = document.createElement("p");
    estado.className = "app-em-breve";
    estado.textContent = "Em desenvolvimento";
    artigo.appendChild(estado);
  }

  return artigo;
}

document.addEventListener("DOMContentLoaded", function(){
  document.querySelectorAll("[data-lista]").forEach(function(alvo){
    const categoria = alvo.getAttribute("data-lista");
    PRODUTOS
      .filter(function(p){ return p.categoria === categoria; })
      .forEach(function(p){ alvo.appendChild(montarCartao(p, alvo.hasAttribute("data-vitrine"))); });
  });
});
