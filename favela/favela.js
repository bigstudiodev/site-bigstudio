/* =========================================================
   BIG STUDIO — Favela em pixel art (subprojeto)
   Toda a cena é desenhada em código, num único estilo: nada
   vem de imagem. Resolução lógica 360x200, ampliada em pixels
   nítidos. Camadas:
     céu (estrelas, luas, nuvens) · morro e cidade · casas
     (muros, lajes, grades, caixas d'água, portas, janelas) ·
     fiação e postes · árvores · luz das janelas · moradores.
   Uso: BigFavela.criar(canvas, { estatica: false })
   ========================================================= */
(() => {
  const W = 360;
  const H = 200;

  // ---------------------------------------------------------- aleatório determinístico
  function semente(s) {
    return () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------- paleta noturna
  const COR = {
    ceuTopo: [6, 10, 26], ceuMeio: [12, 22, 52], ceuBaixo: [24, 38, 78],
    estrela: '#dfe7ff', lua: '#e6e8f0', luaSombra: '#b9bfd0',
    morro: '#0a1122', morroBorda: '#14203a', cristo: '#0d1426',
    predio: '#0c1630', predioClaro: '#111e3d',
    janelaCidade: ['#f2c46d', '#ffd88a', '#8fb6ff', '#e9a24f'],
    nuvem: ['#1b2a50', '#24365f', '#2f4573'],
    fio: '#07080d', poste: '#16171d', posteLuz: '#ffcf80',
    folha: ['#14281a', '#1c3622', '#25452a', '#335c34'], tronco: '#24180f',
    laje: '#5e5a55', lajeSombra: '#2a2725', grade: '#1c1b1f',
    caixa: '#2a4a96', caixaTopo: '#4a6cc4', caixaSombra: '#1c3166',
    porta: '#2e1d14', portaLuz: '#f0a24a',
    vidroApagado: '#1a2133', moldura: '#14110e',
    luz: ['#ffd98c', '#ffc46a', '#f5a64a'], tela: '#8fc0ff',
    pele: ['#5a3624', '#6e4630', '#8a5a3c', '#3e2518'],
    cabelo: '#120c09',
    mural: '#e8735c', muralSombra: '#a84c3c',
  };
  // muros: [base, claro, escuro] — cores de dia; a noite é aplicada por noite()
  const MUROS_DIA = {
    terracota: ['#6b3a2a', '#7d4632', '#4e2a1f'],
    ocre: ['#76522e', '#8a6238', '#573c21'],
    rosa: ['#6a4250', '#7c4e5e', '#4f313c'],
    cinza: ['#46464e', '#55555e', '#33333a'],
    azul: ['#36425c', '#43516e', '#283146'],
    tijolo: ['#743828', '#86432f', '#56291d'],
    verde: ['#3c5446', '#486553', '#2b3d33'],
  };
  function noite(hex, k = 0.62) {
    const v = parseInt(hex.slice(1), 16);
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    const az = [14, 20, 40];
    return `rgb(${Math.round(r * k + az[0] * (1 - k))},${Math.round(g * k + az[1] * (1 - k))},${Math.round(b * k + az[2] * (1 - k))})`;
  }
  const MUROS = Object.fromEntries(Object.entries(MUROS_DIA).map(([n, cs]) => [n, cs.map((c) => noite(c))]));
  const TIJOLO = MUROS_DIA.tijolo.map((c) => noite(c, 0.7));

  // ---------------------------------------------------------- fonte de pixel 3x5 (mural)
  const FONTE = {
    A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'],
    C: ['011', '100', '100', '100', '011'], E: ['111', '100', '110', '100', '111'],
    G: ['011', '100', '101', '101', '011'], I: ['111', '010', '010', '010', '111'],
    L: ['100', '100', '100', '100', '111'], M: ['101', '111', '111', '101', '101'],
    N: ['101', '111', '111', '111', '101'], O: ['010', '101', '101', '101', '010'],
    Q: ['010', '101', '101', '011', '001'], S: ['011', '100', '010', '001', '110'],
    T: ['111', '010', '010', '010', '010'], U: ['101', '101', '101', '101', '111'],
  };

  // ---------------------------------------------------------- composição
  // Casas: [x, topo, largura, altura, muro, opções]. Fileiras sobem da esquerda-baixo
  // para o centro-direita, como na arte aprovada; as de trás são desenhadas primeiro.
  const CASAS = [
    // fileira de trás (alto do morro)
    [150, 52, 30, 32, 'cinza', { caixa: 1, obra: 1 }],
    [178, 40, 34, 44, 'ocre', { janelas: 'luz', caixa: 1, grade: 1 }],
    [210, 30, 40, 54, 'terracota', { janelas: 'luz', varal: 1 }],
    [248, 46, 30, 38, 'rosa', { caixa: 1, antena: 1 }],
    [276, 60, 26, 30, 'azul', { obra: 1 }],
    // fileira do meio-alto
    [118, 82, 34, 34, 'tijolo', { caixa: 1, escada: 1 }],
    [150, 84, 44, 40, 'cinza', { selo: 1 }],
    [192, 80, 36, 44, 'ocre', { janelas: 'luz', grade: 1, pipa: 1 }],
    [226, 76, 40, 48, 'terracota', { janelas: 'luz', caixa: 1, grade: 1, caminho: 1 }],
    [264, 84, 34, 40, 'azul', { janelas: 'tv' }],
    [296, 92, 64, 18, 'rosa', { grade: 1, terraco: 1 }],
    // fileira do meio
    [60, 136, 58, 36, 'ocre', { computador: 1 }],
    [96, 112, 30, 26, 'rosa', { grade: 1 }],
    [116, 118, 40, 30, 'terracota', { janelas: 'luz', grade: 1 }],
    [154, 122, 36, 28, 'tijolo', { escada: 1 }],
    [188, 124, 42, 30, 'cinza', { janelas: 'luz', caixa: 1 }],
    [228, 124, 30, 26, 'verde', { janelas: 'luz' }],
    [296, 110, 64, 32, 'terracota', { janelas: 'luz', porta: 1 }],
    // fileira da frente
    [30, 172, 48, 30, 'tijolo', { janelas: 'luz' }],
    [76, 172, 44, 30, 'cinza', { porta: 1, bandeira: 1 }],
    [118, 150, 46, 52, 'terracota', { janelas: 'luz', porta: 1, caminho: 1 }],
    [162, 154, 44, 48, 'ocre', { janelas: 'luz' }],
    [204, 150, 52, 52, 'rosa', { janelas: 'luz', porta: 1 }],
    [254, 142, 106, 60, 'azul', { mural: 1 }],
  ];

  // ---------------------------------------------------------- montagem dos dados
  function montar() {
    const r = semente(20261030);
    const janelas = [];
    const portas = [];
    const extras = [];
    const caminhos = [];
    CASAS.forEach(([x, y, w, h, muro, o], i) => {
      const casa = { x, y, w, h, muro, o, i, ruido: [] };
      // textura do reboco: manchas e tijolo aparente
      for (let k = 0; k < (w * h) / 22; k++) {
        casa.ruido.push([x + 1 + Math.floor(r() * (w - 2)), y + 3 + Math.floor(r() * (h - 4)), r() < 0.5 ? 1 : 2]);
      }
      if (!o.mural && !o.computador && !o.terraco) {
        const andares = Math.max(1, Math.round((h - 6) / 15));
        for (let fy = 0; fy < andares; fy++) {
          const qtd = 1 + Math.floor(r() * (w > 36 ? 3 : 2));
          const usados = [];
          for (let q = 0; q < qtd; q++) {
            const tam = [[4, 5], [5, 6], [6, 7], [3, 4], [7, 5]][Math.floor(r() * 5)];
            const jx = x + 3 + Math.floor(r() * Math.max(1, w - tam[0] - 6));
            const jy = y + 5 + fy * 15 + Math.floor(r() * 3);
            if (jy + tam[1] > y + h - 3 || usados.some((u) => Math.abs(u - jx) < tam[0] + 3)) continue;
            usados.push(jx);
            const acesa = o.janelas === 'luz' ? r() < 0.7 : r() < 0.4;
            const tv = o.janelas === 'tv' && q === 0 && fy === 0;
            janelas.push({
              x: jx, y: jy, w: tam[0], h: tam[1], acesa, tv,
              modo: tv ? 'tv' : (r() < 0.5 ? 'fixa' : r() < 0.6 ? 'respira' : 'ciclo'),
              periodo: 9 + r() * 30, fase: r() * 40, cor: Math.floor(r() * 3),
              cortina: r() < 0.3, grade: r() < 0.35,
            });
          }
        }
        // reboco caído com tijolo aparente
        casa.buracos = [];
        for (let k = 0; k < 1 + Math.floor(r() * 2); k++) {
          casa.buracos.push([x + 2 + Math.floor(r() * (w - 12)), y + 5 + Math.floor(r() * (h - 12)), 6 + Math.floor(r() * 6), 4 + Math.floor(r() * 4)]);
        }
      }
      if (o.porta) portas.push({ x: x + w - 10, y: y + h - 10, acesa: r() < 0.6 });
      if (o.caminho) caminhos.push({ x0: x + 3, x1: x + w - 8, y: y, casa: i });
      extras.push(casa);
    });
    // terraço da direita: chão livre para moradores e o cachorro
    caminhos.push({ x0: 300, x1: 344, y: 110, terraco: true });
    // rua de baixo
    caminhos.push({ x0: 8, x1: 250, y: 199, rua: true });

    const estrelas = [];
    for (let k = 0; k < 70; k++) {
      const sx = Math.floor(r() * W);
      const sy = Math.floor(r() * 95);
      if (Math.hypot(sx - 98, sy - 62) < 18) continue;
      estrelas.push({ x: sx, y: sy, fase: r() * 6, brilho: r() });
    }
    const cidade = [];
    let cx = 0;
    while (cx < 140) {
      const w = 8 + Math.floor(r() * 12);
      const h = 34 + Math.floor(r() * 70);
      const jan = [];
      for (let jy = H - h + 3; jy < H - 4; jy += 3) {
        for (let jx = cx + 1; jx < cx + w - 1; jx += 2) {
          if (r() < 0.32) jan.push([jx, jy, Math.floor(r() * 4)]);
        }
      }
      cidade.push({ x: cx, w, h, jan });
      cx += w + Math.floor(r() * 3);
    }
    const arvores = [
      { x: 108, y: 96, r: 13 }, { x: 140, y: 66, r: 15 }, { x: 236, y: 22, r: 14 },
      { x: 290, y: 52, r: 12 }, { x: 46, y: 160, r: 12 }, { x: 196, y: 186, r: 11 },
      { x: 268, y: 26, r: 10 }, { x: 170, y: 40, r: 10 }, { x: 88, y: 128, r: 9 },
      { x: 250, y: 118, r: 8 }, { x: 128, y: 44, r: 11 }, { x: 205, y: 70, r: 7 },
    ].map((a) => {
      const px = [];
      for (let dy = -a.r; dy <= a.r; dy++) {
        for (let dx = -a.r - 3; dx <= a.r + 3; dx++) {
          const d = Math.hypot(dx * 0.85, dy) + r() * 3.2;
          if (d < a.r) px.push([dx, dy, d < a.r * 0.45 ? 3 : d < a.r * 0.7 ? 2 : d < a.r * 0.9 ? 1 : 0, dy < -a.r * 0.2]);
        }
      }
      return { ...a, px };
    });
    const postes = [[92, 108], [182, 70], [262, 74], [330, 88], [26, 150]];
    const nuvens = [
      { y: 18, w: 46, vel: 1.2, fase: 0 }, { y: 34, w: 30, vel: 0.8, fase: 140 },
      { y: 8, w: 36, vel: 1.0, fase: 260 },
    ].map((n) => {
      const px = [];
      for (let dy = -6; dy <= 4; dy++) {
        for (let dx = -n.w / 2; dx <= n.w / 2; dx++) {
          const f = Math.abs(dx) / (n.w / 2) + (dy < 0 ? -dy / 7 : dy / 4) + r() * 0.35;
          if (f < 1) px.push([dx, dy, f < 0.45 ? 2 : f < 0.75 ? 1 : 0]);
        }
      }
      return { ...n, px };
    });
    const moradores = [
      { caminho: caminhos.find((c) => c.terraco), cor: '#d8d4ca', calca: '#28324a', pele: 1, vel: 7, fase: 0 },
      { caminho: caminhos.find((c) => c.rua), cor: '#d29a3a', calca: '#3c2a40', pele: 2, vel: 9, fase: 30, saia: true },
      { caminho: caminhos.find((c) => c.rua), cor: '#3f6aa8', calca: '#1f2430', pele: 0, vel: 6, fase: 150 },
      { caminho: caminhos.find((c) => c.casa === 8), cor: '#b8432f', calca: '#2c3a4c', pele: 3, vel: 5, fase: 70, crianca: true },
      { caminho: caminhos.find((c) => c.casa === 20), cor: '#7a8f6a', calca: '#2b2b2b', pele: 1, vel: 6, fase: 90 },
    ];
    return { janelas, portas, extras, caminhos, estrelas, cidade, arvores, postes, nuvens, moradores };
  }

  // ---------------------------------------------------------- utilidades de desenho
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  function px(ctx, x, y, cor, w = 1, h = 1) {
    ctx.fillStyle = cor;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function texto(ctx, s, x, y, cor, sombra, e = 1) {
    let cx = x;
    let i = 0;
    for (const ch of s) {
      const inclina = Math.round(i * 0.35 * e) * -1; // letreiro levemente subindo, como pichação
      i++;
      if (ch === ' ') { cx += 3 * e; continue; }
      const g = FONTE[ch === 'É' ? 'E' : ch];
      if (!g) { cx += 4 * e; continue; }
      g.forEach((linha, gy) => [...linha].forEach((b, gx) => {
        if (b === '1') {
          if (sombra) px(ctx, cx + gx * e + 1, y + inclina + gy * e + 1, sombra, e, e);
          px(ctx, cx + gx * e, y + inclina + gy * e, cor, e, e);
        }
      }));
      if (ch === 'É') { px(ctx, cx + e, y + inclina - 2 * e, cor, e, e); px(ctx, cx + 2 * e, y + inclina - 3 * e, cor, e, e); }
      cx += 4 * e;
    }
  }

  // ---------------------------------------------------------- camada fixa: céu, morro, cidade
  function desenharCeu(ctx) {
    for (let y = 0; y < H; y++) {
      const t = y / 120;
      const a = t < 0.5 ? COR.ceuTopo : COR.ceuMeio;
      const b = t < 0.5 ? COR.ceuMeio : COR.ceuBaixo;
      const k = t < 0.5 ? t * 2 : Math.min(1, (t - 0.5) * 2);
      // faixas de 2 px (degradê em pixel art)
      const q = Math.floor(k * 6) / 6;
      ctx.fillStyle = rgb(a.map((v, i) => Math.round(v + (b[i] - v) * q)));
      ctx.fillRect(0, y, W, 1);
    }
  }
  function desenharLuas(ctx) {
    const lua = (cx, cy, r, glow) => {
      for (let d = r + glow; d > r; d--) {
        ctx.fillStyle = `rgba(200,215,255,${0.035 * (r + glow - d + 1) / glow})`;
        ctx.beginPath(); ctx.arc(cx, cy, d, 0, Math.PI * 2); ctx.fill();
      }
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y <= r * r) {
            const crater = ((x * 7 + y * 13) % 11 === 0) || (Math.hypot(x + 3, y - 2) < 2.4) || (Math.hypot(x - 4, y + 3) < 1.8);
            px(ctx, cx + x, cy + y, crater ? COR.luaSombra : COR.lua);
          }
        }
      }
    };
    lua(98, 62, 11, 9);
    lua(318, 26, 6, 6);
  }
  function desenharMorro(ctx) {
    ctx.fillStyle = COR.morro;
    for (let x = 250; x < W; x++) {
      const y = Math.round(60 - Math.sin((x - 250) / 40) * 18 - (x > 320 ? (x - 320) * 0.2 : 0));
      ctx.fillRect(x, y, 1, H - y);
      px(ctx, x, y, COR.morroBorda);
    }
    // Cristo no alto do morro
    const cx = 330;
    const cy = 30;
    px(ctx, cx - 1, cy, COR.cristo, 3, 3);
    px(ctx, cx - 6, cy + 3, COR.cristo, 13, 2);
    px(ctx, cx - 1, cy + 3, COR.cristo, 3, 12);
    px(ctx, cx - 2, cy + 15, COR.cristo, 5, 3);
  }
  function desenharCidade(ctx, cena) {
    for (const p of cena.cidade) {
      px(ctx, p.x, H - p.h, COR.predio, p.w, p.h);
      px(ctx, p.x, H - p.h, COR.predioClaro, 1, p.h);
    }
  }

  // ---------------------------------------------------------- casas
  function desenharCasa(ctx, c, cena) {
    const [base, claro, escuro] = MUROS[c.muro];
    px(ctx, c.x, c.y, base, c.w, c.h);
    // luz da lua na lateral esquerda, sombra à direita
    px(ctx, c.x, c.y, claro, 1, c.h);
    px(ctx, c.x + c.w - 1, c.y, escuro, 1, c.h);
    // reboco: manchas e tijolos aparentes
    for (const [x, y, t] of c.ruido) {
      if (c.muro === 'tijolo' || t === 2) {
        px(ctx, x, y, escuro, 2, 1);
      } else {
        px(ctx, x, y, claro);
      }
    }
    const tijolos = (x0, y0, w, h, cor) => {
      for (let y = y0; y < y0 + h; y += 3) {
        px(ctx, x0, y, cor, w, 1);
        for (let x = x0 + ((y / 3) % 2 ? 1 : 3); x < x0 + w; x += 4) px(ctx, x, y, cor, 1, 3);
      }
    };
    if (c.muro === 'tijolo') tijolos(c.x + 1, c.y + 4, c.w - 2, c.h - 4, escuro);
    for (const [bx, by, bw, bh] of c.buracos || []) {
      px(ctx, bx, by, TIJOLO[0], bw, bh);
      tijolos(bx, by, bw, bh, TIJOLO[2]);
      px(ctx, bx - 1, by - 1, claro, bw + 2, 1);
    }
    // marcas de chuva escorrendo da laje
    for (let x = c.x + 3; x < c.x + c.w - 2; x += 7) px(ctx, x, c.y + 3, escuro, 1, 2 + ((x * 7) % 5));
    // laje
    px(ctx, c.x - 1, c.y, COR.laje, c.w + 2, 2);
    px(ctx, c.x - 1, c.y + 2, COR.lajeSombra, c.w + 2, 1);
    // grade na laje
    if (c.o.grade) {
      px(ctx, c.x, c.y - 5, COR.grade, c.w, 1);
      for (let x = c.x; x < c.x + c.w; x += 3) px(ctx, x, c.y - 5, COR.grade, 1, 5);
    }
    // caixa d'água
    if (c.o.caixa) {
      const x = c.x + c.w - 13;
      px(ctx, x, c.y - 7, COR.caixa, 9, 7);
      px(ctx, x, c.y - 8, COR.caixaTopo, 9, 2);
      px(ctx, x + 7, c.y - 7, COR.caixaSombra, 2, 7);
      px(ctx, x + 1, c.y - 4, COR.caixaSombra, 6, 1);
    }
    if (c.o.obra) {
      // laje em construção: pilares com vergalhão e blocos empilhados
      for (const cx of [c.x + 2, c.x + c.w - 5]) {
        px(ctx, cx, c.y - 9, '#4c4a47', 3, 9);
        px(ctx, cx + 1, c.y - 12, '#2a2622', 1, 3);
      }
      for (let k = 0; k < 3; k++) px(ctx, c.x + 8 + k * 4, c.y - 3 - (k % 2) * 3, '#57524c', 3, 3);
    }
    if (c.o.escada) {
      // escada externa subindo pela lateral, com corrimão
      const degraus = Math.floor(c.h / 3);
      for (let k = 0; k < degraus; k++) {
        const sx = c.x + c.w - 4 - k * 2;
        const sy = c.y + c.h - 2 - k * 3;
        if (sx < c.x + 2) break;
        px(ctx, sx, sy, COR.laje, 5, 1);
        px(ctx, sx, sy + 1, COR.lajeSombra, 5, 2);
      }
      for (let k = 0; k < degraus; k += 2) {
        const sx = c.x + c.w - 2 - k * 2;
        const sy = c.y + c.h - 8 - k * 3;
        if (sx < c.x + 4) break;
        px(ctx, sx, sy, COR.grade, 1, 5);
      }
    }
    if (c.o.antena) {
      px(ctx, c.x + 6, c.y - 12, COR.grade, 1, 12);
      px(ctx, c.x + 3, c.y - 12, COR.grade, 7, 1);
      px(ctx, c.x + 4, c.y - 9, COR.grade, 5, 1);
    }
    if (c.o.selo) {
      // selo da BIG STUDIO pintado na parede (única marca dentro da cena)
      const cores = ['#d9d9d4', '#6fa8ff', '#d9d9d4', '#d9d9d4', '#22c55e', '#f0b429', '#55555c', '#d9d9d4', '#d9d9d4'];
      cores.forEach((cor, i) => px(ctx, c.x + 14 + (i % 3) * 5, c.y + 10 + Math.floor(i / 3) * 5, cor, 4, 4));
    }
    if (c.o.bandeira) {
      const x = c.x + 6;
      const y = c.y + 8;
      px(ctx, x, y, '#1f7a3a', 14, 9);
      for (let k = 0; k < 5; k++) px(ctx, x + 2 + k, y + 4 - Math.min(k, 4 - k) - 0, '#e0c23a', 10 - 2 * k > 0 ? 10 - 2 * k : 1, 1);
      px(ctx, x + 5, y + 3, '#e0c23a', 4, 3);
      px(ctx, x + 6, y + 3, '#2a4aa0', 2, 3);
    }
    if (c.o.mural) {
      // muro grande com o mural da arte aprovada
      texto(ctx, 'A TECNOLOGIA', c.x + 8, c.y + 12, COR.mural, COR.muralSombra, 2);
      texto(ctx, 'TAMBÉM', c.x + 22, c.y + 29, COR.mural, COR.muralSombra, 2);
      texto(ctx, 'NASCE AQUI', c.x + 14, c.y + 44, COR.mural, COR.muralSombra, 2);
    }
    if (c.o.computador) {
      // sala dos computadores: janelão azul (o interior é desenhado a cada quadro)
      px(ctx, c.x + 6, c.y + 6, COR.moldura, 34, 20);
      px(ctx, c.x + 4, c.y + 26, COR.laje, 52, 2);
      for (let x = c.x + 4; x < c.x + 56; x += 3) px(ctx, x, c.y + 21, COR.grade, 1, 5);
      px(ctx, c.x + 4, c.y + 21, COR.grade, 52, 1);
    }
    if (c.o.terraco) {
      px(ctx, c.x, c.y + 10, COR.grade, c.w, 1);
      for (let x = c.x; x < c.x + c.w; x += 4) px(ctx, x, c.y + 10, COR.grade, 1, 8);
    }
  }
  function desenharPorta(ctx, p, acesa) {
    px(ctx, p.x - 1, p.y - 1, COR.moldura, 7, 11);
    px(ctx, p.x, p.y, acesa ? COR.portaLuz : COR.porta, 5, 10);
    if (acesa) px(ctx, p.x + 1, p.y + 1, '#ffd08a', 3, 8);
    px(ctx, p.x + 3, p.y + 5, '#0e0a08');
  }

  // ---------------------------------------------------------- fios, postes, árvores
  function desenharFios(ctx, cena) {
    const ps = cena.postes;
    for (const [x, y] of ps) {
      px(ctx, x, y, COR.poste, 1, H - y);
      px(ctx, x - 3, y + 1, COR.poste, 7, 1);
      px(ctx, x + 3, y + 2, COR.posteLuz);
    }
    ctx.fillStyle = COR.fio;
    const ligar = (a, b, curva, desloc) => {
      const [x1, y1] = a;
      const [x2, y2] = b;
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        const t = (x - x1) / (x2 - x1);
        const y = y1 + desloc + (y2 - y1) * t + Math.sin(Math.PI * t) * curva;
        ctx.fillRect(x, Math.round(y), 1, 1);
      }
    };
    for (let i = 0; i < ps.length - 1; i++) {
      const [a, b] = [ps[i], ps[i + 1]].sort((p, q) => p[0] - q[0]);
      ligar(a, b, 9, 1);
      ligar(a, b, 12, 3);
    }
    ligar([0, 96], ps[0], 6, 0);
    ligar([0, 80], [92, 108], 10, 2);
    ligar([262, 74], [W, 62], 8, 1);
    ligar([330, 88], [W, 96], 4, 0);
  }
  function desenharArvore(ctx, a, balanco) {
    px(ctx, a.x - 1, a.y, COR.tronco, 2, a.r + 4);
    for (const [dx, dy, tom, topo] of a.px) {
      const ox = topo ? balanco : 0;
      px(ctx, a.x + dx + ox, a.y + dy, COR.folha[tom]);
    }
  }

  // ---------------------------------------------------------- luz das janelas
  function intensidade(j, t) {
    if (!j.acesa && j.modo !== 'ciclo') return 0;
    if (j.modo === 'fixa') return 1;
    if (j.modo === 'respira') return 0.78 + 0.22 * Math.sin((t + j.fase) / j.periodo * Math.PI * 2);
    if (j.modo === 'tv') return 0.55 + 0.45 * Math.abs(Math.sin(t * 3.1 + Math.sin(t * 1.7) * 2));
    // ciclo: acesa a maior parte do tempo, apaga por um trecho (alguém saiu do cômodo)
    const f = ((t + j.fase) % j.periodo) / j.periodo;
    return (j.acesa ? f < 0.72 : f > 0.6) ? 1 : 0;
  }
  function desenharJanela(ctx, j, k) {
    px(ctx, j.x - 1, j.y - 1, COR.moldura, j.w + 2, j.h + 2);
    if (k <= 0.05) {
      px(ctx, j.x, j.y, COR.vidroApagado, j.w, j.h);
      px(ctx, j.x, j.y, '#232b40', j.w, 1);
      return;
    }
    const cor = j.tv ? COR.tela : COR.luz[j.cor];
    ctx.globalAlpha = 0.35 + 0.65 * k;
    px(ctx, j.x, j.y, cor, j.w, j.h);
    px(ctx, j.x + 1, j.y + 1, j.tv ? '#d4e6ff' : '#fff0c8', j.w - 2, 2);
    ctx.globalAlpha = 1;
    if (j.cortina) px(ctx, j.x, j.y, '#7a3a2a', 1, j.h);
    if (j.grade) for (let gx = j.x + 1; gx < j.x + j.w; gx += 2) px(ctx, gx, j.y, '#1a1410', 1, j.h);
    else px(ctx, j.x + Math.floor(j.w / 2), j.y, COR.moldura, 1, j.h);
    // luz derramando no peitoril
    px(ctx, j.x - 1, j.y + j.h + 1, 'rgba(255,170,80,' + (0.35 * k).toFixed(2) + ')', j.w + 2, 1);
  }
  function brilho(ctx, x, y, raio, cor, k) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, raio);
    g.addColorStop(0, `rgba(${cor},${0.34 * k})`);
    g.addColorStop(1, `rgba(${cor},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }

  // ---------------------------------------------------------- moradores
  function desenharPessoa(ctx, x, y, m, quadro, direcao, parada) {
    // y = pés; figura de 12 px (criança 9 px), de perfil
    const alt = m.crianca ? 9 : 12;
    const topo = y - alt;
    const pele = COR.pele[m.pele];
    const d = direcao;
    const fx = (dx) => x + dx * d;
    // pernas
    const passo = parada ? 0 : [1, 0, -1, 0][quadro];
    const perna = alt === 12 ? 4 : 3;
    px(ctx, fx(passo) - (d < 0 ? 0 : 0), y - perna, m.calca, 1, perna);
    px(ctx, fx(-passo), y - perna, m.calca, 1, perna);
    if (m.saia) px(ctx, x - 1, y - perna - 1, m.calca, 3, 2);
    // tronco
    const tronco = alt === 12 ? 5 : 4;
    px(ctx, x - 1, y - perna - tronco, m.cor, 3, tronco);
    // braço balançando
    px(ctx, fx(parada ? 1 : [-1, 0, 1, 0][quadro]), y - perna - tronco + 1, pele, 1, 3);
    // cabeça
    px(ctx, x - 1, topo, pele, 3, 3);
    px(ctx, x - 1, topo, COR.cabelo, 3, 1);
    px(ctx, fx(-1), topo + 1, COR.cabelo);
    // borda de luz quente vinda das janelas
    px(ctx, fx(1) + (d > 0 ? 1 : -1), y - perna - tronco, 'rgba(255,170,90,.55)', 1, tronco);
  }

  // ---------------------------------------------------------- quadro completo
  function criar(canvas, opcoes = {}) {
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const cena = montar();

    // camadas fixas desenhadas uma vez
    const fundo = document.createElement('canvas');
    fundo.width = W; fundo.height = H;
    const f = fundo.getContext('2d');
    desenharCeu(f);
    desenharLuas(f);
    desenharMorro(f);
    desenharCidade(f, cena);

    const casas = document.createElement('canvas');
    casas.width = W; casas.height = H;
    const c = casas.getContext('2d');
    for (const casa of cena.extras) desenharCasa(c, casa, cena);
    desenharFios(c, cena);

    let t0 = performance.now();
    let tempo = opcoes.tempoInicial || 0;
    let rodando = false;
    let ultimo = 0;

    function quadro(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(fundo, 0, 0);
      // cidade: janelinhas acendendo devagar
      for (const p of cena.cidade) {
        for (const [jx, jy, k] of p.jan) {
          const on = ((Math.floor(t / 7) + jx * 3 + jy) % 9) !== 0;
          if (on) px(ctx, jx, jy, COR.janelaCidade[k]);
        }
      }
      // estrelas piscando
      for (const e of cena.estrelas) {
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (0.8 + e.brilho) + e.fase));
        ctx.globalAlpha = a * (0.5 + e.brilho * 0.5);
        px(ctx, e.x, e.y, COR.estrela);
      }
      ctx.globalAlpha = 1;
      // nuvens passando atrás das casas
      for (const n of cena.nuvens) {
        const x = ((n.fase + t * n.vel) % (W + n.w * 2)) - n.w;
        for (const [dx, dy, tom] of n.px) px(ctx, x + dx, n.y + dy, COR.nuvem[tom]);
      }
      ctx.drawImage(casas, 0, 0);
      // árvores com folhas balançando no alto
      const bal = Math.round(Math.sin(t * 1.3)) ;
      for (const a of cena.arvores) desenharArvore(ctx, a, Math.sin(t * 1.1 + a.x) > 0.55 ? 1 : bal > 0 ? 0 : 0);
      // janelas e brilho
      for (const j of cena.janelas) {
        const k = intensidade(j, t);
        desenharJanela(ctx, j, k);
      }
      for (const p of cena.portas) desenharPorta(ctx, p, p.acesa);
      ctx.globalCompositeOperation = 'lighter';
      for (const j of cena.janelas) {
        const k = intensidade(j, t);
        if (k > 0.05) brilho(ctx, j.x + j.w / 2, j.y + j.h / 2, 7 + j.w * 1.6, j.tv ? '120,170,255' : '255,150,60', k);
      }
      for (const p of cena.portas) if (p.acesa) brilho(ctx, p.x + 2.5, p.y + 5, 10, '255,150,60', 1);
      for (const [x, y] of cena.postes) brilho(ctx, x + 3, y + 2, 8, '255,200,120', 0.9);
      ctx.globalCompositeOperation = 'source-over';
      // sala dos computadores: os dois digitando
      desenharComputador(ctx, cena.extras.find((e) => e.o.computador), t);
      // varal com roupa balançando
      desenharVaral(ctx, cena.extras.find((e) => e.o.varal), t);
      // pipa
      desenharPipa(ctx, cena.extras.find((e) => e.o.pipa), t);
      // cachorro no terraço
      desenharCachorro(ctx, 346, 110, t);
      // moradores andando
      for (const m of cena.moradores) {
        if (!m.caminho) continue;
        const { x0, x1, y } = m.caminho;
        const L = x1 - x0;
        const s = (m.fase + t * m.vel) % (L * 2);
        const indo = s < L;
        const x = indo ? x0 + s : x1 - (s - L);
        const q = Math.floor(t * (m.crianca ? 9 : 6) + m.fase) % 4;
        desenharPessoa(ctx, Math.round(x), y, m, q, indo ? 1 : -1, false);
      }
    }

    function desenharComputador(ctx2, casa, t) {
      if (!casa) return;
      const x = casa.x + 6;
      const y = casa.y + 6;
      px(ctx2, x + 1, y + 1, '#2b4a86', 32, 18);
      px(ctx2, x + 1, y + 1, '#5f8fe0', 32, 6);
      // mesa e monitores
      px(ctx2, x + 4, y + 14, '#2a2420', 26, 2);
      const brilhoTela = 0.8 + 0.2 * Math.sin(t * 5);
      ctx2.globalAlpha = brilhoTela;
      px(ctx2, x + 11, y + 8, '#bfe0ff', 5, 4);
      px(ctx2, x + 21, y + 8, '#ffe2a8', 6, 4);
      ctx2.globalAlpha = 1;
      // duas pessoas sentadas, de costas; braços se mexem ao digitar
      const tecla1 = Math.floor(t * 6) % 2;
      const tecla2 = Math.floor(t * 4.5 + 1) % 3 === 0 ? 1 : 0;
      const vira = Math.floor(t / 4) % 3 === 2 ? 1 : 0;
      px(ctx2, x + 8, y + 7, '#120c09', 3, 3);
      px(ctx2, x + 7, y + 10, '#1e2a40', 5, 5);
      px(ctx2, x + 11, y + 12 - tecla1, '#5a3624');
      px(ctx2, x + 18 + vira, y + 7, '#120c09', 3, 3);
      px(ctx2, x + 17, y + 10, '#22324a', 5, 5);
      px(ctx2, x + 21, y + 12 - tecla2, '#6e4630');
      // cadeiras
      px(ctx2, x + 7, y + 15, '#141414', 5, 2);
      px(ctx2, x + 17, y + 15, '#141414', 5, 2);
      ctx2.globalCompositeOperation = 'lighter';
      brilho(ctx2, x + 17, y + 9, 22, '110,160,255', 0.9);
      ctx2.globalCompositeOperation = 'source-over';
    }
    function desenharVaral(ctx2, casa, t) {
      if (!casa) return;
      const x = casa.x + 4;
      const y = casa.y - 9;
      px(ctx2, x, y - 2, COR.grade, 1, 11);
      px(ctx2, x + 30, y - 2, COR.grade, 1, 11);
      px(ctx2, x, y, '#2a2a30', 31, 1);
      const roupas = ['#c9473a', '#e8e2d0', '#3f6aa8', '#e0b63a'];
      roupas.forEach((cor, i) => {
        const vento = Math.round(Math.sin(t * 2.4 + i) * 1);
        px(ctx2, x + 3 + i * 7 + vento, y + 1, cor, 4, 4 + (i % 2));
      });
    }
    function desenharPipa(ctx2, casa, t) {
      if (!casa) return;
      const cx = casa.x + 10;
      const cy = casa.y;
      const crianca = { cor: '#3f6aa8', calca: '#1f2430', pele: 2, crianca: true };
      desenharPessoa(ctx2, cx, cy, crianca, Math.floor(t * 2) % 2, -1, true);
      px(ctx2, cx - 1, cy - 8, COR.pele[2], 1, 2);
      const kx = cx - 44 + Math.round(Math.sin(t * 0.9) * 3);
      const ky = cy - 58 + Math.round(Math.cos(t * 1.3) * 2);
      ctx2.strokeStyle = 'rgba(225,232,255,.45)';
      ctx2.lineWidth = 0.6;
      ctx2.beginPath();
      ctx2.moveTo(cx - 1, cy - 8);
      ctx2.quadraticCurveTo((cx + kx) / 2 + 4, (cy + ky) / 2 + 6, kx + 2, ky + 3);
      ctx2.stroke();
      // pipa (losango) com rabiola
      const forma = ['00100', '01110', '11111', '01110', '00100'];
      forma.forEach((l, yy) => [...l].forEach((b, xx) => {
        if (b === '1') px(ctx2, kx + xx, ky + yy, xx < 2 ? '#e2be46' : xx > 2 ? '#2eaa68' : '#1a1410');
      }));
      for (let k = 0; k < 5; k++) px(ctx2, kx + 2 + Math.round(Math.sin(t * 3 + k) * 1), ky + 5 + k, k % 2 ? '#f0d278' : '#d24a3c');
    }
    function desenharCachorro(ctx2, x, y, t) {
      const rabo = Math.floor(t * 4) % 2;
      px(ctx2, x - 6, y - 4, '#151313', 7, 3);
      px(ctx2, x, y - 6, '#151313', 3, 3);
      px(ctx2, x + 2, y - 5, '#151313', 2, 1);
      px(ctx2, x - 6, y - 1, '#151313', 1, 1);
      px(ctx2, x - 4, y - 1, '#151313', 1, 1);
      px(ctx2, x - 1, y - 1, '#151313', 1, 1);
      px(ctx2, x - 7 - rabo, y - 5 + rabo, '#151313', 1, 2);
    }

    function laco(agora) {
      if (!rodando) return;
      requestAnimationFrame(laco);
      if (agora - ultimo < 1000 / 14) return; // 14 quadros/s: ritmo de pixel art, pouco processamento
      ultimo = agora;
      tempo += Math.min(0.2, (agora - t0) / 1000);
      t0 = agora;
      quadro(tempo);
    }

    quadro(tempo);
    return {
      tocar() {
        if (rodando || opcoes.estatica) return;
        rodando = true;
        t0 = performance.now();
        requestAnimationFrame(laco);
      },
      pausar() { rodando = false; },
      get rodando() { return rodando; },
      irPara(segundos) { tempo = segundos; quadro(tempo); },
      cena,
    };
  }

  // ---------------------------------------------------------- montagem automática com controle de pausa
  function iniciar(raiz) {
    const canvas = raiz.querySelector('canvas');
    const botao = raiz.querySelector('[data-favela-controle]');
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cena = criar(canvas, { tempoInicial: 12 });
    let visivel = !('IntersectionObserver' in window);
    let pausada = false;
    function sincronizar() {
      const pode = !reduzido.matches && visivel && !document.hidden && !pausada;
      if (pode) cena.tocar(); else cena.pausar();
      if (botao) {
        botao.hidden = reduzido.matches;
        botao.textContent = pausada ? 'Retomar cena' : 'Pausar cena';
        botao.setAttribute('aria-pressed', String(pausada));
      }
    }
    botao?.addEventListener('click', () => { pausada = !pausada; sincronizar(); });
    document.addEventListener('visibilitychange', sincronizar);
    reduzido.addEventListener('change', sincronizar);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visivel = e.isIntersecting; sincronizar(); }, { threshold: 0 }).observe(raiz);
    }
    sincronizar();
    raiz.bigFavela = cena;
  }

  window.BigFavela = { criar, iniciar, LARGURA: W, ALTURA: H };
  document.querySelectorAll('[data-big-favela]').forEach(iniciar);
})();
