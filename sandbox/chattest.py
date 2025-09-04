from openai import AzureOpenAI
import os  
  

deployment_name = "gpt-4o-mini" # 先ほど作成したモデルのデプロイ名に置き換えてください
api_version = "2024-08-01-preview" # 先ほど作成したモデルの API バージョンに置き換えてください

# 環境変数またはデフォルト値から設定を取得
endpoint = os.getenv("ENDPOINT_URL", "https://test-001f.openai.azure.com/")
deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4")
subscription_key = os.getenv("AZURE_OPENAI_API_KEY", "8cnqswydw7fmj6cBdRTh27JJmWsydcaPpn12eTlGjjA8qSA8tVluJQQJ99BIACYeBjFXJ3w3AAABACOGAhvi")
api_version = "2025-01-01-preview"

# Azure OpenAI クライアントを作成  
client = AzureOpenAI(  
    azure_endpoint=endpoint,  
    api_key=subscription_key,  
    api_version=api_version 
)
# チャット履歴を保持するリスト  
chat_history = [  
    {"role": "system", 
     "content": "MBTI 16 typeに関する内容の質問が来たら，参考URLにあげたようなサイトに基づいて正確に回答するようにしてください"
     "参考URL1；https://www.mbti.or.jp/what/"
     "参考URL2；https://www.16personalities.com/ja/%E6%80%A7%E6%A0%BC%E3%82%BF%E3%82%A4%E3%83%97"
     }  
]
  
# ユーザーからのメッセージに対して応答を生成する関数
def get_response(message):  
    # ユーザーのメッセージを履歴に追加  
    chat_history.append({"role": "user", "content": message})  
    # ChatGPT からの応答を取得  
    response = client.chat.completions.create(  
        model=deployment, 
        messages=chat_history  
    ) 
    # 応答を履歴に追加  
    assistant_message = response.choices[0].message.content.strip()  
    chat_history.append({
        "role": "assistant", 
        "content": assistant_message
        })
    return assistant_message  


if __name__ == "__main__":  
    while True:  
        user_input = input("You: ")  
        if user_input.lower() in ["exit", "quit"]:  
            break  
        print("ChatGPT:", get_response(user_input))