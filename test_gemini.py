import os
import requests

url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
headers = {
    "Authorization": f"Bearer dummy_key",
    "Content-Type": "application/json"
}
data = {
    "model": "gemini-2.0-flash",
    "messages": [{"role": "user", "content": "Hello"}]
}
response = requests.post(url, headers=headers, json=data)
print(response.status_code)
print(response.text)
