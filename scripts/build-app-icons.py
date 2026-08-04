"""PWA 홈 화면 아이콘 생성 — 여는 도돌이표 𝄆 (src/components/DodoriMark.tsx와 같은 지오메트리).

    python scripts/build-app-icons.py

MARK_RATIO는 maskable 세이프존(가운데 지름 80% 원)에 마크의 대각선이 들어가는 상한이다.
더 키우면 원형으로 깎는 런처에서 막대 끝이 잘린다.
"""

from PIL import Image, ImageDraw

BG = (18, 18, 18, 255)  # color.bg #121212
GREEN = (30, 215, 96, 255)  # color.greenBright #1ED760
MARK_RATIO = 0.60  # 캔버스 한 변 대비 마크 높이
SS = 4  # 슈퍼샘플링 배율 (둥근 모서리·점을 매끄럽게)

OUTPUTS = [
    ("public/icons/icon-512.png", 512),
    ("public/icons/icon-1024.png", 1024),
    ("public/icons/apple-touch-icon.png", 512),
]


def render(size: int) -> Image.Image:
    n = size * SS
    im = Image.new("RGBA", (n, n), BG)
    d = ImageDraw.Draw(im)

    s = n * MARK_RATIO  # 마크 높이 (DodoriMark의 size)
    left = (n - s * 0.8) / 2
    top = (n - s) / 2

    def bar(x: float, w: float) -> None:
        d.rounded_rectangle(
            [left + s * x, top, left + s * (x + w), top + s], radius=s * 0.03, fill=GREEN
        )

    def dot(y: float) -> None:
        d.ellipse(
            [left + s * 0.54, top + s * y, left + s * 0.80, top + s * (y + 0.26)], fill=GREEN
        )

    bar(0, 0.22)
    bar(0.33, 0.085)
    dot(0.17)
    dot(0.57)

    return im.resize((size, size), Image.LANCZOS)


for path, size in OUTPUTS:
    render(size).save(path)
    print(f"{path} ({size}px)")
