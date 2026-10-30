#!/usr/bin/env python3
"""Gera a favela animada da página inicial a partir da arte aprovada (Base 3).

A ilustração é decomposta em camadas independentes; nada é desenhado por cima
de uma imagem pronta. Saídas:

  assets/img/favela/base-872.webp          construções e céu, janelas animadas apagadas
  assets/img/favela/luzes-872.webp         só a luz das janelas animadas (alfa)
  assets/img/favela/ceu.png                máscara do céu (nuvens só passam sobre ele)
  assets/img/favela/nuvem-{1,2,3}.png      nuvens em pixel art
  assets/img/favela/morador-*.png          moradores (folhas de 4 quadros)
  assets/img/favela/pipa.png               pipa
  assets/css/favela.css                    posições, janelas e animações
  index.html                               marcação entre <!-- favela:inicio --> e <!-- favela:fim -->

Uso: python3 ferramentas/gerar-favela.py caminho/para/base3.png
"""
import math
import random
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
IMG = RAIZ / "assets/img/favela"
CSS = RAIZ / "assets/css/favela.css"
INDEX = RAIZ / "index.html"

RECORTE = (664, 74, 1536, 538)   # área só de cenário na Base 3 (sem textos de interface)
CEU_EXTRA = 74                   # céu reconstruído acima do recorte (na Base 3 fica sob o menu)
W, H = 872, 464 + CEU_EXTRA      # coordenadas do "palco"

random.seed(20261030)


def pct(v, total):
    return f"{v / total * 100:.3f}%"


