// Global variables
let leftWords = {};          // { theme: [wordObjects] }
let rightWords = {};
let currentList = null;      // 'left' or 'right'
let filteredWords = [];
let currentWordIndex = 0;
let currentWordObject = null;
let correctFirstAttempt = 0;
let totalAttempted = 0;
let hasAttemptedCurrent = false;
let answeredCorrectly = false;
let mode = 'check';
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let hasTypedInCurrentList = false;
let firstWordLength = 0;
let secondWordLength = 0;

// DOM elements
const themeLeft = document.getElementById('theme-left');
const themeRight = document.getElementById('theme-right');
const letterBoxesDiv = document.getElementById('letter-boxes');
const hiddenInput = document.getElementById('hidden-input');
const speakBtn = document.getElementById('speak-btn');
const actionBtn = document.getElementById('action-btn');
const messageDiv = document.getElementById('message');
const translationDiv = document.getElementById('translation');
const tipDiv = document.getElementById('tip');
const correctSpan = document.getElementById('correct-count');
const totalSpan = document.getElementById('total-attempts');
const accuracySpan = document.getElementById('accuracy');
const showAnswerBtn = document.getElementById('show-answer-btn');
const wordCountSpan = document.getElementById('word-count');
const timerDisplay = document.getElementById('timer-display');

// --- Event Listeners ---
letterBoxesDiv.addEventListener('click', () => {
    if (!hiddenInput.disabled) hiddenInput.focus();
});

speakBtn.addEventListener('click', () => {
    if (speakBtn.disabled) return;
    if (currentWordObject) speakWord(currentWordObject.word);
});

// Load words from JSON
fetch('words.json')
    .then(response => response.json())
    .then(data => {
        leftWords = data.list1;
        rightWords = data.list2;
        populateDropdown(themeLeft, leftWords);
        populateDropdown(themeRight, rightWords);
        clearWordDisplay();
    })
    .catch(error => {
        console.error('Error loading words:', error);
        messageDiv.textContent = 'Failed to load vocabulary. Please refresh.';
        messageDiv.classList.add('error');
    });

function populateDropdown(selectElement, wordSet) {
    // Clear existing options except the placeholder
    selectElement.innerHTML = '<option value="" disabled selected>-- 选择词汇列表 --</option>';
    Object.keys(wordSet).forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        selectElement.appendChild(option);
    });
}

// Theme change handlers
themeLeft.addEventListener('change', (e) => {
    const theme = e.target.value;
    if (theme === '') {
        clearWordDisplay();
        resetStats();
        return;
    }
    currentList = 'left';
    loadThemeWords(leftWords[theme], theme);
});

themeRight.addEventListener('change', (e) => {
    const theme = e.target.value;
    if (theme === '') {
        clearWordDisplay();
        resetStats();
        return;
    }
    currentList = 'right';
    loadThemeWords(rightWords[theme], theme);
});

function loadThemeWords(wordArray, themeName) {
    // Convert plain word objects to include the theme property
    filteredWords = wordArray.map(w => ({
        word: w.word,
        translation: w.translation,
        tip: w.tip,
        theme: themeName
    }));
    shuffleArray(filteredWords);
    resetStats();
    resetTimer();
    updateWordCount();
    currentWordIndex = 0;
    if (filteredWords.length > 0) {
        loadWord(currentWordIndex);
    } else {
        clearWordDisplay();
    }
}

