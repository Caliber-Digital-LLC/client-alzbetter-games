/**
 * Word Change Game - Main Game Logic
 * 
 * State machine, UI rendering, input handling, audio, and persistence.
 * Requires words.js to be loaded first.
 */

// ============================================================================
// CONFIGURATION (TUNING SECTION)
// ============================================================================
const CONFIG = {
    // Scoring
    POINTS_PER_WORD: 100,
    BONUS_TIME_THRESHOLD: 10, // Seconds remaining for time bonus
    BONUS_POINTS: 50,
    
    // Timer
    DEFAULT_TIMER_ENABLED: false,
    DEFAULT_TIMER_SECONDS: 60,
    
    // Powerups - ADJUST COUNTS HERE
    INITIAL_HINTS: 5,
    INITIAL_REVEALS: 3,
    INITIAL_REROLLS: 5,
    POWERUP_REPLENISH_EVERY: 5, // Words completed to earn +1 powerup
    
    // Recent words tracking (prevent repeats)
    MAX_RECENT_WORDS: 20,
    
    // Animations
    SUCCESS_DELAY_MS: 600,
    INVALID_DELAY_MS: 400,
    REVEAL_DURATION_MS: 2000,
    
    // Audio
    DEFAULT_VOLUME: 0.6,
    DEFAULT_SOUND_ENABLED: true,
    DEFAULT_TAP_MODE: true,
    DEFAULT_REDUCED_MOTION: false
};

// ============================================================================
// GAME STATE
// ============================================================================
const State = {
    // Current game state
    screen: 'start', // 'start', 'playing', 'paused'
    
    // Current puzzle
    currentWord: '',
    originalWord: '',
    solutions: [],
    category: 'easy3',
    
    // Stats
    score: 0,
    wordsCompleted: 0,
    timerSeconds: CONFIG.DEFAULT_TIMER_SECONDS,
    timerRunning: false,
    timerInterval: null,
    
    // Powerups
    hints: CONFIG.INITIAL_HINTS,
    reveals: CONFIG.INITIAL_REVEALS,
    rerolls: CONFIG.INITIAL_REROLLS,
    
    // Input state
    selectedLetter: null,
    selectedPosition: null,
    isDragging: false,
    dragLetter: null,
    isAnimating: false,
    
    // Recent words tracking
    recentWords: new Set(),
    
    // Settings
    settings: {
        timerEnabled: CONFIG.DEFAULT_TIMER_ENABLED,
        soundEnabled: CONFIG.DEFAULT_SOUND_ENABLED,
        volume: CONFIG.DEFAULT_VOLUME,
        tapMode: CONFIG.DEFAULT_TAP_MODE,
        reducedMotion: CONFIG.DEFAULT_REDUCED_MOTION
    },
    
    // Audio context (initialized on first interaction)
    audioContext: null,
    audioInitialized: false
};

// ============================================================================
// DOM REFERENCES
// ============================================================================
const DOM = {};

function cacheDOMReferences() {
    DOM.startScreen = document.getElementById('start-screen');
    DOM.gameScreen = document.getElementById('game-screen');
    DOM.wordRow = document.getElementById('word-row');
    DOM.keyboard = document.getElementById('keyboard');
    DOM.instructionText = document.getElementById('instruction-text');
    DOM.categoryBadge = document.getElementById('category-badge');
    DOM.scoreValue = document.getElementById('score-value');
    DOM.wordsValue = document.getElementById('words-value');
    DOM.timerValue = document.getElementById('timer-value');
    DOM.timerStat = document.getElementById('timer-stat');
    DOM.hintBtn = document.getElementById('hint-btn');
    DOM.revealBtn = document.getElementById('reveal-btn');
    DOM.rerollBtn = document.getElementById('reroll-btn');
    DOM.hintCount = document.getElementById('hint-count');
    DOM.revealCount = document.getElementById('reveal-count');
    DOM.rerollCount = document.getElementById('reroll-count');
    DOM.settingsModal = document.getElementById('settings-modal');
    DOM.helpModal = document.getElementById('help-modal');
    DOM.categoryModal = document.getElementById('category-modal');
    DOM.soundPrompt = document.getElementById('sound-prompt');
    DOM.revealPreview = document.getElementById('reveal-preview');
}

