FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads data

# THE FIX: Point to folder 5 instead of 4!
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata

CMD uvicorn main:app --host 0.0.0.0 --port $PORT