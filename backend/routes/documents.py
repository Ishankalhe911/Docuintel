from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import json

from config import settings
from database import get_db
from models.user import User
from models.document import Document
from models.chat_message import ChatMessage
from schemas.document import DocumentOut, DocumentList
from services.auth_service import get_current_user
from services.file_service import validate_and_save_file, delete_file
from services.ocr_service import extract_text
from services.groq_service import classify_document, extract_structured_data, generate_summary

router = APIRouter()


def run_ai_pipeline(document_id: int, db: Session):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return
    try:
        doc.ocr_status = "processing"
        db.commit()

        result = extract_text(doc.file_path, doc.file_type)
        doc.extracted_text = result["text"]
        doc.page_count = result["page_count"]
        doc.processing_time = result["processing_time"]
        doc.ocr_status = "done" if "error" not in result else "failed"
        db.commit()

        if doc.ocr_status == "failed":
            doc.extraction_status = "failed"
            db.commit()
            return

        doc.extraction_status = "processing"
        db.commit()

        doc_type = classify_document(doc.extracted_text)
        doc.document_type = doc_type

        structured = extract_structured_data(doc.extracted_text, doc_type)
        doc.structured_data = json.dumps(structured)

        summary = generate_summary(doc.extracted_text, doc_type)
        doc.summary = summary

        doc.extraction_status = "done"
        db.commit()

    except Exception as e:
        doc.ocr_status = "failed"
        doc.extraction_status = "failed"
        db.commit()


@router.post("", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_info = validate_and_save_file(file)

    doc = Document(
        user_id=current_user.id,
        filename=file_info["original_filename"],
        file_path=file_info["saved_path"],
        file_type=file_info["file_type"],
        ocr_status="pending",
        extraction_status="pending"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    background_tasks.add_task(run_ai_pipeline, doc.id, db)
    return doc


@router.get("", response_model=list[DocumentList])
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.created_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
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
    return doc


@router.delete("/{document_id}")
def delete_document(
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

    delete_file(doc.file_path)
    db.query(ChatMessage).filter(ChatMessage.document_id == document_id).delete()
    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully"}


@router.get("/{document_id}/file")
def get_document_file(
    document_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == int(user_id)
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    
    return FileResponse(
        path=doc.file_path,
        media_type=doc.file_type,
        headers={"Content-Disposition": f'inline; filename="{doc.filename}"'}
    )