// ============================================================================
// INITIALIZATION
// ============================================================================
function init() {
    cacheDOMReferences();
    loadSettings();
    applySettings();
    setupEventListeners();
    renderKeyboard();
    updateUI();
    
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        State.settings.reducedMotion = true;
        applySettings();
    }
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================
function loadSettings() {
    try {
        const saved = localStorage.getItem('wordchange_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            State.settings = { ...State.settings, ...parsed };
        }
        
        const savedStats = localStorage.getItem('wordchange_stats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            State.hints = stats.hints ?? CONFIG.INITIAL_HINTS;
            State.reveals = stats.reveals ?? CONFIG.INITIAL_REVEALS;
            State.rerolls = stats.rerolls ?? CONFIG.INITIAL_REROLLS;
        }
    } catch (e) {
        console.warn('Failed to load settings:', e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('wordchange_settings', JSON.stringify(State.settings));
        localStorage.setItem('wordchange_stats', JSON.stringify({
            hints: State.hints,
            reveals: State.reveals,
            rerolls: State.rerolls
        }));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

function applySettings() {
    document.body.classList.toggle('reduced-motion', State.settings.reducedMotion);
    
    if (DOM.timerStat) {
        DOM.timerStat.style.display = State.settings.timerEnabled ? 'flex' : 'none';
    }
    
    updateSettingsUI();
    updateSoundIcon();
}

function updateSoundIcon() {
    const soundOn = document.getElementById('icon-sound-on');
    const soundOff = document.getElementById('icon-sound-off');
    if (soundOn && soundOff) {
        soundOn.classList.toggle('hidden', !State.settings.soundEnabled);
        soundOff.classList.toggle('hidden', State.settings.soundEnabled);
    }
}

function updateSettingsUI() {
    const toggles = {
        'toggle-timer': State.settings.timerEnabled,
        'toggle-sound': State.settings.soundEnabled,
        'toggle-tap': State.settings.tapMode,
        'toggle-motion': State.settings.reducedMotion
    };
    
    for (const [id, value] of Object.entries(toggles)) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', value);
    }
    
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.value = State.settings.volume * 100;
    }
}

// ============================================================================
// AUDIO ENGINE (Web Audio API)
// ============================================================================
function initAudio() {
    if (State.audioInitialized) return;
    
    try {
        State.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        State.audioInitialized = true;
        DOM.soundPrompt?.classList.add('hidden');
    } catch (e) {
        console.warn('Web Audio not available:', e);
    }
}

function playSound(type) {
    if (!State.settings.soundEnabled || !State.audioContext) return;
    
    const ctx = State.audioContext;
    const volume = State.settings.volume;
    const now = ctx.currentTime;
    
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        switch (type) {
            case 'pickup':
                // Short click
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.15 * volume, now);
                gain.gain.exponentialDecayTo(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
                
            case 'place':
                // Soft thud
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.2 * volume, now);
                gain.gain.exponentialDecayTo(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
                
            case 'success':
                // Pleasant chime
                [523, 659, 784].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'sine';
                    o.frequency.setValueAtTime(freq, now + i * 0.1);
                    g.gain.setValueAtTime(0.15 * volume, now + i * 0.1);
                    g.gain.exponentialDecayTo(0.01, now + i * 0.1 + 0.3);
                    o.start(now + i * 0.1);
                    o.stop(now + i * 0.1 + 0.3);
                });
                return; // Already handled
                
            case 'invalid':
                // Gentle bump
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                gain.gain.setValueAtTime(0.12 * volume, now);
                gain.gain.exponentialDecayTo(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
                
            case 'hint':
                // Sparkle
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1000, now);
                osc.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
                gain.gain.setValueAtTime(0.1 * volume, now);
                gain.gain.exponentialDecayTo(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
        }
    } catch (e) {
        // Fallback: silent
    }
}

