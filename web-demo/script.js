document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const mbtiSelection = document.getElementById('mbtiSelection');
    const chatContainer = document.getElementById('chatContainer');
    const resultContainer = document.getElementById('resultContainer');

    const startChatButton = document.getElementById('startChatButton');
    const sendButton = document.getElementById('sendButton');
    const resetButton = document.getElementById('resetButton');

    const mbtiTypeSelect = document.getElementById('mbtiType');
    const messageInput = document.getElementById('messageInput');
    const messageArea = document.getElementById('messageArea');
    
    const progressBar = document.getElementById('progressBar');
    const turnCounter = document.getElementById('turnCounter');

    const estimatedMBTI = document.getElementById('estimatedMBTI');
    const reasoningText = document.getElementById('reasoningText');

    // 状態管理用の変数
    let conversationHistory = [];
    let userTurnCount = 0;
    const MAX_TURNS = 15; // バックエンドと値を合わせる

    // イベントリスナーの設定
    startChatButton.addEventListener('click', startChat);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    resetButton.addEventListener('click', () => {
        // 状態をリセットして最初の画面に戻る
        window.location.reload();
    });

    /**
     * チャットを開始する関数
     */
    function startChat() {
        const selectedMBTI = mbtiTypeSelect.value;
        if (!selectedMBTI) {
            // alertの代わりに、画面にメッセージを表示
            showNotification('MBTIタイプを選択してください。', mbtiSelection, startChatButton);
            return;
        }

        // UIの切り替え
        mbtiSelection.style.display = 'none';
        chatContainer.style.display = 'flex';
        messageInput.focus();

        // 最初のメッセージをAIから送信
        const initialBotMessage = `こんにちは！あなたのMBTIは ${selectedMBTI} なのですね。これからいくつか質問をさせてください。準備はいいですか？`;
        addMessageToUI(initialBotMessage, 'bot');
        conversationHistory.push({ role: 'assistant', content: initialBotMessage });
        updateTurnProgress();
    }

    /**
     * ユーザーがメッセージを送信する関数
     */
    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        // ユーザーのターンをカウント
        userTurnCount++;
        updateTurnProgress();

        addMessageToUI(messageText, 'user');
        conversationHistory.push({ role: 'user', content: messageText });
        messageInput.value = '';

        // AIからの応答を待つ間、入力を無効化
        setChatInputDisabled(true);
        addLoadingIndicator();

        try {
            const selectedMBTI = mbtiTypeSelect.value;
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mbti: selectedMBTI,
                    history: conversationHistory,
                    turn: userTurnCount
                })
            });

            removeLoadingIndicator();

            if (!response.ok) {
                throw new Error(`サーバーエラー: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.is_final) {
                // 最終結果の処理
                conversationHistory.push({ role: 'assistant', content: JSON.stringify(data.result) });
                displayFinalResult(data.result);
            } else {
                // 通常の会話の処理
                const aiReply = data.reply;
                addMessageToUI(aiReply, 'bot');
                conversationHistory.push({ role: 'assistant', content: aiReply });
            }

        } catch (error) {
            console.error('エラー:', error);
            addMessageToUI('エラーが発生しました。しばらくしてからもう一度お試しください。', 'bot');
        } finally {
            // 最後のターンでなければ入力を再度有効化
            if (userTurnCount < MAX_TURNS) {
                setChatInputDisabled(false);
            }
        }
    }
    
    /**
     * 最終的な診断結果を表示する関数
     * @param {object} result - AIからの診断結果オブジェクト
     */
    function displayFinalResult(result) {
        chatContainer.style.display = 'none';
        resultContainer.style.display = 'block';

        estimatedMBTI.textContent = `あなたの真のタイプは...【${result.estimated_mbti}】`;
        reasoningText.textContent = result.reasoning;
    }

    /**
     * メッセージをUIに追加する関数
     * @param {string} text - 表示するメッセージ
     * @param {string} sender - 'user' または 'bot'
     */
    function addMessageToUI(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        messageArea.appendChild(messageElement);
        // 自動で一番下までスクロール
        messageArea.scrollTop = messageArea.scrollHeight;
    }

    /**
     * AIの応答待ちを示すローディング表示を追加
     */
    function addLoadingIndicator() {
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'bot-message', 'loading');
        loadingElement.innerHTML = '<span>.</span><span>.</span><span>.</span>';
        loadingElement.id = 'loadingIndicator';
        messageArea.appendChild(loadingElement);
        messageArea.scrollTop = messageArea.scrollHeight;
    }

    /**
     * ローディング表示を削除
     */
    function removeLoadingIndicator() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
    
    /**
     * チャット入力欄の有効/無効を切り替える
     * @param {boolean} disabled - trueなら無効、falseなら有効
     */
    function setChatInputDisabled(disabled) {
        messageInput.disabled = disabled;
        sendButton.disabled = disabled;
    }

    /**
     * 会話の進捗を更新する
     */
    function updateTurnProgress() {
        const progress = (userTurnCount / MAX_TURNS) * 100;
        progressBar.style.width = `${progress}%`;
        turnCounter.textContent = `ターン ${userTurnCount} / ${MAX_TURNS}`;
    }

    /**
     * 画面に通知メッセージを表示する関数
     * @param {string} message - 表示するメッセージ
     * @param {HTMLElement} container - メッセージを表示する親要素
     * @param {HTMLElement} insertBeforeElement - この要素の前にメッセージを挿入する
     */
    function showNotification(message, container, insertBeforeElement) {
        const existingNotification = container.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notificationElement = document.createElement('p');
        notificationElement.textContent = message;
        notificationElement.className = 'notification';
        notificationElement.style.color = 'red';
        notificationElement.style.textAlign = 'center';
        notificationElement.style.marginBottom = '15px';
        
        container.insertBefore(notificationElement, insertBeforeElement);
        
        setTimeout(() => {
            if (notificationElement) {
                notificationElement.remove();
            }
        }, 3000);
    }
});

