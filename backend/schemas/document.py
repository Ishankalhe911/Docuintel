from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: str
    document_type: str
    page_count: int
    processing_time: float
    ocr_status: str
    extraction_status: str
    extracted_text: Optional[str] = None
    structured_data: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class DocumentList(BaseModel):
    id: int
    filename: str
    file_type: str
    document_type: str
    page_count: int
    processing_time: float
    ocr_status: str
    extraction_status: str
    created_at: datetime

    model_config = {"from_attributes": True}