// Polyfill for exponentialDecayTo
GainNode.prototype.exponentialDecayTo = function(value, endTime) {
    this.gain.setTargetAtTime(value, this.context.currentTime, (endTime - this.context.currentTime) / 3);
};

// ============================================================================
// GAME FLOW
// ============================================================================
function startGame(category = null) {
    initAudio();
    
    State.screen = 'playing';
    State.score = 0;
    State.wordsCompleted = 0;
    State.timerSeconds = CONFIG.DEFAULT_TIMER_SECONDS;
    State.recentWords.clear();
    
    if (category) {
        State.category = category;
    }
    
    DOM.startScreen.style.display = 'none';
    DOM.gameScreen.style.display = 'flex';
    
    generateNewPuzzle();
    
    if (State.settings.timerEnabled) {
        startTimer();
    }
    
    updateUI();
}

function quickPlay() {
    // Use a balanced mix of easy categories
    const categories = ['easy3', 'easy4', 'general'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    startGame(category);
}

function generateNewPuzzle() {
    const puzzle = window.WordGame.generatePuzzle(State.category, State.recentWords);
    
    if (!puzzle) {
        // Fallback if no puzzles available
        State.recentWords.clear();
        const retryPuzzle = window.WordGame.generatePuzzle(State.category, State.recentWords);
        if (!retryPuzzle) {
            showError('No puzzles available for this category.');
            return;
        }
        Object.assign(State, { 
            currentWord: retryPuzzle.word, 
            originalWord: retryPuzzle.word,
            solutions: retryPuzzle.solutions 
        });
    } else {
        State.currentWord = puzzle.word;
        State.originalWord = puzzle.word;
        State.solutions = puzzle.solutions;
    }
    
    // Track recent word
    State.recentWords.add(State.currentWord);
    if (State.recentWords.size > CONFIG.MAX_RECENT_WORDS) {
        const first = State.recentWords.values().next().value;
        State.recentWords.delete(first);
    }
    
    clearSelection();
    renderWord();
    updateCategoryBadge();
}

function startTimer() {
    if (State.timerInterval) clearInterval(State.timerInterval);
    State.timerRunning = true;
    State.timerInterval = setInterval(() => {
        State.timerSeconds--;
        updateTimerDisplay();
        
        if (State.timerSeconds <= 0) {
            endGame();
        }
    }, 1000);
}

function stopTimer() {
    if (State.timerInterval) {
        clearInterval(State.timerInterval);
        State.timerInterval = null;
    }
    State.timerRunning = false;
}

function endGame() {
    stopTimer();
    State.screen = 'start';
    DOM.gameScreen.style.display = 'none';
    DOM.startScreen.style.display = 'flex';
    saveSettings();
}

// ============================================================================
// WORD RENDERING
// ============================================================================
function renderWord() {
    DOM.wordRow.innerHTML = '';
    
    const word = State.currentWord.toUpperCase();
    for (let i = 0; i < word.length; i++) {
        const tile = document.createElement('div');
        tile.className = 'word-tile';
        tile.textContent = word[i];
        tile.dataset.position = i;
        
        // Click handlers for tap mode
        tile.addEventListener('click', () => handleTileClick(i));
        tile.addEventListener('pointerenter', (e) => handleTileDragOver(i, e));
        
        DOM.wordRow.appendChild(tile);
    }
}

function updateWordTile(position, letter, animationClass = null) {
    const tiles = DOM.wordRow.querySelectorAll('.word-tile');
    if (tiles[position]) {
        tiles[position].textContent = letter.toUpperCase();
        if (animationClass) {
            tiles[position].classList.add(animationClass);
            setTimeout(() => {
                tiles[position].classList.remove(animationClass);
            }, CONFIG.SUCCESS_DELAY_MS);
        }
    }
}

function highlightTile(position, highlight = true) {
    const tiles = DOM.wordRow.querySelectorAll('.word-tile');
    tiles.forEach((tile, i) => {
        tile.classList.toggle('drop-target', highlight && i === position);
    });
}

function showHintHighlight(position) {
    const tiles = DOM.wordRow.querySelectorAll('.word-tile');
    if (tiles[position]) {
        tiles[position].classList.add('hint-highlight');
        setTimeout(() => {
            tiles[position]?.classList.remove('hint-highlight');
        }, 3000);
    }
}

// ============================================================================
// KEYBOARD RENDERING
// ============================================================================
function renderKeyboard() {
    const rows = [
        'QWERTYUIOP',
        'ASDFGHJKL',
        'ZXCVBNM'
    ];
    
    DOM.keyboard.innerHTML = '';
    
    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        for (const letter of row) {
            const key = document.createElement('button');
            key.className = 'key';
            key.textContent = letter;
            key.dataset.letter = letter.toLowerCase();
            
            // Pointer events for drag-and-drop
            key.addEventListener('pointerdown', (e) => handleKeyPointerDown(e, letter.toLowerCase()));
            key.addEventListener('click', () => handleKeyClick(letter.toLowerCase()));
            
            rowDiv.appendChild(key);
        }
        
        DOM.keyboard.appendChild(rowDiv);
    });
}

