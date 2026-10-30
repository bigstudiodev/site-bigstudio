/* =========================================================
   BIG STUDIO — Favela em pixel art (subprojeto)
   Toda a cena é desenhada em código, num único estilo: nada
   vem de imagem. Resolução lógica 720x400, ampliada em pixels
   nítidos. A composição segue a planta da arte aprovada
   (Base 3), em camadas de distância:
     0 céu (lua, nuvens iluminadas, estrelas)
     1 longe: prédios da cidade e morro do Cristo, com névoa
     2 fundo: casario denso subindo o morro (pequeno, azulado)
     3 árvores
     4 meio: casas principais (laje, puxadinho, telha, caixa d'água)
     5 frente: terraço com moradores grandes, sala dos computadores,
       escadaria, muro do mural, telhados de baixo com a bandeira
   Uso: BigFavela.criar(canvas, { estatica: false })
   ========================================================= */
(() => {
  const W = 720;
  const H = 400;

  // ---------------------------------------------------------- base
  function semente(s) {
    return () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hex = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
  const css = (c, a = 1) => (typeof c === 'string' ? c : a === 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);
  const mistura = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const NEVOA = [16, 26, 54];
  // cor à distância: quanto mais longe (p de 0 a 1), mais escura e azulada
  const longe = (c, p) => mistura(mistura(typeof c === 'string' ? hex(c) : c, [8, 12, 26], 0.35 * p + p * 0.25), NEVOA, p * 0.55);
  function px(g, x, y, cor, w = 1, h = 1) {
    g.fillStyle = css(cor);
    g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }
  function linha(g, x1, y1, x2, y2, cor, esp = 1) {
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    g.fillStyle = css(cor);
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x1 + ((x2 - x1) * i) / n - esp / 2 + 0.5), Math.round(y1 + ((y2 - y1) * i) / n - esp / 2 + 0.5), esp, esp);
  }

  // ---------------------------------------------------------- paleta
  const C = {
    ceu: [[4, 7, 18], [7, 12, 30], [11, 19, 44], [16, 28, 60], [22, 38, 78]],
    estrela: '#dfe7ff', lua: [232, 236, 246], luaMeio: [204, 212, 228], luaSombra: [168, 178, 200],
    nuvem: [[18, 30, 64], [26, 42, 84], [38, 58, 108], [62, 86, 140], [104, 130, 182]],
    contorno: '#05060a',
    laje: [92, 88, 82], lajeLuz: [150, 158, 178], lajeSombra: [36, 33, 31],
    bloco: [86, 84, 80], blocoJunta: [52, 50, 48],
    telha: [74, 78, 86], telhaLuz: [110, 116, 128], telhaSombra: [40, 42, 48],
    caixa: [40, 74, 156], caixaLuz: [74, 112, 204], caixaSombra: [22, 40, 96], caixaTampa: [92, 132, 220],
    grade: '#16151a', fio: '#050609',
    folha: [[6, 14, 9], [10, 22, 13], [15, 32, 19], [22, 46, 27], [32, 62, 36]], tronco: '#1a120b',
    luz: [[255, 238, 186], [255, 196, 104], [232, 140, 56]], luzBranca: [[236, 244, 255], [196, 214, 240], [140, 164, 200]],
    tela: [[176, 214, 255], [110, 160, 236], [60, 104, 196]],
    vidro: [18, 22, 34], vidroLuz: [34, 42, 64],
    pele: [[58, 34, 22], [78, 48, 30], [104, 66, 42], [44, 26, 18], [124, 82, 54]],
    cabelo: [[14, 10, 8], [26, 16, 10]],
    mural: [240, 124, 100], muralSombra: [124, 52, 40], muralLuz: [255, 180, 156],
  };
  const MUROS = {
    terracota: hex('#7a3f2b'), ocre: hex('#80582f'), rosa: hex('#73475a'), cinza: hex('#4e4d55'),
    azul: hex('#3a4864'), tijolo: hex('#7e3a28'), verde: hex('#3f5a49'), amarelo: hex('#8a7434'), reboco: hex('#6a6158'),
  };
  // noite: o muro de dia vira o tom noturno (mais escuro e frio)
  const noite = (c) => mistura(c, [10, 14, 30], 0.48);

  // ---------------------------------------------------------- fonte 5x7 (mural)
  const FONTE = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'], I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'], M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'], O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'], S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'], U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  };

  // ---------------------------------------------------------- brilho (sprites pré-desenhados)
  const cacheBrilho = new Map();
  function spriteBrilho(raio, cor) {
    const k = raio + cor;
    if (cacheBrilho.has(k)) return cacheBrilho.get(k);
    const c = document.createElement('canvas');
    c.width = c.height = raio * 2;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(raio, raio, 0, raio, raio, raio);
    gr.addColorStop(0, `rgba(${cor},.55)`); gr.addColorStop(0.4, `rgba(${cor},.2)`); gr.addColorStop(1, `rgba(${cor},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, raio * 2, raio * 2);
    cacheBrilho.set(k, c);
    return c;
  }
  function brilho(g, x, y, raio, cor, k, achatado = 1) {
    if (k <= 0.02) return;
    g.globalAlpha = Math.min(1, k);
    const r = Math.round(raio);
    g.drawImage(spriteBrilho(r, cor), Math.round(x - r), Math.round(y - r * achatado), r * 2, Math.round(r * 2 * achatado));
    g.globalAlpha = 1;
  }

  // ---------------------------------------------------------- moradores (figura articulada em pixels)
  // Pés em (x, y), altura 'alt' px, olhando para 'dir' (1 = direita).
  // pose: { tipo: 'anda'|'parado'|'fala'|'celular'|'sentado'|'acena', f: fase, cabeca: deslocamento }
  function pessoa(g, x, y, alt, m, pose, dir, contorno) {
    const P = (xx, yy, cor, w = 1, h = 1) => px(g, xx, yy, contorno || cor, w, h);
    const L = (x1, y1, x2, y2, cor, e) => linha(g, x1, y1, x2, y2, contorno || cor, e);
    const u = alt / 48;
    const pele = C.pele[m.pele];
    const peleSombra = mistura(pele, [0, 0, 0], 0.35);
    const camisa = m.camisa, calca = m.calca;
    const sombraC = mistura(camisa, [0, 0, 0], 0.4);
    const luzC = mistura(camisa, [255, 176, 96], 0.4); // luz quente das janelas na borda
    const f = pose.f || 0;
    const sentado = pose.tipo === 'sentado';
    const quadril = sentado ? y - 14 * u : y - 22 * u;
    const ombro = quadril - 15 * u;
    const esp = Math.max(1, Math.round(3.6 * u));
    const espB = Math.max(1, esp - (u < 0.7 ? 0 : 1));
    if (sentado) {
      const bal = Math.sin(f * Math.PI * 2) * 2 * u;
      const cs = mistura(calca, [0, 0, 0], 0.3);
      L(x, quadril, x + 11 * u * dir, quadril + 1, cs, esp);
      L(x + 11 * u * dir, quadril + 1, x + 11 * u * dir + bal * dir, y, cs, esp);
      L(x + 1, quadril + 1, x + 13 * u * dir, quadril + 2, calca, esp);
      L(x + 13 * u * dir, quadril + 2, x + 13 * u * dir - bal * dir, y + 1, calca, esp);
      P(x + 13 * u * dir - bal * dir - 1, y + 1, '#111', Math.max(3, 4 * u), Math.max(1, 2 * u));
    } else {
      const ang = pose.tipo === 'anda' ? Math.sin(f * Math.PI * 2) * 0.42 : 0.08;
      const perna = 22 * u;
      const pe = (a, cor, sapato) => {
        const jx = x + Math.sin(a) * perna * 0.5 * dir, jy = quadril + perna * 0.5;
        const dobra = pose.tipo === 'anda' && a < 0 ? 0.25 : 0;
        const px2 = x + (Math.sin(a) * perna - dobra * perna * 0.4) * dir;
        L(x, quadril, jx, jy, cor, esp);
        L(jx, jy, px2, y - 1, cor, esp);
        P(px2 - (dir < 0 ? 4 * u : 0), y - 1 - u, sapato, Math.max(3, 5 * u), Math.max(1, 2 * u));
      };
      pe(-ang, mistura(calca, [0, 0, 0], 0.35), '#0e0e10');
      pe(ang, calca, '#18181c');
      if (m.saia) for (let k = 0; k < 7 * u; k++) P(x - (5 + k * 0.35) * u, quadril - 2 * u + k, calca, (10 + k * 0.7) * u, 1);
    }
    const braco = (frente) => {
      const ox = x + (frente ? 2 : -2) * u * dir;
      const cor = frente ? mistura(camisa, [0, 0, 0], 0.12) : sombraC;
      let mx, my, hx, hy;
      if (pose.tipo === 'anda') {
        const a = Math.sin(f * Math.PI * 2 + (frente ? Math.PI : 0)) * 0.5;
        mx = ox + Math.sin(a) * 8 * u * dir; my = ombro + 8 * u; hx = ox + Math.sin(a * 1.3) * 15 * u * dir; hy = ombro + 15 * u;
      } else if (pose.tipo === 'fala' && frente) {
        const a = 0.6 + Math.sin(f * Math.PI * 2) * 0.35;
        mx = ox + 5 * u * dir; my = ombro + 8 * u; hx = ox + (6 + 6 * a) * u * dir; hy = ombro + (10 - 9 * a) * u;
      } else if (pose.tipo === 'celular' && frente) {
        mx = ox + 3 * u * dir; my = ombro + 9 * u; hx = ox + 7 * u * dir; hy = ombro + 4 * u;
      } else if (pose.tipo === 'acena' && frente) {
        const a = Math.sin(f * Math.PI * 4);
        mx = ox + 5 * u * dir; my = ombro - 4 * u; hx = ox + (8 + a * 3) * u * dir; hy = ombro - 13 * u;
      } else if (sentado) {
        mx = ox + 5 * u * dir; my = ombro + 8 * u; hx = ox + 11 * u * dir; hy = ombro + 12 * u;
      } else {
        mx = ox + 1 * u * dir; my = ombro + 8 * u; hx = ox + 2 * u * dir; hy = ombro + 15 * u;
      }
      L(ox, ombro + 1, mx, my, cor, espB);
      L(mx, my, hx, hy, cor, espB);
      P(hx - u, hy - u, frente ? pele : peleSombra, Math.max(2, 3 * u), Math.max(2, 3 * u));
    };
    braco(false);
    // tronco com sombra nas costas e luz quente na frente
    const larg = 11 * u;
    const tronco = quadril - ombro;
    for (let k = 0; k < tronco; k++) {
      const w = larg - (k / tronco) * 2 * u;
      const x0 = x - w / 2;
      P(x0, ombro + k, camisa, w, 1);
      if (!contorno) {
        P(dir > 0 ? x0 : x0 + w - Math.max(1, 2 * u), ombro + k, sombraC, Math.max(1, 2 * u), 1);
        P(dir > 0 ? x0 + w - 1 : x0, ombro + k, luzC, 1, 1);
      }
    }
    if (m.estampa && !contorno) P(x - 2 * u, ombro + 5 * u, m.estampa, 4 * u, 3 * u);
    braco(true);
    if (pose.tipo === 'celular' && !contorno) {
      const hx = x + 9 * u * dir, hy = ombro + 3 * u;
      P(hx - u, hy - 2 * u, '#0a0a10', Math.max(2, 2 * u), Math.max(3, 4 * u));
      P(hx - u, hy - 2 * u, [140, 190, 255], Math.max(1, u), Math.max(2, 3 * u));
    }
    // pescoço e cabeça
    P(x - 1.5 * u, ombro - 3 * u, peleSombra, 3 * u, 3 * u);
    const cy = ombro - 8 * u;
    const r = 5.2 * u;
    const vx = (pose.cabeca || 0) * dir;
    for (let yy = -r; yy <= r; yy++) {
      const w = Math.sqrt(Math.max(0, r * r - yy * yy)) * 0.92;
      P(x - w + vx, cy + yy, pele, w * 2, 1);
    }
    if (!contorno) {
      P(x + r * 0.55 * dir + vx - (dir < 0 ? 1 : 0), cy - u, '#0b0806', Math.max(1, u), Math.max(1, u));
      P(x + r * 0.95 * dir + vx - (dir < 0 ? 1 : 0), cy + u, peleSombra, 1, Math.max(1, u));
      P(x - r * 0.9 * dir - (dir > 0 ? 0 : 1) + vx, cy - r * 0.3, peleSombra, Math.max(1, 1.4 * u), r);
    }
    const cab = C.cabelo[m.cabelo || 0];
    if (m.cabeloTipo === 'black') {
      for (let yy = -r * 1.5; yy <= r * 0.2; yy++) {
        const w = Math.sqrt(Math.max(0, (r * 1.45) ** 2 - (yy + r * 0.3) ** 2));
        P(x - w - 1.2 * u * dir + vx, cy + yy, cab, w * 2 - r * 0.4 * (yy > -r * 0.2 ? 1 : 0), 1);
      }
      if (!contorno) for (let k = 0; k < 6; k++) P(x - r + ((k * 7) % (r * 2)) + vx, cy - r * 1.3 + ((k * 3) % 4), mistura(cab, [255, 255, 255], 0.1));
    } else if (m.cabeloTipo === 'trancas') {
      P(x - r + vx, cy - r - u, cab, r * 2, 2 * u);
      for (let k = 0; k < 4; k++) P(x - r * dir - k * u * dir + vx - (dir > 0 ? 0 : 1), cy - r * 0.6 + k * 0.5, cab, Math.max(1, u), r * 2.2);
    } else {
      P(x - r + vx, cy - r - 0.5 * u, cab, r * 2, 2.4 * u);
      P(x - r * dir - (dir > 0 ? 0 : 1) + vx, cy - r, cab, 2 * u, r * 1.1);
    }
    if (m.bone) { P(x - r + vx, cy - r - u, m.bone, r * 2, 3 * u); P(x + (r - u) * dir - (dir < 0 ? 4 * u : 0) + vx, cy - r + u, m.bone, 4 * u, Math.max(1, u)); }
    if (m.fone && !contorno) { P(x - r * 1.1 + vx, cy - r - u, '#202028', r * 2.2, Math.max(1, u)); P(x - r * 0.45 * dir - 1.2 * u + vx, cy - u, '#c83c3c', 2.4 * u, 3.4 * u); }
  }
  function desenharPessoa(g, x, y, alt, m, pose, dir) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pessoa(g, x + dx, y + dy, alt, m, pose, dir, C.contorno);
    pessoa(g, x, y, alt, m, pose, dir);
  }

  // ---------------------------------------------------------- casas
  // c: { x, y (topo), w, h, muro, p (distância 0..1), lado (face lateral), elementos... }
  function casa(g, c, r) {
    const p = c.p || 0;
    const base = noite(MUROS[c.muro]);
    const tom = (k) => longe(mistura(base, k > 0 ? [190, 170, 150] : [0, 0, 0], Math.abs(k)), p);
    const lado = c.lado ?? Math.max(2, Math.round(c.w * 0.12 * (1 - p)));
    // face lateral (volume): mais escura, com o topo subindo um pouco
    for (let k = 0; k < lado; k++) px(g, c.x + c.w + k, c.y - Math.round(k * 0.5) + 2, tom(-0.45), 1, c.h - 2 + Math.round(k * 0.5));
    // reboco: granulado e manchas de umidade
    const img = g.createImageData(c.w, c.h);
    for (let yy = 0; yy < c.h; yy++) for (let xx = 0; xx < c.w; xx++) {
      const mancha = Math.sin((c.x + xx) * 0.08 + c.x) * Math.cos((c.y + yy) * 0.1 - c.y) * 0.45 + (yy / c.h) * 0.25;
      const n = mancha + (r() - 0.5) * (1.1 - p * 0.6);
      const cor = n > 0.55 ? tom(0.12) : n < -0.5 ? tom(-0.22) : n < -0.2 ? tom(-0.08) : tom(0);
      const o = (yy * c.w + xx) * 4;
      img.data[o] = cor[0]; img.data[o + 1] = cor[1]; img.data[o + 2] = cor[2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, c.x, c.y);
    const tijolos = (x0, y0, w, h) => {
      const fundo = longe(noite(MUROS.tijolo), p), junta = longe(mistura(noite(MUROS.tijolo), [0, 0, 0], 0.45), p);
      px(g, x0, y0, fundo, w, h);
      for (let yy = y0; yy < y0 + h; yy += 3) {
        px(g, x0, yy, junta, w, 1);
        for (let xx = x0 + ((yy / 3) % 2 ? 0 : 3); xx < x0 + w; xx += 6) px(g, xx, yy, junta, 1, 3);
      }
    };
    if (c.tijolo) tijolos(c.x + 1, c.y + 4, c.w - 2, c.h - 4);
    if (p < 0.4) {
      const n = c.remendos ?? 1 + Math.floor(r() * 2);
      for (let k = 0; k < n; k++) {
        const bw = 8 + Math.floor(r() * 12), bh = 5 + Math.floor(r() * 7);
        tijolos(c.x + 3 + Math.floor(r() * Math.max(1, c.w - bw - 6)), c.y + 8 + Math.floor(r() * Math.max(1, c.h - bh - 12)), bw, bh);
      }
    }
    if (c.blocos) {
      const [bx, by, bw, bh] = c.blocos;
      px(g, bx, by, longe(C.bloco, p), bw, bh);
      for (let yy = by; yy < by + bh; yy += 4) {
        px(g, bx, yy, longe(C.blocoJunta, p), bw, 1);
        for (let xx = bx + ((yy / 4) % 2 ? 0 : 4); xx < bx + bw; xx += 8) px(g, xx, yy, longe(C.blocoJunta, p), 1, 4);
      }
    }
    if (p < 0.5) for (let xx = c.x + 3; xx < c.x + c.w - 2; xx += 4 + Math.floor(r() * 8)) {
      const comp = 3 + Math.floor(r() * 12);
      for (let k = 0; k < comp; k++) if (r() < 0.8) px(g, xx, c.y + 4 + k, tom(-0.3));
    }
    // luar na quina esquerda e contorno
    px(g, c.x, c.y, longe(mistura(base, [150, 170, 220], 0.3), p), 1, c.h);
    px(g, c.x - 1, c.y, C.contorno, 1, c.h);
    px(g, c.x + c.w + lado, c.y - Math.round(lado * 0.5) + 2, C.contorno, 1, c.h);
    for (let k = 0; k < 4; k++) px(g, c.x, c.y + 3 + k, `rgba(0,0,0,${0.35 - k * 0.08})`, c.w, 1);
    // cobertura: telha de fibrocimento inclinada ou laje saliente
    if (c.telha) {
      const inc = c.telha;
      for (let xx = -3; xx < c.w + lado + 3; xx++) {
        const yy = c.y - 4 + Math.round((xx * inc) / (c.w + 6));
        px(g, c.x + xx, yy - 1, C.contorno, 1, 1);
        px(g, c.x + xx, yy, longe(xx % 3 === 0 ? C.telhaSombra : xx % 3 === 1 ? C.telha : C.telhaLuz, p), 1, 4);
      }
    } else {
      px(g, c.x - 3, c.y - 1, C.contorno, c.w + lado + 6, 1);
      px(g, c.x - 2, c.y, longe(C.lajeLuz, p), c.w + lado + 4, 1);
      px(g, c.x - 2, c.y + 1, longe(C.laje, p), c.w + lado + 4, 2);
      px(g, c.x - 2, c.y + 3, longe(C.lajeSombra, p), c.w + lado + 4, 1);
      if (c.vergalhao) for (const vx of [c.x + 1, c.x + c.w - 3]) for (let k = 0; k < 3; k++) px(g, vx + k, c.y - 6 - (k % 2) * 2, longe([70, 52, 40], p), 1, 6 + (k % 2) * 2);
    }
    if (c.grade) {
      const gy = c.y - 8;
      px(g, c.x, gy, longe([30, 29, 34], p), c.w, 1);
      for (let xx = c.x; xx < c.x + c.w; xx += 4) px(g, xx, gy, longe([30, 29, 34], p), 1, 8);
    }
    if (c.caixa) caixaDagua(g, c.x + (c.caixa === 'esq' ? 4 : c.w - (c.caixaTam || 18) - 4), c.y, c.caixaTam || 18, p);
    if (c.antena) {
      const ax = c.x + 6;
      px(g, ax, c.y - 18, longe([34, 34, 40], p), 1, 18);
      for (let k = 0; k < 3; k++) px(g, ax - 5 + k, c.y - 18 + k * 4, longe([34, 34, 40], p), 11 - k * 2, 1);
    }
    if (c.parabolica) {
      const ax = c.x + c.w - 14;
      for (let k = 0; k < 7; k++) px(g, ax + k, c.y - 9 + Math.abs(3 - k), longe([140, 146, 158], p), 1, 2);
      px(g, ax + 3, c.y - 5, longe([90, 92, 100], p), 1, 5);
    }
    if (c.botijao) { const bx = c.x + 8; px(g, bx, c.y - 6, longe([150, 40, 36], p), 4, 6); px(g, bx + 1, c.y - 7, longe([90, 90, 90], p), 2, 1); }
    if (c.vasos) for (let k = 0; k < c.vasos; k++) {
      const vx = c.x + 4 + k * 9;
      px(g, vx, c.y - 4, longe([122, 72, 46], p), 5, 4);
      for (let f = 0; f < 7; f++) px(g, vx - 1 + f, c.y - 8 + ((f * 5) % 4), longe(C.folha[3 + (f % 2)], p), 1, 3);
    }
    if (c.picho && p < 0.3) for (const [tx, ty, cor] of c.picho) pichacao(g, c.x + tx, c.y + ty, cor, r);
    if (c.toldo) for (const [tx, ty, tw] of c.toldo) {
      for (let k = 0; k < tw; k++) px(g, c.x + tx + k, c.y + ty, Math.floor(k / 3) % 2 ? longe([200, 60, 50], p) : longe([220, 210, 190], p), 1, 3);
      px(g, c.x + tx, c.y + ty + 3, 'rgba(0,0,0,.4)', tw, 2);
    }
    if (c.ar) {
      const ax = c.x + c.ar[0], ay = c.y + c.ar[1];
      px(g, ax - 1, ay - 1, C.contorno, 11, 8);
      px(g, ax, ay, longe([150, 150, 156], p), 9, 6);
      for (let k = 0; k < 3; k++) px(g, ax + 1, ay + 1 + k * 2, longe([90, 90, 96], p), 7, 1);
    }
  }
  function caixaDagua(g, x, yBase, w, p) {
    const h = Math.round(w * 0.72);
    const y = yBase - h;
    for (let k = 0; k < h; k++) {
      const meio = 1 - Math.abs(k - h / 2) / (h * 1.6);
      const ww = Math.round(w * (0.86 + 0.14 * meio));
      const x0 = x + Math.round((w - ww) / 2);
      px(g, x0 - 1, y + k, C.contorno, ww + 2, 1);
      px(g, x0, y + k, longe(C.caixa, p), ww, 1);
      px(g, x0, y + k, longe(C.caixaLuz, p), Math.round(ww * 0.28), 1);
      px(g, x0 + ww - Math.round(ww * 0.22), y + k, longe(C.caixaSombra, p), Math.round(ww * 0.22), 1);
    }
    for (const k of [Math.round(h * 0.3), Math.round(h * 0.7)]) px(g, x, y + k, longe(C.caixaSombra, p), w, 1);
    px(g, x - 1, y - 3, C.contorno, w + 2, 4);
    px(g, x, y - 3, longe(C.caixaTampa, p), w, 2);
    px(g, x + 2, y - 4, longe(C.caixaLuz, p), w - 4, 1);
    px(g, x + Math.round(w / 2) - 2, y - 5, longe(C.caixaSombra, p), 4, 2);
  }
  function pichacao(g, x, y, cor, r) {
    let cx = x;
    for (let k = 0; k < 4 + Math.floor(r() * 4); k++) {
      const h = 4 + Math.floor(r() * 3);
      linha(g, cx, y + h, cx + 1, y, cor);
      linha(g, cx + 1, y, cx + 3, y + h * 0.6, cor);
      cx += 3 + Math.floor(r() * 2);
    }
    linha(g, x - 1, y + 7, cx, y + 6, cor);
  }

  // ---------------------------------------------------------- janelas
  function intensidade(j, t) {
    if (j.modo === 'fixa') return j.acesa ? 1 : 0;
    if (j.modo === 'respira') return j.acesa ? 0.8 + 0.2 * Math.sin(((t + j.fase) / j.periodo) * Math.PI * 2) : 0;
    if (j.modo === 'tv') return 0.5 + 0.5 * Math.abs(Math.sin(t * 3.1 + Math.sin(t * 1.7) * 2));
    const f = ((t + j.fase) % j.periodo) / j.periodo;
    return (j.acesa ? f < 0.74 : f > 0.58) ? 1 : 0;
  }
  function janela(g, j, k, t) {
    const { x, y, w, h, p = 0 } = j;
    const cont = longe([14, 11, 9], p);
    px(g, x - 1, y - 1, cont, w + 2, h + 2);
    if (p < 0.4) px(g, x - 2, y + h + 1, longe([96, 90, 84], p), w + 4, 1);
    if (k <= 0.05) {
      px(g, x, y, longe(C.vidro, p), w, h);
      if (w > 3) px(g, x, y, longe(C.vidroLuz, p), w, 1);
    } else {
      const [c1, c2, c3] = j.tv ? C.tela : j.branca ? C.luzBranca : C.luz;
      g.globalAlpha = 0.35 + 0.65 * k;
      px(g, x, y, c3, w, h);
      px(g, x, y, c2, w, Math.max(1, h - Math.ceil(h / 4)));
      if (w > 3 && h > 3) px(g, x + 1, y + 1, c1, w - 2, Math.max(1, Math.floor(h / 2) - 1));
      g.globalAlpha = 1;
      if (j.dentro === 'pessoa' && w > 6) {
        const s = Math.sin((t + (j.fase || 0)) / 3.5);
        if (Math.sin((t + (j.fase || 0)) / 9) > -0.3) {
          const sx = x + 1 + Math.round((s * 0.5 + 0.5) * (w - 5));
          px(g, sx, y + h - 6, [42, 26, 18], 4, 6);
          px(g, sx + 1, y + h - 9, [42, 26, 18], 2, 3);
        }
      } else if (j.dentro === 'planta' && w > 5) {
        px(g, x + 1, y + h - 3, [74, 44, 28], 3, 3);
        px(g, x, y + h - 7, [40, 74, 44], 5, 4);
      }
      if (j.cortina && w > 5) {
        const v = Math.round(Math.sin(t * 1.3 + (j.fase || 0)) * 0.8);
        px(g, x, y, j.cortina, 2 + Math.max(0, v), h);
        px(g, x + w - 2, y, j.cortina, 2, h);
      }
    }
    if (j.grade) for (let gx = x + 1; gx < x + w; gx += 2) px(g, gx, y, cont, 1, h);
    else if (w > 5) px(g, x + Math.floor(w / 2), y, cont, 1, h);
  }

  // morro do Cristo (silhueta à direita)
  const morroY = (x) => Math.round(214 - 128 * Math.exp(-(((x - 650) / 70) ** 2)) - 24 * Math.exp(-(((x - 560) / 46) ** 2)));

  // ---------------------------------------------------------- planta da cena (segue a Base 3)
  function montar() {
    const r = semente(20261030);
    // camada 2: casario do fundo subindo o morro (denso, irregular, azulado pela distância)
    const fundo = [];
    for (let fila = 0; fila < 7; fila++) {
      let x = 236 + Math.floor(r() * 10) - fila * 2;
      const y0 = 92 + fila * 22;
      while (x < 640) {
        const w = 14 + Math.floor(r() * 22);
        const h = 16 + Math.floor(r() * 18);
        fundo.push({
          x, y: y0 + Math.floor(r() * 12) - 6, w, h, p: 0.62 - fila * 0.05,
          muro: ['terracota', 'ocre', 'rosa', 'cinza', 'azul', 'tijolo', 'reboco', 'amarelo'][Math.floor(r() * 8)],
          caixa: r() < 0.25 ? 'dir' : 0, caixaTam: 9, antena: r() < 0.12, vergalhao: r() < 0.2,
          telha: r() < 0.25 ? (r() < 0.5 ? 3 : -3) : 0, lado: 2 + Math.floor(r() * 2), remendos: 0,
        });
        x += w + 1 + Math.floor(r() * 4) - 2;
      }
    }
    // camada 4: casas do meio (posições da Base 3)
    const meio = [
      { x: 444, y: 92, w: 74, h: 60, muro: 'ocre', lado: 8, caixa: 'esq', grade: 1, antena: 1, p: 0.18 },
      { x: 520, y: 120, w: 44, h: 46, muro: 'terracota', lado: 5, caixa: 'dir', caixaTam: 16, p: 0.2, ar: [6, 20] },
      { x: 568, y: 136, w: 40, h: 34, muro: 'rosa', lado: 4, telha: 4, p: 0.24 },
      { x: 352, y: 140, w: 70, h: 62, muro: 'cinza', lado: 6, caixa: 'esq', caixaTam: 22, selo: 1, p: 0.12, vasos: 3 },
      { x: 424, y: 152, w: 42, h: 58, muro: 'tijolo', tijolo: 1, lado: 4, p: 0.14, parabolica: 1 },
      { x: 296, y: 176, w: 52, h: 46, muro: 'amarelo', lado: 5, p: 0.16, botijao: 1, vergalhao: 1 },
      { x: 232, y: 196, w: 60, h: 52, muro: 'terracota', lado: 5, p: 0.14, grade: 1, vasos: 2 },
      { x: 468, y: 206, w: 108, h: 74, muro: 'azul', lado: 6, p: 0.08, toldo: [[66, 10, 16]] },
      { x: 344, y: 226, w: 110, h: 174, muro: 'reboco', lado: 0, p: 0.1, remendos: 3, picho: [[8, 120, [150, 220, 140]]] },
      { x: 600, y: 176, w: 54, h: 40, muro: 'ocre', lado: 4, p: 0.16, caixa: 'dir', caixaTam: 14 },
      { x: 104, y: 290, w: 40, h: 50, muro: 'reboco', lado: 4, p: 0.06, blocos: [108, 300, 18, 16] },
    ];
    // camada 5: frente
    const frente = [
      { x: 144, y: 262, w: 104, h: 80, muro: 'ocre', lado: 6, p: 0, computador: 1, remendos: 0 },
      { x: 250, y: 252, w: 92, h: 92, muro: 'rosa', lado: 6, p: 0.02, picho: [[8, 70, [120, 200, 255]], [52, 62, [240, 230, 120]]], ar: [70, 22] },
      { x: 60, y: 338, w: 104, h: 62, muro: 'tijolo', tijolo: 1, lado: 0, p: 0, caixa: 'esq', caixaTam: 24 },
      { x: 166, y: 344, w: 96, h: 56, muro: 'cinza', lado: 0, p: 0, grade: 1, picho: [[60, 30, [255, 120, 160]]] },
      { x: 264, y: 350, w: 74, h: 50, muro: 'verde', lado: 0, p: 0, bandeira: 1, telha: -3 },
      { x: 454, y: 278, w: 266, h: 122, muro: 'azul', lado: 0, p: 0, mural: 1, remendos: 0 },
      { x: 578, y: 226, w: 142, h: 52, muro: 'terracota', lado: 0, p: 0.02, terraco: 1, remendos: 1 },
    ];
    const janelas = [];
    const addJanelas = (c) => {
      if (c.computador || c.mural || c.terraco) return;
      const pe = c.p > 0.4;
      const andar = pe ? 14 : 24;
      const nAndares = Math.max(1, Math.floor((c.h - 6) / andar));
      for (let a = 0; a < nAndares; a++) {
        const qtd = pe ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * (c.w > 60 ? 3 : 2));
        const usados = [];
        for (let q = 0; q < qtd; q++) {
          const tam = pe ? [[3, 3], [3, 4], [4, 3], [2, 3]][Math.floor(r() * 4)] : [[8, 11], [10, 12], [12, 14], [7, 9], [14, 10], [6, 12]][Math.floor(r() * 6)];
          const jx = c.x + 4 + Math.floor(r() * Math.max(1, c.w - tam[0] - 8));
          const jy = c.y + (pe ? 6 : 9) + a * andar + Math.floor(r() * 3);
          if (jy + tam[1] > c.y + c.h - 4 || usados.some((u) => Math.abs(u - jx) < tam[0] + 4)) continue;
          if (c.selo && jx < c.x + 46 && jy < c.y + 46) continue;
          if (c.bandeira && jx < c.x + 44) continue;
          if (c.blocos && jx < c.blocos[0] + c.blocos[2] + 2 && jy < c.blocos[1] + c.blocos[3] + 2 && jx + tam[0] > c.blocos[0] - 2) continue;
          if (c.toldo && c.toldo.some(([tx, , tw]) => jx + tam[0] > c.x + tx - 2 && jx < c.x + tx + tw + 2)) continue;
          if (c.picho && c.picho.some(([tx, ty]) => Math.abs(c.x + tx + 10 - jx) < 18 && Math.abs(c.y + ty - jy) < 12)) continue;
          if (c.ar && Math.abs(c.x + c.ar[0] - jx) < 14 && Math.abs(c.y + c.ar[1] - jy) < 14) continue;
          usados.push(jx);
          janelas.push({
            x: jx, y: jy, w: tam[0], h: tam[1], p: c.p, acesa: r() < (pe ? 0.5 : 0.7), branca: r() < 0.12,
            modo: r() < 0.45 ? 'fixa' : r() < 0.55 ? 'respira' : 'ciclo', periodo: 12 + r() * 34, fase: r() * 50,
            dentro: pe ? 'vazio' : ['vazio', 'vazio', 'planta', 'pessoa', 'pessoa'][Math.floor(r() * 5)],
            cortina: !pe && r() < 0.35 ? (r() < 0.5 ? [138, 59, 44] : [60, 90, 138]) : null, grade: !pe && r() < 0.3,
          });
        }
      }
    };
    [...fundo, ...meio, ...frente].forEach(addJanelas);
    // janelas marcantes da Base 3
    janelas.push({ x: 474, y: 104, w: 12, h: 20, p: 0.18, acesa: 1, modo: 'fixa', dentro: 'pessoa', fase: 3 });
    janelas.push({ x: 482, y: 222, w: 18, h: 22, p: 0.08, acesa: 1, modo: 'respira', periodo: 14, fase: 2, grade: 1 });
    janelas.push({ x: 512, y: 218, w: 20, h: 24, p: 0.08, acesa: 1, modo: 'tv', tv: 1 });
    janelas.push({ x: 488, y: 300, w: 18, h: 40, p: 0, acesa: 1, modo: 'respira', periodo: 18, fase: 6, cortina: [140, 60, 40] });
    janelas.push({ x: 246, y: 206, w: 14, h: 22, p: 0.14, acesa: 1, modo: 'fixa', dentro: 'planta' });
    janelas.push({ x: 300, y: 272, w: 16, h: 18, p: 0.02, acesa: 1, modo: 'ciclo', periodo: 30, fase: 4, dentro: 'pessoa' });
    const portas = [{ x: 262, y: 228, acesa: 1, p: 0.14 }, { x: 400, y: 182, acesa: 1, p: 0.12 }, { x: 186, y: 376, acesa: 1, p: 0 }, { x: 116, y: 316, acesa: 0, p: 0.06 }];

    const cidade = [];
    let cx = 0;
    while (cx < 250) {
      const w = 14 + Math.floor(r() * 22), h = 80 + Math.floor(r() * 170);
      const jan = [];
      for (let jy = H - h + 5; jy < H - 4; jy += 4) for (let jx = cx + 3; jx < cx + w - 3; jx += 3) if (r() < 0.32) jan.push([jx, jy, r()]);
      cidade.push({ x: cx, w, h, jan, antena: r() < 0.4, p: 0.55 + r() * 0.3 });
      cx += w + Math.floor(r() * 4);
    }
    const estrelas = [];
    for (let k = 0; k < 200; k++) {
      const sx = Math.floor(r() * W), sy = Math.floor(r() * 170);
      if (Math.hypot(sx - 196, sy - 150) < 36) continue;
      if (sx > 540 && sy > morroY(sx) - 2) continue;
      estrelas.push({ x: sx, y: sy, fase: r() * 6, b: r(), grande: r() < 0.07 });
    }
    const nuvens = [
      { x: 230, y: 112, w: 150, vel: 1.2 }, { x: 70, y: 96, w: 120, vel: 1.6 }, { x: 600, y: 76, w: 140, vel: 1.0 },
      { x: 420, y: 52, w: 110, vel: 1.4 }, { x: 160, y: 40, w: 90, vel: 1.9 },
    ].map((n, i) => {
      const pts = [];
      for (let dy = -18; dy <= 10; dy++) for (let dx = -n.w / 2; dx <= n.w / 2; dx++) {
        const borda = Math.sin(dx * 0.15 + i) * 0.14 + Math.sin(dx * 0.37 + i * 3) * 0.06;
        const f = Math.abs(dx) / (n.w / 2) + (dy < 0 ? -dy / 19 : dy / 9) + borda + r() * 0.18;
        if (f < 1) pts.push([dx, dy, dy < -10 ? 4 : dy < -4 ? 3 : f < 0.45 ? 2 : f < 0.75 ? 1 : 0]);
      }
      return { ...n, pts, fase: i * 200 };
    });
    const arvores = [
      { x: 300, y: 112, r: 34, p: 0.3 }, { x: 352, y: 90, r: 30, p: 0.35 }, { x: 258, y: 150, r: 26, p: 0.28 },
      { x: 412, y: 70, r: 26, p: 0.4 }, { x: 706, y: 150, r: 30, p: 0.3 }, { x: 640, y: 210, r: 18, p: 0.15 },
      { x: 120, y: 268, r: 22, p: 0.12 }, { x: 572, y: 104, r: 18, p: 0.3 },
    ].map((a) => {
      const pts = [];
      for (let dy = -a.r; dy <= a.r; dy++) for (let dx = -a.r - 8; dx <= a.r + 8; dx++) {
        const tufo = Math.sin(dx * 0.4 + a.x) * 2.6 + Math.cos(dy * 0.5 + a.y) * 2.6;
        const d = Math.hypot(dx * 0.8, dy * 1.05) + tufo + r() * 2.8;
        if (d < a.r) {
          const luz = (-dx - dy) / (a.r * 2);
          const tom = Math.max(0, Math.min(4, Math.round(1 + luz * 3 + (r() - 0.5) * 1.5 + (d < a.r * 0.5 ? 0.5 : 0))));
          pts.push([dx, dy, tom, dy < -a.r * 0.2 ? 1 : dy < a.r * 0.3 ? 0.5 : 0]);
        }
      }
      return { ...a, pts, fase: r() * 6 };
    });
    // postes e fiação embolada (feixes)
    const postes = [[226, 150, 196], [434, 120, 152], [632, 96, 176], [86, 236, 338], [438, 248, 400]];
    const fios = [];
    const feixe = (a, b, n, curva) => { for (let k = 0; k < n; k++) fios.push([a, b, curva + k * 3 + r() * 3, k * 1.5]); };
    feixe([0, 230], [86, 236], 4, 10); feixe([86, 236], [226, 150], 4, 8); feixe([226, 150], [434, 120], 5, 14);
    feixe([434, 120], [632, 96], 5, 16); feixe([632, 96], [720, 60], 4, 8); feixe([632, 96], [720, 120], 3, 6);
    feixe([434, 120], [720, 40], 3, 22); feixe([86, 236], [438, 248], 3, 18); feixe([438, 248], [720, 230], 2, 12);
    for (const [a, b] of [[[226, 150], [300, 176]], [[434, 120], [470, 96]], [[434, 120], [400, 142]], [[632, 96], [600, 178]], [[438, 248], [470, 210]], [[86, 236], [146, 262]]]) fios.push([a, b, 4 + r() * 4, 0]);
    const M = {
      a: { pele: 0, cabelo: 0, cabeloTipo: 'black', camisa: [40, 52, 82], calca: [28, 34, 52] },
      b: { pele: 1, cabelo: 0, cabeloTipo: 'curto', camisa: [214, 210, 200], calca: [34, 44, 70], estampa: [200, 60, 50] },
      c: { pele: 2, cabelo: 1, cabeloTipo: 'trancas', camisa: [210, 150, 60], calca: [64, 44, 70], saia: 1 },
      d: { pele: 3, cabelo: 0, cabeloTipo: 'curto', camisa: [176, 66, 50], calca: [44, 58, 78], bone: [30, 30, 36] },
      e: { pele: 4, cabelo: 1, cabeloTipo: 'black', camisa: [70, 120, 90], calca: [30, 30, 34], fone: 1 },
      f: { pele: 0, cabelo: 0, cabeloTipo: 'curto', camisa: [96, 96, 104], calca: [36, 30, 28] },
    };
    const andando = [
      { m: M.c, alt: 26, x0: 236, x1: 284, y: 196, vel: 7, fase: 0 },
      { m: M.f, alt: 22, x0: 384, x1: 414, y: 140, vel: 6, fase: 20 },
      { m: M.d, alt: 20, x0: 470, x1: 512, y: 92, vel: 5, fase: 30 },
      { m: M.e, alt: 34, x0: 168, x1: 250, y: 344, vel: 9, fase: 50 },
      { m: { ...M.b, camisa: [63, 106, 168] }, alt: 30, x0: 600, x1: 700, y: 400, vel: 8, fase: 10 },
    ];
    return { fundo, meio, frente, janelas, portas, cidade, estrelas, nuvens, arvores, postes, fios, M, andando };
  }

  // ---------------------------------------------------------- camadas fixas
  function desenharCeu(g) {
    const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      const t = Math.min(1, y / 300) * (C.ceu.length - 1);
      const i = Math.min(C.ceu.length - 2, Math.floor(t)), k = t - i;
      for (let x = 0; x < W; x++) {
        const lim = ((x % 2) + (y % 2) * 2 + 0.5) / 4;
        const d = Math.hypot(x - 196, y - 150);
        const halo = Math.max(0, 1 - d / 170) ** 2 * 0.5; // luar clareando o céu
        const c = mistura(k > lim ? C.ceu[i + 1] : C.ceu[i], [48, 72, 130], halo);
        const o = (y * W + x) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }
  function desenharLua(g, cx, cy, raio) {
    for (let d = raio + 26; d > raio; d -= 2) {
      g.fillStyle = `rgba(200,214,255,${(0.06 * (raio + 26 - d)) / 26})`;
      g.beginPath(); g.arc(cx, cy, d, 0, Math.PI * 2); g.fill();
    }
    const crateras = [[-6, -4, 4], [5, 6, 3], [7, -7, 2], [-3, 9, 2], [-10, 3, 2], [2, -1, 2], [9, 2, 2]];
    for (let y = -raio; y <= raio; y++) for (let x = -raio; x <= raio; x++) {
      if (x * x + y * y > raio * raio) continue;
      let c = (x + y) > raio * 0.6 ? C.luaMeio : C.lua;
      for (const [ax, ay, ar] of crateras) if (Math.hypot(x - ax, y - ay) < ar) c = C.luaSombra;
      px(g, cx + x, cy + y, c);
    }
  }
  function desenharLonge(g, cena, r) {
    for (const b of cena.cidade) {
      const cor = longe([20, 30, 58], b.p);
      px(g, b.x, H - b.h, cor, b.w, b.h);
      px(g, b.x, H - b.h, longe([40, 56, 96], b.p), 1, b.h);
      if (b.antena) px(g, b.x + Math.floor(b.w / 2), H - b.h - 10, cor, 1, 10);
    }
    for (let x = 540; x < W; x++) {
      const y = morroY(x) + (r() < 0.3 ? 1 : 0);
      px(g, x, y, [10, 16, 32], 1, H - y);
      px(g, x, y, [36, 52, 92]);
      if (r() < 0.35) px(g, x, y - 1 - Math.floor(r() * 3), [10, 16, 32], 1, 3);
    }
    for (let k = 0; k < 60; k++) {
      const lx = 548 + Math.floor(r() * 172), ly = 120 + Math.floor(r() * 110);
      if (ly > morroY(lx) + 5) px(g, lx, ly, r() < 0.7 ? [220, 150, 70] : [240, 210, 140]);
    }
    const cx = 650, cy = morroY(650) - 34;
    for (let d = 26; d > 4; d -= 2) { g.fillStyle = `rgba(200,215,255,${(0.012 * (26 - d)) / 2})`; g.beginPath(); g.arc(cx, cy + 14, d, 0, Math.PI * 2); g.fill(); }
    const corpo = ['00011000', '00011000', '11111111', '11111111', '00011000', '00011000', '00011000', '00011000', '00111100', '00111100', '00111100', '00111100', '01111110', '01111110', '11111111', '11111111', '11111111'];
    corpo.forEach((l, y) => [...l].forEach((b, x) => { if (b === '1') px(g, cx - 8 + x * 2, cy + y * 2, x < 4 ? [232, 238, 252] : [178, 190, 216], 2, 2); }));
  }
  function spriteArvore(a, bal) {
    const tela = document.createElement('canvas');
    const m = a.r + 12;
    tela.width = m * 2; tela.height = m * 2 + 20;
    const t = tela.getContext('2d');
    px(t, m - 2, m, longe(hex(C.tronco), a.p), 4, a.r + 20);
    for (const [dx, dy, tom, solto] of a.pts) px(t, m + dx + (solto ? Math.round(bal * solto * 1.4) : 0), m + dy, longe(C.folha[tom], a.p));
    return { tela, m };
  }
  function desenharMeio(g, cena, r) {
    for (const c of cena.meio) {
      casa(g, c, r);
      if (c.selo) {
        // selo da BIG STUDIO pintado na parede (única marca dentro da cena)
        const cores = [[214, 214, 208], [111, 168, 255], [214, 214, 208], [214, 214, 208], [34, 197, 94], [240, 180, 41], [70, 70, 78], [214, 214, 208], [214, 214, 208]];
        cores.forEach((cor, i) => {
          const bx = c.x + 12 + (i % 3) * 10, by = c.y + 12 + Math.floor(i / 3) * 10;
          px(g, bx, by, mistura(cor, [20, 24, 40], 0.25), 8, 8);
          for (let k = 0; k < 5; k++) px(g, bx + Math.floor(r() * 8), by + Math.floor(r() * 8), mistura(noite(MUROS.cinza), [0, 0, 0], 0.1));
        });
      }
    }
    // escadaria descendo entre as casas até a rua
    for (let k = 0; k < 18; k++) {
      const sx = 392 + k * 3, sy = 262 + k * 8;
      px(g, sx - 1, sy - 1, C.contorno, 30, 1);
      px(g, sx, sy, [128, 124, 116], 28, 1);
      px(g, sx, sy + 1, [92, 88, 82], 28, 4);
      px(g, sx, sy + 5, [44, 40, 38], 28, 3);
    }
    for (let k = 0; k < 18; k += 3) px(g, 418 + k * 3, 246 + k * 8, C.grade, 1, 14);
    linha(g, 418, 246, 469, 382, C.grade);
  }
  function desenharFrente(g, cena, r) {
    for (const c of cena.frente) {
      casa(g, c, r);
      if (c.bandeira) {
        const x = c.x + 6, y = c.y + 10;
        px(g, x - 1, y - 1, C.contorno, 32, 22);
        px(g, x, y, [28, 120, 58], 30, 20);
        for (let yy = 0; yy < 20; yy++) { const l = Math.max(0, 13 - Math.abs(yy - 10) * 1.3); px(g, x + 15 - l, y + yy, [222, 190, 52], l * 2, 1); }
        for (let yy = 5; yy < 15; yy++) { const l = Math.max(0, 6 - Math.abs(yy - 10) * 1.1); px(g, x + 15 - l, y + yy, [40, 72, 168], l * 2, 1); }
        px(g, x + 10, y + 10, [236, 236, 228], 10, 1);
      }
      if (c.mural) {
        escrever(g, 'A TECNOLOGIA', c.x + 80, c.y + 40, 2);
        escrever(g, 'TAMBÉM', c.x + 110, c.y + 64, 2);
        escrever(g, 'NASCE AQUI', c.x + 92, c.y + 88, 2);
        for (let k = 0; k < 50; k++) px(g, c.x + 76 + Math.floor(r() * 170), c.y + 26 + Math.floor(r() * 84), css(C.mural, 0.4));
      }
      if (c.computador) {
        px(g, c.x + 6, c.y + 6, C.contorno, 80, 46);
        px(g, c.x + 4, c.y + 62, [128, 124, 116], 100, 1); px(g, c.x + 4, c.y + 63, [92, 88, 82], 100, 3); px(g, c.x + 4, c.y + 66, [40, 36, 34], 100, 2);
        px(g, c.x + 4, c.y + 50, C.grade, 100, 2);
        for (let x = c.x + 4; x < c.x + 104; x += 5) px(g, x, c.y + 50, C.grade, 1, 12);
      }
      if (c.terraco) { px(g, c.x, c.y + 50, [120, 116, 108], c.w, 1); px(g, c.x, c.y + 51, [88, 84, 78], c.w, 3); }
    }
  }
  function escrever(g, s, x, y, e) {
    let cx = x, i = 0;
    for (const ch of s) {
      const sobe = -Math.round(i * 0.6) * e; i++;
      if (ch === ' ') { cx += 4 * e; continue; }
      const gl = FONTE[ch === 'É' ? 'E' : ch];
      if (!gl) { cx += 6 * e; continue; }
      const des = (dx, dy, cor) => gl.forEach((l, gy) => [...l].forEach((b, gx) => { if (b === '1') px(g, cx + gx * e + dx, y + sobe + gy * e + dy, cor, e, e); }));
      des(2, 2, C.muralSombra); des(0, 0, C.mural);
      gl.forEach((l, gy) => [...l].forEach((b, gx) => { if (b === '1' && gy === 0) px(g, cx + gx * e, y + sobe, C.muralLuz, e, 1); }));
      if (ch === 'É') { px(g, cx + 2 * e, y + sobe - 3 * e, C.mural, e, e); px(g, cx + 3 * e, y + sobe - 4 * e, C.mural, e, e); }
      cx += 6 * e;
    }
  }
  function desenharPostes(g, cena) {
    for (const [x, y, base] of cena.postes) {
      px(g, x - 1, y, C.contorno, 4, base - y);
      px(g, x, y, [26, 26, 32], 2, base - y);
      px(g, x, y, [48, 50, 60], 1, base - y);
      px(g, x - 7, y + 3, [26, 26, 32], 16, 2);
      px(g, x + 6, y + 5, [40, 40, 46], 4, 2);
      for (let k = 0; k < 10; k++) px(g, x - 4 + ((k * 7) % 9), y + 8 + ((k * 5) % 7), C.fio, 2, 1); // emaranhado de gatos
      if (base < H) px(g, x - 3, base - 2, [58, 54, 50], 8, 2);
    }
  }

  // ---------------------------------------------------------- criação
  function criar(canvas, opcoes = {}) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const cena = montar();
    const r = semente(7);
    const nova = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const ceu = nova(); desenharCeu(ceu.getContext('2d')); desenharLua(ceu.getContext('2d'), 196, 150, 22);
    const longeC = nova(); desenharLonge(longeC.getContext('2d'), cena, r);
    const casario = nova();
    { const g = casario.getContext('2d'); for (const c of cena.fundo) casa(g, c, r); }
    const meioC = nova(); desenharMeio(meioC.getContext('2d'), cena, r); desenharPostes(meioC.getContext('2d'), cena);
    const frenteC = nova(); desenharFrente(frenteC.getContext('2d'), cena, r);
    for (const a of cena.arvores) a.estados = [-1, -0.5, 0, 0.5, 1].map((b) => spriteArvore(a, b));
    for (const n of cena.nuvens) {
      const t = document.createElement('canvas'); t.width = n.w + 4; t.height = 32;
      const g = t.getContext('2d');
      for (const [dx, dy, tom] of n.pts) px(g, n.w / 2 + dx, 20 + dy, C.nuvem[tom]);
      n.tela = t;
    }
    const fioY = (a, b, x, curva, desloc) => { const tt = (x - a[0]) / (b[0] - a[0]); return a[1] + desloc + (b[1] - a[1]) * tt + Math.sin(Math.PI * tt) * curva; };
    const { M } = cena;
    const fiosC = [-1.2, -0.6, 0, 0.6, 1.2].map((v) => {
      const c = nova(); const g = c.getContext('2d'); g.fillStyle = C.fio;
      for (const [a, b, curva, desloc] of cena.fios) for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) g.fillRect(x, Math.round(fioY(a, b, x, curva + v, desloc)), 1, 1);
      return c;
    });
    // janelas fixas do casario do fundo ficam pré-desenhadas (com o brilho); só as que mudam são redesenhadas
    const jFundoTodas = cena.janelas.filter((j) => j.p > 0.4);
    {
      const g = casario.getContext('2d');
      for (const j of jFundoTodas) if (j.modo === 'fixa') janela(g, j, j.acesa ? 1 : 0, 0);
      g.globalCompositeOperation = 'lighter';
      for (const j of jFundoTodas) if (j.modo === 'fixa' && j.acesa) brilho(g, j.x + 1.5, j.y + 1.5, 7, '255,150,60', 0.6);
      g.globalCompositeOperation = 'source-over';
    }
    const jFundo = jFundoTodas.filter((j) => j.modo !== 'fixa');
    const jMeio = cena.janelas.filter((j) => j.p <= 0.4 && j.p > 0.05);
    const jFrente = cena.janelas.filter((j) => j.p <= 0.05);

    let tempo = opcoes.tempoInicial || 0;
    let t0 = performance.now();
    let rodando = false;
    let ultimo = 0;

    function arvore(a, t) {
      const e = a.estados[Math.max(0, Math.min(4, Math.round((Math.sin(t * 1.1 + a.fase) + 1) * 2)))];
      ctx.drawImage(e.tela, a.x - e.m, a.y - e.m);
    }
    function luzes(lista, t, raio) {
      ctx.globalCompositeOperation = 'overlay';
      for (const j of lista) brilho(ctx, j.x + j.w / 2, j.y + j.h / 2, raio(j), j.tv ? '90,140,255' : '255,120,30', intensidade(j, t) * (1 - j.p) * 0.75);
      ctx.globalCompositeOperation = 'lighter';
      for (const j of lista) brilho(ctx, j.x + j.w / 2, j.y + j.h / 2, raio(j) * 0.8, j.tv ? '110,160,255' : j.branca ? '200,220,255' : '255,140,50', intensidade(j, t) * (1 - j.p * 0.8));
      ctx.globalCompositeOperation = 'source-over';
    }
    function porta(p) {
      const c = (cor) => longe(cor, p.p);
      px(ctx, p.x - 2, p.y - 2, C.contorno, 16, 26);
      px(ctx, p.x, p.y, p.acesa ? c([240, 162, 74]) : c([44, 27, 18]), 12, 24);
      if (p.acesa) { px(ctx, p.x + 2, p.y + 2, c([255, 210, 140]), 8, 20); px(ctx, p.x + 2, p.y + 2, c([255, 232, 184]), 8, 5); }
      else { px(ctx, p.x + 1, p.y + 2, [58, 36, 24], 10, 9); px(ctx, p.x + 1, p.y + 13, [58, 36, 24], 10, 9); }
      px(ctx, p.x + 9, p.y + 12, [200, 160, 96]);
      px(ctx, p.x + 3, p.y - 7, [42, 38, 32], 6, 2); px(ctx, p.x + 4, p.y - 5, [255, 224, 160], 4, 1);
    }
    function andar(m, t) {
      const L = m.x1 - m.x0;
      const s = (m.fase + t * m.vel) % (L * 2);
      const indo = s < L;
      const x = indo ? m.x0 + s : m.x1 - (s - L);
      desenharPessoa(ctx, Math.round(x), m.y, m.alt, m.m, { tipo: 'anda', f: (t * m.vel) / (m.alt * 0.55) }, indo ? 1 : -1);
    }

    function quadro(t) {
      ctx.drawImage(ceu, 0, 0);
      for (const e of cena.estrelas) {
        const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (0.7 + e.b * 1.2) + e.fase));
        ctx.globalAlpha = a * (0.45 + e.b * 0.55);
        px(ctx, e.x, e.y, C.estrela);
        if (e.grande && a > 0.8) { px(ctx, e.x - 1, e.y, C.estrela, 3, 1); px(ctx, e.x, e.y - 1, C.estrela, 1, 3); }
      }
      ctx.globalAlpha = 1;
      const ec = t % 23;
      if (ec < 0.9) { const k = ec / 0.9; for (let i = 0; i < 18; i++) { ctx.globalAlpha = (1 - i / 18) * (1 - k); px(ctx, 60 + k * 160 - i * 1.6, 20 + k * 40 - i * 0.4, '#fff'); } ctx.globalAlpha = 1; }
      const av = t % 47;
      if (av < 24) { const ax = W + 20 - (av / 24) * (W + 60), ay = 26 + av * 0.5; px(ctx, ax, ay, [42, 47, 62], 6, 1); if (Math.floor(t * 2) % 2) px(ctx, ax, ay, '#ff4a4a'); }
      for (const n of cena.nuvens) { const x = ((n.x + n.fase + t * n.vel) % (W + n.w * 2)) - n.w; ctx.drawImage(n.tela, Math.round(x - n.w / 2), n.y - 20); }
      ctx.drawImage(longeC, 0, 0);
      for (const b of cena.cidade) {
        for (const [jx, jy, s] of b.jan) if ((Math.floor(t / (6 + s * 20) + s * 100) % 7) !== 0) px(ctx, jx, jy, longe(s < 0.8 ? [242, 196, 109] : [143, 182, 255], b.p * 0.6), 1, 2);
        if (b.antena) px(ctx, b.x + Math.floor(b.w / 2), H - b.h - 11, Math.floor(t * 1.5 + b.x) % 2 ? '#ff4a3a' : '#5a1a14');
      }
      for (const a of cena.arvores) if (a.p >= 0.3) arvore(a, t);
      ctx.drawImage(casario, 0, 0);
      for (const j of jFundo) janela(ctx, j, intensidade(j, t), t);
      ctx.globalCompositeOperation = 'lighter';
      for (const j of jFundo) brilho(ctx, j.x + 1.5, j.y + 1.5, 7, '255,150,60', intensidade(j, t) * 0.6);
      ctx.globalCompositeOperation = 'source-over';
      for (const a of cena.arvores) if (a.p < 0.3 && a.p >= 0.12) arvore(a, t);
      ctx.drawImage(meioC, 0, 0);
      // fios em feixes, balançando com o vento (5 posições pré-desenhadas)
      const vento = Math.sin(t * 0.8) * 1.2;
      ctx.drawImage(fiosC[Math.max(0, Math.min(4, Math.round((vento / 1.2 + 1) * 2)))], 0, 0);
      // pássaros no fio
      const pv = t % 31;
      for (let k = 0; k < 4; k++) {
        let bx = 300 + k * 13, by = fioY([226, 150], [434, 120], 300 + k * 13, 14 + vento, 0) - 3;
        if (pv > 20) { const voo = Math.min(1, (pv - 20) / 3) - Math.max(0, (pv - 28) / 3); bx += voo * (60 + k * 14); by -= voo * (50 + k * 9); }
        const asa = pv > 20 && pv < 30 ? Math.floor(t * 8 + k) % 2 : 0;
        px(ctx, bx, by, '#07080b', 4, 2); px(ctx, bx + 3, by - 1, '#07080b', 2, 2); px(ctx, bx - 1, by - 1 - asa, '#07080b', 3, 1);
      }
      for (const j of jMeio) janela(ctx, j, intensidade(j, t), t);
      for (const p of cena.portas) if (p.p > 0.05) porta(p);
      luzes(jMeio, t, (j) => 14 + j.w * 2.6);
      for (const m of cena.andando.slice(0, 3)) andar(m, t);
      desenharVaral(t);
      desenharPipa(t);
      for (const a of cena.arvores) if (a.p < 0.12) arvore(a, t);
      ctx.drawImage(frenteC, 0, 0);
      for (const j of jFrente) janela(ctx, j, intensidade(j, t), t);
      for (const p of cena.portas) if (p.p <= 0.05) porta(p);
      desenharComputador(t);
      luzes(jFrente, t, (j) => 18 + j.w * 3);
      ctx.globalCompositeOperation = 'lighter';
      cena.postes.forEach(([x, y, base], i) => {
        const pisca = i === 2 ? (Math.sin(t * 13) > 0.2 || Math.floor(t) % 5 ? 1 : 0.25) : 1;
        px(ctx, x + 7, y + 7, '#ffe6b0', 3, 1);
        brilho(ctx, x + 8, y + 9, 30, '255,200,120', pisca);
        brilho(ctx, x + 8, base - 1, 38, '255,190,110', pisca * 0.7, 0.28);
      });
      for (const p of cena.portas) if (p.acesa) brilho(ctx, p.x + 6, p.y + 24, 26, '255,150,60', 0.9, 0.3);
      ctx.globalCompositeOperation = 'source-over';
      desenharTerraco(t);
      desenharEscadaria(t);
      for (const m of cena.andando.slice(3)) andar(m, t);
      desenharMoto(t);
    }

    function desenharTerraco(t) {
      // terraço da Base 3: dois moradores conversando e o cachorro
      const y = 276;
      px(ctx, 580, 246, C.grade, 140, 2);
      for (let x = 580; x < 720; x += 7) px(ctx, x, 246, C.grade, 1, 30);
      const falaA = Math.floor(t / 3.2) % 2 === 0;
      desenharPessoa(ctx, 628, y, 46, M.a, { tipo: falaA ? 'fala' : 'parado', f: t * 0.9, cabeca: falaA ? 0 : 1 }, 1);
      desenharPessoa(ctx, 666, y, 44, M.b, { tipo: falaA ? 'celular' : 'fala', f: t * 1.1 }, -1);
      if (falaA) { ctx.globalCompositeOperation = 'lighter'; brilho(ctx, 657, y - 34, 10, '140,190,255', 0.5); ctx.globalCompositeOperation = 'source-over'; }
      const dx = 702, rabo = Math.floor(t * 5) % 2, cab = Math.floor(t / 4) % 3 === 0 ? 1 : 0;
      const cor = '#100e0e';
      px(ctx, dx - 14, y - 12, cor, 18, 8);
      px(ctx, dx + 2, y - 18 + cab, cor, 8, 8); px(ctx, dx + 8, y - 15 + cab, cor, 4, 3); px(ctx, dx + 3, y - 21 + cab, cor, 3, 4);
      for (const lx of [-13, -9, -1, 2]) px(ctx, dx + lx, y - 5, cor, 2, 5);
      px(ctx, dx - 17 - rabo, y - 16 + rabo, cor, 3, 5);
      px(ctx, dx + 6, y - 16 + cab, '#3a3a3a');
    }
    function desenharEscadaria(t) {
      // menina subindo e descendo a escadaria
      const ciclo = (t % 16) / 16, ida = ciclo < 0.5, k = ida ? ciclo * 2 : (1 - ciclo) * 2;
      desenharPessoa(ctx, Math.round(402 + k * 42), Math.round(262 + k * 112), 32, M.c, { tipo: 'anda', f: t * 1.6 }, ida ? 1 : -1);
      // jovem sentado nos degraus, ouvindo música e mexendo no celular
      const bate = Math.floor(t * 2.2) % 2;
      desenharPessoa(ctx, 420, 326, 54, M.e, { tipo: 'sentado', f: t * 0.4, cabeca: bate }, 1);
      ctx.globalCompositeOperation = 'lighter'; brilho(ctx, 436, 296, 10, '140,190,255', 0.45); ctx.globalCompositeOperation = 'source-over';
    }
    function desenharComputador(t) {
      const x = 152, y = 270;
      px(ctx, x, y, [40, 74, 138], 76, 42);
      px(ctx, x, y, [80, 128, 210], 76, 12); px(ctx, x, y, [112, 156, 230], 76, 3);
      px(ctx, x + 58, y + 6, [216, 184, 120], 13, 10); px(ctx, x + 60, y + 8, [138, 90, 58], 9, 6);
      px(ctx, x + 4, y + 30, [58, 44, 34], 68, 3); px(ctx, x + 6, y + 33, [40, 30, 22], 2, 9); px(ctx, x + 68, y + 33, [40, 30, 22], 2, 9);
      ctx.globalAlpha = 0.82 + 0.18 * Math.sin(t * 5);
      px(ctx, x + 22, y + 14, [26, 26, 34], 16, 13); px(ctx, x + 23, y + 15, [190, 224, 255], 14, 10);
      px(ctx, x + 46, y + 14, [26, 26, 34], 16, 13); px(ctx, x + 47, y + 15, [255, 226, 168], 14, 10);
      for (let k = 0; k < 4; k++) px(ctx, x + 25, y + 16 + ((k * 3 + Math.floor(t * 4)) % 9), [58, 106, 176], 3 + ((k * 5) % 7), 1);
      ctx.globalAlpha = 1;
      const tecla1 = Math.floor(t * 7) % 2, tecla2 = Math.floor(t * 5 + 1) % 3 === 0 ? 1 : 0, vira = Math.floor(t / 5) % 4 === 3 ? 1 : 0;
      for (const [ox, cab, cor, tc, v] of [[18, C.cabelo[0], [30, 42, 64], tecla1, 0], [40, C.cabelo[1], [34, 50, 74], tecla2, vira]]) {
        // de costas: cabelo, ombros, braço digitando, cadeira
        px(ctx, x + ox - v * 2, y + 12, C.contorno, 10, 10);
        px(ctx, x + ox + 1 - v * 2, y + 13, cab, 8, 8);
        if (v) px(ctx, x + ox - 2, y + 16, C.pele[2], 2, 3);
        px(ctx, x + ox - 2, y + 21, C.contorno, 14, 12);
        px(ctx, x + ox - 1, y + 22, cor, 12, 11);
        px(ctx, x + ox + 11, y + 26 - tc, C.pele[1], 3, 2);
        px(ctx, x + ox - 2, y + 33, [20, 20, 22], 14, 3); px(ctx, x + ox + 4, y + 36, [20, 20, 22], 2, 5);
      }
      ctx.globalCompositeOperation = 'lighter'; brilho(ctx, x + 38, y + 20, 56, '110,160,255', 0.9); ctx.globalCompositeOperation = 'source-over';
    }
    function desenharVaral(t) {
      const x = 448, y = 74;
      px(ctx, x, y - 2, C.grade, 1, 18); px(ctx, x + 50, y - 2, C.grade, 1, 18);
      for (let k = 0; k < 50; k++) px(ctx, x + k, y + Math.round(Math.sin((k / 50) * Math.PI) * 2), [58, 58, 66]);
      [[[201, 71, 58], 7, 9], [[232, 226, 208], 8, 6], [[63, 106, 168], 6, 10], [[224, 182, 58], 7, 7], [[106, 74, 154], 6, 8]].forEach(([cor, w, h], i) => {
        const v = Math.round(Math.sin(t * 2.4 + i * 1.3) * 1.5), rx = x + 3 + i * 9, ry = y + 1 + Math.round(Math.sin(((rx - x) / 50) * Math.PI) * 2);
        for (let k = 0; k < h; k++) px(ctx, rx + Math.round((v * k) / h), ry + k, mistura(cor, [10, 14, 30], 0.3), w, 1);
      });
    }
    function desenharPipa(t) {
      const cx = 312, cy = 176;
      desenharPessoa(ctx, cx, cy, 20, { pele: 2, cabelo: 0, cabeloTipo: 'curto', camisa: [63, 106, 168], calca: [31, 36, 48] }, { tipo: 'acena', f: t * 0.15 }, -1);
      const kx = cx - 70 + Math.round(Math.sin(t * 0.9) * 6), ky = cy - 120 + Math.round(Math.cos(t * 1.3) * 4);
      ctx.globalAlpha = 0.5;
      for (let k = 0; k <= 60; k++) { const s = k / 60; px(ctx, cx - 4 + (kx + 5 - (cx - 4)) * s, cy - 20 + (ky + 6 - (cy - 20)) * s + Math.sin(s * Math.PI) * 10, '#e6ecff'); }
      ctx.globalAlpha = 1;
      ['00000100000', '00001110000', '00011111000', '00111111100', '01111111110', '00111111100', '00011111000', '00001110000', '00000100000'].forEach((l, yy) => [...l].forEach((b, xx) => {
        if (b === '1') px(ctx, kx + xx, ky + yy, xx === 5 || yy === 4 ? '#1a1410' : xx < 5 ? '#e2be46' : '#2eaa68');
      }));
      for (let k = 0; k < 10; k++) px(ctx, kx + 5 + Math.round(Math.sin(t * 3 + k * 0.7) * 2), ky + 9 + k * 2, k % 2 ? '#f0d278' : '#d24a3c', 2, 2);
    }
    function desenharMoto(t) {
      const ciclo = t % 29;
      if (ciclo > 6) return;
      const x = -50 + (ciclo / 6) * 520, y = 398;
      desenharPessoa(ctx, Math.round(x + 13), y - 9, 30, { pele: 3, cabelo: 0, cabeloTipo: 'curto', camisa: [42, 58, 90], calca: [30, 30, 36], bone: [232, 232, 232] }, { tipo: 'sentado', f: 0 }, 1);
      px(ctx, x - 1, y - 13, C.contorno, 30, 10);
      px(ctx, x, y - 12, [154, 42, 36], 28, 6); px(ctx, x + 6, y - 16, [26, 26, 26], 12, 4);
      for (const wx of [x + 1, x + 20]) { px(ctx, wx, y - 7, '#0b0b0b', 9, 7); px(ctx, wx + 3, y - 5, '#555', 3, 3); }
      px(ctx, x + 28, y - 12, '#fff6c8', 2, 3);
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 60; k++) { ctx.globalAlpha = 0.12 * (1 - k / 60); px(ctx, x + 30 + k, y - 12 - Math.floor(k * 0.12), '#ffe8b0', 1, 3 + Math.floor(k * 0.25)); }
      ctx.globalAlpha = 1; brilho(ctx, x + 30, y - 10, 26, '255,230,170', 0.8);
      ctx.globalCompositeOperation = 'source-over';
    }

    function laco(agora) {
      if (!rodando) return;
      requestAnimationFrame(laco);
      if (agora - ultimo < 1000 / 14) return; // 14 quadros/s: ritmo de pixel art
      ultimo = agora;
      tempo += Math.min(0.2, (agora - t0) / 1000);
      t0 = agora;
      quadro(tempo);
    }
    quadro(tempo);
    return {
      tocar() { if (rodando || opcoes.estatica) return; rodando = true; t0 = performance.now(); requestAnimationFrame(laco); },
      pausar() { rodando = false; },
      get rodando() { return rodando; },
      irPara(s) { tempo = s; quadro(tempo); },
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
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visivel = e.isIntersecting; sincronizar(); }, { threshold: 0 }).observe(raiz);
    sincronizar();
    raiz.bigFavela = cena;
  }

  window.BigFavela = { criar, iniciar, LARGURA: W, ALTURA: H };
  document.querySelectorAll('[data-big-favela]').forEach(iniciar);
})();
