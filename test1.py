
import os
import requests
import json

# 環境変数またはデフォルト値から設定を取得
endpoint = os.getenv("ENDPOINT_URL", "https://test-001f.openai.azure.com/")
deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4")
subscription_key = os.getenv("AZURE_OPENAI_API_KEY", "8cnqswydw7fmj6cBdRTh27JJmWsydcaPpn12eTlGjjA8qSA8tVluJQQJ99BIACYeBjFXJ3w3AAABACOGAhvi")
api_version = "2025-01-01-preview"

# チャットプロンプトを作成
messages = [
	{
		"role": "system",
		"content": [
			{"type": "text", "text": "情報を見つけるのに役立つ AI アシスタントです。"}
		]
	},
	{
		"role": "user",
		"content": [
			{"type": "text", "text": "こんにちは"}
		]
	}
]

# APIエンドポイントURLを構築
url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"

# ヘッダーとペイロードを準備
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

# POSTリクエストでAPIを呼び出し
response = requests.post(url, headers=headers, data=json.dumps(payload))

# レスポンスJSONをプリント
print(response.text)