function selectKey(letter) {
    const keys = DOM.keyboard.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.toggle('selected', key.dataset.letter === letter);
    });
}

// ============================================================================
// INPUT HANDLING
// ============================================================================
function handleKeyClick(letter) {
    if (State.isAnimating) return;
    initAudio();
    
    if (State.settings.tapMode) {
        if (State.selectedLetter === letter) {
            // Deselect
            clearSelection();
        } else {
            // Select this letter
            State.selectedLetter = letter;
            selectKey(letter);
            playSound('pickup');
            updateInstruction('Now tap a tile to replace');
        }
    }
}

function handleTileClick(position) {
    if (State.isAnimating) return;
    initAudio();
    
    if (State.settings.tapMode && State.selectedLetter) {
        // Apply the selected letter to this position
        attemptReplacement(position, State.selectedLetter);
        clearSelection();
    }
}

function handleKeyPointerDown(e, letter) {
    if (!State.settings.tapMode || e.pointerType === 'mouse') {
        // Start drag
        e.preventDefault();
        e.target.setPointerCapture(e.pointerId);
        
        State.isDragging = true;
        State.dragLetter = letter;
        e.target.classList.add('dragging');
        
        playSound('pickup');
        
        // Create drag ghost
        createDragGhost(letter, e.clientX, e.clientY);
        
        // Add move and up listeners
        const moveHandler = (me) => handlePointerMove(me);
        const upHandler = (ue) => handlePointerUp(ue, letter, moveHandler, upHandler);
        
        document.addEventListener('pointermove', moveHandler);
        document.addEventListener('pointerup', upHandler);
        document.addEventListener('pointercancel', upHandler);
    }
}

function handlePointerMove(e) {
    if (!State.isDragging) return;
    
    moveDragGhost(e.clientX, e.clientY);
    
    // Check if over a word tile
    const tiles = DOM.wordRow.querySelectorAll('.word-tile');
    let foundPosition = -1;
    
    tiles.forEach((tile, i) => {
        const rect = tile.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            foundPosition = i;
        }
    });
    
    highlightTile(foundPosition, foundPosition >= 0);
}

function handlePointerUp(e, letter, moveHandler, upHandler) {
    document.removeEventListener('pointermove', moveHandler);
    document.removeEventListener('pointerup', upHandler);
    document.removeEventListener('pointercancel', upHandler);
    
    if (!State.isDragging) return;
    
    State.isDragging = false;
    removeDragGhost();
    
    // Remove dragging class from all keys
    DOM.keyboard.querySelectorAll('.key').forEach(k => k.classList.remove('dragging'));
    highlightTile(-1);
    
    // Check if dropped on a tile
    const tiles = DOM.wordRow.querySelectorAll('.word-tile');
    tiles.forEach((tile, i) => {
        const rect = tile.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            attemptReplacement(i, letter);
        }
    });
}

