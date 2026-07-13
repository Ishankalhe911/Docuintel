from pydantic import BaseModel
from datetime import datetime

class ChatMessageOut(BaseModel):
    id: int
    document_id: int
    role: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}

class ChatRequest(BaseModel):
    message: str