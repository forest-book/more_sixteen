
# FlaskサーバーとしてAI応答APIを提供
import os
import json
from flask import Flask, request, jsonify
import requests

from flask import send_from_directory

app = Flask(__name__, static_folder=".")
@app.route("/")
def root():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    # style.css, script.js などを返す
    return send_from_directory('.', filename)

endpoint = os.getenv("ENDPOINT_URL", "https://test-001f.openai.azure.com/")
deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4")
subscription_key = os.getenv("AZURE_OPENAI_API_KEY", "8cnqswydw7fmj6cBdRTh27JJmWsydcaPpn12eTlGjjA8qSA8tVluJQQJ99BIACYeBjFXJ3w3AAABACOGAhvi")
api_version = "2025-01-01-preview"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    # 直近の会話履歴を受け取る場合は data.get('history', []) などで拡張可
    messages = [
        {
            "role": "system",
            "content": [
                {"type": "text", "text": "あなたはユーザーのMBTI診断を会話から推測するAIアシスタントです。質問を通じてユーザーの性格を分析し、最後にMBTIタイプを推定してください。"}
            ]
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": user_message}
            ]
        }
    ]
    url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"
    headers = {
        "Content-Type": "application/json",
        "api-key": subscription_key
    }
    payload = {
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.7,
        "top_p": 0.95,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "stop": None,
        "stream": False
    }
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        result = response.json()
        ai_message = result["choices"][0]["message"]["content"][0]["text"]
        return jsonify({"reply": ai_message})
    except Exception as e:
        return jsonify({"reply": f"エラーが発生しました: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
    