function handleTileDragOver(position, e) {
    if (State.isDragging) {
        highlightTile(position, true);
    }
}

// Drag ghost
function createDragGhost(letter, x, y) {
    removeDragGhost();
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.id = 'drag-ghost';
    ghost.textContent = letter.toUpperCase();
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    document.body.appendChild(ghost);
}

function moveDragGhost(x, y) {
    const ghost = document.getElementById('drag-ghost');
    if (ghost) {
        ghost.style.left = x + 'px';
        ghost.style.top = y + 'px';
    }
}

function removeDragGhost() {
    const ghost = document.getElementById('drag-ghost');
    if (ghost) ghost.remove();
}

function clearSelection() {
    State.selectedLetter = null;
    State.selectedPosition = null;
    selectKey(null);
    updateInstruction('');
}

// ============================================================================
// GAME LOGIC
// ============================================================================
function attemptReplacement(position, letter) {
    if (State.isAnimating) return;
    
    const wordChars = State.currentWord.split('');
    const originalLetter = wordChars[position];
    
    // Same letter - no change
    if (originalLetter === letter) {
        return;
    }
    
    wordChars[position] = letter;
    const newWord = wordChars.join('');
    
    // Check if valid word
    if (window.WordGame.isValidWord(newWord) && newWord !== State.originalWord) {
        // Success!
        handleSuccess(newWord, position);
    } else {
        // Invalid
        handleInvalid(position);
    }
}

function handleSuccess(newWord, position) {
    State.isAnimating = true;
    playSound('place');
    
    // Update display with success animation
    updateWordTile(position, newWord[position], 'valid');
    
    setTimeout(() => {
        playSound('success');
        
        // Update score
        State.score += CONFIG.POINTS_PER_WORD;
        if (State.settings.timerEnabled && State.timerSeconds > CONFIG.BONUS_TIME_THRESHOLD) {
            State.score += CONFIG.BONUS_POINTS;
        }
        
        State.wordsCompleted++;
        
        // Replenish powerups every N words
        if (State.wordsCompleted % CONFIG.POWERUP_REPLENISH_EVERY === 0) {
            State.hints = Math.min(State.hints + 1, CONFIG.INITIAL_HINTS * 2);
            State.reveals = Math.min(State.reveals + 1, CONFIG.INITIAL_REVEALS * 2);
            State.rerolls = Math.min(State.rerolls + 1, CONFIG.INITIAL_REROLLS * 2);
        }
        
        // Reset timer if enabled
        if (State.settings.timerEnabled) {
            State.timerSeconds = CONFIG.DEFAULT_TIMER_SECONDS;
        }
        
        updateUI();
        saveSettings();
        
        // Generate new puzzle after delay
        setTimeout(() => {
            generateNewPuzzle();
            State.isAnimating = false;
        }, 300);
        
    }, CONFIG.SUCCESS_DELAY_MS);
}

function handleInvalid(position) {
    State.isAnimating = true;
    playSound('invalid');
    
    const tiles = DOM.wordRow.querySelectorAll('.word-tile');
    if (tiles[position]) {
        tiles[position].classList.add('invalid');
        
        setTimeout(() => {
            tiles[position].classList.remove('invalid');
            // Revert to original letter
            tiles[position].textContent = State.currentWord[position].toUpperCase();
            State.isAnimating = false;
        }, CONFIG.INVALID_DELAY_MS);
    }
}

// ============================================================================
// POWERUPS
// ============================================================================
function useHint() {
    if (State.hints <= 0 || State.isAnimating) return;
    initAudio();
    
    const hint = window.WordGame.getHint(State.currentWord, State.solutions);
    if (hint) {
        State.hints--;
        playSound('hint');
        showHintHighlight(hint.position);
        updateUI();
        saveSettings();
    }
}

