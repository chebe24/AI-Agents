from dotenv import load_dotenv
import os

print("🧪 Testing .env file loading...\n")

# Load .env file
load_dotenv()

# Check if API key exists
api_key = os.getenv("GOOGLE_API_KEY")

if api_key:
    if api_key == "your_new_key_here":
        print("⚠️  API key found but still set to placeholder value")
        print("📝 Please edit .env and replace 'your_new_key_here' with your actual API key")
        print("\nSteps:")
        print("1. Go to https://makersuite.google.com/app/apikey")
        print("2. Generate a new API key")
        print("3. Open .env file and replace the placeholder")
    else:
        # Show only first 10 and last 4 characters for security
        masked_key = f"{api_key[:10]}...{api_key[-4:]}"
        print(f"✅ API key loaded successfully: {masked_key}")
        print(f"✅ Key length: {len(api_key)} characters")
        print("\n🎉 Your .env file is configured correctly!")
else:
    print("❌ API key not found in .env file")
    print("\n📝 Please check that:")
    print("1. .env file exists in the current directory")
    print("2. .env contains: GOOGLE_API_KEY=your_actual_key")
    print("3. No spaces around the = sign")
