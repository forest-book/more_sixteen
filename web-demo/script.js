/**
 * MBTI Chat Diagnosis App
 *
 * This script handles the frontend logic for an MBTI diagnosis chat application.
 * It manages UI transitions, user interactions for MBTI type selection,
 * chat functionality with an AI, and the display of final diagnosis results.
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM Element References
    const mbtiSelection = document.getElementById('mbtiSelection');
    const chatContainer = document.getElementById('chatContainer');
    const resultContainer = document.getElementById('resultContainer');
    const startChatButton = document.getElementById('startChatButton');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messageArea = document.getElementById('messageArea');
    const progressBar = document.getElementById('progressBar');
    const turnCounter = document.getElementById('turnCounter');
    const estimatedMBTI = document.getElementById('estimatedMBTI');
    const reasoningText = document.getElementById('reasoningText');
    const resetButton = document.getElementById('resetButton');
    const notification = document.getElementById('selectionNotification');

    // State Variables
    let conversationHistory = [];
    let currentTurn = 0;
    const MAX_TURNS = 15;

    // --- Interactive Rectangle Logic for MBTI Selection ---
    const rects = [];
    for (let i = 1; i <= 4; i++) {
        rects.push(document.getElementById('interactiveRect' + i));
    }

    rects.forEach(rect => {
        if (!rect) return;
        let locked = null;

        rect.addEventListener('mousemove', function(e) {
            if (locked) return;
            const rectBox = rect.getBoundingClientRect();
            const y = e.clientY - rectBox.top;
            if (y < rectBox.height / 2) {
                rect.classList.add('hover-top');
                rect.classList.remove('hover-bottom');
            } else {
                rect.classList.add('hover-bottom');
                rect.classList.remove('hover-top');
            }
        });

        rect.addEventListener('mouseleave', function() {
            if (!locked) {
                rect.classList.remove('hover-top', 'hover-bottom');
            }
        });

        rect.addEventListener('mousedown', function(e) {
            const rectBox = rect.getBoundingClientRect();
            const y = e.clientY - rectBox.top;
            let customValue;
            
            // Remove locked classes from all rects in the same group before applying a new one
            rect.classList.remove('locked-top', 'locked-bottom');
            
            if (y < rectBox.height / 2) {
                customValue = rect.dataset.customTop;
                rect.classList.add('locked-top');
                rect.classList.remove('locked-bottom', 'hover-bottom');
                locked = 'top';
            } else {
                customValue = rect.dataset.customBottom;
                rect.classList.add('locked-bottom');
                rect.classList.remove('locked-top', 'hover-top');
                locked = 'bottom';
            }
            rect.setAttribute('data-pressed', customValue);
        });
    });


    // --- Event Listeners ---
    startChatButton.addEventListener('click', () => {
        let selectedMBTI = "";
        let allSelected = true;
        for (let i = 1; i <= 4; i++) {
            const rect = document.getElementById('interactiveRect' + i);
            const value = rect.getAttribute('data-pressed');
            if (value) {
                selectedMBTI += value;
            } else {
                allSelected = false;
                break;
            }
        }
        
        if (allSelected && selectedMBTI.length === 4) {
            startChat(selectedMBTI);
        } else {
            showNotification("すべての4つの指標を選択してください。");
        }
    });

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    resetButton.addEventListener('click', () => location.reload());

    // --- Core Functions ---

    /**
     * Displays a temporary notification message to the user.
     * @param {string} message - The message to display.
     */
    function showNotification(message) {
        notification.textContent = message;
        setTimeout(() => {
            notification.textContent = '';
        }, 3000);
    }

    /**
     * Initializes the chat session.
     * @param {string} selectedMBTI - The user's selected MBTI type.
     */
    function startChat(selectedMBTI) {
        // UI transition
        mbtiSelection.style.display = 'none';
        chatContainer.style.display = 'flex';
        messageInput.focus();

        // Send initial bot message
        const initialBotMessage = `こんにちは！これから少しの間お話ししましょう．何か話したいことはありますか？`;
        addMessageToUI(initialBotMessage, 'bot');
        conversationHistory.push({ role: 'assistant', content: initialBotMessage });
        updateTurnProgress();
    }

    /**
     * Sends the user's message to the backend and handles the response.
     */
    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '' || sendButton.disabled) return;

        addMessageToUI(messageText, 'user');
        conversationHistory.push({ role: 'user', content: messageText });
        messageInput.value = '';
        currentTurn++;
        updateTurnProgress();

        addLoadingIndicator();
        sendButton.disabled = true;

        try {
            const selectedMBTI = getSelectedMBTI(); // Re-fetch MBTI at the time of sending
            const response = await fetchAIResponse(selectedMBTI, conversationHistory, currentTurn);
            
            removeLoadingIndicator();

            if (response.is_final) {
                displayFinalResult(response.result);
            } else {
                addMessageToUI(response.reply, 'bot');
                conversationHistory.push({ role: 'assistant', content: response.reply });
            }
        } catch (error) {
            console.error('Error fetching AI response:', error);
            removeLoadingIndicator();
            addMessageToUI('エラーが発生しました。しばらくしてから再度お試しください。', 'bot');
        } finally {
             if (currentTurn < MAX_TURNS) {
                sendButton.disabled = false;
             }
        }
    }

    /**
     * Fetches the selected MBTI from the interactive rectangles.
     * @returns {string} The concatenated MBTI string.
     */
    function getSelectedMBTI() {
        let mbti = '';
        for (let i = 1; i <= 4; i++) {
            const rect = document.getElementById('interactiveRect' + i);
            mbti += rect.getAttribute('data-pressed') || '';
        }
        return mbti;
    }


    /**
     * Sends data to the backend API.
     * @param {string} mbti - The user's initial MBTI.
     * @param {Array} history - The conversation history.
     * @param {number} turn - The current turn number.
     * @returns {Promise<Object>} - The JSON response from the server.
     */
    async function fetchAIResponse(mbti, history, turn) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mbti, history, turn })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Displays the final diagnosis result.
     * @param {Object} result - The result object from the API.
     */
    function displayFinalResult(result) {
        chatContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        estimatedMBTI.textContent = `あなたの真のタイプは... ${result.estimated_mbti} かも！`;
        reasoningText.textContent = result.reasoning;
    }

    // --- UI Helper Functions ---

    /**
     * Adds a message to the chat UI.
     * @param {string} text - The message text.
     * @param {string} sender - 'user' or 'bot'.
     */
    function addMessageToUI(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        messageArea.appendChild(messageElement);
        scrollToBottom();
    }

    function addLoadingIndicator() {
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'bot-message', 'loading');
        loadingElement.innerHTML = '<span>.</span><span>.</span><span>.</span>';
        messageArea.appendChild(loadingElement);
        scrollToBottom();
    }

    function removeLoadingIndicator() {
        const loadingElement = messageArea.querySelector('.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    function scrollToBottom() {
        messageArea.scrollTop = messageArea.scrollHeight;
    }

    function updateTurnProgress() {
        const progress = (currentTurn / MAX_TURNS) * 100;
        progressBar.style.width = `${progress}%`;
        turnCounter.textContent = `ターン ${currentTurn} / ${MAX_TURNS}`;
        if (currentTurn >= MAX_TURNS) {
            sendButton.disabled = true;
            messageInput.disabled = true;
            messageInput.placeholder = "まもなく結果が表示されます...";
        }
    }
});

