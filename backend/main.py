from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine, Base
from models import User, Document, ChatMessage

from routes import auth, documents, ocr, ai, analytics, websocket

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="DocuIntel API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://docuintel-frontend.vercel.app","https://docuintel-backend-7ock.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(ocr.router, prefix="/documents", tags=["OCR"])
app.include_router(ai.router, prefix="/documents", tags=["AI"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(websocket.router, tags=["WebSocket"])

@app.get("/")
def root():
    return {"message": "DocuIntel API is running"}