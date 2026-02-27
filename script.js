// Global variables
let allWords = [];
let filteredWords = [];
let currentWordIndex = 0;
let currentWordObject = null;
let correctFirstAttempt = 0;
let totalAttempted = 0;
let hasAttemptedCurrent = false;
let answeredCorrectly = false;
let currentTheme = 'all';
let mode = 'check';  
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let hasTypedInCurrentList = false; 
let firstWordLength = 0;
let secondWordLength = 0;

// DOM elements
const themeSelect = document.getElementById('theme');
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

// --- Event Listeners (set once) ---

// Click on letter boxes focuses hidden input (if enabled)
letterBoxesDiv.addEventListener('click', () => {
    if (!hiddenInput.disabled) {
        hiddenInput.focus();
    }
});

// FIX: Added console log and cancel() to speak button
speakBtn.addEventListener('click', () => {
    console.log('Speak button clicked');
    if (speakBtn.disabled) {
        console.log('Button is disabled – not speaking');
        return;
    }
    if (currentWordObject) {
        speakWord(currentWordObject.word);
    } else {
        console.log('No current word');
    }
});
// Load words from JSON
fetch('words.json')
    .then(response => response.json())
    .then(data => {
        allWords = [];
        Object.keys(data).forEach(theme => {
            data[theme].forEach(wordObj => {
                allWords.push({
                    word: wordObj.word,
                    translation: wordObj.translation,
                    tip: wordObj.tip,
                    theme: theme
                });
            });
        });
        populateThemes();
        // Set default to placeholder (blank)
        themeSelect.value = '';
        clearWordDisplay();
    })
    .catch(error => {
        console.error('Error loading words:', error);
        messageDiv.textContent = 'Failed to load vocabulary. Please refresh.';
        messageDiv.classList.add('error');
    });

function populateThemes() {
    const themes = new Set(allWords.map(w => w.theme));
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        themeSelect.appendChild(option);
    });
}

function resetStats() {
    correctFirstAttempt = 0;
    totalAttempted = 0;
    updateStats();
}

// Timer functions
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

// Update word count display
function updateWordCount() {
    wordCountSpan.textContent = filteredWords.length;
}

// Function to clear all word-related UI and disable controls
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

// FIX: Added shuffle function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Modified filterWordsByTheme
function filterWordsByTheme(theme) {
    if (theme === 'all') {
        filteredWords = [...allWords];
    } else {
        filteredWords = allWords.filter(w => w.theme === theme);
    }
    // Shuffle the filtered words so they appear in random order
    shuffleArray(filteredWords);
    resetStats();                     // reset counters on theme change
    resetTimer();                      // reset timer when theme changes
    updateWordCount();                 // update word count display
    
    currentWordIndex = 0;
    if (filteredWords.length > 0) {
        loadWord(currentWordIndex);
    } else {
        clearWordDisplay();
    }
}

function loadWord(index) {
    if (filteredWords.length === 0) return;
    currentWordObject = filteredWords[index];

    // Create letter boxes for the new word
    createLetterBoxes(currentWordObject.word);  // pass the whole word

    // Update tip, clear messages
    tipDiv.textContent = `💡 Tip: ${currentWordObject.tip}`;
    translationDiv.textContent = '';
    messageDiv.textContent = '';
    messageDiv.classList.remove('error', 'success');

    // Reset state
    hasAttemptedCurrent = false;
    answeredCorrectly = false;
    mode = 'check';
    actionBtn.textContent = 'Check';
    actionBtn.disabled = false;
    speakBtn.disabled = false;
    hiddenInput.value = '';
    hiddenInput.disabled = false;
    hiddenInput.focus();

    // Reset typing flag for first word only
    if (index === 0) {
        hasTypedInCurrentList = false;
    }

    // Auto-speak the new word
    speakWord(currentWordObject.word);
}

function createLetterBoxes(word) {
    letterBoxesDiv.innerHTML = '';
    const words = word.split(' ');
    
    // Decide layout: if two words and total length > 13, split into two rows
    if (words.length === 2 && word.length > 13) {
        firstWordLength = words[0].length;
        secondWordLength = words[1].length;
        
        // First row (first word)
        const row1 = document.createElement('div');
        row1.className = 'word-row';
        for (let i = 0; i < firstWordLength; i++) {
            const box = document.createElement('span');
            box.className = 'letter-box';
            row1.appendChild(box);
        }
        letterBoxesDiv.appendChild(row1);
        
        // Second row (second word)
        const row2 = document.createElement('div');
        row2.className = 'word-row';
        for (let i = 0; i < secondWordLength; i++) {
            const box = document.createElement('span');
            box.className = 'letter-box';
            row2.appendChild(box);
        }
        letterBoxesDiv.appendChild(row2);
    } else {
        // Single word or short phrase – one row, including space(s)
        firstWordLength = word.length;
        secondWordLength = 0;
        const row = document.createElement('div');
        row.className = 'word-row';
        for (let i = 0; i < word.length; i++) {
            const box = document.createElement('span');
            box.className = 'letter-box';
            // Mark space positions for visual dot (only for single‑row mode)
            if (word[i] === ' ') {
                box.dataset.space = 'true';
            }
            row.appendChild(box);
        }
        letterBoxesDiv.appendChild(row);
    }
}

