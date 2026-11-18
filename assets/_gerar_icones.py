"""
Gera os icones do PWA Sonare reproduzindo o logo completo.
- Formato: PNG quadrado (192x192, 512x512, maskable)
- Conteudo: fundo escuro com gradiente diagonal, guitarra dourada grande,
  equalizer roxo/ciano com 12 barras de cada lado, "SONARE" embaixo
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os, math

OUT = r"C:\Users\Administrador\Downloads\sonare-app\assets"
os.makedirs(OUT, exist_ok=True)

# Cores do site
INK        = (15, 14, 26)
INK_2      = (26, 23, 38)
GOLD       = (212, 165, 116)
GOLD_SOFT  = (232, 195, 135)
GOLD_DEEP  = (160, 122, 72)
GOLD_DEEPER= (122, 90, 46)
VIOLET     = (157, 78, 221)
CYAN       = (76, 201, 240)
CREAM      = (245, 241, 232)

def gradient_bg(size):
    img = Image.new("RGB", size, INK)
    px = img.load()
    w, h = size
    for y in range(h):
        for x in range(w):
            t = (x + y * 0.3) / (w + h * 0.3)
            r = int(INK[0] + (INK_2[0] - INK[0]) * t)
            g = int(INK[1] + (INK_2[1] - INK[1]) * t)
            b = int(INK[2] + (INK_2[2] - INK[2]) * t)
            px[x, y] = (r, g, b)
    return img

def eq_bars(draw, cx_center, cy_center, side, n_bars=12, max_h=None, color=VIOLET):
    """Desenha equalizer de N barras, centradas horizontalmente em cx_center."""
    if max_h is None:
        max_h = int(cy_center * 1.2)
    # Espacamento decresce nas pontas, cresce no meio (formato natural do logo)
    heights = []
    for i in range(n_bars):
        # Sino: pico no centro, baixa nas pontas
        # i = 0..n_bars-1; pico em (n_bars-1)/2
        center = (n_bars - 1) / 2
        dist = abs(i - center) / center  # 0 no centro, 1 nas pontas
        # Padrão similar à imagem: cresce do meio pras pontas suavemente
        # Mas a imagem mostra: barras crescem a partir do centro (curva sino)
        h = max(4, int((0.3 + 0.7 * (1 - dist * 0.9)) * max_h))
        heights.append(h)

    bw = max(2, int(cx_center / 30))  # largura da barra
    spacing = bw + max(2, int(bw * 0.7))
    total_w = (n_bars - 1) * spacing + bw

    start_x = cx_center - total_w // 2
    for i, h in enumerate(heights):
        x = start_x + i * spacing
        y = cy_center - h // 2
        draw.rounded_rectangle([x, y, x + bw, y + h], radius=bw // 2, fill=color)

def draw_guitar(draw, cx, cy, scale=1.0):
    """Guitarra dourada vertical (formato violão)."""
    # Corpo (elipse vertical maior, formato violão)
    body_w = int(80 * scale)
    body_h = int(160 * scale)
    # Gradiente vertical do corpo (claro em cima, escuro embaixo)
    body_top_y = cy - body_h // 2
    body_bot_y = cy + body_h // 2
    for y in range(body_top_y, body_bot_y):
        t = (y - body_top_y) / (body_h)
        r = int(GOLD_SOFT[0] + (GOLD_DEEP[0] - GOLD_SOFT[0]) * t)
        g = int(GOLD_SOFT[1] + (GOLD_DEEP[1] - GOLD_SOFT[1]) * t)
        b = int(GOLD_SOFT[2] + (GOLD_DEEP[2] - GOLD_SOFT[2]) * t)
        # Forma de elipse: x extent encolhe nas pontas
        # Aproximacao: largura varia com altura
        rel = (y - body_top_y) / body_h
        extent = math.sin(rel * math.pi)  # 0 nas pontas, 1 no meio
        w = int(body_w * extent)
        if w > 0:
            draw.ellipse([cx - w, y, cx + w, y + 1], fill=(r, g, b))

    # Boca da guitarra (cavidade preta/escura)
    boca_w = int(body_w * 0.55)
    boca_h = int(body_h * 0.18)
    boca_cy = cy - body_h // 6
    draw.ellipse([cx - boca_w, boca_cy - boca_h, cx + boca_w, boca_cy + boca_h], fill=INK)

    # Pestana inferior (curvada)
    draw.arc([cx - body_w, body_bot_y - 30, cx + body_w, body_bot_y + 30], 0, 180, fill=GOLD_DEEPER, width=2)

    # Braço/cabeça (retângulo estreito vertical saindo do topo)
    arm_w = int(body_w * 0.32)
    arm_h = int(120 * scale)
    arm_top = cy - body_h // 2 - arm_h
    # Gradiente do braço
    for y in range(arm_top, cy - body_h // 2):
        t = (y - arm_top) / arm_h
        r = int(GOLD_SOFT[0] + (GOLD_DEEPER[0] - GOLD_SOFT[0]) * t)
        g = int(GOLD_SOFT[1] + (GOLD_DEEPER[1] - GOLD_SOFT[1]) * t)
        b = int(GOLD_SOFT[2] + (GOLD_DEEPER[2] - GOLD_SOFT[2]) * t)
        # afunilando pra cima (formato cabeça de guitarra)
        rel = (y - arm_top) / arm_h
        w = int(arm_w * (0.7 + 0.3 * rel))
        draw.rectangle([cx - w, y, cx + w, y + 1], fill=(r, g, b))

    # Pestano (linha horizontal preta no topo do braço)
    draw.line([(cx - arm_w, arm_top + 4), (cx + arm_w, arm_top + 4)], fill=INK_2, width=2)

    # Tarraxas (cravelhas) - 3 bolinhas de cada lado
    for i in range(3):
        y_t = arm_top + 12 + i * 14
        # Esquerda
        draw.ellipse([cx - arm_w - 8, y_t - 4, cx - arm_w + 2, y_t + 4], fill=GOLD_DEEPER)
        # Direita
        draw.ellipse([cx + arm_w - 2, y_t - 4, cx + arm_w + 8, y_t + 4], fill=GOLD_DEEPER)

    # Cordas (linhas verticais finas do braço até o corpo)
    for k in range(3):
        offset = (k - 1) * arm_w * 0.25
        draw.line([(cx + offset, arm_top), (cx + offset, cy + body_h // 2 - 8)], fill=INK_2, width=1)

def draw_text(draw, text, cx, y, size, color):
    """Texto SONARE."""
    font = None
    for name in ["arial.ttf", "DejaVuSans-Bold.ttf", "calibrib.ttf"]:
        try:
            font = ImageFont.truetype(name, size)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # Linhas decorativas em volta do texto (como na imagem)
    line_w = int(tw * 0.15)
    line_y = y - 2
    # Linha esquerda
    draw.line([(cx - tw // 2 - line_w, line_y), (cx - tw // 2 - 4, line_y)], fill=color, width=2)
    # Linha direita
    draw.line([(cx + tw // 2 + 4, line_y), (cx + tw // 2 + line_w, line_y)], fill=color, width=2)
    draw.text((cx - tw // 2, y - th // 2), text, font=font, fill=color)

def make_icon(size, maskable=False):
    s = size
    img = gradient_bg((s, s))
    draw = ImageDraw.Draw(img)

    # Margem para maskable (10% pra cada lado = área segura)
    pad = int(s * 0.10) if maskable else int(s * 0.05)
    inner = s - pad * 2
    cx = s // 2

    # Equalizer esquerdo (roxo) e direito (ciano)
    eq_y = int(s * 0.36)
    eq_offset = int(inner * 0.36)
    eq_bars(draw, cx - eq_offset, eq_y, "left", n_bars=12, max_h=int(inner * 0.40), color=VIOLET)
    eq_bars(draw, cx + eq_offset, eq_y, "right", n_bars=12, max_h=int(inner * 0.40), color=CYAN)

    # Guitarra centralizada
    guitar_cy = int(s * 0.42)
    guitar_scale = inner / 220
    draw_guitar(draw, cx, guitar_cy, scale=guitar_scale)

    # Texto SONARE
    text_y = int(s * 0.78)
    draw_text(draw, "SONARE", cx, text_y, int(s * 0.13), GOLD)

    # Glow dourado sutil atrás da guitarra
    glow = Image.new("RGB", (s, s), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([cx - s * 0.18, s * 0.28, cx + s * 0.18, s * 0.62], fill=GOLD_DEEP)
    glow = glow.filter(ImageFilter.GaussianBlur(s * 0.04))
    img = Image.blend(img, glow, 0.20)

    # Redesenhar tudo por cima do glow (pra ficar nítido)
    draw = ImageDraw.Draw(img)
    eq_y = int(s * 0.36)
    eq_offset = int(inner * 0.36)
    eq_bars(draw, cx - eq_offset, eq_y, "left", n_bars=12, max_h=int(inner * 0.40), color=VIOLET)
    eq_bars(draw, cx + eq_offset, eq_y, "right", n_bars=12, max_h=int(inner * 0.40), color=CYAN)
    draw_guitar(draw, cx, int(s * 0.42), scale=inner / 220)
    draw_text(draw, "SONARE", cx, int(s * 0.78), int(s * 0.13), GOLD)

    img.save(os.path.join(OUT, f"icon-{s}.png" if not maskable else f"icon-maskable-{s}.png"), "PNG", optimize=True)
    print(f"  OK icon-{s}.png" + (" (maskable)" if maskable else ""))

print("Gerando icones Sonare com logo completo...")
make_icon(192)
make_icon(512)
make_icon(512, maskable=True)
print("Pronto.")