function useReveal() {
    if (State.reveals <= 0 || State.isAnimating) return;
    initAudio();
    
    if (State.solutions.length > 0) {
        State.reveals--;
        const solution = State.solutions[Math.floor(Math.random() * State.solutions.length)];
        
        // Show the solution briefly
        DOM.revealPreview.textContent = solution.toUpperCase();
        DOM.revealPreview.classList.add('visible');
        playSound('hint');
        
        setTimeout(() => {
            DOM.revealPreview.classList.remove('visible');
        }, CONFIG.REVEAL_DURATION_MS);
        
        updateUI();
        saveSettings();
    }
}

function useReroll() {
    if (State.rerolls <= 0 || State.isAnimating) return;
    initAudio();
    
    State.rerolls--;
    playSound('pickup');
    generateNewPuzzle();
    updateUI();
    saveSettings();
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateUI() {
    if (DOM.scoreValue) DOM.scoreValue.textContent = State.score;
    if (DOM.wordsValue) DOM.wordsValue.textContent = State.wordsCompleted;
    if (DOM.hintCount) DOM.hintCount.textContent = State.hints;
    if (DOM.revealCount) DOM.revealCount.textContent = State.reveals;
    if (DOM.rerollCount) DOM.rerollCount.textContent = State.rerolls;
    
    if (DOM.hintBtn) DOM.hintBtn.disabled = State.hints <= 0;
    if (DOM.revealBtn) DOM.revealBtn.disabled = State.reveals <= 0;
    if (DOM.rerollBtn) DOM.rerollBtn.disabled = State.rerolls <= 0;
    
    updateTimerDisplay();
}

function updateTimerDisplay() {
    if (!DOM.timerValue) return;
    
    const mins = Math.floor(State.timerSeconds / 60);
    const secs = State.timerSeconds % 60;
    DOM.timerValue.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    DOM.timerValue.classList.toggle('warning', State.timerSeconds <= 10);
}

function updateCategoryBadge() {
    if (!DOM.categoryBadge) return;
    
    const cat = window.WordGame.CATEGORIES[State.category];
    DOM.categoryBadge.textContent = cat ? cat.name : State.category;
}

function updateInstruction(text) {
    if (!DOM.instructionText) return;
    
    if (text) {
        DOM.instructionText.textContent = text;
        DOM.instructionText.classList.add('highlight');
    } else {
        DOM.instructionText.textContent = State.settings.tapMode 
            ? 'Tap a letter, then tap a tile to replace' 
            : 'Drag a letter onto a tile to replace';
        DOM.instructionText.classList.remove('highlight');
    }
}

// ============================================================================
// MODALS
// ============================================================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        if (modalId === 'settings-modal') {
            updateSettingsUI();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// Settings toggles
function toggleSetting(setting) {
    State.settings[setting] = !State.settings[setting];
    applySettings();
    saveSettings();
    
    if (setting === 'tapMode') {
        updateInstruction('');
    }
}

function setVolume(value) {
    State.settings.volume = value / 100;
    saveSettings();
}

// Help modal paging
let helpPage = 0;
const HELP_PAGES = 3;

function showHelpPage(page) {
    helpPage = Math.max(0, Math.min(page, HELP_PAGES - 1));
    
    document.querySelectorAll('.help-page').forEach((p, i) => {
        p.classList.toggle('active', i === helpPage);
    });
    
    document.querySelectorAll('.page-dot').forEach((d, i) => {
        d.classList.toggle('active', i === helpPage);
    });
    
    const prevBtn = document.getElementById('help-prev');
    const nextBtn = document.getElementById('help-next');
    if (prevBtn) prevBtn.disabled = helpPage === 0;
    if (nextBtn) nextBtn.textContent = helpPage === HELP_PAGES - 1 ? 'Got It!' : 'Next';
}

function helpNext() {
    if (helpPage >= HELP_PAGES - 1) {
        closeModal('help-modal');
        helpPage = 0;
    } else {
        showHelpPage(helpPage + 1);
    }
}

function helpPrev() {
    showHelpPage(helpPage - 1);
}

// Category selection
function selectCategory(category) {
    const btns = document.querySelectorAll('.category-btn');
    btns.forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.category === category);
    });
}