# ---------------------------------------------------------------- base
def carregar(caminho):
    src = Image.open(caminho).convert("RGB")
    arte = np.asarray(src.crop(RECORTE)).astype(np.float32)
    # o botão verde da Base 3 fica logo acima do recorte e deixa um brilho esverdeado no céu
    faixa_topo = arte[:22]
    r, g, b = faixa_topo[..., 0], faixa_topo[..., 1], faixa_topo[..., 2]
    verde = (g > r + 12) & (g > b * 0.85)
    faixa_topo[..., 1] = np.where(verde, np.minimum(g, b * 0.72), g)
    palco = np.zeros((H, W, 3), np.float32)
    palco[CEU_EXTRA:] = arte
    # céu acima do recorte: tom médio de cada região, bem suavizado, escurecendo para o azul-noite
    topo = arte[4:14].mean(axis=0)
    linha = Image.fromarray(np.repeat(topo[None], 8, 0).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(26))
    topo = np.asarray(linha).astype(np.float32)[4]
    noite = np.array([6, 12, 30], np.float32)
    for y in range(CEU_EXTRA):
        t = (CEU_EXTRA - y) / CEU_EXTRA          # 1 no alto, 0 junto ao recorte
        t = t ** 0.7
        palco[y] = topo * (1 - t * 0.9) + noite * (t * 0.9)
    faixa = Image.fromarray(palco[:CEU_EXTRA + 8].clip(0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(6))
    palco[:CEU_EXTRA] = np.asarray(faixa).astype(np.float32)[:CEU_EXTRA]
    return palco


def remover_mural(palco):
    """Tira o letreiro "BIG STUDIO" e a coroa da parede e pinta o selo pixelado da marca."""
    x0, y0, x1, y1 = 358, 138 + CEU_EXTRA, 452, 266 + CEU_EXTRA
    reg = palco[y0:y1, x0:x1]
    mx, mn = reg.max(axis=2), reg.min(axis=2)
    r, g, b = reg[..., 0], reg[..., 1], reg[..., 2]
    branco = (mn > 120) & (mx - mn < 70)
    verde = (g > r + 12) & (g > b + 4)
    m = branco | verde
    for _ in range(2):  # dilata a máscara para pegar o contorno das letras
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    # preenche por difusão (baixa frequência da parede)
    cheio = reg.copy()
    cheio[m] = np.nan
    for _ in range(400):
        viz = np.stack([np.roll(cheio, s, a) for s in (1, -1) for a in (0, 1)])
        media = np.nanmean(viz, axis=0)
        alvo = np.isnan(cheio) & ~np.isnan(media)
        if not alvo.any():
            break
        cheio[alvo] = media[alvo]
    cheio = np.nan_to_num(cheio)
    # reboco: ruído em blocos de 2 px com a variação da própria parede (pixels limpos da região)
    limpos = reg[~m & (reg[..., 0] < reg[..., 2] + 40)]
    desvio = limpos.std(axis=0) * 0.8 if len(limpos) else np.array([10, 10, 10], np.float32)
    rng0 = np.random.default_rng(3)
    blocos = rng0.normal(0, 1, ((y1 - y0 + 1) // 2, (x1 - x0 + 1) // 2, 1)).repeat(2, 0).repeat(2, 1)[: y1 - y0, : x1 - x0]
    tex = blocos * desvio * 0.55
    manchas = rng0.random((y1 - y0, x1 - x0)) > 0.985
    tex[manchas] -= 18
    reg[m] = (cheio + tex)[m]
    palco[y0:y1, x0:x1] = reg
    # selo oficial em pixels, como pintura na parede (3x3, mesmas cores do cabeçalho)
    cores = {0: (235, 235, 230), 1: (111, 168, 255), 2: (235, 235, 230),
             3: (235, 235, 230), 4: (34, 197, 94), 5: (240, 180, 41),
             6: (235, 235, 230), 7: (235, 235, 230), 8: (235, 235, 230)}
    tam, vao = 9, 3
    cx, cy = 403, 200 + CEU_EXTRA
    ox, oy = cx - (3 * tam + 2 * vao) // 2, cy - (3 * tam + 2 * vao) // 2
    rng = np.random.default_rng(7)
    for i, cor in cores.items():
        col, lin = i % 3, i // 3
        xa, ya = ox + col * (tam + vao), oy + lin * (tam + vao)
        alfa = 0.18 if i == 6 else 0.6
        bloco = palco[ya:ya + tam, xa:xa + tam]
        tinta = np.array(cor, np.float32) * 0.78           # tinta sob luz noturna
        ruido = rng.uniform(0.82, 1.05, bloco.shape[:2])[..., None]
        palco[ya:ya + tam, xa:xa + tam] = bloco * (1 - alfa) + tinta * ruido * alfa
    return palco


# ---------------------------------------------------------------- luzes
def detectar_luzes(palco):
    p = palco[CEU_EXTRA:]
    r, g, b = p[..., 0], p[..., 1], p[..., 2]
    v = p.max(axis=2) / 255
    quente = (v > 0.80) & (r - b > 70) & (g > 100)
    claro = (v > 0.90) & (r - b > 25)
    tela = (b > r + 25) & (v > 0.7) & (b > 170)
    m = quente | claro | tela
    m[:110] &= ~tela[:110]          # o azul claro do céu perto da lua não é tela
    excluir = [(122, 95, 190, 160), (735, 5, 790, 65), (655, 330, 805, 460),  # luas, mural de texto
               (288, 408, 340, 464), (730, 225, 805, 300), (440, 300, 560, 464)]  # bandeira, pessoas, rosto
    for x0, y0, x1, y1 in excluir:
        m[y0:y1, x0:x1] = False
    return m, tela


def componentes(m):
    h, w = m.shape
    rot = np.zeros((h, w), np.int32)
    caixas = []
    n = 0
    ys, xs = np.nonzero(m)
    for y, x in zip(ys, xs):
        if rot[y, x]:
            continue
        n += 1
        pilha = [(y, x)]
        rot[y, x] = n
        x0 = x1 = x
        y0 = y1 = y
        area = 0
        while pilha:
            cy, cx = pilha.pop()
            area += 1
            x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not rot[ny, nx]:
                        rot[ny, nx] = n
                        pilha.append((ny, nx))
        caixas.append([x0, y0, x1 + 1, y1 + 1, area])
    # junta pedaços da mesma janela
    mudou = True
    while mudou:
        mudou = False
        for i in range(len(caixas)):
            for j in range(i + 1, len(caixas)):
                a, b = caixas[i], caixas[j]
                juntos = (max(a[2], b[2]) - min(a[0], b[0])) <= 70 and (max(a[3], b[3]) - min(a[1], b[1])) <= 80
                if juntos and a[0] - 1 <= b[2] and b[0] - 1 <= a[2] and a[1] - 1 <= b[3] and b[1] - 1 <= a[3]:
                    caixas[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]), a[4] + b[4]]
                    caixas.pop(j)
                    mudou = True
                    break
            if mudou:
                break
    return [c for c in caixas if c[4] >= 10 and (c[2] - c[0]) <= 110 and (c[3] - c[1]) <= 110]


# ---------------------------------------------------------------- pixel art
def morador(pele, cabelo, camisa, calca, sapato, saia=False, rabo=False, crianca=False, idle=False):
    """Folha de 4 quadros 16x34 px, de perfil para a direita.

    Cada quadro é desenhado em 4x com membros articulados e reduzido, como a arte
    da Base 3: silhueta noturna escura com borda de luz quente vinda das janelas.
    """
    E = 4
    w, h = 16, 34
    pernas = [(24, -24), (6, -5), (-24, 24), (-5, 6)]
    bracos = [(-22, 22), (-6, 6), (22, -22), (6, -6)]
    noite = lambda c, k=0.62: tuple(int(v * k) for v in c)
    folha = Image.new("RGBA", (w * 4, h), (0, 0, 0, 0))
    for f in range(4):
        big = Image.new("RGBA", (w * E, h * E), (0, 0, 0, 0))
        d = ImageDraw.Draw(big)
        bob = 0 if f in (1, 3) else 0.5
        if idle:
            bob = 0.4 * (f % 2)
        U = lambda v: v * E

        def membro(x, y, ang, comp, larg, cor, ponta=None):
            a = math.radians(ang)
            x2, y2 = x + math.sin(a) * comp, y + math.cos(a) * comp
            d.line((U(x), U(y), U(x2), U(y2)), fill=cor, width=int(U(larg)))
            d.ellipse((U(x2) - U(larg) / 2, U(y2) - U(larg) / 2, U(x2) + U(larg) / 2, U(y2) + U(larg) / 2), fill=ponta or cor)
            return x2, y2

        quadril = 19.5 + bob
        ombro = 9.6 + bob
        pa, pb = (0, 0) if idle else pernas[f]
        ba, bb = (-150, 8) if idle else bracos[f]
        comp_perna = 12.5 if not crianca else 11.5
        # perna e braço de trás (mais escuros)
        x2, y2 = membro(7.6, quadril, pb, comp_perna, 2.6, noite(calca, .5))
        d.ellipse((U(x2 - 1.2), U(y2 - .8), U(x2 + 2), U(y2 + .9)), fill=noite(sapato, .6))
        membro(7.8, ombro + .6, bb, 8.2, 1.8, noite(camisa, .45), noite(pele, .45))
        # tronco
        d.polygon([(U(5.4), U(ombro)), (U(10.6), U(ombro)), (U(10.2), U(quadril + .5)), (U(5.8), U(quadril + .5))], fill=noite(camisa))
        if saia:
            d.polygon([(U(5.6), U(quadril - 1)), (U(10.4), U(quadril - 1)), (U(11.6), U(quadril + 5)), (U(4.4), U(quadril + 5))], fill=noite(calca, .7))
        # perna da frente
        cor_perna = noite(pele) if crianca else noite(calca)
        x2, y2 = membro(8.4, quadril, pa, comp_perna, 2.7, cor_perna)
        d.ellipse((U(x2 - 1.2), U(y2 - .8), U(x2 + 2.2), U(y2 + .9)), fill=noite(sapato, .7))
        if crianca:  # bermuda
            membro(8.4, quadril, pa, 4.5, 3.0, noite(calca))
            membro(7.6, quadril, pb, 4.5, 2.9, noite(calca, .5))
        # pescoço e cabeça
        d.rectangle((U(7.3), U(ombro - 1.6), U(8.9), U(ombro + .4)), fill=noite(pele, .55))
        cy = 5.6 + bob
        d.ellipse((U(5.4), U(cy - 3.1), U(10.6), U(cy + 3.1)), fill=noite(pele))
        d.pieslice((U(5.2), U(cy - 3.4), U(10.8), U(cy + 2.6)), 160, 360, fill=noite(cabelo, 1))
        d.rectangle((U(5.2), U(cy - 1.4), U(6.6), U(cy + 1.6)), fill=noite(cabelo, 1))
        if rabo:
            d.ellipse((U(3.6), U(cy - 1), U(5.8), U(cy + 3.6)), fill=noite(cabelo, 1))
        # braço da frente
        membro(8.2, ombro + .6, ba, 8.2, 1.9, noite(camisa, .82), noite(pele, .8))
        # borda de luz quente (lado da frente e topo) e redução
        a = np.asarray(big)[..., 3] > 0
        borda = (a & ~np.roll(a, -E // 2 - 1, axis=1)) | (a & ~np.roll(a, E // 2 + 1, axis=0))
        arr = np.asarray(big).copy()
        quente = np.array([255, 176, 96], np.float32)
        arr[borda, :3] = (arr[borda, :3] * 0.5 + quente * 0.5).astype(np.uint8)
        q = Image.fromarray(arr).resize((w, h), Image.BOX)
        qa = np.asarray(q).copy()
        qa[..., 3] = np.where(qa[..., 3] > 110, 255, np.where(qa[..., 3] > 40, 150, 0))
        folha.paste(Image.fromarray(qa), (f * w, 0))
    return folha


def pipa():
    im = Image.new("RGBA", (11, 17), (0, 0, 0, 0))
    d = im.load()
    for y in range(9):
        meia = 4 - abs(4 - y)
        for x in range(5 - meia, 6 + meia):
            d[x, y] = (226, 190, 70, 255) if x <= 5 else (46, 170, 104, 255)
    for x in range(1, 10):
        d[x, 4] = (30, 24, 20, 255)
    cauda = [(5, 9), (6, 10), (5, 11), (4, 12), (5, 13), (6, 14), (5, 15)]
    for i, (x, y) in enumerate(cauda):
        d[x, y] = (210, 70, 60, 255) if i % 2 == 0 else (240, 210, 120, 255)
    return im


def nuvem(larg, alt, semente):
    rng = random.Random(semente)
    pix = 3
    lw, lh = larg // pix, alt // pix
    im = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for _ in range(9):
        cx = rng.uniform(lw * 0.15, lw * 0.85)
        cy = rng.uniform(lh * 0.45, lh * 0.7)
        rx = rng.uniform(lw * 0.12, lw * 0.25)
        ry = rng.uniform(lh * 0.25, lh * 0.42)
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(54, 72, 118, 150))
    for _ in range(5):
        cx = rng.uniform(lw * 0.25, lw * 0.75)
        cy = rng.uniform(lh * 0.3, lh * 0.5)
        rx = rng.uniform(lw * 0.08, lw * 0.16)
        ry = rng.uniform(lh * 0.15, lh * 0.25)
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(92, 112, 160, 150))
    return im.resize((lw * pix, lh * pix), Image.NEAREST)


# ---------------------------------------------------------------- céu
def mascara_ceu(palco):
    v = palco.max(axis=2)
    r, b = palco[..., 0], palco[..., 2]
    ceu = ((b > r + 6) & (v < 175) & (b > 34)) | (v > 200) & (np.arange(H)[:, None] < 240)
    ceu[:CEU_EXTRA] = True
    alcancado = np.zeros_like(ceu)
    alcancado[0] = ceu[0]
    for _ in range(700):
        viz = alcancado | np.roll(alcancado, 1, 0) | np.roll(alcancado, -1, 0) | np.roll(alcancado, 1, 1) | np.roll(alcancado, -1, 1)
        novo = viz & ceu
        if (novo == alcancado).all():
            break
        alcancado = novo
    alfa = Image.fromarray((alcancado * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    rgba = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rgba.putalpha(alfa)
    return rgba, alcancado


# ---------------------------------------------------------------- principal
def main(base3):
    palco = carregar(base3)
    palco = remover_mural(palco)
    mascara, tela = detectar_luzes(palco)
    caixas = componentes(mascara)
    caixas.sort(key=lambda c: -c[4])
    animadas = caixas[:46]

    # camada de luz: pixels de luz das janelas animadas (+1 px de halo)
    luz = np.zeros((H, W), bool)
    for x0, y0, x1, y1, _ in animadas:
        luz[y0 + CEU_EXTRA:y1 + CEU_EXTRA, x0:x1] |= mascara[y0:y1, x0:x1]
    halo = luz | np.roll(luz, 1, 0) | np.roll(luz, -1, 0) | np.roll(luz, 1, 1) | np.roll(luz, -1, 1)
    luzes = np.zeros((H, W, 4), np.uint8)
    luzes[..., :3] = palco.clip(0, 255).astype(np.uint8)
    alfa = np.where(luz, 255, np.where(halo, 110, 0)).astype(np.uint8)
    luzes[..., 3] = alfa
    # base: as mesmas janelas "apagadas" (a luz volta pela camada de cima)
    base = palco.copy()
    apagada = base * 0.26 + np.array([10, 8, 9], np.float32)
    k = (alfa / 255.0)[..., None]
    base = base * (1 - k) + apagada * k

    ceu_rgba, ceu = mascara_ceu(palco)

    IMG.mkdir(parents=True, exist_ok=True)
    b_img = Image.fromarray(base.clip(0, 255).astype(np.uint8))
    l_img = Image.fromarray(luzes, "RGBA")
    # Só a resolução original da arte (872 px): uma versão "2x" seria apenas ampliação, sem
    # detalhe novo, e custava ~500 KB a mais no celular (LCP medido de 6,6 s).
    b_img.save(IMG / "base-872.webp", "WEBP", quality=82, method=6)
    l_img.save(IMG / "luzes-872.webp", "WEBP", quality=85, method=6)
    for velho in ("base-1744.webp", "luzes-1744.webp"):
        (IMG / velho).unlink(missing_ok=True)
    ceu_rgba.resize((W // 2, H // 2), Image.LANCZOS).save(IMG / "ceu.png", optimize=True)
    for i, (lw, lh) in enumerate([(210, 54), (150, 42), (120, 36)], 1):
        nuvem(lw, lh, i * 17).save(IMG / f"nuvem-{i}.png", optimize=True)
    moradores = {
        "morador-1": morador((86, 56, 40), (18, 13, 10), (206, 200, 188), (38, 48, 64), (24, 24, 24)),
        "morador-2": morador((118, 78, 52), (26, 18, 13), (214, 156, 58), (62, 42, 64), (30, 22, 20), saia=True, rabo=True),
        "morador-3": morador((74, 46, 32), (13, 10, 8), (176, 66, 48), (45, 58, 74), (28, 28, 28), crianca=True),
        "morador-4": morador((96, 62, 44), (16, 12, 9), (64, 110, 170), (40, 40, 52), (24, 24, 24), crianca=True, idle=True),
    }
    for nome, folha in moradores.items():
        folha.save(IMG / f"{nome}.png", optimize=True)
    pipa().save(IMG / "pipa.png", optimize=True)

    # ------------------------------------------------ CSS
    regras = []
    janelas = []
    for i, (x0, y0, x1, y1, area) in enumerate(animadas, 1):
        x0, y0, x1, y1 = x0 - 1, y0 + CEU_EXTRA - 1, x1 + 1, y1 + CEU_EXTRA + 1
        w, h = x1 - x0, y1 - y0
        e_tela = tela[y0 - CEU_EXTRA:y1 - CEU_EXTRA, x0:x1].mean() > 0.3
        if e_tela:
            tipo = "tela"
        else:
            tipo = random.choices(["respira", "apaga", "acende", "oscila"], [5, 4, 2, 1])[0]
        dur = {"respira": random.uniform(7, 13), "apaga": random.uniform(22, 44),
               "acende": random.uniform(26, 50), "oscila": random.uniform(3, 6), "tela": random.uniform(4, 7)}[tipo]
        atraso = -random.uniform(0, dur)
        bx = x0 / (W - w) * 100 if W != w else 0
        by = y0 / (H - h) * 100 if H != h else 0
        regras.append(
            f".fv-j{i}{{left:{pct(x0, W)};top:{pct(y0, H)};width:{pct(w, W)};height:{pct(h, H)};"
            f"background-size:{W / w * 100:.2f}% {H / h * 100:.2f}%;background-position:{bx:.3f}% {by:.3f}%;"
            f"--dur:{dur:.1f}s;--atraso:{atraso:.1f}s}}")
        janelas.append(f'<i class="fv-janela fv-{tipo} fv-j{i}"></i>')

    # estrelas só onde é céu, longe das luas
    estrelas = []
    tent = 0
    while len(estrelas) < 26 and tent < 5000:
        tent += 1
        x, y = random.randrange(10, W - 10), random.randrange(4, 210)
        if not ceu[y, x] or math.hypot(x - 155, y - 128 - CEU_EXTRA) < 60 or math.hypot(x - 751, y - 36 - CEU_EXTRA) < 50:
            continue
        estrelas.append((x, y))
    for i, (x, y) in enumerate(estrelas, 1):
        regras.append(f".fv-e{i}{{left:{pct(x, W)};top:{pct(y, H)};--dur:{random.uniform(2.5, 6):.1f}s;--atraso:{-random.uniform(0, 6):.1f}s}}")

    css = TEMPLATE_CSS.replace("/*__GERADO__*/", "\n".join(regras))
    CSS.write_text(css, encoding="utf-8")

    html = TEMPLATE_HTML.format(
        janelas="\n          ".join(janelas),
        estrelas="\n          ".join(f'<i class="fv-estrela fv-e{i}"></i>' for i in range(1, len(estrelas) + 1)),
    )
    s = INDEX.read_text(encoding="utf-8")
    s = re.sub(r"<!-- favela:inicio -->.*?<!-- favela:fim -->", "<!-- favela:inicio -->\n" + html + "    <!-- favela:fim -->", s, flags=re.S)
    INDEX.write_text(s, encoding="utf-8")
    print(f"janelas animadas: {len(animadas)} de {len(caixas)} | estrelas: {len(estrelas)}")


TEMPLATE_HTML = """    <div class="favela" data-favela>
      <div class="fv-palco" role="img" aria-label="Favela à noite, com casas de laje iluminadas, moradores andando pelas lajes, uma criança soltando pipa no telhado e o mural A tecnologia também nasce aqui.">
        <img class="fv-base" src="assets/img/favela/base-872.webp" width="872" height="538" alt="" fetchpriority="high" decoding="async">
        <div class="fv-ceu" aria-hidden="true">
          {estrelas}
          <i class="fv-nuvem fv-n1"></i><i class="fv-nuvem fv-n2"></i><i class="fv-nuvem fv-n3"></i>
        </div>
        <i class="fv-lua" aria-hidden="true"></i>
        <div class="fv-luzes" aria-hidden="true">
          {janelas}
        </div>
        <div class="fv-pessoas" aria-hidden="true">
          <i class="fv-caminho fv-c1"><i class="fv-sprite fv-morador-1"></i></i>
          <i class="fv-caminho fv-c2"><i class="fv-sprite fv-morador-2"></i></i>
          <i class="fv-caminho fv-c3"><i class="fv-sprite fv-morador-3"></i></i>
          <i class="fv-crianca-pipa"><i class="fv-sprite fv-morador-4"></i><i class="fv-linha"><i class="fv-pipa"></i></i></i>
        </div>
      </div>
      <button class="fv-controle" type="button" data-favela-controle hidden>Pausar cena</button>
    </div>
"""

TEMPLATE_CSS = """/* =========================================================
   BIG STUDIO — favela animada da página inicial
   ARQUIVO GERADO por ferramentas/gerar-favela.py (não editar à mão:
   altere o gerador e rode de novo).

   A arte da Base 3 é dividida em camadas no "palco" (872x538):
   céu e construções (base) · estrelas e nuvens (só sobre o céu) ·
   luz de cada janela · moradores e pipa. Tudo em % do palco.
   ========================================================= */
.favela{position:relative;overflow:hidden;isolation:isolate}
.fv-palco{
  position:absolute;right:0;bottom:0;height:100%;min-width:100%;
  aspect-ratio:872/538;container-type:size;
}
.fv-palco > .fv-base,.fv-palco > .fv-ceu,.fv-palco > .fv-luzes,.fv-palco > .fv-pessoas{position:absolute;inset:0}
.fv-base{width:100%;height:100%;display:block}
.fv-palco i{display:block;position:absolute}

/* céu: estrelas piscando e nuvens lentas, recortadas pela máscara do céu */
.fv-ceu{-webkit-mask:url("../img/favela/ceu.png") 0 0/100% 100% no-repeat;mask:url("../img/favela/ceu.png") 0 0/100% 100% no-repeat}
.fv-estrela{width:.23%;aspect-ratio:1;background:#DCE6FF;border-radius:1px;box-shadow:0 0 4px rgba(200,215,255,.8);animation:fv-pisca var(--dur) ease-in-out var(--atraso) infinite}
.fv-nuvem{background-repeat:no-repeat;background-size:100% 100%;image-rendering:pixelated;opacity:.85;animation:fv-nuvem var(--dur) linear var(--atraso) infinite}
.fv-n1{background-image:url("../img/favela/nuvem-1.png");width:24%;aspect-ratio:210/54;top:5%;--dur:150s;--atraso:-40s}
.fv-n2{background-image:url("../img/favela/nuvem-2.png");width:17%;aspect-ratio:150/42;top:17%;--dur:190s;--atraso:-120s}
.fv-n3{background-image:url("../img/favela/nuvem-3.png");width:14%;aspect-ratio:120/36;top:28%;--dur:170s;--atraso:-70s}
.fv-lua{left:12.2%;top:28.5%;width:9.5%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(220,230,255,.32),transparent 68%);mix-blend-mode:screen;animation:fv-lua 9s ease-in-out infinite}

/* luzes: cada janela usa a sua parte da camada de luz e tem o seu ritmo */
.fv-janela{
  background-image:url("../img/favela/luzes-872.webp");
  background-repeat:no-repeat;mix-blend-mode:normal;
  animation:var(--anim,fv-respira) var(--dur) ease-in-out var(--atraso) infinite;
}
.fv-respira{--anim:fv-respira}
.fv-apaga{--anim:fv-apaga}
.fv-acende{--anim:fv-acende}
.fv-oscila{--anim:fv-oscila}
.fv-tela{--anim:fv-tela;animation-timing-function:steps(1,end)}

/* moradores: o caminho anda; o sprite troca os quadros do passo */
.fv-caminho{animation:var(--trajeto) var(--dur) linear var(--atraso) infinite;opacity:0}
.fv-sprite{inset:0;background-repeat:no-repeat;background-size:400% 100%;image-rendering:pixelated;animation:fv-passo var(--passo,.62s) steps(4) infinite}
.fv-morador-1{background-image:url("../img/favela/morador-1.png")}
.fv-morador-2{background-image:url("../img/favela/morador-2.png")}
.fv-morador-3{background-image:url("../img/favela/morador-3.png")}
.fv-morador-4{background-image:url("../img/favela/morador-4.png");animation:fv-respiro 2.4s steps(4) infinite}
/* laje do telhado à direita: anda devagar de um lado para o outro, contra as luzes da cidade */
.fv-c1{left:92.4%;top:45.7%;height:8.55%;aspect-ratio:16/34;--dur:24s;--atraso:-4s;--trajeto:fv-c1;--passo:.75s}
/* laje da sala dos computadores: sai da porta acesa e anda para a esquerda */
.fv-c2{left:28.9%;top:75.8%;height:9.7%;aspect-ratio:16/34;--dur:34s;--atraso:-17s;--trajeto:fv-c2;--passo:.7s}
/* laje superior: criança sai da porta e vai até a beira */
.fv-c3{left:68.6%;top:26.6%;height:5.9%;aspect-ratio:16/34;--dur:26s;--atraso:-9s;--trajeto:fv-c3;--passo:.5s}
/* telhado da casa acesa: criança soltando pipa */
.fv-crianca-pipa{left:26.1%;top:43.9%;height:4.9%;aspect-ratio:16/34}
.fv-crianca-pipa .fv-sprite{transform:scaleX(-1)}
.fv-linha{left:22%;top:26%;width:1000%;height:0;border-top:1px solid rgba(225,232,255,.45);transform-origin:0 0;transform:rotate(-118deg);animation:fv-linha 6s ease-in-out infinite}
.fv-pipa{right:0;top:0;width:7%;margin:-5.4% -3.5% 0 0;aspect-ratio:11/17;transform:rotate(118deg);background:url("../img/favela/pipa.png") 0 0/100% 100% no-repeat;image-rendering:pixelated;animation:fv-pipa 2.2s ease-in-out infinite}

@keyframes fv-pisca{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes fv-nuvem{from{transform:translateX(105cqw)}to{transform:translateX(-30cqw)}}
@keyframes fv-lua{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes fv-respira{0%,100%{opacity:1}50%{opacity:.72}}
@keyframes fv-apaga{0%,62%,100%{opacity:1}66%,90%{opacity:.08}}
@keyframes fv-acende{0%,40%,100%{opacity:.1}44%,78%{opacity:1}}
@keyframes fv-oscila{0%,100%{opacity:1}20%{opacity:.82}24%{opacity:.98}60%{opacity:.86}}
@keyframes fv-tela{0%{opacity:1}18%{opacity:.7}31%{opacity:.95}47%{opacity:.6}63%{opacity:1}81%{opacity:.78}}
@keyframes fv-passo{from{background-position:0 0}to{background-position:133.333% 0}}
@keyframes fv-respiro{from{background-position:0 0}to{background-position:133.333% 0}}
@keyframes fv-linha{0%,100%{transform:rotate(-118deg)}50%{transform:rotate(-114deg)}}
@keyframes fv-pipa{0%,100%{transform:rotate(118deg) translateY(0)}50%{transform:rotate(124deg) translateY(-12%)}}
@keyframes fv-c1{
  0%{opacity:0;transform:translateX(0)}6%{opacity:1;transform:translateX(0)}
  44%{transform:translateX(3.9cqw)}44.01%{transform:translateX(3.9cqw) scaleX(-1)}
  86%{opacity:1;transform:translateX(0) scaleX(-1)}92%,100%{opacity:0;transform:translateX(0) scaleX(-1)}
}
@keyframes fv-c2{
  0%{opacity:0;transform:scaleX(-1)}3%{opacity:1;transform:translateX(0) scaleX(-1)}
  42%{transform:translateX(-15.6cqw) scaleX(-1)}42.01%{transform:translateX(-15.6cqw)}
  80%{opacity:1;transform:translateX(0)}83%,100%{opacity:0;transform:translateX(0)}
}
@keyframes fv-c3{
  0%{opacity:0;transform:translateX(0)}4%{opacity:1;transform:translateX(0)}
  38%{transform:translateX(8.3cqw)}38.01%{transform:translateX(8.3cqw) scaleX(-1)}
  72%{opacity:1;transform:translateX(0) scaleX(-1)}76%,100%{opacity:0;transform:translateX(0) scaleX(-1)}
}

/* pausa (botão, fora da tela ou aba oculta) */
.favela:not(.fv-rodando) .fv-palco *{animation-play-state:paused!important}
.fv-controle{
  position:absolute;right:max(14px,2%);bottom:max(14px,4%);z-index:3;
  min-height:36px;padding:0 16px;border-radius:999px;font:inherit;font-size:.78rem;font-weight:600;
  color:#E4E8EC;background:rgba(6,9,16,.72);border:1px solid rgba(255,255,255,.28);cursor:pointer;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
}
.fv-controle:hover{border-color:#fff}
.fv-controle:focus-visible{outline:3px solid #6FA8FF;outline-offset:2px}
.fv-controle[hidden]{display:none}

/* movimento reduzido: cena estática completa (janelas acesas, moradores parados) */
@media (prefers-reduced-motion:reduce){
  .fv-palco *{animation:none!important}
  .fv-caminho{opacity:1}
  .fv-n1{transform:translateX(52cqw)}.fv-n2{transform:translateX(18cqw)}.fv-n3{display:none}
  .fv-linha{transform:rotate(-116deg)}
}

/* ---- posições geradas ---- */
/*__GERADO__*/
"""

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
