/* =========================================================
   BIG STUDIO — cliente das Atualizações públicas (Etapa 2D)

   Consome o feed público e read-only do Control Center
   (Etapa 2C: GET /api/public/atualizacoes e
   GET /api/public/projetos/<slug>/atualizacoes). A regra de quem
   pode aparecer (status=publicada e visibilidade=publica) já é
   garantida INTEIRAMENTE pela API — este arquivo nunca tenta
   reproduzi-la nem filtra por status/visibilidade.

   Uso declarativo, igual ao padrão de assets/js/produtos.js:
   basta um contêiner com o atributo `data-atualizacoes` — nada de
   script por página.

     <div class="grade" data-atualizacoes
          data-atualizacoes-projeto="big-rotas"   (opcional)
          data-atualizacoes-destaque="true"       (opcional)
          data-atualizacoes-limite="3"            (opcional, padrão 3)
          data-atualizacoes-mostrar-projeto="false" (opcional, padrão "true")
          data-atualizacoes-ocultar-vazio="true"  (opcional, padrão "false")
     ></div>

   Sem `CONTROL_CENTER_PUBLIC_API_BASE_URL` configurada
   (assets/js/config.js), NENHUMA chamada de rede é feita — o
   contêiner (ou a <section> em volta, se existir) simplesmente
   fica oculto e o restante da página funciona normalmente.
   Qualquer falha (timeout, HTTP não-200, JSON inválido,
   indisponibilidade) tem o MESMO resultado: nunca um erro cru na
   tela, nunca stack trace, nunca URL interna. */

