import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import (
    DirectoryLoader,
    UnstructuredPDFLoader,
    CSVLoader
)
from langchain_text_splitters import SemanticChunker

# Load API key from .env file
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key or api_key == "your_new_key_here":
    raise ValueError(
        "GOOGLE_API_KEY not found or not set in .env file.\n"
        "Please edit .env and add your Google AI Studio API key."
    )

print("🔑 API key loaded successfully")

# Initialize embeddings
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# Check if standards_raw directory exists and has files
raw_dir = Path("./standards_raw/")
if not raw_dir.exists():
    raise FileNotFoundError(
        "standards_raw/ directory not found.\n"
        "Please create it and add your PDF/CSV files."
    )

# Load PDFs
print("\n📄 Loading PDF files...")
pdf_loader = DirectoryLoader(
    "./standards_raw/",
    glob="**/*.pdf",
    loader_cls=UnstructuredPDFLoader,
    show_progress=True
)

# Load CSVs separately
print("\n📊 Loading CSV files...")
csv_loader = DirectoryLoader(
    "./standards_raw/",
    glob="**/*.csv",
    loader_cls=CSVLoader,
    show_progress=True
)

# Combine documents
try:
    pdf_docs = pdf_loader.load()
except Exception as e:
    print(f"Note: No PDFs found or error loading PDFs: {e}")
    pdf_docs = []

try:
    csv_docs = csv_loader.load()
except Exception as e:
    print(f"Note: No CSVs found or error loading CSVs: {e}")
    csv_docs = []

docs = pdf_docs + csv_docs

if len(docs) == 0:
    raise ValueError(
        "No documents found in standards_raw/\n"
        "Please add PDF or CSV files to the standards_raw/ directory."
    )

print(f"\n✅ Loaded {len(pdf_docs)} PDFs and {len(csv_docs)} CSVs = {len(docs)} total documents")

# Chunk documents
print("\n✂️  Chunking documents semantically...")
splitter = SemanticChunker(embeddings)
chunks = splitter.split_documents(docs)
print(f"✅ Chunked into {len(chunks)} semantic chunks")

# Create Chroma vector store
print("\n💾 Creating Chroma vector database...")
db = Chroma(
    collection_name="trilingual_standards",
    embedding_function=embeddings,
    persist_directory="./standards_chroma"
)

# Add documents in batches (safer for large datasets)
batch_size = 100
total_batches = (len(chunks) - 1) // batch_size + 1

for i in range(0, len(chunks), batch_size):
    batch = chunks[i:i + batch_size]
    db.add_documents(batch)
    current_batch = i // batch_size + 1
    print(f"  Batch {current_batch}/{total_batches} embedded ({len(batch)} chunks)")

print("\n✅ Corpus embedded successfully! Query ready.")
print(f"📁 Database saved to: ./standards_chroma/")
