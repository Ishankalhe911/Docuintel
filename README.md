

# DocuIntel AI - Document Intelligence Platform

## Overview
DocuIntel AI is a full-stack web application that simulates an enterprise-grade AI-powered Document Intelligence Platform. It allows users to securely upload scanned documents and PDFs, automatically extracts text using Tesseract OCR, and leverages the Groq API to classify document types, extract structured JSON data, and generate concise summaries. Additionally, it features a real-time, WebSocket-powered AI chat interface, allowing users to query their documents dynamically.

This project was built as a product-focused assignment for Encegen AI Labs Pvt Ltd.

## 🚀 Live Links
* **Frontend Application (Vercel):** [(https://docuintel-frontend.vercel.app/)]
* **Backend API (Render):** [(https://docuintel-backend-gwo3.onrender.com)]


> **Note on Backend Deployment:** > While the original assignment suggested Railway, the backend for this project is deployed on **Render** using a custom Docker container (`python:3.11-slim`). This engineering decision was made to ensure free tier deployement requirement and seamless integration with **Tesseract OCR 5** and modern Debian graphics dependencies (`libgl1`), providing significantly better stability for heavy image processing .

---

## 🛠 Tech Stack

**Frontend**
* React.js (Vite)
* Tailwind CSS & shadcn/ui
* React Router
* Axios (API Client)
* Recharts (Analytics Dashboard)

**Backend**
* Python 3.11 & FastAPI
* SQLite (via SQLAlchemy + Alembic)
* Tesseract OCR & PyMuPDF (Text & Image Extraction)
* WebSockets (Real-time token streaming)

**AI & Inference**
* Groq API (`llama-3.3-70b-versatile`)


**Additionals**
*Uptime Monitor :To keep the backend and the sqlite db live and preserve the login data and the registered accounts and there documents
---

## ✨ Core Features
* **Secure Authentication:** JWT-based protected routes with email/password login.
* **Automated OCR Pipeline:** Extracts text natively from PDFs or processes images (PNG/JPG/JPEG) via Tesseract OCR. Minimum 300 DPI upscaling and contrast enhancement applied pre-extraction.
* **AI Classification:** Automatically categorizes documents (Invoice, Resume, Receipt, Passport, Contract, Bank Statement, Utility Bill, or Other).
* **Structured Data Extraction:** Dynamically extracts key JSON fields based on the classified document type.
* **AI Summarization:** Generates a 2-3 sentence contextual summary of the uploaded document.
* **Interactive AI Chat:** WebSocket-powered chat interface streaming token-by-token responses using the OCR text as a localized knowledge base.
* **Analytics Dashboard:** Visualizes daily uploads, document type distributions, and average OCR processing times using real database metrics.

---

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone [(https://github.com/Ishankalhe911/Docuintel)]([https://github.com/Ishankalhe911/Docuintel])
cd docuintel-ai

```

### 2. Backend Setup

Ensure you have Python 3.11+ and Tesseract OCR installed on your local machine.

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload

```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev

```

---

## 🔐 Environment Variables

Create a `.env` file in the `backend` directory and add the following keys. Do not commit your actual keys to version control.

```env
# Database
DATABASE_URL=sqlite:///./docuintel.db

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Configuration
GROQ_API_KEY=your_groq_api_key_here

```


---

## 📁 Project Architecture

```text
├── backend/
│   ├── api/            # FastAPI route handlers
│   ├── models/         # SQLAlchemy database models
│   ├── schemas/        # Pydantic validation schemas
│   ├── services/       # Core logic (OCR, Groq AI, Auth)
│   ├── uploads/        # Secure local file storage
│   ├── main.py         # Application entry point
│   └── Dockerfile      # Custom Debian/Tesseract image
└── frontend/
    ├── src/
    │   ├── api/        # Axios endpoint configurations
    │   ├── components/ # Reusable UI components (shadcn)
    │   ├── hooks/      # Custom React hooks (useWebSocket)
    │   ├── pages/      # Main route views
    │   └── App.jsx     # Router configuration
    └── package.json

```

