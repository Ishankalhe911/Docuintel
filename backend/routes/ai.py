from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from database import get_db
from models.document import Document
from models.chat_message import ChatMessage
from models.user import User
from schemas.chat import ChatRequest, ChatMessageOut
from services.auth_service import get_current_user
from services.groq_service import classify_document, extract_structured_data, generate_summary, stream_chat

router = APIRouter()


@router.post("/{document_id}/classify")
def classify(
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
    if not doc.extracted_text:
        raise HTTPException(status_code=400, detail="OCR not completed yet")

    doc_type = classify_document(doc.extracted_text)
    doc.document_type = doc_type
    db.commit()

    return {"document_id": document_id, "document_type": doc_type}


@router.post("/{document_id}/extract")
def extract(
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
    if not doc.extracted_text:
        raise HTTPException(status_code=400, detail="OCR not completed yet")

    structured = extract_structured_data(doc.extracted_text, doc.document_type)
    doc.structured_data = json.dumps(structured)
    db.commit()

    return {"document_id": document_id, "structured_data": structured}


@router.post("/{document_id}/summary")
def summary(
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
    if not doc.extracted_text:
        raise HTTPException(status_code=400, detail="OCR not completed yet")

    doc_summary = generate_summary(doc.extracted_text, doc.document_type)
    doc.summary = doc_summary
    db.commit()

    return {"document_id": document_id, "summary": doc_summary}


@router.post("/{document_id}/chat", response_model=ChatMessageOut)
def chat(
    document_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.extracted_text:
        raise HTTPException(status_code=400, detail="OCR not completed yet")

    history = db.query(ChatMessage).filter(
        ChatMessage.document_id == document_id
    ).order_by(ChatMessage.created_at.asc()).all()

    history_list = [{"role": m.role, "message": m.message} for m in history]

    user_msg = ChatMessage(
        document_id=document_id,
        role="user",
        message=payload.message
    )
    db.add(user_msg)
    db.commit()

    response_text = ""
    for token in stream_chat(doc.extracted_text, payload.message, history_list):
        response_text += token

    assistant_msg = ChatMessage(
        document_id=document_id,
        role="assistant",
        message=response_text
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg