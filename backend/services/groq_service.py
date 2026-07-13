import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"

VALID_DOC_TYPES = [
    "Invoice", "Resume", "Receipt", "Passport",
    "Contract", "Bank Statement", "Utility Bill", "Other"
]

EXTRACTION_FIELDS = {
    "Invoice": ["invoice_number", "vendor", "invoice_date", "total_amount", "currency"],
    "Resume": ["candidate_name", "email", "phone_number", "skills", "education", "experience"],
    "Receipt": ["store_name", "date", "total_amount", "items", "payment_method"],
    "Passport": ["full_name", "passport_number", "nationality", "date_of_birth", "expiry_date"],
    "Contract": ["parties_involved", "contract_date", "effective_date", "expiry_date", "key_terms"],
    "Bank Statement": ["account_holder", "account_number", "bank_name", "statement_period", "closing_balance"],
    "Utility Bill": ["customer_name", "account_number", "billing_period", "amount_due", "due_date"],
    "Other": ["title", "date", "key_information", "parties_mentioned"]
}


def classify_document(text: str) -> str:
    prompt = f"""You are a document classification expert.

You will be given raw OCR text extracted from a scanned document.
Your job is to classify it into exactly one of these categories:

Invoice
Resume
Receipt
Passport
Contract
Bank Statement
Utility Bill
Other

Rules:
- Reply with ONLY the category name. Nothing else.
- No explanation. No punctuation. No extra words.
- If the document does not clearly fit any category, reply: Other
- If the text is too short or unreadable, reply: Other

Document text:
{text[:3000]}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=10
    )

    result = response.choices[0].message.content.strip()
    return result if result in VALID_DOC_TYPES else "Other"


def extract_structured_data(text: str, doc_type: str) -> dict:
    fields = EXTRACTION_FIELDS.get(doc_type, EXTRACTION_FIELDS["Other"])
    fields_str = "\n".join(f"- {f}" for f in fields)

    prompt = f"""You are a document data extraction expert.

Extract the following fields from this {doc_type} document.

Fields to extract:
{fields_str}

Rules:
- Return ONLY a valid JSON object.
- No markdown, no backticks, no explanation.
- If a field is not found, use null as the value.
- Keep values concise and accurate.

Document text:
{text[:3000]}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=500
    )

    raw = response.choices[0].message.content.strip()

    try:
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw_extraction": raw}


def generate_summary(text: str, doc_type: str) -> str:
    prompt = f"""You are a document summarization expert.

Write a 2-3 sentence summary of this {doc_type} document.

Rules:
- Focus on key facts, dates, amounts, and parties involved.
- Do NOT simply repeat the raw text.
- Write in clear, professional English.
- Return ONLY the summary, nothing else.

Document text:
{text[:3000]}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=150
    )

    return response.choices[0].message.content.strip()


def stream_chat(text: str, question: str, history: list):
    messages = [
        {
            "role": "system",
            "content": f"""You are a helpful document assistant.
Answer questions based ONLY on the document text provided below.
If the answer is not in the document, say so clearly.

Document content:
{text[:3000]}"""
        }
    ]

    for msg in history[-6:]:
        messages.append({
            "role": msg["role"],
            "content": msg["message"]
        })

    messages.append({"role": "user", "content": question})

    stream = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.5,
        max_tokens=500,
        stream=True
    )

    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content