function startWithSelectedCategory() {
    const selected = document.querySelector('.category-btn.selected');
    const category = selected ? selected.dataset.category : 'easy3';
    closeModal('category-modal');
    startGame(category);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================
function showError(message) {
    alert(message); // Simple fallback
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
    // Start screen buttons
    document.getElementById('quick-play-btn')?.addEventListener('click', quickPlay);
    document.getElementById('choose-category-btn')?.addEventListener('click', () => openModal('category-modal'));
    document.getElementById('how-to-play-btn')?.addEventListener('click', () => {
        showHelpPage(0);
        openModal('help-modal');
    });
    
    // Top bar buttons
    document.getElementById('settings-btn')?.addEventListener('click', () => openModal('settings-modal'));
    document.getElementById('helpBtn')?.addEventListener('click', () => {
        showHelpPage(0);
        openModal('help-modal');
    });
    document.getElementById('soundBtn')?.addEventListener('click', () => {
        toggleSetting('soundEnabled');
        playSound('pickup');
    });
    
    // Powerup buttons
    DOM.hintBtn?.addEventListener('click', useHint);
    DOM.revealBtn?.addEventListener('click', useReveal);
    DOM.rerollBtn?.addEventListener('click', useReroll);
    
    // End game / menu
    document.getElementById('menu-btn')?.addEventListener('click', endGame);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAllModals();
        });
    });
    
    // Settings toggles
    document.getElementById('toggle-timer')?.addEventListener('click', () => toggleSetting('timerEnabled'));
    document.getElementById('toggle-sound')?.addEventListener('click', () => toggleSetting('soundEnabled'));
    document.getElementById('toggle-tap')?.addEventListener('click', () => toggleSetting('tapMode'));
    document.getElementById('toggle-motion')?.addEventListener('click', () => toggleSetting('reducedMotion'));
    document.getElementById('volume-slider')?.addEventListener('input', (e) => setVolume(e.target.value));
    
    // Help navigation
    document.getElementById('help-prev')?.addEventListener('click', helpPrev);
    document.getElementById('help-next')?.addEventListener('click', helpNext);
    
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => selectCategory(btn.dataset.category));
    });
    document.getElementById('start-category-btn')?.addEventListener('click', startWithSelectedCategory);
    
    // Sound prompt
    DOM.soundPrompt?.addEventListener('click', () => {
        initAudio();
        playSound('pickup');
    });
    
    // Enable audio on any interaction
    document.addEventListener('pointerdown', () => initAudio(), { once: true });
    document.addEventListener('keydown', () => initAudio(), { once: true });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (State.screen !== 'playing') return;
        
        const key = e.key.toLowerCase();
        if (key >= 'a' && key <= 'z') {
            if (State.settings.tapMode) {
                if (State.selectedLetter === key) {
                    clearSelection();
                } else {
                    State.selectedLetter = key;
                    selectKey(key);
                    playSound('pickup');
                    updateInstruction('Press 1-' + State.currentWord.length + ' to replace a tile');
                }
            }
        } else if (key >= '1' && key <= '9') {
            const pos = parseInt(key) - 1;
            if (pos < State.currentWord.length && State.selectedLetter) {
                attemptReplacement(pos, State.selectedLetter);
                clearSelection();
            }
        } else if (key === 'escape') {
            clearSelection();
            closeAllModals();
        }
    });
}

// ============================================================================
// STARTUP
// ============================================================================
document.addEventListener('DOMContentLoaded', init);
