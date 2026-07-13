from PIL import Image, ImageFilter, ImageEnhance
import pytesseract
import os

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(img):
    if img.mode != 'RGB':
        img = img.convert('RGB')
    width, height = img.size
    if width < 1000:
        scale = 1000 / width
        img = img.resize((int(width * scale), int(height * scale)), Image.LANCZOS)
    img = img.convert('L')
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    img = img.filter(ImageFilter.SHARPEN)
    return img

files = os.listdir('uploads')
for f in files:
    if f.endswith(('.png', '.jpg', '.jpeg')):
        path = f'uploads/{f}'
        img = Image.open(path)
        img = preprocess_image(img)
        text = pytesseract.image_to_string(img, config='--psm 3 --oem 3')
        print(f"File: {f}")
        print(f"Text: '{text[:300]}'")
        print(f"Length: {len(text)}")