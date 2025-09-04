
import os
from openai import AzureOpenAI

# Azure OpenAI設定
endpoint = os.getenv("ENDPOINT_URL", "https://test-001f.openai.azure.com/")
deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4")
subscription_key = os.getenv("AZURE_OPENAI_API_KEY", "8cnqswydw7fmj6cBdRTh27JJmWsydcaPpn12eTlGjjA8qSA8tVluJQQJ99BIACYeBjFXJ3w3AAABACOGAhvi")
api_version = "2025-01-01-preview"
client = AzureOpenAI(
  azure_endpoint=endpoint,
  api_key=subscription_key,
  api_version=api_version
)

# MBTIタイプの入力
user_mbti = input("あなたのMBTIタイプを入力してください（例: INFP）: ").strip().upper()

# チャット履歴を保持するリスト
chat_history = [
  {"role": "system", "content": "雑談の相手になってください．MBTI 16 typeに関する内容の質問が来たら，参考URLにあげたようなサイトに基づいて正確に回答するようにしてください。\n参考URL1：https://www.mbti.or.jp/what/\n参考URL2：https://www.16personalities.com/ja/%E6%80%A7%E6%A0%BC%E3%82%BF%E3%82%A4%E3%83%97"}
]

def get_response(message):
  chat_history.append({"role": "user", "content": message})
  response = client.chat.completions.create(
    model=deployment,
    messages=chat_history
  )
  assistant_message = response.choices[0].message.content.strip()
  chat_history.append({"role": "assistant", "content": assistant_message})
  return assistant_message

if __name__ == "__main__":
  round_count = 0
  max_rounds = 15
  while round_count < max_rounds:
    user_input = input(f"You ({round_count+1}/{max_rounds}): ")
    if user_input.lower() in ["exit", "quit"]:
      break
    print("ChatGPT:", get_response(user_input))
    round_count += 1

  # 3ラリー終了後にMBTI判定
  prompt = (
    f"ユーザーが自分で入力したMBTIは「{user_mbti}」です。"
    "以下の会話履歴をもとに、ユーザーの本当のMBTIタイプを推測し、"
    "入力されたMBTIと比較して、どちらがより適切かを日本語で簡潔に解説してください。"
    "最終的に「あなたのMBTIは〇〇です」と結論を述べてください。"
  )
  judge_history = chat_history + [
    {"role": "system", "content": prompt}
  ]
  response = client.chat.completions.create(
    model=deployment,
    messages=judge_history
  )
  result = response.choices[0].message.content.strip()
  print("\n【判定結果】\n" + result)

