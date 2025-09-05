import os
import json
from flask import Flask, request, jsonify, send_from_directory
import requests

# Flaskアプリケーションのインスタンスを作成
# static_folder='.' は、app.pyと同じ階層にあるファイルを静的ファイルとして配信するための設定
app = Flask(__name__, static_folder='.')

# Azure OpenAI Serviceの接続情報を環境変数またはデフォルト値から取得
ENDPOINT_URL = os.getenv("ENDPOINT_URL", "https://test-001f.openai.azure.com/")
DEPLOYMENT_NAME = os.getenv("DEPLOYMENT_NAME", "gpt-4")
API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "8cnqswydw7fmj6cBdRTh27JJmWsydcaPpn12eTlGjjA8qSA8tVluJQQJ99BIACYeBjFXJ3w3AAABACOGAhvi") # ご自身のAPIキーに置き換えてください
API_VERSION = "2025-01-01-preview"

# 会話の最大ターン数
MAX_TURNS = 10

# ルートURL ("/") にアクセスがあった場合に index.html を返す
@app.route("/")
def root():
    return send_from_directory('.', 'index.html')

# CSSやJavaScriptなどの静的ファイルを配信するためのルートを追加
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# フロントエンドからのチャットリクエストを処理するAPIエンドポイント
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        user_mbti = data.get('mbti', '不明')
        history = data.get('history', [])
        turn_count = data.get('turn', 0)

        # AIへの指示（システムプロンプト）を作成
        system_prompt = f"""
        あなたはユーザーの楽しい雑談相手です。自然な会話を心がけてください。
        あくまで雑談の相手です．趣味やはまっていること，愚痴や相談などの相手になってください．
        会話の中で、ユーザーの性格や考え方についてさりげなく探りを入れてください。診断しているような雰囲気は出さず、あくまで友人との会話のように振る舞ってください。
        ユーザーは最初に自分のMBTIタイプを「{user_mbti}」と申告しています。
        あなたの目的は、決めつけずに、オープンな質問を投げかけ、ユーザーが自分自身のことを話したくなるような雰囲気を作ることです。
        約{MAX_TURNS}回の対話を通じて、ユーザーの思考パターン、価値観、意思決定のプロセス、エネルギーの源（内向的か外向的か）などを探ってください。
        """

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)

        # 最終ターンの場合、診断結果を生成するように指示を追加
        if turn_count >= MAX_TURNS:
            final_instruction = f"""
            これまでのすべての会話履歴を分析してください。
            ユーザーが最初に申告したMBTIタイプは「{user_mbti}」でしたが、会話全体から判断されるユーザーの最も可能性の高い「真のMBTIタイプ」を1つだけ特定してください。
            そして、なぜそのタイプだと判断したのか、具体的な会話の内容を引用しながら、申告されたタイプと比較しつつ、日本語で自然な口調で詳細な理由を説明してください。
            以下のJSON形式で、他のテキストは一切含めずに回答してください:
            {{
              "estimated_mbti": "推定したMBTIタイプ",
              "reasoning": "判断理由を記述した詳細なテキスト"
            }}
            """
            messages.append({"role": "user", "content": final_instruction})
            
            # 最終ターンでは response_format を json_object に指定
            payload = {
                "messages": messages, "max_tokens": 2048, "temperature": 0.5,
                "response_format": {"type": "json_object"}
            }
        else:
            # 会話の途中は通常のテキスト応答
             payload = {
                "messages": messages, "max_tokens": 1024, "temperature": 0.7,
                "top_p": 0.95, "stop": None, "stream": False
            }

        # Azure OpenAI APIを呼び出し
        url = f"{ENDPOINT_URL}/openai/deployments/{DEPLOYMENT_NAME}/chat/completions?api-version={API_VERSION}"
        headers = {"Content-Type": "application/json", "api-key": API_KEY}
        
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        result = response.json()

        if turn_count >= MAX_TURNS:
            # 最終ターンの場合、AIからのJSON応答をそのままフロントエンドに返す
            analysis_result = json.loads(result["choices"][0]["message"]["content"])
            return jsonify({"is_final": True, "result": analysis_result})
        else:
            # 会話途中の場合、テキスト応答を返す
            ai_message = result["choices"][0]["message"]["content"]
            return jsonify({"is_final": False, "reply": ai_message})

    except requests.exceptions.RequestException as e:
        print(f"API request error: {e}")
        return jsonify({"error": "API request failed."}), 502
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)