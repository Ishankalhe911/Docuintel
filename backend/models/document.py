from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    document_type = Column(String, default="Unknown")
    extracted_text = Column(Text, default="")
    structured_data = Column(Text, default="{}")
    summary = Column(Text, default="")
    page_count = Column(Integer, default=0)
    processing_time = Column(Float, default=0.0)
    ocr_status = Column(String, default="pending")
    extraction_status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())