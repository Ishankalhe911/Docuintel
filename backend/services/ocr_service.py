import time
import io
import platform
import pytesseract
import pymupdf
from PIL import Image, ImageFilter, ImageEnhance

# Smart OS Detection!
if platform.system() == 'Windows':
    # Use this path when testing locally on your laptop
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
else:
    # Use this path when running inside Render's Linux Docker container
    pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'

def preprocess_image(img: Image.Image) -> Image.Image:
    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Resize if too small — Tesseract needs minimum ~300 DPI equivalent
    width, height = img.size
    if width < 1000:
        scale = 1000 / width
        img = img.resize((int(width * scale), int(height * scale)), Image.LANCZOS)
    
    # Convert to grayscale
    img = img.convert('L')
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    
    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)
    
    return img

def extract_text(file_path: str, file_type: str) -> dict:
    start = time.time()
    text = ""
    pages = 1

    try:
        if file_type in ("image/png", "image/jpeg", "image/jpg"):
            img = Image.open(file_path)
            img = preprocess_image(img)
            text = pytesseract.image_to_string(img, config='--psm 3 --oem 3')
            pages = 1

        elif file_type == "application/pdf":
            doc = pymupdf.open(file_path)
            pages = len(doc)
            all_text = []

            for page in doc:
                native = page.get_text().strip()
                if native and len(native) > 20:
                    all_text.append(native)
                else:
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
                    img = Image.open(io.BytesIO(img_bytes))
                    img = preprocess_image(img)
                    ocr_text = pytesseract.image_to_string(img, config='--psm 3 --oem 3')
                    all_text.append(ocr_text)

            doc.close()
            text = "\n\n".join(all_text)

    except Exception as e:
        # Force Docker to print the error instantly!
        print(f"🚨 OCR FATAL CRASH: {str(e)}", flush=True)
        return {
            "text": "",
            "page_count": pages,
            "processing_time": round(time.time() - start, 2),
            "error": str(e)
        }

    return {
        "text": text.strip(),
        "page_count": pages,
        "processing_time": round(time.time() - start, 2)
    }