// Timer functions (unchanged)
function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
    }, 1000);
}
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerRunning = false;
}
function resetTimer() {
    stopTimer();
    timerSeconds = 0;
    hasTypedInCurrentList = false;
    updateTimerDisplay();
}
function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
function updateWordCount() {
    wordCountSpan.textContent = filteredWords.length;
}
function resetStats() {
    correctFirstAttempt = 0;
    totalAttempted = 0;
    updateStats();
}
function updateStats() {
    correctSpan.textContent = correctFirstAttempt;
    totalSpan.textContent = totalAttempted;
    const accuracy = totalAttempted > 0 ? Math.round((correctFirstAttempt / totalAttempted) * 100) : 0;
    accuracySpan.textContent = accuracy;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function clearWordDisplay() {
    letterBoxesDiv.innerHTML = '';
    tipDiv.textContent = '';
    translationDiv.textContent = '';
    messageDiv.textContent = '';
    messageDiv.classList.remove('error', 'success');
    actionBtn.disabled = true;
    speakBtn.disabled = true;
    hiddenInput.disabled = true;
    hiddenInput.value = '';
    firstWordLength = 0;
    secondWordLength = 0;
}
function loadWord(index) {
    if (filteredWords.length === 0) return;
    currentWordObject = filteredWords[index];
    createLetterBoxes(currentWordObject.word);
    tipDiv.textContent = `💡 Tip: ${currentWordObject.tip}`;
    translationDiv.textContent = '';
    messageDiv.textContent = '';
    messageDiv.classList.remove('error', 'success');
    hasAttemptedCurrent = false;
    answeredCorrectly = false;
    mode = 'check';
    actionBtn.textContent = 'Check';
    actionBtn.disabled = false;
    speakBtn.disabled = false;
    hiddenInput.value = '';
    hiddenInput.disabled = false;
    hiddenInput.focus();
    if (index === 0) hasTypedInCurrentList = false;
    speakWord(currentWordObject.word);
}
function createLetterBoxes(word) {
    letterBoxesDiv.innerHTML = '';
    const words = word.split(' ');
    if (words.length === 2 && word.length > 13) {
        firstWordLength = words[0].length;
        secondWordLength = words[1].length;
        const row1 = document.createElement('div');
        row1.className = 'word-row';
        for (let i = 0; i < firstWordLength; i++) {
            const box = document.createElement('span');
            box.className = 'letter-box';
            row1.appendChild(box);
        }
        letterBoxesDiv.appendChild(row1);
        const row2 = document.createElement('div');
        row2.className = 'word-row';
        for (let i = 0; i < secondWordLength; i++) {
            const box = document.createElement('span');
            box.className = 'letter-box';
            row2.appendChild(box);
        }
        letterBoxesDiv.appendChild(row2);
    } else {
        firstWordLength = word.length;
        secondWordLength = 0;
        const row = document.createElement('div');
        row.className = 'word-row';
        for (let i = 0; i < word.length; i++) {
            const box = document.createElement('span');
            box.className = 'letter-box';
            if (word[i] === ' ') box.dataset.space = 'true';
            row.appendChild(box);
        }
        letterBoxesDiv.appendChild(row);
    }
}
function updateLetterBoxes() {
    if (!currentWordObject) return;
    const value = hiddenInput.value;
    const boxes = document.querySelectorAll('.letter-box');
    const maxLength = firstWordLength + secondWordLength + (secondWordLength > 0 ? 1 : 0);
    if (value.length > maxLength) hiddenInput.value = value.slice(0, maxLength);
    boxes.forEach(box => box.textContent = '');
    let boxIndex = 0;
    for (let i = 0; i < hiddenInput.value.length; i++) {
        const char = hiddenInput.value[i];
        if (secondWordLength > 0 && i === firstWordLength) continue;
        if (boxIndex < boxes.length) {
            const box = boxes[boxIndex];
            if (box.dataset.space === 'true') {
                box.textContent = char === ' ' ? '·' : char;
            } else {
                box.textContent = char;
            }
            boxIndex++;
        }
    }
    if (secondWordLength === 0) {
        boxes.forEach(box => {
            if (box.dataset.space === 'true' && box.textContent === '') {
                box.textContent = '·';
            }
        });
    }
}
hiddenInput.addEventListener('input', (e) => {
    updateLetterBoxes();
    if (!hasTypedInCurrentList && filteredWords.length > 0 && currentWordIndex === 0) {
        hasTypedInCurrentList = true;
        startTimer();
    }
});
hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && mode === 'check' && !answeredCorrectly) {
        e.preventDefault();
        checkAnswer();
    }
});
actionBtn.addEventListener('click', () => {
    if (mode === 'check') checkAnswer();
    else goToNextWord();
});
function checkAnswer() {
    if (!currentWordObject || mode !== 'check' || answeredCorrectly) return;
    const isFirstAttempt = !hasAttemptedCurrent;
    if (isFirstAttempt) {
        totalAttempted++;
        hasAttemptedCurrent = true;
    }
    const userAnswer = hiddenInput.value.trim().toLowerCase();
    const correctWord = currentWordObject.word.toLowerCase();
    const expectedLength = firstWordLength + secondWordLength + (secondWordLength > 0 ? 1 : 0);
    if (userAnswer.length !== expectedLength) {
        messageDiv.textContent = `请完整输入 ${expectedLength} 个字符`;
        messageDiv.classList.add('error');
        updateStats();
        hiddenInput.focus();
        return;
    }
    if (userAnswer === correctWord) {
        if (isFirstAttempt) correctFirstAttempt++;
        answeredCorrectly = true;
        messageDiv.textContent = '✅ 正确！';
        messageDiv.classList.add('success');
        translationDiv.textContent = currentWordObject.translation;
        mode = 'next';
        actionBtn.textContent = '下一个';
        hiddenInput.disabled = true;
        actionBtn.focus();
    } else {
        messageDiv.textContent = '❌ 错误，再试一次';
        messageDiv.classList.add('error');
        hiddenInput.value = '';
        updateLetterBoxes();
        hiddenInput.focus();
    }
    updateStats();
}
function goToNextWord() {
    if (filteredWords.length === 0) return;
    currentWordIndex = (currentWordIndex + 1) % filteredWords.length;
    loadWord(currentWordIndex);
}
function speakWord(word) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}
function revealAnswer() {
    if (!currentWordObject || answeredCorrectly) return;
    hiddenInput.value = currentWordObject.word;
    updateLetterBoxes();
    translationDiv.textContent = currentWordObject.translation;
    messageDiv.textContent = 'Answer revealed. Moving to next word.';
    messageDiv.classList.add('success');
    answeredCorrectly = true;
    mode = 'next';
    actionBtn.textContent = 'Next Word';
    hiddenInput.disabled = true;
    actionBtn.focus();
}
if (showAnswerBtn) {
    showAnswerBtn.addEventListener('click', revealAnswer);
} else {
    console.warn('Show answer button not found');
}