(function () {
  "use strict";

  var TEMPO_LIMITE_MS = 6000;
  var LIMITE_PADRAO = 3;

  function baseConfigurada() {
    return typeof CONTROL_CENTER_PUBLIC_API_BASE_URL === "string"
      && CONTROL_CENTER_PUBLIC_API_BASE_URL.trim() !== "";
  }

  function montarUrl(caminho, parametros) {
    // Remove uma eventual barra final da base para nunca gerar "//" no
    // caminho - a base vem de configuração (config.js), nunca de
    // entrada do usuário.
    var base = CONTROL_CENTER_PUBLIC_API_BASE_URL.replace(/\/+$/, "");
    var url = new URL(base + caminho);
    Object.keys(parametros || {}).forEach(function (chave) {
      var valor = parametros[chave];
      if (valor !== null && valor !== undefined && valor !== "") {
        url.searchParams.set(chave, String(valor));
      }
    });
    return url.toString();
  }

  function buscarComTempoLimite(url) {
    var controlador = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var temporizador = controlador
      ? setTimeout(function () { controlador.abort(); }, TEMPO_LIMITE_MS)
      : null;

    return fetch(url, { method: "GET", signal: controlador ? controlador.signal : undefined })
      .then(function (resposta) {
        if (temporizador) { clearTimeout(temporizador); }
        if (!resposta.ok) {
          throw new Error("http_" + resposta.status);
        }
        return resposta.json();
      })
      .catch(function (erro) {
        if (temporizador) { clearTimeout(temporizador); }
        throw erro;
      });
  }

  // Validação mínima do formato - nunca confia cegamente no corpo da
  // resposta antes de tocar no DOM.
  function respostaValida(dados) {
    return !!dados && Array.isArray(dados.items);
  }

  // "YYYY-MM-DD" -> "DD/MM/AAAA", sem passar por Date/fuso horário
  // (evita o classico bug de "um dia a menos" perto da meia-noite).
  function formatarDataReferencia(valor) {
    if (typeof valor !== "string") { return null; }
    var partes = valor.split("-");
    if (partes.length !== 3) { return null; }
    var ano = partes[0], mes = partes[1], dia = partes[2];
    if (!/^\d{4}$/.test(ano) || !/^\d{2}$/.test(mes) || !/^\d{2}$/.test(dia)) { return null; }
    return dia + "/" + mes + "/" + ano;
  }

  // Só http/https podem virar link de verdade - nunca javascript:,
  // data:, vbscript: etc. Conteúdo da API é dado NÃO CONFIÁVEL.
  function linkSeguro(valor) {
    if (typeof valor !== "string" || !valor) { return null; }
    try {
      var url = new URL(valor, window.location.href);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.href;
      }
    } catch (erro) {
      // URL malformada - tratado como "sem link", nunca um erro na tela.
    }
    return null;
  }

  function limparConteudo(elemento) {
    while (elemento.firstChild) { elemento.removeChild(elemento.firstChild); }
  }

  function mostrarEstado(alvo, texto) {
    limparConteudo(alvo);
    var paragrafo = document.createElement("p");
    paragrafo.className = "atualizacoes-estado";
    paragrafo.textContent = texto;
    alvo.appendChild(paragrafo);
  }

  function ocultarSecao(alvo) {
    var secao = alvo.closest ? alvo.closest("section") : null;
    (secao || alvo).hidden = true;
  }

  // Elementos criados com createElement/textContent - NUNCA innerHTML
  // com texto vindo da API (mesmo padrão já usado em produtos.js).
  function montarCartaoAtualizacao(item, mostrarProjeto) {
    var artigo = document.createElement("article");
    artigo.className = "cartao";

    if (item.destaque === true) {
      var etiqueta = document.createElement("span");
      etiqueta.className = "etiqueta";
      etiqueta.textContent = "Destaque";
      artigo.appendChild(etiqueta);
    }

    var titulo = document.createElement("h3");
    titulo.textContent = String(item.titulo || "");
    artigo.appendChild(titulo);

    var meta = document.createElement("p");
    meta.className = "atualizacao-meta";
    var partesMeta = [];
    if (mostrarProjeto && item.projeto && item.projeto.nome) {
      partesMeta.push(String(item.projeto.nome));
    }
    var dataFormatada = formatarDataReferencia(item.data_referencia);
    if (dataFormatada) { partesMeta.push(dataFormatada); }
    meta.textContent = partesMeta.join(" · ");
    if (partesMeta.length) { artigo.appendChild(meta); }

    if (item.resumo) {
      var resumo = document.createElement("p");
      resumo.className = "resumo";
      resumo.textContent = String(item.resumo);
      artigo.appendChild(resumo);
    }

    var href = linkSeguro(item.link);
    if (href) {
      var link = document.createElement("a");
      link.className = "cartao-link";
      link.href = href;
      link.textContent = "Ver mais →";
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      artigo.appendChild(link);
    }

    return artigo;
  }

  function renderizarItens(alvo, itens, opcoes) {
    limparConteudo(alvo);
    if (!itens.length) {
      if (opcoes.ocultarVazio) {
        ocultarSecao(alvo);
      } else {
        mostrarEstado(alvo, "Nenhuma atualização por aqui ainda.");
      }
      return;
    }
    itens.forEach(function (item) {
      if (item && typeof item === "object" && typeof item.titulo === "string") {
        alvo.appendChild(montarCartaoAtualizacao(item, opcoes.mostrarProjeto));
      }
    });
  }

  function montarSecao(alvo) {
    if (!baseConfigurada()) {
      // Sem URL configurada: nenhuma tentativa de rede, seção some.
      ocultarSecao(alvo);
      return;
    }

    var projeto = alvo.getAttribute("data-atualizacoes-projeto") || null;
    var destaqueAtributo = alvo.getAttribute("data-atualizacoes-destaque");
    var limiteAtributo = parseInt(alvo.getAttribute("data-atualizacoes-limite"), 10);
    var limite = (limiteAtributo > 0 && limiteAtributo <= 50) ? limiteAtributo : LIMITE_PADRAO;
    var mostrarProjeto = alvo.getAttribute("data-atualizacoes-mostrar-projeto") !== "false";
    var ocultarVazio = alvo.getAttribute("data-atualizacoes-ocultar-vazio") === "true";

    var caminho = projeto
      ? "/api/public/projetos/" + encodeURIComponent(projeto) + "/atualizacoes"
      : "/api/public/atualizacoes";
    var parametros = { limit: limite };
    if (!projeto && destaqueAtributo === "true") { parametros.destaque = "true"; }
    if (!projeto && destaqueAtributo === "false") { parametros.destaque = "false"; }

    mostrarEstado(alvo, "Carregando atualizações…");

    var url;
    try {
      url = montarUrl(caminho, parametros);
    } catch (erro) {
      ocultarSecao(alvo);
      return;
    }

    buscarComTempoLimite(url)
      .then(function (dados) {
        if (!respostaValida(dados)) {
          throw new Error("formato_invalido");
        }
        renderizarItens(alvo, dados.items, { mostrarProjeto: mostrarProjeto, ocultarVazio: ocultarVazio });
      })
      .catch(function () {
        // Timeout, HTTP não-200, JSON inválido, formato inesperado ou
        // qualquer outra falha de rede: SEMPRE o mesmo resultado
        // discreto, nunca o erro técnico cru na tela.
        if (ocultarVazio) {
          ocultarSecao(alvo);
        } else {
          mostrarEstado(alvo, "Atualizações indisponíveis no momento.");
        }
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-atualizacoes]").forEach(montarSecao);
  });
})();
