/* =========================================================
   BIG STUDIO — Favela em pixel art (subprojeto)
   Toda a cena é desenhada em código, num único estilo: nada
   vem de imagem. Resolução lógica 720x400, ampliada em pixels
   nítidos.
   Camadas fixas (desenhadas uma vez): céu, luas, morro, cidade,
   casas (muros, reboco, tijolo, lajes, grades, caixas d'água,
   escadas, obra), postes e fiação.
   A cada quadro: estrelas, estrela cadente, avião, nuvens,
   árvores, janelas (luz e o que acontece dentro), portas,
   brilhos, vida nas lajes, sala dos computadores, varal, pipa,
   bola, gato, pássaros, cachorro, moto e moradores.
   Uso: BigFavela.criar(canvas, { estatica: false })
   ========================================================= */
(() => {
  const W = 720;
  const H = 400;
  const E = 2; // a composição é escrita na grade antiga (360x200) e ampliada

  // ---------------------------------------------------------- aleatório determinístico
  function semente(s) {
    return () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------- paleta
  const COR = {
    ceu: [[5, 8, 22], [9, 16, 40], [14, 26, 60], [22, 38, 82], [30, 48, 96]],
    estrela: '#dfe7ff', lua: '#e8eaf2', luaMeio: '#cfd4e2', luaSombra: '#aab1c4',
    morro: '#050912', morroBorda: '#22325a', cristo: '#0b1222',
    predio: ['#0b1530', '#0e1a39', '#101e40'],
    janelaCidade: ['#f2c46d', '#ffd88a', '#8fb6ff', '#e9a24f'],
    nuvem: ['#16244a', '#1e2f5a', '#283d6c', '#33497a'],
    fio: '#06070b', poste: '#15161c', posteLuz: '#ffd28a',
    folha: ['#09150d', '#0e1f13', '#142a19', '#1c3a21', '#27502c'], tronco: '#1e140c',
    laje: '#5f5b55', lajeClara: '#77726a', lajeSombra: '#282523', grade: '#1a191d',
    caixa: '#28469a', caixaClara: '#3d5fbd', caixaTopo: '#5577d0', caixaSombra: '#1a2f6a',
    porta: '#2c1b12', portaLuz: '#f0a24a',
    vidro: '#151b2b', vidroReflexo: '#232c44', moldura: '#100d0a', peitoril: '#5a554f',
    luz: [['#fff1c4', '#ffc76a', '#e8903a'], ['#fff4d0', '#ffd27c', '#f0a04a'], ['#ffe9b8', '#f8b65a', '#d9802e']],
    tela: ['#a8d0ff', '#7fb0f5', '#5a86d6'],
    pele: ['#5a3624', '#6e4630', '#8a5a3c', '#3e2518', '#a06a45'],
    cabelo: ['#120c09', '#2a1810', '#0c0a0a'],
    mural: '#ee7a62', muralSombra: '#8e3d30', muralLuz: '#ffb09a',
  };
  const MUROS_DIA = {
    terracota: ['#6b3a2a', '#7d4632', '#4e2a1f'],
    ocre: ['#76522e', '#8a6238', '#573c21'],
    rosa: ['#6a4250', '#7c4e5e', '#4f313c'],
    cinza: ['#46464e', '#55555e', '#33333a'],
    azul: ['#36425c', '#43516e', '#283146'],
    tijolo: ['#743828', '#86432f', '#56291d'],
    verde: ['#3c5446', '#486553', '#2b3d33'],
    amarelo: ['#7a6a32', '#8d7b3c', '#5a4d22'],
  };
  function noite(hex, k = 0.5) {
    const v = parseInt(hex.slice(1), 16);
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    const az = [12, 18, 38];
    return [Math.round(r * k + az[0] * (1 - k)), Math.round(g * k + az[1] * (1 - k)), Math.round(b * k + az[2] * (1 - k))];
  }
  const MUROS = Object.fromEntries(Object.entries(MUROS_DIA).map(([n, cs]) => [n, cs.map((c) => noite(c))]));
  const TIJOLO = MUROS_DIA.tijolo.map((c) => noite(c, 0.66));
  // perfil do morro do Cristo: pico sob a estátua
  const morroY = (x) => Math.round(178 - 96 * Math.exp(-(((x - 660) / 78) ** 2)) - 18 * Math.exp(-(((x - 540) / 60) ** 2)));
  const css = (c, a = 1) => (a === 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);
  const mistura = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));

  // ---------------------------------------------------------- fonte 5x7 do mural
  const FONTE = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  };

  // ---------------------------------------------------------- composição (grade 360x200)
  const CASAS = [
    // fileira de trás (alto do morro)
    [150, 52, 30, 32, 'cinza', { caixa: 1, obra: 1 }],
    [178, 40, 34, 44, 'ocre', { janelas: 'luz', caixa: 1, grade: 1, vasos: 1 }],
    [210, 30, 40, 54, 'terracota', { janelas: 'luz', varal: 1 }],
    [248, 46, 30, 38, 'rosa', { caixa: 1, antena: 1 }],
    [276, 60, 26, 30, 'azul', { obra: 1, parabolica: 1 }],
    // fileira do meio-alto
    [118, 82, 34, 34, 'tijolo', { caixa: 1, escada: 1 }],
    [150, 84, 44, 40, 'cinza', { selo: 1 }],
    [192, 80, 36, 44, 'amarelo', { janelas: 'luz', grade: 1, pipa: 1 }],
    [226, 76, 40, 48, 'terracota', { janelas: 'luz', caixa: 1, grade: 1, caminho: 'laje-alta', cadeiras: 1 }],
    [264, 84, 34, 40, 'azul', { janelas: 'tv' }],
    [296, 92, 64, 18, 'rosa', { terraco: 1 }],
    // fileira do meio
    [60, 136, 58, 36, 'ocre', { computador: 1 }],
    [96, 112, 30, 26, 'rosa', { grade: 1, bola: 1 }],
    [116, 118, 40, 30, 'terracota', { janelas: 'luz', grade: 1 }],
    [154, 122, 36, 28, 'tijolo', { escada: 1, sentado: 1 }],
    [188, 124, 42, 30, 'cinza', { janelas: 'luz', caixa: 1, vasos: 1 }],
    [228, 124, 30, 26, 'verde', { janelas: 'luz', gato: 1 }],
    [258, 122, 40, 28, 'ocre', { janelas: 'luz', caixa: 1 }],
    [296, 110, 64, 32, 'terracota', { janelas: 'luz', porta: 1 }],
    // fileira da frente
    [30, 172, 48, 30, 'tijolo', { janelas: 'luz' }],
    [76, 172, 44, 30, 'cinza', { porta: 1, bandeira: 1 }],
    [118, 150, 46, 52, 'terracota', { janelas: 'luz', porta: 1, caminho: 'laje-baixa' }],
    [162, 154, 44, 48, 'amarelo', { janelas: 'luz' }],
    [204, 150, 52, 52, 'rosa', { janelas: 'luz', porta: 1 }],
    [254, 142, 106, 60, 'azul', { mural: 1 }],
  ];

  // ---------------------------------------------------------- montagem dos dados
  function montar() {
    const r = semente(20261030);
    const janelas = [];
    const portas = [];
    const casas = [];
    const caminhos = [];
    CASAS.forEach(([gx, gy, gw, gh, muro, o], i) => {
      const x = gx * E, y = gy * E, w = gw * E, h = gh * E;
      const casa = { x, y, w, h, muro, o, i, buracos: [] };
      if (!o.mural && !o.computador && !o.terraco) {
        const andares = Math.max(1, Math.round((h - 12) / 30));
        for (let fy = 0; fy < andares; fy++) {
          const qtd = 1 + Math.floor(r() * (w > 72 ? 3 : 2));
          const usados = [];
          for (let q = 0; q < qtd; q++) {
            const tam = [[8, 10], [10, 12], [12, 14], [7, 8], [14, 10], [8, 14]][Math.floor(r() * 6)];
            const jx = x + 6 + Math.floor(r() * Math.max(1, w - tam[0] - 12));
            const jy = y + 10 + fy * 30 + Math.floor(r() * 5);
            if (jy + tam[1] > y + h - 6 || usados.some((u) => Math.abs(u - jx) < tam[0] + 6)) continue;
            const livre = (ax, ay, aw, ah) => jx + tam[0] + 3 < ax || jx - 3 > ax + aw || jy + tam[1] + 3 < ay || jy - 3 > ay + ah;
            if (o.bandeira && !livre(x + 10, y + 14, 28, 18)) continue;
            if (o.selo && !livre(x + 30, y + 18, 31, 31)) continue;
            usados.push(jx);
            const acesa = o.janelas === 'luz' ? r() < 0.72 : r() < 0.42;
            const tv = o.janelas === 'tv' && q === 0 && fy === 0;
            const dentro = tv ? 'tv' : ['vazio', 'vazio', 'planta', 'pessoa', 'estante', 'pessoa'][Math.floor(r() * 6)];
            janelas.push({
              x: jx, y: jy, w: tam[0], h: tam[1], acesa, tv, dentro,
              modo: tv ? 'tv' : (r() < 0.45 ? 'fixa' : r() < 0.55 ? 'respira' : 'ciclo'),
              periodo: 12 + r() * 34, fase: r() * 50, cor: Math.floor(r() * 3),
              cortina: r() < 0.35 ? (r() < 0.5 ? '#8a3b2c' : '#3c5a8a') : null,
              grade: r() < 0.3, persiana: r() < 0.15,
            });
          }
        }
        for (let k = 0; k < 1 + Math.floor(r() * 3); k++) {
          casa.buracos.push([x + 4 + Math.floor(r() * (w - 24)), y + 10 + Math.floor(r() * (h - 24)), 10 + Math.floor(r() * 12), 7 + Math.floor(r() * 8)]);
        }
      }
      if (o.porta) portas.push({ x: x + w - 20, y: y + h - 20, acesa: r() < 0.7 });
      if (o.caminho) caminhos.push({ x0: x + 6, x1: x + w - (o.caixa ? 34 : 16), y, id: o.caminho }); // não atravessa a caixa d'água
      casas.push(casa);
    });
    caminhos.push({ x0: 600, x1: 676, y: 220, terraco: true });
    caminhos.push({ x0: 10, x1: 500, y: 399, rua: true });

    const estrelas = [];
    for (let k = 0; k < 180; k++) {
      const sx = Math.floor(r() * W);
      const sy = Math.floor(r() * 190);
      if (Math.hypot(sx - 196, sy - 124) < 34 || Math.hypot(sx - 660, sy - 70) < 26) continue;
      if (sx >= 430 && sy >= morroY(sx) - 2) continue; // estrela só onde é céu
      estrelas.push({ x: sx, y: sy, fase: r() * 6, brilho: r(), grande: r() < 0.08 });
    }
    const cidade = [];
    let cx = 0;
    while (cx < 290) {
      const w = 14 + Math.floor(r() * 22);
      const h = 70 + Math.floor(r() * 140);
      const jan = [];
      for (let jy = H - h + 5; jy < H - 6; jy += 5) {
        for (let jx = cx + 3; jx < cx + w - 3; jx += 4) {
          if (r() < 0.3) jan.push([jx, jy, Math.floor(r() * 4), r()]);
        }
      }
      cidade.push({ x: cx, w, h, jan, tom: Math.floor(r() * 3), antena: r() < 0.4 });
      cx += w + Math.floor(r() * 5);
    }
    const arvores = [
      // atrás das casas: só a copa aparece acima das lajes
      { x: 282, y: 150, r: 28, atras: 1 }, { x: 472, y: 46, r: 26, atras: 1 }, { x: 584, y: 96, r: 22, atras: 1 },
      { x: 338, y: 84, r: 20, atras: 1 }, { x: 222, y: 214, r: 24, atras: 1 }, { x: 520, y: 236, r: 16, atras: 1 },
      { x: 420, y: 128, r: 15, atras: 1 }, { x: 260, y: 92, r: 18, atras: 1 },
      // na rua, com tronco até o chão
      { x: 96, y: 336, r: 24, base: H }, { x: 404, y: 352, r: 20, base: H },
    ].map((a) => {
      const px = [];
      for (let dy = -a.r; dy <= a.r; dy++) {
        for (let dx = -a.r - 6; dx <= a.r + 6; dx++) {
          // copa irregular em tufos
          const tufo = Math.sin(dx * 0.45 + a.x) * 2.4 + Math.cos(dy * 0.55 + a.y) * 2.4;
          const d = Math.hypot(dx * 0.82, dy * 1.05) + tufo + r() * 2.6;
          if (d < a.r) {
            const luz = (-dx - dy) / (a.r * 2); // luz da lua vinda do alto à esquerda
            const tom = Math.max(0, Math.min(4, Math.round(1 + luz * 3 + (r() - 0.5) * 1.4 + (d < a.r * 0.5 ? 0.6 : 0))));
            px.push([dx, dy, tom, dy < -a.r * 0.15 ? 1 : dy < a.r * 0.3 ? 0.5 : 0]);
          }
        }
      }
      return { ...a, px, fase: r() * 6 };
    });
    const postes = [[44, 296, H], [252, 302, H], [470, 306, H], [356, 126, 168], [560, 118, 168], [700, 168, 220]];
    const nuvens = [
      { y: 36, w: 110, vel: 2.4, fase: 0 }, { y: 70, w: 70, vel: 1.6, fase: 300 },
      { y: 16, w: 84, vel: 2.0, fase: 520 }, { y: 100, w: 54, vel: 1.2, fase: 820 },
    ].map((n) => {
      const px = [];
      for (let dy = -14; dy <= 9; dy++) {
        for (let dx = -n.w / 2; dx <= n.w / 2; dx++) {
          const borda = Math.sin(dx * 0.18 + n.fase) * 0.12;
          const f = Math.abs(dx) / (n.w / 2) + (dy < 0 ? -dy / 15 : dy / 8) + borda + r() * 0.25;
          if (f < 1) px.push([dx, dy, dy < -6 ? 3 : f < 0.4 ? 2 : f < 0.7 ? 1 : 0]);
        }
      }
      return { ...n, px };
    });
    const moradores = [
      { caminho: caminhos.find((c) => c.terraco), cor: [214, 210, 200], calca: [40, 50, 74], pele: 1, cabelo: 0, vel: 13, fase: 0 },
      { caminho: caminhos.find((c) => c.rua), cor: [210, 154, 58], calca: [64, 44, 70], pele: 2, cabelo: 1, vel: 17, fase: 60, saia: true, rabo: true },
      { caminho: caminhos.find((c) => c.rua), cor: [63, 106, 168], calca: [30, 34, 46], pele: 0, cabelo: 0, vel: 12, fase: 420, bone: [180, 40, 40] },
      { caminho: caminhos.find((c) => c.rua), cor: [120, 120, 126], calca: [34, 30, 28], pele: 3, cabelo: 2, vel: 10, fase: 760, sacola: 1 },
      { caminho: caminhos.find((c) => c.id === 'laje-alta'), cor: [184, 67, 47], calca: [44, 58, 76], pele: 3, cabelo: 0, vel: 9, fase: 70, crianca: true },
      { caminho: caminhos.find((c) => c.id === 'laje-baixa'), cor: [122, 143, 106], calca: [43, 43, 43], pele: 4, cabelo: 1, vel: 11, fase: 90, rabo: true },
    ];
    // pássaros pousados no fio entre os postes 2 e 3
    const passaros = [0, 1, 2, 3].map((k) => ({ x: 378 + k * 13 + Math.floor(r() * 5), fase: r() }));
    return { janelas, portas, casas, caminhos, estrelas, cidade, arvores, postes, nuvens, moradores, passaros };
  }

  // ---------------------------------------------------------- utilidades
  function px(ctx, x, y, cor, w = 1, h = 1) {
    ctx.fillStyle = typeof cor === 'string' ? cor : css(cor);
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function fioY(a, b, x, curva, desloc) {
    const t = (x - a[0]) / (b[0] - a[0]);
    return a[1] + desloc + (b[1] - a[1]) * t + Math.sin(Math.PI * t) * curva;
  }
  // brilho pré-desenhado (evita criar gradiente a cada quadro)
  const brilhos = new Map();
  function spriteBrilho(raio, cor) {
    const chave = raio + cor;
    if (brilhos.has(chave)) return brilhos.get(chave);
    const c = document.createElement('canvas');
    c.width = c.height = raio * 2;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(raio, raio, 0, raio, raio, raio);
    gr.addColorStop(0, `rgba(${cor},.55)`);
    gr.addColorStop(0.4, `rgba(${cor},.22)`);
    gr.addColorStop(1, `rgba(${cor},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, raio * 2, raio * 2);
    brilhos.set(chave, c);
    return c;
  }
  function poca(ctx, x, y, raio, cor, k) {
    if (k <= 0.02) return;
    ctx.globalAlpha = Math.min(1, k);
    ctx.drawImage(spriteBrilho(Math.round(raio), cor), Math.round(x - raio), Math.round(y - raio * 0.28), raio * 2, Math.round(raio * 0.56));
    ctx.globalAlpha = 1;
  }
  function brilho(ctx, x, y, raio, cor, k) {
    if (k <= 0.02) return;
    ctx.globalAlpha = Math.min(1, k);
    ctx.drawImage(spriteBrilho(Math.round(raio), cor), Math.round(x - raio), Math.round(y - raio));
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------- camada fixa: céu, luas, morro, cidade
  function desenharCeu(ctx, r) {
    // degradê em faixas com pontilhado entre elas (técnica de pixel art)
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      const t = Math.min(1, y / 260) * (COR.ceu.length - 1);
      const i = Math.min(COR.ceu.length - 2, Math.floor(t));
      const k = t - i;
      for (let x = 0; x < W; x++) {
        const limiar = ((x % 2) + (y % 2) * 2 + 0.5) / 4;
        const c = k > limiar ? COR.ceu[i + 1] : COR.ceu[i];
        const o = (y * W + x) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // véu de nuvens altas fixas
    for (let k = 0; k < 900; k++) {
      const x = Math.floor(r() * W);
      const y = Math.floor(30 + r() * 160);
      if (Math.sin(x * 0.02) + Math.cos(y * 0.05) > 0.9) px(ctx, x, y, COR.nuvem[0], 2, 1);
    }
  }
  function desenharLua(ctx, cx, cy, raio) {
    for (let d = raio + 18; d > raio; d -= 2) {
      ctx.fillStyle = `rgba(190,205,255,${(0.05 * (raio + 18 - d)) / 18})`;
      ctx.beginPath(); ctx.arc(cx, cy, d, 0, Math.PI * 2); ctx.fill();
    }
    const crateras = [[-6, -4, 4], [5, 6, 3], [7, -7, 2], [-3, 9, 2], [-10, 3, 2], [2, -1, 2]];
    for (let y = -raio; y <= raio; y++) {
      for (let x = -raio; x <= raio; x++) {
        if (x * x + y * y > raio * raio) continue;
        let cor = (x + y) > raio * 0.6 ? COR.luaMeio : COR.lua;
        for (const [ax, ay, ar] of crateras) {
          const s = raio / 22;
          if (Math.hypot(x - ax * s, y - ay * s) < ar * s) cor = COR.luaSombra;
        }
        px(ctx, cx + x, cy + y, cor);
      }
    }
  }
  function desenharMorro(ctx, r) {
    for (let x = 430; x < W; x++) {
      const y = morroY(x) + (r() < 0.3 ? 1 : 0);
      px(ctx, x, y, COR.morro, 1, H - y);
      px(ctx, x, y, COR.morroBorda);
      // mata no morro
      if (r() < 0.5) px(ctx, x, y - 1 - Math.floor(r() * 3), COR.morro);
      if (r() < 0.35) px(ctx, x, y + 2 + Math.floor(r() * 6), '#0b1426');
      if (r() < 0.12) px(ctx, x, y - 2 - Math.floor(r() * 4), '#050912', 1, 4); // mata no topo do morro
    }
    // Cristo Redentor no alto do morro
    const cx = 660, cy = morroY(660) - 28;
    const corpo = ['00011000', '00011000', '11111111', '11111111', '00011000', '00011000', '00011000',
      '00011000', '00111100', '00111100', '00111100', '00111100', '01111110', '01111110'];
    // halo dos refletores
    for (let d = 30; d > 4; d -= 2) {
      ctx.fillStyle = `rgba(220,230,255,${0.012 * (30 - d) / 2})`;
      ctx.beginPath(); ctx.arc(cx, cy + 12, d, 0, Math.PI * 2); ctx.fill();
    }
    corpo.forEach((l, y) => [...l].forEach((b, x) => {
      if (b === '1') px(ctx, cx - 8 + x * 2, cy + y * 2, x < 4 ? '#c9d2e6' : '#9aa6c2', 2, 2);
    }));
    // casinhas acesas no morro, ao longe
    for (let k = 0; k < 26; k++) {
      const lx = 500 + Math.floor(r() * 210);
      const ly = 96 + Math.floor(r() * 110);
      if (ly > morroY(lx) + 4) px(ctx, lx, ly, r() < 0.7 ? '#e8a24a' : '#f2d08a');
    }
  }
  function desenharCidade(ctx, cena) {
    for (const p of cena.cidade) {
      px(ctx, p.x, H - p.h, COR.predio[p.tom], p.w, p.h);
      px(ctx, p.x, H - p.h, '#16244a', 1, p.h);
      px(ctx, p.x, H - p.h, '#16244a', p.w, 1);
      if (p.antena) {
        px(ctx, p.x + Math.floor(p.w / 2), H - p.h - 10, COR.predio[2], 1, 10);
      }
    }
  }

  // ---------------------------------------------------------- casas
  function desenharCasa(ctx, c, r) {
    const [base, claro, escuro] = MUROS[c.muro];
    // reboco: textura pixel a pixel (manchas, desgaste, sujeira escorrida)
    const img = ctx.createImageData(c.w, c.h);
    for (let y = 0; y < c.h; y++) {
      for (let x = 0; x < c.w; x++) {
        // granulado fino com manchas grandes e suaves (umidade), sem padrão repetido
        const mancha = Math.sin((c.x + x) * 0.07 + c.i * 1.7) * Math.cos((c.y + y) * 0.09 - c.i) * 0.5;
        const n = mancha + (r() - 0.5) * 1.1;
        const cor = n > 0.58 ? claro : n < -0.6 ? escuro : base;
        const o = (y * c.w + x) * 4;
        img.data[o] = cor[0]; img.data[o + 1] = cor[1]; img.data[o + 2] = cor[2]; img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, c.x, c.y);
    // luz da lua na quina esquerda, sombra na direita
    px(ctx, c.x, c.y, css(mistura(claro, [120, 135, 180], 0.25)), 2, c.h);
    px(ctx, c.x + c.w - 3, c.y, css(mistura(escuro, [6, 8, 16], 0.4)), 3, c.h);
    const tijolos = (x0, y0, w, h, fundo, rejunte) => {
      px(ctx, x0, y0, css(fundo), w, h);
      for (let y = y0; y < y0 + h; y += 4) {
        px(ctx, x0, y, css(rejunte), w, 1);
        const off = (y / 4) % 2 ? 0 : 4;
        for (let x = x0 + off; x < x0 + w; x += 8) px(ctx, x, y, css(rejunte), 1, 4);
        for (let x = x0 + 1; x < x0 + w; x += 3) if (r() < 0.25) px(ctx, x, y + 1 + Math.floor(r() * 2), css(mistura(fundo, [255, 200, 160], 0.08)));
      }
    };
    if (c.muro === 'tijolo') tijolos(c.x + 2, c.y + 6, c.w - 5, c.h - 6, MUROS.tijolo[0], MUROS.tijolo[2]);
    for (const [bx, by, bw, bh] of c.buracos) {
      tijolos(bx, by, bw, bh, TIJOLO[0], TIJOLO[2]);
      px(ctx, bx - 1, by - 1, css(claro), bw + 2, 1);
      px(ctx, bx - 1, by + bh, css(escuro), bw + 2, 1);
    }
    // sujeira escorrendo da laje
    for (let x = c.x + 5; x < c.x + c.w - 4; x += 5 + Math.floor(r() * 9)) {
      const comp = 4 + Math.floor(r() * 14);
      for (let k = 0; k < comp; k++) if (r() < 0.8) px(ctx, x, c.y + 5 + k, css(mistura(escuro, [0, 0, 0], 0.15)));
    }
    // contorno escuro (pixel art) e sombra sob a laje
    px(ctx, c.x - 1, c.y, '#06070b', 1, c.h);
    px(ctx, c.x + c.w, c.y, '#06070b', 1, c.h);
    for (let k = 0; k < 5; k++) px(ctx, c.x, c.y + 6 + k, `rgba(0,0,0,${0.32 - k * 0.06})`, c.w, 1);
    // laje saliente com borda de luar
    px(ctx, c.x - 4, c.y - 1, '#06070b', c.w + 8, 1);
    px(ctx, c.x - 3, c.y, '#a6b2d2', c.w + 6, 1);
    px(ctx, c.x - 3, c.y + 1, COR.laje, c.w + 6, 3);
    px(ctx, c.x - 3, c.y + 4, COR.lajeSombra, c.w + 6, 2);
    px(ctx, c.x - 4, c.y + 6, '#06070b', c.w + 8, 1);
    for (let x = c.x; x < c.x + c.w; x += 7) px(ctx, x, c.y + 6, css(mistura(escuro, [0, 0, 0], 0.4)), 3, 1);
    if (c.o.grade) {
      px(ctx, c.x, c.y - 10, COR.grade, c.w, 2);
      for (let x = c.x; x < c.x + c.w; x += 5) px(ctx, x, c.y - 10, COR.grade, 1, 10);
    }
    if (c.o.caixa) {
      const x = c.x + c.w - 26;
      px(ctx, x + 1, c.y - 15, COR.caixa, 18, 15);
      px(ctx, x + 1, c.y - 15, COR.caixaClara, 4, 15);
      px(ctx, x + 14, c.y - 15, COR.caixaSombra, 5, 15);
      px(ctx, x, c.y - 17, COR.caixaTopo, 20, 3);
      px(ctx, x + 2, c.y - 18, COR.caixaClara, 16, 1);
      px(ctx, x + 1, c.y - 9, COR.caixaSombra, 18, 1);
      px(ctx, x + 1, c.y - 4, COR.caixaSombra, 18, 1);
      px(ctx, x + 8, c.y - 19, '#1d3672', 4, 2);
    }
    if (c.o.antena) {
      px(ctx, c.x + 12, c.y - 26, COR.grade, 1, 26);
      for (let k = 0; k < 3; k++) px(ctx, c.x + 6 + k, c.y - 26 + k * 6, COR.grade, 13 - k * 2, 1);
    }
    if (c.o.parabolica) {
      const x = c.x + 10, y = c.y - 12;
      for (let k = 0; k < 6; k++) px(ctx, x + k, y + Math.abs(3 - k), '#8a8f9a', 2, 1);
      px(ctx, x + 3, y + 4, '#5f636c', 1, 8);
    }
    if (c.o.obra) {
      for (const cx of [c.x + 4, c.x + c.w - 10]) {
        px(ctx, cx, c.y - 18, '#4c4a47', 6, 18);
        px(ctx, cx, c.y - 18, '#5d5a56', 2, 18);
        for (let k = 0; k < 3; k++) px(ctx, cx + 1 + k * 2, c.y - 24, '#2a2622', 1, 6);
      }
      for (let k = 0; k < 4; k++) {
        const bx = c.x + 16 + (k % 2) * 9;
        const by = c.y - 6 - Math.floor(k / 2) * 6;
        px(ctx, bx, by, '#5a5550', 8, 5);
        px(ctx, bx + 2, by + 1, '#3a3632', 2, 3);
        px(ctx, bx + 5, by + 1, '#3a3632', 2, 3);
      }
    }
    if (c.o.escada) {
      const degraus = Math.floor(c.h / 6);
      for (let k = 0; k < degraus; k++) {
        const sx = c.x + c.w - 10 - k * 4;
        const sy = c.y + c.h - 4 - k * 6;
        if (sx < c.x + 4) break;
        px(ctx, sx, sy, COR.lajeClara, 10, 1);
        px(ctx, sx, sy + 1, COR.laje, 10, 2);
        px(ctx, sx, sy + 3, COR.lajeSombra, 10, 3);
      }
      for (let k = 0; k < degraus; k += 2) {
        const sx = c.x + c.w - 2 - k * 4;
        const sy = c.y + c.h - 14 - k * 6;
        if (sx < c.x + 8) break;
        px(ctx, sx, sy, COR.grade, 1, 10);
        px(ctx, sx - 8, sy - 6, COR.grade, 9, 1);
      }
    }
    if (c.o.vasos) {
      for (let k = 0; k < 3; k++) {
        const vx = c.x + 8 + k * 12;
        px(ctx, vx, c.y - 5, '#7a4a30', 6, 5);
        px(ctx, vx, c.y - 5, '#8f5a3a', 6, 1);
        for (let f = 0; f < 6; f++) px(ctx, vx - 1 + f + (f % 2), c.y - 9 + (f % 3), COR.folha[3 + (f % 2)], 1, 3);
      }
    }
    if (c.o.cadeiras) {
      for (const [cx, cor] of [[c.x + 30, '#d8d8d0'], [c.x + 44, '#3a7ad0']]) {
        px(ctx, cx, c.y - 9, cor, 1, 9);
        px(ctx, cx, c.y - 5, cor, 7, 1);
        px(ctx, cx + 6, c.y - 5, cor, 1, 5);
      }
    }
    if (c.o.selo) {
      // selo da BIG STUDIO pintado na parede (única marca dentro da cena)
      const cores = ['#d6d6d0', '#6fa8ff', '#d6d6d0', '#d6d6d0', '#22c55e', '#f0b429', '#4a4a50', '#d6d6d0', '#d6d6d0'];
      const sx = c.x + 30, sy = c.y + 18;
      cores.forEach((cor, i) => {
        const bx = sx + (i % 3) * 11, by = sy + Math.floor(i / 3) * 11;
        px(ctx, bx, by, cor, 9, 9);
        for (let k = 0; k < 6; k++) px(ctx, bx + Math.floor(r() * 9), by + Math.floor(r() * 9), css(MUROS[c.muro][0], 0.35)); // tinta gasta
      });
    }
    if (c.o.bandeira) {
      const x = c.x + 10, y = c.y + 14;
      px(ctx, x, y, '#1c6a34', 28, 18);
      for (let k = 0; k <= 8; k++) px(ctx, x + 4 + k, y + 9 - k, '#d8b832', 20 - 2 * k > 0 ? 20 - 2 * k : 1, 2 * k + 1 > 17 ? 17 : 1);
      for (let yy = 0; yy < 18; yy++) {
        const meio = 9;
        const larg = Math.max(0, 12 - Math.abs(yy - meio) * 1.4);
        px(ctx, x + 14 - larg, y + yy, '#d8b832', larg * 2, 1);
      }
      for (let yy = 5; yy < 13; yy++) {
        const larg = Math.max(0, 5 - Math.abs(yy - 9) * 1.2);
        px(ctx, x + 14 - larg, y + yy, '#2a4aa0', larg * 2, 1);
      }
      px(ctx, x + 10, y + 9, '#e8e8e0', 8, 1);
    }
    if (c.o.mural) {
      escrever(ctx, 'A TECNOLOGIA', c.x + 18, c.y + 26, 2);
      escrever(ctx, 'TAMBÉM', c.x + 52, c.y + 50, 2);
      escrever(ctx, 'NASCE AQUI', c.x + 30, c.y + 74, 2);
      // respingos de spray
      for (let k = 0; k < 40; k++) px(ctx, c.x + 14 + Math.floor(r() * 180), c.y + 18 + Math.floor(r() * 80), css([238, 122, 98], 0.5));
    }
    if (c.o.computador) {
      // janelão da sala dos computadores (o interior é desenhado a cada quadro)
      px(ctx, c.x + 10, c.y + 10, COR.moldura, 72, 42);
      px(ctx, c.x + 6, c.y + 52, COR.lajeClara, 106, 1);
      px(ctx, c.x + 6, c.y + 53, COR.laje, 106, 3);
      px(ctx, c.x + 6, c.y + 56, COR.lajeSombra, 106, 2);
      px(ctx, c.x + 6, c.y + 42, COR.grade, 106, 2);
      for (let x = c.x + 6; x < c.x + 112; x += 5) px(ctx, x, c.y + 42, COR.grade, 1, 10);
    }
    if (c.o.terraco) {
      px(ctx, c.x, c.y + 18, COR.grade, c.w, 2);
      for (let x = c.x; x < c.x + c.w; x += 6) px(ctx, x, c.y + 18, COR.grade, 1, 16);
    }
  }
  function escrever(ctx, s, x, y, e) {
    let cx = x;
    let i = 0;
    for (const ch of s) {
      const sobe = -Math.round(i * 0.5) * e; // letreiro subindo, como pichação
      i++;
      if (ch === ' ') { cx += 4 * e; continue; }
      const g = FONTE[ch === 'É' ? 'E' : ch];
      if (!g) { cx += 6 * e; continue; }
      const desenha = (dx, dy, cor) => g.forEach((l, gy) => [...l].forEach((b, gx) => {
        if (b === '1') px(ctx, cx + gx * e + dx, y + sobe + gy * e + dy, cor, e, e);
      }));
      desenha(2, 2, COR.muralSombra);
      desenha(0, 0, COR.mural);
      g.forEach((l, gy) => [...l].forEach((b, gx) => { if (b === '1' && gy === 0) px(ctx, cx + gx * e, y + sobe, COR.muralLuz, e, 1); }));
      if (ch === 'É') { px(ctx, cx + 2 * e, y + sobe - 3 * e, COR.mural, e, e); px(ctx, cx + 3 * e, y + sobe - 4 * e, COR.mural, e, e); }
      cx += 6 * e;
    }
  }
  function desenharFios(ctx, cena) {
    for (const [x, y, base] of cena.postes) {
      px(ctx, x - 1, y, '#07080c', 4, base - y); // contorno
      px(ctx, x, y, COR.poste, 2, base - y);
      px(ctx, x, y, '#2a2c36', 1, base - y);
      px(ctx, x - 6, y + 2, COR.poste, 14, 2);
      px(ctx, x + 6, y + 4, '#2a2a30', 3, 2);
      if (x === 356) { px(ctx, x - 8, y + 12, '#2a2d36', 7, 10); px(ctx, x - 8, y + 12, '#3a3e4a', 2, 10); } // transformador
      if (base < H) px(ctx, x - 3, base - 2, '#3a3632', 8, 2); // base de concreto na laje
    }
  }
  function ligacoes(cena) {
    const ps = [...cena.postes].map(([x, y]) => [x, y]).sort((a, b) => a[0] - b[0]);
    const lista = [];
    for (let i = 0; i < ps.length - 1; i++) {
      lista.push([ps[i], ps[i + 1], 14, 3], [ps[i], ps[i + 1], 20, 7], [ps[i], ps[i + 1], 10, 1]);
    }
    lista.push([[0, 270], ps[0], 12, 1], [ps[ps.length - 1], [W, 150], 12, 2], [[560, 118], [W, 96], 10, 4]);
    // gatos de luz: fios finos descendo dos postes para as casas
    lista.push([[356, 126], [300, 168], 6, 2], [[560, 118], [500, 152], 5, 3], [[252, 302], [212, 274], 4, 2],
      [[470, 306], [520, 250], 4, 2], [[700, 168], [650, 222], 4, 2]);
    return lista;
  }

  // ---------------------------------------------------------- janelas
  function intensidade(j, t) {
    if (j.modo === 'fixa') return j.acesa ? 1 : 0;
    if (j.modo === 'respira') return j.acesa ? 0.8 + 0.2 * Math.sin(((t + j.fase) / j.periodo) * Math.PI * 2) : 0;
    if (j.modo === 'tv') return 0.55 + 0.45 * Math.abs(Math.sin(t * 3.1 + Math.sin(t * 1.7) * 2));
    const f = ((t + j.fase) % j.periodo) / j.periodo;
    return (j.acesa ? f < 0.74 : f > 0.58) ? 1 : 0;
  }
  function desenharJanela(ctx, j, k, t) {
    const { x, y, w, h } = j;
    px(ctx, x - 2, y - 2, COR.moldura, w + 4, h + 4);
    px(ctx, x - 3, y + h + 2, COR.peitoril, w + 6, 2);
    px(ctx, x - 3, y + h + 4, COR.lajeSombra, w + 6, 1);
    if (k <= 0.05) {
      px(ctx, x, y, COR.vidro, w, h);
      px(ctx, x, y, COR.vidroReflexo, w, 2);
      px(ctx, x + 1, y + 3, '#1c2438', 2, h - 4);
    } else {
      const [c1, c2, c3] = j.tv ? COR.tela : COR.luz[j.cor];
      ctx.globalAlpha = 0.3 + 0.7 * k;
      px(ctx, x, y, c3, w, h);
      px(ctx, x, y, c2, w, h - 3);
      px(ctx, x + 1, y + 1, c1, w - 2, Math.max(1, Math.floor(h / 2) - 1));
      ctx.globalAlpha = 1;
      // o que acontece dentro
      if (j.dentro === 'pessoa') {
        const andar = Math.sin((t + j.fase) / 3.5);
        const sx = x + 2 + Math.round((andar * 0.5 + 0.5) * (w - 6));
        if (Math.sin((t + j.fase) / 9) > -0.3) {
          px(ctx, sx, y + h - 7, '#2a1a12', 4, 7);
          px(ctx, sx + 1, y + h - 10, '#2a1a12', 2, 3);
        }
      } else if (j.dentro === 'planta') {
        px(ctx, x + 1, y + h - 3, '#4a2c1c', 3, 3);
        px(ctx, x, y + h - 7, '#2a4a2c', 5, 4);
      } else if (j.dentro === 'estante') {
        px(ctx, x + w - 4, y + 2, '#3a2418', 3, h - 2);
        px(ctx, x + w - 4, y + 4, '#c86a4a', 1, 2);
        px(ctx, x + w - 3, y + 7, '#4a7ac8', 1, 2);
      } else if (j.dentro === 'tv') {
        px(ctx, x + 2, y + h - 5, '#101420', w - 4, 2);
      }
      if (j.cortina) {
        const vento = Math.round(Math.sin(t * 1.3 + j.fase) * 0.8);
        px(ctx, x, y, j.cortina, 2 + Math.max(0, vento), h);
        px(ctx, x + w - 2, y, j.cortina, 2, h);
      }
      // luz derramando no peitoril
      px(ctx, x - 3, y + h + 2, css([255, 175, 90], 0.45 * k), w + 6, 1);
    }
    if (j.persiana) for (let yy = y; yy < y + h; yy += 2) px(ctx, x, yy, 'rgba(20,14,10,.55)', w, 1);
    if (j.grade) for (let gx = x + 1; gx < x + w; gx += 3) px(ctx, gx, y, '#15110d', 1, h);
    else px(ctx, x + Math.floor(w / 2), y, COR.moldura, 1, h);
    if (!j.grade && h > 10) px(ctx, x, y + Math.floor(h / 2), COR.moldura, w, 1);
  }
  function desenharPorta(ctx, p, t) {
    const { x, y } = p;
    px(ctx, x - 2, y - 3, COR.moldura, 14, 23);
    px(ctx, x, y, p.acesa ? COR.portaLuz : COR.porta, 10, 20);
    if (p.acesa) {
      px(ctx, x + 2, y + 2, '#ffd08a', 6, 16);
      px(ctx, x + 2, y + 2, '#ffe7b8', 6, 4);
    } else {
      px(ctx, x + 1, y + 2, '#3a2418', 8, 7);
      px(ctx, x + 1, y + 11, '#3a2418', 8, 7);
    }
    px(ctx, x + 7, y + 10, '#c8a060');
    // luminária sobre a porta
    px(ctx, x + 3, y - 6, '#2a2620', 4, 2);
    px(ctx, x + 4, y - 4, '#ffe0a0', 2, 1);
  }

  // ---------------------------------------------------------- pessoas (24 px)
  function pessoa(ctx, x, y, m, quadro, dir, pose, contorno) {
    const P = (xx, yy, cor, w = 1, h = 1) => px(ctx, xx, yy, contorno || cor, w, h);
    const alt = m.crianca ? 17 : 24;
    const k = alt / 24;
    const pele = COR.pele[m.pele];
    const cabelo = COR.cabelo[m.cabelo || 0];
    const sombra = (c, f = 0.7) => css(c.map((v) => Math.round(v * f)));
    const camisa = m.cor;
    const fx = (dx) => x + dx * dir;
    const perna = Math.round(9 * k);
    const tronco = Math.round(9 * k);
    const ombro = pose === 'sentado' ? y - 3 - tronco : y - perna - tronco;
    // pernas
    if (pose === 'sentado') {
      // sentado na beira da laje: coxas na horizontal, canelas penduradas balançando
      const balanca = quadro % 2;
      P(x - 2, y - 3, css(m.calca), 7, 3);
      P(fx(4) + balanca * dir, y, css(m.calca), 2, 6);
      P(fx(2) + (1 - balanca) * dir, y, sombra(m.calca), 2, 6);
      P(fx(4) + balanca * dir, y + 6, '#161616', 3, 1);
    } else {
      const passos = pose === 'anda' ? [[-3, 3], [-1, 1], [3, -3], [1, -1]][quadro] : [[0, 0]][0];
      const [p1, p2] = passos;
      // perna de trás (mais escura) e da frente
      for (let i = 0; i < perna; i++) {
        const t = i / perna;
        P(x + Math.round(p2 * t * dir) - 1, y - perna + i, sombra(m.calca), 2, 1);
        P(x + Math.round(p1 * t * dir), y - perna + i, css(m.calca), 2, 1);
      }
      P(x + p2 * dir - 2, y - 1, '#141414', 4, 1);
      P(x + p1 * dir - 1, y - 1, '#1c1c1c', 4, 1);
      if (m.saia) P(x - 3, y - perna - 1, css(m.calca), 7, 4);
    }
    // tronco com sombra e borda de luz quente
    P(x - 2, ombro, css(camisa), 5, tronco);
    P(fx(-2), ombro, sombra(camisa), 1, tronco);
    P(fx(3), ombro + 1, css(mistura(camisa, [255, 170, 90], 0.45)), 1, tronco - 2);
    if (m.sacola) P(fx(3), ombro + tronco - 1, '#d8d4c8', 3, 4);
    // braços
    if (pose === 'acena') {
      const sobe = quadro % 2;
      P(fx(3), ombro - 5 + sobe, pele, 1, 6);
      P(fx(-3), ombro - 5 + (1 - sobe), pele, 1, 6);
    } else {
      const balanco = pose === 'anda' ? [-2, 0, 2, 0][quadro] : 0;
      for (let i = 0; i < 7; i++) P(fx(1) + Math.round((balanco * i) / 7) * dir, ombro + 1 + i, i > 5 ? pele : sombra(camisa, 0.85), 1, 1);
    }
    // cabeça
    const cab = ombro - 6;
    P(x - 2, cab, pele, 5, 5);
    P(fx(3), cab + 2, pele, 1, 2);
    P(fx(2), cab + 2, '#120c08');
    P(x - 2, cab - 1, cabelo, 5, 2);
    P(fx(-2), cab, cabelo, 2, 3);
    if (m.rabo) P(fx(-3), cab + 1, cabelo, 1, 5);
    if (m.bone) { P(x - 2, cab - 2, css(m.bone), 5, 2); P(fx(3), cab - 1, css(m.bone), 2, 1); }
    P(x - 1, ombro - 1, pele, 3, 1); // pescoço
  }

  function desenharPessoa(ctx, x, y, m, quadro, dir, pose = 'anda') {
    // contorno de 1 px em volta da figura (dá presença contra os muros)
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pessoa(ctx, x + dx, y + dy, m, quadro, dir, pose, '#07070a');
    pessoa(ctx, x, y, m, quadro, dir, pose);
  }

  // ---------------------------------------------------------- criação
  function criar(canvas, opcoes = {}) {
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const cena = montar();
    const r = semente(7);

    const fundo = document.createElement('canvas');
    fundo.width = W; fundo.height = H;
    const f = fundo.getContext('2d');
    desenharCeu(f, r);
    desenharLua(f, 196, 124, 22);
    desenharMorro(f, r);
    desenharCidade(f, cena);

    const casas = document.createElement('canvas');
    casas.width = W; casas.height = H;
    const c = casas.getContext('2d');
    for (const casa of cena.casas) desenharCasa(c, casa, r);
    desenharFios(c, cena);
    const fios = ligacoes(cena);
    // árvores: 5 posições de balanço pré-desenhadas; nuvens: um quadro cada
    for (const a of cena.arvores) {
      a.estados = [-1, -0.5, 0, 0.5, 1].map((bal) => {
        const tela = document.createElement('canvas');
        const m = a.r + 10;
        tela.width = m * 2; tela.height = m + (a.base ? a.base - a.y : m) + 10;
        const g = tela.getContext('2d');
        px(g, m - 2, m, COR.tronco, 4, (a.base ? a.base - a.y : a.r + 8));
        for (const [dx, dy, tom, solto] of a.px) {
          g.fillStyle = COR.folha[tom];
          g.fillRect(m + dx + (solto ? Math.round(bal * solto * 1.4) : 0), m + dy, 1, 1);
        }
        return { tela, m };
      });
    }
    for (const n of cena.nuvens) {
      const tela = document.createElement('canvas');
      tela.width = n.w + 2; tela.height = 26;
      const g = tela.getContext('2d');
      for (const [dx, dy, tom] of n.px) px(g, n.w / 2 + dx, 14 + dy, COR.nuvem[tom]);
      n.tela = tela;
    }
    const porNome = (o) => cena.casas.find((x) => x.o[o]);

    let t0 = performance.now();
    let tempo = opcoes.tempoInicial || 0;
    let rodando = false;
    let ultimo = 0;

    function quadro(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(fundo, 0, 0);
      // cidade
      for (const p of cena.cidade) {
        for (const [jx, jy, k, s] of p.jan) {
          if ((Math.floor(t / (6 + s * 20) + s * 100) % 7) !== 0) px(ctx, jx, jy, COR.janelaCidade[k], 2, 2);
        }
        if (p.antena) px(ctx, p.x + Math.floor(p.w / 2), H - p.h - 11, Math.floor(t * 1.5) % 2 ? '#ff4a3a' : '#5a1a14');
      }
      // estrelas
      for (const e of cena.estrelas) {
        const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (0.7 + e.brilho * 1.2) + e.fase));
        ctx.globalAlpha = a * (0.45 + e.brilho * 0.55);
        px(ctx, e.x, e.y, COR.estrela);
        if (e.grande && a > 0.8) { px(ctx, e.x - 1, e.y, COR.estrela); px(ctx, e.x + 1, e.y, COR.estrela); px(ctx, e.x, e.y - 1, COR.estrela); px(ctx, e.x, e.y + 1, COR.estrela); }
      }
      ctx.globalAlpha = 1;
      // estrela cadente (a cada 23 s)
      const ec = t % 23;
      if (ec < 0.9) {
        const k = ec / 0.9;
        const sx = 120 + k * 160, sy = 20 + k * 50;
        for (let i = 0; i < 18; i++) { ctx.globalAlpha = (1 - i / 18) * (1 - k); px(ctx, sx - i * 1.6, sy - i * 0.5, '#ffffff'); }
        ctx.globalAlpha = 1;
      }
      // avião piscando (a cada 47 s)
      const av = t % 47;
      if (av < 22) {
        const ax = W + 20 - (av / 22) * (W + 60), ay = 34 + av * 0.6;
        px(ctx, ax, ay, '#2a2f3e', 6, 1);
        if (Math.floor(t * 2) % 2) px(ctx, ax, ay, '#ff4a4a');
        if (Math.floor(t * 2 + 1) % 3 === 0) px(ctx, ax + 5, ay, '#ffffff');
      }
      // nuvens
      for (const n of cena.nuvens) {
        const x = ((n.fase + t * n.vel) % (W + n.w * 2)) - n.w;
        ctx.drawImage(n.tela, Math.round(x - n.w / 2), n.y - 14);
      }
      const arvore = (a) => {
        const bal = Math.sin(t * 1.2 + a.fase);
        const e = a.estados[Math.max(0, Math.min(4, Math.round((bal + 1) * 2)))];
        ctx.drawImage(e.tela, a.x - e.m, a.y - e.m);
      };
      for (const a of cena.arvores) if (a.atras) arvore(a);
      ctx.drawImage(casas, 0, 0);
      // fios balançando de leve com o vento
      ctx.fillStyle = COR.fio;
      const vento = Math.sin(t * 0.8) * 1.2;
      for (const [a, b, curva, desloc] of fios) {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) {
          ctx.fillRect(x, Math.round(fioY(a, b, x, curva + vento, desloc)), 1, 1);
        }
      }
      // pássaros no fio (levantam voo a cada 31 s e voltam)
      const pv = t % 31;
      const fio = true;
      for (const pa of cena.passaros) {
        let bx = pa.x, by = fioY([356, 126], [470, 306], pa.x, 14 + vento, 3) - 3;
        if (fio && pv > 20) {
          const voo = Math.min(1, (pv - 20) / 3) - Math.max(0, (pv - 28) / 3);
          bx += voo * (60 + pa.fase * 40);
          by -= voo * (50 + pa.fase * 30);
        }
        const asa = pv > 20 && pv < 30 ? Math.floor(t * 8 + pa.fase * 4) % 2 : 0;
        px(ctx, bx, by, '#0b0c10', 4, 2);
        px(ctx, bx + 3, by - 1, '#0b0c10', 2, 2);
        px(ctx, bx - 1, by - 1 - asa, '#0b0c10', 3, 1);
      }
      // árvores (tufos do alto balançam)
      for (const a of cena.arvores) if (!a.atras) arvore(a);
      // janelas e portas
      for (const j of cena.janelas) desenharJanela(ctx, j, intensidade(j, t), t);
      for (const p of cena.portas) desenharPorta(ctx, p, t);
      desenharComputador(ctx, porNome('computador'), t);
      // luz quente tingindo os muros (overlay) e depois clareando (aditivo)
      ctx.globalCompositeOperation = 'overlay';
      for (const j of cena.janelas) {
        const k = intensidade(j, t);
        brilho(ctx, j.x + j.w / 2, j.y + j.h / 2, 26 + j.w * 3, j.tv ? '90,140,255' : '255,120,30', k * 0.72);
      }
      for (const p of cena.portas) if (p.acesa) brilho(ctx, p.x + 5, p.y + 10, 36, '255,120,30', 1);
      ctx.globalCompositeOperation = 'lighter';
      for (const j of cena.janelas) {
        const k = intensidade(j, t);
        brilho(ctx, j.x + j.w / 2, j.y + j.h / 2, 20 + j.w * 2.8, j.tv ? '110,160,255' : '255,140,50', k);
      }
      for (const p of cena.portas) if (p.acesa) brilho(ctx, p.x + 5, p.y + 10, 30, '255,140,50', 1);
      cena.postes.forEach(([x, y, base], i) => {
        const pisca = i === 1 ? (Math.sin(t * 13) > 0.2 || Math.floor(t) % 5 ? 1 : 0.2) : 1;
        px(ctx, x + 6, y + 6, '#ffe6b0', 3, 1);
        brilho(ctx, x + 7, y + 8, 28, '255,200,120', pisca);
        poca(ctx, x + 7, base - 1, 34, '255,190,110', 0.8 * pisca); // poça de luz no chão
      });
      for (const p of cena.portas) if (p.acesa) poca(ctx, p.x + 5, p.y + 20, 22, '255,150,60', 0.9);
      ctx.globalCompositeOperation = 'source-over';
      // vida nas lajes
      desenharVaral(ctx, porNome('varal'), t);
      desenharPipa(ctx, porNome('pipa'), t);
      desenharSentado(ctx, porNome('sentado'), t);
      desenharBola(ctx, porNome('bola'), t);
      desenharGato(ctx, porNome('gato'), t);
      desenharCachorro(ctx, 690, 220, t);
      // moradores
      for (const m of cena.moradores) {
        if (!m.caminho) continue;
        const { x0, x1, y } = m.caminho;
        const L = x1 - x0;
        const s = (m.fase + t * m.vel) % (L * 2);
        const indo = s < L;
        const x = indo ? x0 + s : x1 - (s - L);
        const q = Math.floor(t * (m.crianca ? 10 : 7) + m.fase) % 4;
        desenharPessoa(ctx, Math.round(x), y, m, q, indo ? 1 : -1);
      }
      desenharMoto(ctx, t);
    }

    function desenharComputador(g, casa, t) {
      if (!casa) return;
      const x = casa.x + 12, y = casa.y + 12;
      px(g, x, y, '#2b4a86', 68, 38);
      px(g, x, y, '#4f7fd0', 68, 12);
      px(g, x, y, '#6f9be6', 68, 3);
      // prateleira e pôster no fundo
      px(g, x + 50, y + 6, '#d8b878', 12, 9);
      px(g, x + 52, y + 8, '#8a5a3a', 8, 5);
      px(g, x + 4, y + 10, '#2a3a60', 14, 2);
      // mesa e monitores
      px(g, x + 6, y + 28, '#3a2c22', 58, 3);
      px(g, x + 8, y + 31, '#2a1e16', 2, 7);
      px(g, x + 60, y + 31, '#2a1e16', 2, 7);
      const brilhoTela = 0.82 + 0.18 * Math.sin(t * 5);
      g.globalAlpha = brilhoTela;
      px(g, x + 22, y + 15, '#1a1a22', 14, 11); px(g, x + 23, y + 16, '#bfe0ff', 12, 8);
      px(g, x + 42, y + 15, '#1a1a22', 14, 11); px(g, x + 43, y + 16, '#ffe2a8', 12, 8);
      // código rolando na tela
      for (let k = 0; k < 3; k++) px(g, x + 24, y + 17 + ((k * 3 + Math.floor(t * 4)) % 7), '#3a6ab0', 4 + ((k * 5) % 6), 1);
      g.globalAlpha = 1;
      // os dois, de costas, digitando e conversando
      const tecla1 = Math.floor(t * 7) % 2;
      const tecla2 = Math.floor(t * 5 + 1) % 3 === 0 ? 1 : 0;
      const vira = Math.floor(t / 5) % 4 === 3 ? 1 : 0;
      // pessoa 1
      px(g, x + 18, y + 14, '#120c09', 7, 7);
      px(g, x + 17, y + 21, '#1e2a40', 10, 9);
      px(g, x + 26, y + 26 - tecla1, '#5a3624', 2, 2);
      // pessoa 2 (vira a cabeça para conversar)
      px(g, x + 38 - vira * 2, y + 14, '#120c09', 7, 7);
      if (vira) px(g, x + 36, y + 17, '#6e4630', 1, 2);
      px(g, x + 37, y + 21, '#22324a', 10, 9);
      px(g, x + 46, y + 26 - tecla2, '#6e4630', 2, 2);
      // cadeiras
      px(g, x + 16, y + 30, '#141414', 12, 3);
      px(g, x + 36, y + 30, '#141414', 12, 3);
      px(g, x + 21, y + 33, '#141414', 2, 4);
      px(g, x + 41, y + 33, '#141414', 2, 4);
      g.globalCompositeOperation = 'lighter';
      brilho(g, x + 34, y + 20, 48, '110,160,255', 0.9);
      g.globalCompositeOperation = 'source-over';
    }
    function desenharVaral(g, casa, t) {
      if (!casa) return;
      const x = casa.x + 8, y = casa.y - 20;
      px(g, x, y - 4, COR.grade, 2, 24);
      px(g, x + 62, y - 4, COR.grade, 2, 24);
      for (let k = 0; k < 62; k++) px(g, x + 1 + k, y + Math.round(Math.sin((k / 62) * Math.PI) * 2), '#3a3a42');
      const roupas = [['#c9473a', 8, 10], ['#e8e2d0', 10, 7], ['#3f6aa8', 7, 11], ['#e0b63a', 9, 8], ['#6a4a9a', 8, 9]];
      roupas.forEach(([cor, w, h], i) => {
        const vento = Math.round(Math.sin(t * 2.4 + i * 1.3) * 1.5);
        const rx = x + 4 + i * 12;
        const ry = y + 1 + Math.round(Math.sin(((rx - x) / 62) * Math.PI) * 2);
        for (let k = 0; k < h; k++) px(g, rx + Math.round((vento * k) / h), ry + k, cor, w, 1);
        px(g, rx + 1, ry, '#1a1a1a', 1, 1);
      });
      // moradora estendendo roupa
      const m = { cor: [140, 60, 90], calca: [40, 36, 48], pele: 2, cabelo: 1, rabo: true };
      desenharPessoa(g, x + 70, casa.y, m, Math.floor(t * 1.5) % 2, -1, Math.floor(t / 3) % 2 ? 'acena' : 'parado');
    }
    function desenharPipa(g, casa, t) {
      if (!casa) return;
      const cx = casa.x + 20, cy = casa.y;
      const crianca = { cor: [63, 106, 168], calca: [31, 36, 48], pele: 2, cabelo: 0, crianca: true };
      desenharPessoa(g, cx, cy, crianca, Math.floor(t * 2) % 2, -1, 'parado');
      px(g, cx - 3, cy - 18, COR.pele[2], 1, 4);
      const kx = cx - 96 + Math.round(Math.sin(t * 0.9) * 6);
      const ky = cy - 118 + Math.round(Math.cos(t * 1.3) * 4);
      // linha (curva) ponto a ponto
      for (let k = 0; k <= 60; k++) {
        const s = k / 60;
        const lx = cx - 3 + (kx + 5 - (cx - 3)) * s;
        const ly = cy - 18 + (ky + 6 - (cy - 18)) * s + Math.sin(s * Math.PI) * 10;
        g.globalAlpha = 0.55;
        px(g, lx, ly, '#e6ecff');
      }
      g.globalAlpha = 1;
      const forma = ['00000100000', '00001110000', '00011111000', '00111111100', '01111111110', '00111111100', '00011111000', '00001110000', '00000100000'];
      forma.forEach((l, yy) => [...l].forEach((b, xx) => {
        if (b === '1') px(g, kx + xx, ky + yy, xx === 5 || yy === 4 ? '#1a1410' : xx < 5 ? '#e2be46' : '#2eaa68');
      }));
      for (let k = 0; k < 10; k++) px(g, kx + 5 + Math.round(Math.sin(t * 3 + k * 0.7) * 2), ky + 9 + k * 2, k % 2 ? '#f0d278' : '#d24a3c', 2, 2);
    }
    function desenharSentado(g, casa, t) {
      if (!casa) return;
      const m = { cor: [60, 140, 90], calca: [40, 40, 60], pele: 0, cabelo: 0, bone: [30, 30, 30] };
      desenharPessoa(g, casa.x + casa.w - 18, casa.y + 2, m, Math.floor(t * 2.5) % 2, 1, 'sentado');
    }
    function desenharBola(g, casa, t) {
      if (!casa) return;
      const y = casa.y;
      const a = { cor: [230, 200, 60], calca: [30, 60, 120], pele: 1, cabelo: 0, crianca: true };
      const b = { cor: [230, 230, 230], calca: [30, 30, 30], pele: 3, cabelo: 0, crianca: true };
      const ciclo = (t % 2.4) / 2.4;
      const ida = ciclo < 0.5;
      const k = ida ? ciclo * 2 : (1 - ciclo) * 2;
      const x0 = casa.x + 8, x1 = casa.x + casa.w - 10;
      const bx = x0 + 4 + (x1 - x0 - 8) * k;
      const by = y - 3 - Math.abs(Math.sin(k * Math.PI * 2)) * 8;
      desenharPessoa(g, x0, y, a, ida && k < 0.1 ? 1 : 0, 1, 'parado');
      desenharPessoa(g, x1, y, b, !ida && k < 0.1 ? 1 : 0, -1, 'parado');
      px(g, bx, by, '#f2f2f2', 3, 3);
      px(g, bx + 1, by + 1, '#1a1a1a');
    }
    function desenharGato(g, casa, t) {
      if (!casa) return;
      const L = casa.w - 14;
      const s = (t * 6) % (L * 2);
      const indo = s < L;
      const x = casa.x + 4 + (indo ? s : L * 2 - s);
      const y = casa.y - 1;
      const d = indo ? 1 : -1;
      const passo = Math.floor(t * 8) % 2;
      px(g, x - 4, y - 5, '#0c0c0e', 9, 3);
      px(g, x + 4 * d, y - 7, '#0c0c0e', 3, 3);
      px(g, x + 4 * d, y - 8, '#0c0c0e', 1, 1); px(g, x + 6 * d, y - 8, '#0c0c0e', 1, 1);
      px(g, x + 5 * d, y - 6, '#c8d040');
      px(g, x - 4 * d - (d > 0 ? 1 : 0), y - 9, '#0c0c0e', 1, 5);
      px(g, x - 3 + passo, y - 2, '#0c0c0e', 1, 2); px(g, x + 2 - passo, y - 2, '#0c0c0e', 1, 2);
    }
    function desenharCachorro(g, x, y, t) {
      const rabo = Math.floor(t * 5) % 2;
      const cab = Math.floor(t / 4) % 3 === 0 ? 1 : 0;
      px(g, x - 12, y - 9, '#141212', 14, 6);
      px(g, x, y - 13 + cab, '#141212', 6, 6);
      px(g, x + 5, y - 11 + cab, '#141212', 3, 2);
      px(g, x + 1, y - 15 + cab, '#141212', 2, 3);
      for (const lx of [-11, -8, -2, 1]) px(g, x + lx, y - 3, '#141212', 2, 3);
      px(g, x - 14 - rabo, y - 12 + rabo, '#141212', 2, 4);
      px(g, x + 3, y - 12 + cab, '#2a2a2a');
    }
    function desenharMoto(g, t) {
      // moto atravessando a rua de baixo (a cada 29 s), farol aceso
      const ciclo = t % 29;
      if (ciclo > 7) return;
      const x = -40 + (ciclo / 7) * (W - 180);
      const y = 398;
      px(g, x, y - 8, '#9a2a24', 18, 4);
      px(g, x + 4, y - 11, '#1a1a1a', 8, 3);
      px(g, x + 1, y - 4, '#111', 6, 4); px(g, x + 13, y - 4, '#111', 6, 4);
      px(g, x + 2, y - 3, '#444', 2, 2); px(g, x + 14, y - 3, '#444', 2, 2);
      // piloto de capacete
      px(g, x + 6, y - 18, '#2a3a5a', 6, 8);
      px(g, x + 7, y - 23, '#e8e8e8', 6, 5);
      px(g, x + 11, y - 21, '#2a2a3a', 2, 2);
      px(g, x + 18, y - 9, '#fff6c8', 2, 2);
      g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 40; k++) {
        g.globalAlpha = 0.12 * (1 - k / 40);
        px(g, x + 20 + k, y - 9 - Math.floor(k * 0.15), '#ffe8b0', 1, 2 + Math.floor(k * 0.3));
      }
      g.globalAlpha = 1;
      brilho(g, x + 20, y - 8, 22, '255,230,170', 0.8);
      g.globalCompositeOperation = 'source-over';
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