// Update letter boxes based on hidden input value
function updateLetterBoxes() {
    if (!currentWordObject) return;
    const value = hiddenInput.value;
    const boxes = document.querySelectorAll('.letter-box');
    
    // Calculate maximum allowed length (including one space if split)
    const maxLength = firstWordLength + secondWordLength + (secondWordLength > 0 ? 1 : 0);
    if (value.length > maxLength) {
        hiddenInput.value = value.slice(0, maxLength);
    }
    
    // Clear all boxes
    boxes.forEach(box => box.textContent = '');
    
    let boxIndex = 0;
    for (let i = 0; i < hiddenInput.value.length; i++) {
        const char = hiddenInput.value[i];
        
        // If split layout and this is the space position, skip assigning to a box
        if (secondWordLength > 0 && i === firstWordLength) {
            continue;
        }
        
        if (boxIndex < boxes.length) {
            const box = boxes[boxIndex];
            // If this box corresponds to a space in single‑row mode, show a dot
            if (box.dataset.space === 'true') {
                box.textContent = char === ' ' ? '·' : char;
            } else {
                box.textContent = char;
            }
            boxIndex++;
        }
    }
    
    // For single‑row mode: fill remaining empty space‑boxes with a dot placeholder
    if (secondWordLength === 0) {
        boxes.forEach((box, idx) => {
            if (box.dataset.space === 'true' && box.textContent === '') {
                box.textContent = '·';
            }
        });
    }
}

hiddenInput.addEventListener('input', (e) => {
    updateLetterBoxes();
    
    // Start timer on first keystroke of the list
    if (!hasTypedInCurrentList && filteredWords.length > 0 && currentWordIndex === 0) {
        hasTypedInCurrentList = true;
        startTimer();
    }
});

// Enter key in hidden input triggers check (only in check mode)
hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && mode === 'check' && !answeredCorrectly) {
        e.preventDefault();
        checkAnswer();
    }
});

// Action button: Check or Next
actionBtn.addEventListener('click', () => {
    if (mode === 'check') {
        checkAnswer();
    } else {
        goToNextWord();
    }
});

function checkAnswer() {
    if (!currentWordObject || mode !== 'check' || answeredCorrectly) return;

    const isFirstAttempt = !hasAttemptedCurrent;
    if (isFirstAttempt) {
        totalAttempted++;          // count this word once
        hasAttemptedCurrent = true; // mark first attempt done
    }

    const userAnswer = hiddenInput.value.trim().toLowerCase();
    const correctWord = currentWordObject.word.toLowerCase();

    // Calculate expected total characters (including the one space if two rows)
    const expectedLength = firstWordLength + secondWordLength + (secondWordLength > 0 ? 1 : 0);

    // Length mismatch – still counted as an attempt, show error and return
    if (userAnswer.length !== expectedLength) {
        messageDiv.textContent = `请完整输入 ${expectedLength} 个字符`;
        messageDiv.classList.add('error');
        updateStats();
        hiddenInput.focus();
        return;
    }

    if (userAnswer === correctWord) {
        // Correct!
        if (isFirstAttempt) {
            correctFirstAttempt++;      // only first correct counts
        }
        answeredCorrectly = true;
        messageDiv.textContent = '✅ 正确！';
        messageDiv.classList.add('success');
        translationDiv.textContent = currentWordObject.translation;

        // Switch to next mode
        mode = 'next';
        actionBtn.textContent = '下一个';
        hiddenInput.disabled = true;
        actionBtn.focus();
    } else {
        // Wrong answer
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

function updateStats() {
    correctSpan.textContent = correctFirstAttempt;
    totalSpan.textContent = totalAttempted;
    const accuracy = totalAttempted > 0 ? Math.round((correctFirstAttempt / totalAttempted) * 100) : 0;
    accuracySpan.textContent = accuracy;
}

// FIX: Added cancel() to avoid speech queue issues
function speakWord(word) {
    window.speechSynthesis.cancel(); // stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

function revealAnswer() {
    if (!currentWordObject || answeredCorrectly) return; // already correct, but we can still show

    // Fill the hidden input with the correct word
    hiddenInput.value = currentWordObject.word;
    updateLetterBoxes();

    // Show translation
    translationDiv.textContent = currentWordObject.translation;

    // Show a message
    messageDiv.textContent = 'Answer revealed. Moving to next word.';
    messageDiv.classList.add('success');

    // Switch to next mode without counting stats
    answeredCorrectly = true;      // prevent further checking
    mode = 'next';
    actionBtn.textContent = 'Next Word';
    hiddenInput.disabled = true;
    actionBtn.focus();

    // Do NOT update stats (no attempt counted)
}

// Theme change
themeSelect.addEventListener('change', (e) => {
    const selected = e.target.value;
    if (selected === '') {
        // Placeholder selected – do nothing, keep blank
        clearWordDisplay();
        resetStats();
        return;
    }
    currentTheme = selected;
    filterWordsByTheme(selected);
});

// Guard in case button is missing (though it's present)
if (showAnswerBtn) {
    showAnswerBtn.addEventListener('click', revealAnswer);
} else {
    console.warn('Show answer button not found');
}
