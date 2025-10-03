import requests
import json

def test_groq_api():
    api_key = "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"
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "messages": [
            {
                "role": "user",
                "content": "Hello! Please respond with a short test message to confirm the API is working."
            }
        ],
        "model": "llama3-8b-8192"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API test successful!")
            print(f"Response: {result['choices'][0]['message']['content']}")
        else:
            print(f"❌ API request failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_groq_api()