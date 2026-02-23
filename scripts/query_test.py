from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
import os

# Load environment variables
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key or api_key == "your_new_key_here":
    raise ValueError(
        "GOOGLE_API_KEY not found or not set in .env file.\n"
        "Please edit .env and add your Google AI Studio API key."
    )

print("🔑 API key loaded successfully")
print("📂 Loading Chroma database...\n")

# Initialize embeddings
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# Load existing Chroma database
db = Chroma(
    collection_name="trilingual_standards",
    embedding_function=embeddings,
    persist_directory="./standards_chroma"
)

# Test queries
test_queries = [
    "phonics instruction",
    "reading comprehension strategies",
    "mathematical reasoning"
]

print("🔍 Running test queries...\n")
print("=" * 60)

for query in test_queries:
    print(f"\n📌 Query: '{query}'")
    print("-" * 60)

    results = db.similarity_search(query, k=3)

    if len(results) == 0:
        print("  No results found.")
    else:
        for i, doc in enumerate(results, 1):
            print(f"\n  Result {i}:")
            # Show first 200 characters
            content = doc.page_content[:200].replace('\n', ' ')
            print(f"  {content}...")

            # Show metadata if available
            if doc.metadata:
                print(f"  Source: {doc.metadata.get('source', 'Unknown')}")

    print("-" * 60)

print("\n✅ Query test complete!")
