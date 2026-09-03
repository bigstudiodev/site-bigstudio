/* =========================================================
   BIG STUDIO — configuração pública do site
   Etapa 2D: integração com o feed público de Atualizações do
   Control Center.

   Contém SOMENTE valores públicos (URL) — nunca uma credencial,
   token ou string de conexão de banco. É seguro este arquivo
   ficar visível no navegador e publicado no GitHub Pages.

   CONTROL_CENTER_PUBLIC_API_BASE_URL
   -----------------------------------
   URL base (sem barra no final) onde a API pública e read-only
   do Control Center (Etapa 2C, "/api/public/...") está publicada.
   Exemplo, quando existir: "https://controlcenter.bigstudio.dev".

   Enquanto o Control Center não estiver implantado em produção,
   este valor permanece `null` DE PROPÓSITO. Com `null`,
   assets/js/atualizacoes.js NUNCA tenta nenhuma chamada de rede —
   a área de "Atualizações" simplesmente não aparece, e o resto do
   site continua funcionando normalmente (ver Etapa 2D, seção 9).

   Quando a URL de produção existir, troque a linha abaixo por,
   por exemplo:
     const CONTROL_CENTER_PUBLIC_API_BASE_URL = "https://controlcenter.bigstudio.dev";
   Nenhum outro arquivo precisa mudar. */
const CONTROL_CENTER_PUBLIC_API_BASE_URL = "https://control-center-production-0b5e.up.railway.app";
