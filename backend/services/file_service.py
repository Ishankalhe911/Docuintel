import os
import uuid
from fastapi import UploadFile, HTTPException, status

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
}

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE_MB = 10

def validate_and_save_file(file: UploadFile) -> dict:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: PDF, PNG, JPG, JPEG"
        )

    contents = file.file.read()

    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB"
        )

    ext = ALLOWED_TYPES[file.content_type]
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    with open(file_path, "wb") as f:
        f.write(contents)

    return {
        "original_filename": file.filename,
        "saved_path": file_path,
        "file_type": file.content_type,
        "size_mb": round(size_mb, 2)
    }

def delete_file(file_path: str) -> None:
    if os.path.exists(file_path):
        os.remove(file_path)