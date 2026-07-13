from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.document import Document
from models.user import User
from services.auth_service import get_current_user
from services.ocr_service import extract_text

router = APIRouter()

@router.post("/{document_id}/ocr")
def run_ocr(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.ocr_status == "processing":
        raise HTTPException(status_code=400, detail="OCR already in progress")

    doc.ocr_status = "processing"
    db.commit()

    result = extract_text(doc.file_path, doc.file_type)

    doc.extracted_text = result["text"]
    doc.page_count = result["page_count"]
    doc.processing_time = result["processing_time"]
    doc.ocr_status = "done" if "error" not in result else "failed"
    db.commit()

    return {
        "document_id": document_id,
        "ocr_status": doc.ocr_status,
        "page_count": doc.page_count,
        "processing_time": doc.processing_time,
        "extracted_text": doc.extracted_text
    }