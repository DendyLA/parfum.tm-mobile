from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "mobile" / "assets" / "images"
FONT_PATH = ROOT / "frontend" / "parfum_next" / "public" / "fonts" / "FixelVariable.ttf"
SOURCE_LOGO = Path(r"C:\Users\Azat\Downloads\logo.png")
SOURCE_MARK = ROOT / "frontend" / "parfum_next" / "public" / "favicons" / "apple-touch-icon.png"


def load_font(size):
    return ImageFont.truetype(str(FONT_PATH), size)


def center(draw, xy, text, font, fill):
    box = draw.textbbox((0, 0), text, font=font)
    width = box[2] - box[0]
    height = box[3] - box[1]
    draw.text((xy[0] - width / 2, xy[1] - height / 2), text, font=font, fill=fill)


def trim_alpha(image):
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    return image.crop(bbox) if bbox else image


def resize_to_fit(image, max_size):
    scale = min(max_size[0] / image.width, max_size[1] / image.height)
    size = (round(image.width * scale), round(image.height * scale))
    return image.resize(size, Image.Resampling.LANCZOS)


def make_app_icon():
    image = Image.new("RGB", (1024, 1024), "white")
    mark = trim_alpha(Image.open(SOURCE_MARK).convert("RGBA"))
    mark = resize_to_fit(mark, (900, 900))
    image.paste(mark, ((1024 - mark.width) // 2, (1024 - mark.height) // 2), mark)
    image.save(OUT / "parfum-app-icon.png")


def make_adaptive_foreground():
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    mark = trim_alpha(Image.open(SOURCE_MARK).convert("RGBA"))
    mark = resize_to_fit(mark, (900, 900))
    image.paste(mark, ((1024 - mark.width) // 2, (1024 - mark.height) // 2), mark)
    image.save(OUT / "parfum-adaptive-foreground.png")


def make_splash():
    image = Image.new("RGB", (1024, 1024), "white")
    draw = ImageDraw.Draw(image)
    logo = Image.open(OUT / "parfum-logo.png").convert("RGBA")
    logo.thumbnail((760, 300), Image.Resampling.LANCZOS)
    image.paste(logo, ((1024 - logo.width) // 2, 420), logo)
    draw.line((322, 690, 702, 690), fill=(91, 36, 201), width=8)
    image.save(OUT / "parfum-splash.png")


def make_logo_copy():
    logo = Image.open(SOURCE_LOGO).convert("RGBA")
    logo.save(OUT / "parfum-logo.png")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    make_logo_copy()
    make_app_icon()
    make_adaptive_foreground()
    make_splash()
