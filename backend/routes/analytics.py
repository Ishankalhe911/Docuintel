from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta

from database import get_db
from models.document import Document
from models.user import User
from services.auth_service import get_current_user

router = APIRouter()

@router.get("")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_documents = db.query(Document).filter(
        Document.user_id == current_user.id
    ).count()

    total_pages = db.query(func.sum(Document.page_count)).filter(
        Document.user_id == current_user.id
    ).scalar() or 0

    avg_ocr_time = db.query(func.avg(Document.processing_time)).filter(
        Document.user_id == current_user.id,
        Document.ocr_status == "done"
    ).scalar() or 0

    successful_extractions = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.extraction_status == "done"
    ).count()

    extraction_success_rate = (
        round((successful_extractions / total_documents) * 100, 1)
        if total_documents > 0 else 0
    )

    type_distribution = db.query(
        Document.document_type,
        func.count(Document.id).label("count")
    ).filter(
        Document.user_id == current_user.id
    ).group_by(Document.document_type).all()

    recent_uploads = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.created_at.desc()).limit(5).all()

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    docs_last_7_days = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.created_at >= seven_days_ago
    ).all()

    daily_counts = {}
    for doc in docs_last_7_days:
        day = doc.created_at.strftime("%Y-%m-%d")
        daily_counts[day] = daily_counts.get(day, 0) + 1

    upload_trend = [
        {
            "date": (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"),
            "count": daily_counts.get(
                (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"), 0
            )
        }
        for i in range(6, -1, -1)
    ]

    avg_time_by_type = db.query(
        Document.document_type,
        func.avg(Document.processing_time).label("avg_time")
    ).filter(
        Document.user_id == current_user.id,
        Document.ocr_status == "done"
    ).group_by(Document.document_type).all()

    return {
        "total_documents": total_documents,
        "total_pages": total_pages,
        "avg_ocr_time": round(avg_ocr_time, 2),
        "extraction_success_rate": extraction_success_rate,
        "type_distribution": [
            {"type": t, "count": c} for t, c in type_distribution
        ],
        "recent_uploads": [
            {
                "id": d.id,
                "filename": d.filename,
                "document_type": d.document_type,
                "ocr_status": d.ocr_status,
                "processing_time": d.processing_time,
                "page_count": d.page_count,
                "created_at": d.created_at.isoformat()
            }
            for d in recent_uploads
        ],
        "upload_trend": upload_trend,
        "avg_time_by_type": [
            {"type": t, "avg_time": round(avg, 2)}
            for t, avg in avg_time_by_type
        ],
        "docs_per_day": upload_trend
    }