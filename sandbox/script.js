
window.addEventListener('DOMContentLoaded', function() {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const messageArea = document.getElementById('messageArea');

  // 初期メッセージ
  addBotMessage('こんにちは！あなたのMBTIタイプを診断します。質問に答えてください。');

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message !== '') {
      addUserMessage(message);
      messageInput.value = '';
      fetchAIResponse(message);
    }
  }

  function addUserMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = text;
    messageArea.appendChild(messageElement);
    scrollToBottom();
  }

  function addBotMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    messageElement.textContent = text;
    messageArea.appendChild(messageElement);
    scrollToBottom();
  }

  function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
  }

  function fetchAIResponse(message) {
    addBotMessage('AIが考え中...');
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
      // 最後の「AIが考え中...」を削除
      const lastBot = messageArea.querySelector('.bot-message:last-child');
      if (lastBot && lastBot.textContent === 'AIが考え中...') {
        lastBot.remove();
      }
      addBotMessage(data.reply);
    })
    .catch(err => {
      const lastBot = messageArea.querySelector('.bot-message:last-child');
      if (lastBot && lastBot.textContent === 'AIが考え中...') {
        lastBot.remove();
      }
      addBotMessage('エラーが発生しました。しばらくしてから再度お試しください。');
    });
  }
});
