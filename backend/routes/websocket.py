from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models.document import Document
from models.chat_message import ChatMessage
from services.groq_service import stream_chat

router = APIRouter()

@router.websocket("/ws/chat/{document_id}")
async def websocket_chat(
    websocket: WebSocket,
    document_id: int
):
    await websocket.accept()
    db: Session = SessionLocal()

    try:
        while True:
            data = await websocket.receive_json()
            question = data.get("message", "")

            if not question:
                await websocket.send_json({"type": "error", "message": "Empty message"})
                continue

            doc = db.query(Document).filter(Document.id == document_id).first()
            if not doc or not doc.extracted_text:
                await websocket.send_json({"type": "error", "message": "Document not found or OCR not complete"})
                continue

            history = db.query(ChatMessage).filter(
                ChatMessage.document_id == document_id
            ).order_by(ChatMessage.created_at.asc()).all()
            history_list = [{"role": m.role, "message": m.message} for m in history]

            user_msg = ChatMessage(
                document_id=document_id,
                role="user",
                message=question
            )
            db.add(user_msg)
            db.commit()

            full_response = ""
            for token in stream_chat(doc.extracted_text, question, history_list):
                full_response += token
                await websocket.send_json({
                    "type": "token",
                    "content": token
                })

            assistant_msg = ChatMessage(
                document_id=document_id,
                role="assistant",
                message=full_response
            )
            db.add(assistant_msg)
            db.commit()

            await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        pass
    finally:
        db.close()