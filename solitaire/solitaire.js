/**
 * Solitaire.js - Main game logic
 * Klondike Solitaire with tap-to-move, drag-and-drop, hints, undo
 */

(function() {
    'use strict';
    
    // ========================================================================
    // CONFIGURATION (TUNING)
    // ========================================================================
    const CONFIG = {
        // Animation timing (ms)
        CARD_MOVE_DURATION: 200,
        CARD_FLIP_DURATION: 150,
        HIGHLIGHT_DURATION: 1500,
        AUTO_MOVE_DELAY: 100,
        WIN_ANIMATION_DURATION: 2000,
        INPUT_LOCK_DURATION: 250,
        
        // Easy mode
        FRIENDLY_SHUFFLE_ATTEMPTS: 5,
        SOLVABILITY_THRESHOLD: 0.3,
        
        // Sound frequencies (Hz)
        DEFAULT_VOLUME: 0.5,
        PICKUP_FREQ: 400,
        PLACE_FREQ: 200,
        INVALID_FREQ: 150,
        FOUNDATION_FREQ: [523, 659, 784],
        WIN_CHORD: [523, 659, 784, 1047],
        
        // Default settings
        DEFAULT_DRAW_COUNT: 1,
        DEFAULT_EASY_MODE: true,
        DEFAULT_TAP_MODE: true,
        DEFAULT_AUTO_FOUNDATION: true,
        DEFAULT_SOUND: true,
        DEFAULT_REDUCED_MOTION: false
    };
    
    // ========================================================================
    // GAME STATE
    // ========================================================================
    const State = {
        // Game state
        stock: [],
        waste: [],
        foundations: [[], [], [], []],
        tableau: [[], [], [], [], [], []/* , [] */],
        
        // Card lookup
        cardElements: new Map(),
        cards: new Map(),
        
        // Interaction state
        selectedCard: null,
        selectedPile: null,
        selectedIndex: null,
        dragState: null,
        inputLocked: false,
        
        // Game stats
        moves: 0,
        startTime: null,
        timerInterval: null,
        gameWon: false,
        gameStarted: false,
        
        // History for undo
        history: [],
        
        // Settings
        settings: {
            drawCount: CONFIG.DEFAULT_DRAW_COUNT,
            easyMode: CONFIG.DEFAULT_EASY_MODE,
            tapMode: CONFIG.DEFAULT_TAP_MODE,
            autoFoundation: CONFIG.DEFAULT_AUTO_FOUNDATION,
            soundEnabled: CONFIG.DEFAULT_SOUND,
            volume: CONFIG.DEFAULT_VOLUME,
            reducedMotion: CONFIG.DEFAULT_REDUCED_MOTION
        },
        
        // Stats
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            bestTime: null,
            currentStreak: 0
        },
        
        // Audio
        audioContext: null,
        audioInitialized: false
    };
    
    // Fix tableau initialization
    State.tableau = [[], [], [], [], [], [], []];
    
    // ========================================================================
    // DOM REFERENCES
    // ========================================================================
    const DOM = {};
    
    function cacheDOMReferences() {
        DOM.gameArea = document.getElementById('game-area');
        DOM.stock = document.getElementById('stock');
        DOM.waste = document.getElementById('waste');
        DOM.foundations = [
            document.getElementById('foundation-0'),
            document.getElementById('foundation-1'),
            document.getElementById('foundation-2'),
            document.getElementById('foundation-3')
        ];
        DOM.tableau = [];
        for (let i = 0; i < 7; i++) {
            DOM.tableau.push(document.getElementById(`tableau-${i}`));
        }
        
        DOM.movesDisplay = document.querySelector('#moves-stat strong');
        DOM.timeDisplay = document.querySelector('#time-stat strong');
        DOM.undoBtn = document.getElementById('undo-btn');
        DOM.hintBtn = document.getElementById('hint-btn');
        DOM.helpBtn = document.getElementById('help-btn');
        DOM.settingsBtn = document.getElementById('settings-btn');
        DOM.newGameBtn = document.getElementById('new-game-btn');
        DOM.autoFinishBtn = document.getElementById('auto-finish-btn');
        
        DOM.helpModal = document.getElementById('help-modal');
        DOM.settingsModal = document.getElementById('settings-modal');
        DOM.statsModal = document.getElementById('stats-modal');
        DOM.confirmModal = document.getElementById('confirm-modal');
        DOM.winModal = document.getElementById('win-modal');
        DOM.soundBanner = document.getElementById('sound-banner');
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    function wasPageReloaded() {
        try {
            const navEntries = performance.getEntriesByType?.('navigation');
            if (navEntries && navEntries.length > 0) {
                return navEntries[0].type === 'reload';
            }
        } catch (e) {
            // ignore
        }
        // Fallback for older browsers
        // eslint-disable-next-line no-restricted-globals
        return !!(performance && performance.navigation && performance.navigation.type === 1);
    }

    function init() {
        cacheDOMReferences();
        loadSettings();
        loadStats();
        applySettings();
        setupEventListeners();

        // Refresh/reload should always start a fresh game (no resume prompt).
        if (wasPageReloaded()) {
            clearGameState();
            startNewGame();
            return;
        }
        
        // Check for saved game
        const savedGame = loadGameState();
        if (savedGame) {
            showConfirm(
                'Resume Game?',
                'Would you like to continue your previous game?',
                'Continue',
                () => restoreGameState(savedGame),
                () => startNewGame(),
                'New Game'
            );
        } else {
            startNewGame();
        }
    }
    
    // ========================================================================
    // GAME SETUP
    // ========================================================================
    function startNewGame() {
        // Reset state
        State.stock = [];
        State.waste = [];
        State.foundations = [[], [], [], []];
        State.tableau = [[], [], [], [], [], [], []];
        State.moves = 0;
        State.history = [];
        State.gameWon = false;
        State.gameStarted = false;
        State.selectedCard = null;
        clearSelection();
        
        // Stop timer
        if (State.timerInterval) {
            clearInterval(State.timerInterval);
            State.timerInterval = null;
        }
        State.startTime = null;
        
        // Clear card elements
        State.cardElements.forEach(el => el.remove());
        State.cardElements.clear();
        State.cards.clear();
        
        // Create and shuffle deck
        let deck = Cards.createDeck();
        deck = performShuffle(deck);
        
        // Store cards
        deck.forEach(card => State.cards.set(card.id, card));
        
        // Deal to tableau
        let cardIndex = 0;
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row <= col; row++) {
                const card = deck[cardIndex++];
                card.faceUp = (row === col);
                State.tableau[col].push(card);
            }
        }
        
        // Remaining cards go to stock
        while (cardIndex < deck.length) {
            State.stock.push(deck[cardIndex++]);
        }
        
        // Create card elements and render
        State.cards.forEach(card => {
            const el = Cards.createCardElement(card);
            State.cardElements.set(card.id, el);
        });
        
        renderAllPiles();
        updateUI();
        
        // Track stats
        State.stats.gamesPlayed++;
        saveStats();
        
        closeAllModals();
    }
    
    function performShuffle(deck) {
        if (!State.settings.easyMode) {
            return Cards.shuffleDeck(deck);
        }
        
        // Friendly shuffle - try multiple times to get a playable deal
        let bestDeck = null;
        let bestScore = -1;
        
        for (let attempt = 0; attempt < CONFIG.FRIENDLY_SHUFFLE_ATTEMPTS; attempt++) {
            const shuffled = Cards.shuffleDeck(deck);
            const score = evaluateDealPlayability(shuffled);
            
            if (score > bestScore) {
                bestScore = score;
                bestDeck = shuffled;
            }
            
            if (score >= CONFIG.SOLVABILITY_THRESHOLD) {
                break;
            }
        }
        
        return bestDeck || Cards.shuffleDeck(deck);
    }
    
    function evaluateDealPlayability(deck) {
        // Simple heuristic: count how many cards would be face-up initially
        // and check for playable moves
        let score = 0;
        const tableauCards = [];
        let idx = 0;
        
        for (let col = 0; col < 7; col++) {
            const pile = [];
            for (let row = 0; row <= col; row++) {
                const card = { ...deck[idx++] };
                card.faceUp = (row === col);
                pile.push(card);
            }
            tableauCards.push(pile);
        }
        
        // Check for Aces in face-up positions (good)
        tableauCards.forEach(pile => {
            const topCard = pile[pile.length - 1];
            if (topCard && topCard.rank === 'A') score += 0.15;
            if (topCard && topCard.rank === '2') score += 0.05;
        });
        
        // Check for playable moves between tableau
        for (let i = 0; i < 7; i++) {
            const topCard = tableauCards[i][tableauCards[i].length - 1];
            if (!topCard) continue;
            
            for (let j = 0; j < 7; j++) {
                if (i === j) continue;
                const targetTop = tableauCards[j][tableauCards[j].length - 1];
                if (Cards.canStackOnTableau(topCard, targetTop)) {
                    score += 0.1;
                }
            }
        }
        
        // Check for Kings that can go to empty columns (less valuable early)
        const firstStockCards = deck.slice(28, 35);
        firstStockCards.forEach(card => {
            if (card.rank === 'A') score += 0.1;
        });
        
        return Math.min(score, 1);
    }
    
    // ========================================================================
    // RENDERING
    // ========================================================================
    function renderAllPiles() {
        renderStock();
        renderWaste();
        renderFoundations();
        renderTableau();
    }
    
    function renderStock() {
        // Clear existing
        DOM.stock.querySelectorAll('.card').forEach(el => el.remove());
        
        // Show placeholder if empty
        const placeholder = DOM.stock.querySelector('.slot-placeholder');
        if (State.stock.length === 0) {
            if (placeholder) placeholder.style.display = '';
            DOM.stock.style.cursor = State.waste.length > 0 ? 'pointer' : 'default';
        } else {
            if (placeholder) placeholder.style.display = 'none';
            DOM.stock.style.cursor = 'pointer';
            
            // Show top few cards stacked
            const showCount = Math.min(3, State.stock.length);
            for (let i = State.stock.length - showCount; i < State.stock.length; i++) {
                const card = State.stock[i];
                const el = State.cardElements.get(card.id);
                Cards.updateCardElement(el, card);
                el.style.left = `${(i - (State.stock.length - showCount)) * 2}px`;
                el.style.top = `${(i - (State.stock.length - showCount)) * -1}px`;
                DOM.stock.appendChild(el);
            }
        }
    }
    
    function renderWaste() {
        DOM.waste.querySelectorAll('.card').forEach(el => el.remove());
        
        if (State.waste.length === 0) return;
        
        // Show last few cards
        const showCount = State.settings.drawCount === 3 ? 
            Math.min(3, State.waste.length) : 1;
        const startIdx = State.waste.length - showCount;
        
        for (let i = startIdx; i < State.waste.length; i++) {
            const card = State.waste[i];
            card.faceUp = true;
            const el = State.cardElements.get(card.id);
            Cards.updateCardElement(el, card);
            
            const offset = (i - startIdx) * 20;
            el.style.left = `${offset}px`;
            el.style.top = '0';
            
            // Only top card is interactive
            el.style.pointerEvents = (i === State.waste.length - 1) ? 'auto' : 'none';
            
            DOM.waste.appendChild(el);
        }
    }
    
    function renderFoundations() {
        DOM.foundations.forEach((foundationEl, idx) => {
            foundationEl.querySelectorAll('.card').forEach(el => el.remove());
            
            const pile = State.foundations[idx];
            const placeholder = foundationEl.querySelector('.slot-placeholder');
            
            if (pile.length === 0) {
                if (placeholder) placeholder.style.display = '';
            } else {
                if (placeholder) placeholder.style.display = 'none';
                
                // Only show top card
                const card = pile[pile.length - 1];
                card.faceUp = true;
                const el = State.cardElements.get(card.id);
                Cards.updateCardElement(el, card);
                el.style.left = '0';
                el.style.top = '0';
                foundationEl.appendChild(el);
            }
        });
    }
    
    function renderTableau() {
        DOM.tableau.forEach((pileEl, idx) => {
            pileEl.querySelectorAll('.card').forEach(el => el.remove());
            
            const pile = State.tableau[idx];
            
            pile.forEach((card, cardIdx) => {
                const el = State.cardElements.get(card.id);
                Cards.updateCardElement(el, card);
                pileEl.appendChild(el);
            });
        });
    }
    
    // ========================================================================
    // GAME ACTIONS
    // ========================================================================
    function drawFromStock() {
        if (State.inputLocked || State.gameWon) return;
        
        if (State.stock.length === 0) {
            // Recycle waste to stock
            if (State.waste.length === 0) return;
            
            saveHistory();
            
            while (State.waste.length > 0) {
                const card = State.waste.pop();
                card.faceUp = false;
                State.stock.push(card);
            }
            
            playSound('place');
            renderStock();
            renderWaste();
            incrementMoves();
            startTimerIfNeeded();
            return;
        }
        
        saveHistory();
        
        const drawCount = Math.min(State.settings.drawCount, State.stock.length);
        for (let i = 0; i < drawCount; i++) {
            const card = State.stock.pop();
            card.faceUp = true;
            State.waste.push(card);
        }
        
        playSound('pickup');
        renderStock();
        renderWaste();
        incrementMoves();
        startTimerIfNeeded();
    }
    
    function moveCard(card, sourcePile, sourceType, sourceIndex, destPile, destType, destIndex) {
        if (State.inputLocked || State.gameWon) return false;
        
        // Validate move
        if (!isValidMove(card, destPile, destType)) {
            playSound('invalid');
            return false;
        }
        
        saveHistory();
        
        // Find and remove card(s) from source
        let cardsToMove = [];
        
        if (sourceType === 'waste') {
            cardsToMove = [State.waste.pop()];
        } else if (sourceType === 'tableau') {
            const pile = State.tableau[sourceIndex];
            const cardIdx = pile.findIndex(c => c.id === card.id);
            cardsToMove = pile.splice(cardIdx);
            
            // Flip the new top card if needed
            if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
                pile[pile.length - 1].faceUp = true;
            }
        } else if (sourceType === 'foundation') {
            cardsToMove = [State.foundations[sourceIndex].pop()];
        }
        
        // Add to destination
        if (destType === 'foundation') {
            State.foundations[destIndex].push(...cardsToMove);
            playSound('foundation');
        } else if (destType === 'tableau') {
            State.tableau[destIndex].push(...cardsToMove);
            playSound('place');
        }
        
        renderAllPiles();
        incrementMoves();
        startTimerIfNeeded();
        clearSelection();
        
        // Check for auto-move opportunity
        if (State.settings.autoFoundation) {
            setTimeout(() => autoMoveToFoundation(), CONFIG.AUTO_MOVE_DELAY);
        }
        
        checkWinCondition();
        checkAutoFinishAvailable();
        saveGameState();
        
        return true;
    }
    
    function isValidMove(card, destPile, destType) {
        if (destType === 'foundation') {
            const topCard = destPile.length > 0 ? destPile[destPile.length - 1] : null;
            return Cards.canStackOnFoundation(card, topCard);
        } else if (destType === 'tableau') {
            const topCard = destPile.length > 0 ? destPile[destPile.length - 1] : null;
            return Cards.canStackOnTableau(card, topCard);
        }
        return false;
    }
    
    function autoMoveToFoundation() {
        if (State.inputLocked || State.gameWon) return;
        
        // Find a safe card to move to foundation
        // "Safe" means all cards of lower rank in opposite color are already in foundations
        
        const minFoundationValue = Math.min(...State.foundations.map(f => 
            f.length > 0 ? f[f.length - 1].value : 0
        ));
        
        // Check waste
        if (State.waste.length > 0) {
            const card = State.waste[State.waste.length - 1];
            if (isSafeToMoveToFoundation(card, minFoundationValue)) {
                const destIdx = findFoundationForCard(card);
                if (destIdx !== -1) {
                    moveCard(card, State.waste, 'waste', -1, 
                            State.foundations[destIdx], 'foundation', destIdx);
                    return;
                }
            }
        }
        
        // Check tableau tops
        for (let i = 0; i < 7; i++) {
            const pile = State.tableau[i];
            if (pile.length === 0) continue;
            
            const card = pile[pile.length - 1];
            if (card.faceUp && isSafeToMoveToFoundation(card, minFoundationValue)) {
                const destIdx = findFoundationForCard(card);
                if (destIdx !== -1) {
                    moveCard(card, pile, 'tableau', i,
                            State.foundations[destIdx], 'foundation', destIdx);
                    return;
                }
            }
        }
    }
    
    function isSafeToMoveToFoundation(card, minFoundationValue) {
        // Aces and 2s are always safe
        if (card.value <= 2) return true;
        
        // Safe if both opposite color suits have at least value-1 in foundation
        // This prevents locking needed cards
        const oppositeColor = card.color === 'red' ? 'black' : 'red';
        const oppositeSuits = Cards.SUITS.filter(s => {
            const c = Cards.isRed({ suit: s }) ? 'red' : 'black';
            return c === oppositeColor;
        });
        
        for (const suit of oppositeSuits) {
            const foundIdx = State.foundations.findIndex((f, i) => {
                return f.length > 0 && f[0].suit === suit;
            });
            
            if (foundIdx === -1) {
                if (card.value > 2) return false;
            } else {
                const foundTop = State.foundations[foundIdx][State.foundations[foundIdx].length - 1];
                if (foundTop.value < card.value - 1) return false;
            }
        }
        
        return true;
    }
    
    function findFoundationForCard(card) {
        for (let i = 0; i < 4; i++) {
            const pile = State.foundations[i];
            if (pile.length === 0) {
                if (card.rank === 'A') return i;
            } else {
                const top = pile[pile.length - 1];
                if (top.suit === card.suit && top.value === card.value - 1) {
                    return i;
                }
            }
        }
        return -1;
    }
    
    // ========================================================================
    // SELECTION & INPUT
    // ========================================================================
    
    // Send a face-up card to its foundation pile if a valid slot exists.
    // Called by dblclick (mouse) and manual double-tap detection (touch).
    function sendCardToFoundation(card) {
        if (State.inputLocked || State.gameWon) return false;
        if (!card || !card.faceUp) return false;

        const { pile, type, index } = findCardLocation(card);
        if (!type) return false;

        // Windows Solitaire behavior: only auto-send a single, free card.
        // - Waste: only the top waste card
        // - Tableau: only the top tableau card
        if (type === 'waste') {
            if (State.waste.length === 0 || State.waste[State.waste.length - 1].id !== card.id) {
                return false;
            }
        } else if (type === 'tableau') {
            const sourcePile = State.tableau[index];
            if (!sourcePile || sourcePile.length === 0 || sourcePile[sourcePile.length - 1].id !== card.id) {
                return false;
            }
        } else {
            // Don’t auto-send from stock/foundations/unknown piles
            return false;
        }

        const destIdx = findFoundationForCard(card);
        if (destIdx === -1) {
            playSound('invalid');
            return false;
        }

        return moveCard(card, pile, type, index,
            State.foundations[destIdx], 'foundation', destIdx);
    }
    
    function handleCardClick(cardEl, e) {
        if (State.inputLocked || State.gameWon) return;
        
        const cardId = parseInt(cardEl.dataset.cardId);
        const card = State.cards.get(cardId);
        
        if (!card || !card.faceUp) return;
        
        const { pile, type, index } = findCardLocation(card);
        
        // If we have a selection, try to move
        if (State.selectedCard) {
            // Clicking the same card deselects
            if (State.selectedCard.id === card.id) {
                clearSelection();
                return;
            }
            
            // Try to move selected to this card's pile
            const success = moveCard(
                State.selectedCard,
                State.selectedPile,
                State.selectedPileType,
                State.selectedPileIndex,
                pile,
                type,
                index
            );
            
            if (!success) {
                // Maybe user wants to select this card instead
                selectCard(card, pile, type, index);
            }
            return;
        }
        
        // Select this card
        selectCard(card, pile, type, index);
    }
    
    function handleSlotClick(slotEl) {
        if (State.inputLocked || State.gameWon) return;
        
        const pileType = slotEl.dataset.pile;
        const pileIndex = parseInt(slotEl.dataset.index) || 0;
        
        if (pileType === 'stock') {
            clearSelection();
            drawFromStock();
            return;
        }
        
        // If we have a selection, try to move to this empty slot
        if (State.selectedCard) {
            let destPile;
            if (pileType === 'foundation') {
                destPile = State.foundations[pileIndex];
            } else if (pileType === 'tableau') {
                destPile = State.tableau[pileIndex];
            }
            
            if (destPile && destPile.length === 0) {
                moveCard(
                    State.selectedCard,
                    State.selectedPile,
                    State.selectedPileType,
                    State.selectedPileIndex,
                    destPile,
                    pileType,
                    pileIndex
                );
            }
        }
    }
    
    function selectCard(card, pile, type, index) {
        clearSelection();
        
        State.selectedCard = card;
        State.selectedPile = pile;
        State.selectedPileType = type;
        State.selectedPileIndex = index;
        
        // Highlight selected card
        const el = State.cardElements.get(card.id);
        if (el) el.classList.add('selected');
        
        // Also select cards below in tableau stack
        if (type === 'tableau') {
            const cardIdx = pile.findIndex(c => c.id === card.id);
            for (let i = cardIdx + 1; i < pile.length; i++) {
                const stackEl = State.cardElements.get(pile[i].id);
                if (stackEl) stackEl.classList.add('selected');
            }
        }
        
        // Highlight valid destinations
        highlightValidDestinations(card);
        
        playSound('pickup');
    }
    
    function clearSelection() {
        State.selectedCard = null;
        State.selectedPile = null;
        State.selectedPileType = null;
        State.selectedPileIndex = null;
        
        // Remove all selection highlights
        document.querySelectorAll('.card.selected').forEach(el => {
            el.classList.remove('selected');
        });
        document.querySelectorAll('.valid-destination').forEach(el => {
            el.classList.remove('valid-destination');
        });
    }
    
    function highlightValidDestinations(card) {
        // Only highlight foundations when the selection is a single, free card.
        let canHighlightFoundations = true;
        if (State.selectedCard) {
            if (State.selectedPileType === 'tableau') {
                const pile = State.tableau[State.selectedPileIndex] || State.selectedPile;
                const cardIdx = pile ? pile.findIndex(c => c.id === card.id) : -1;
                const stackCount = (pile && cardIdx !== -1) ? (pile.length - cardIdx) : 99;
                const isTopCard = pile && pile.length > 0 && pile[pile.length - 1].id === card.id;
                canHighlightFoundations = isTopCard && stackCount === 1;
            } else if (State.selectedPileType === 'waste') {
                canHighlightFoundations = State.waste.length > 0 && State.waste[State.waste.length - 1].id === card.id;
            }
        }

        if (canHighlightFoundations) {
            for (let i = 0; i < 4; i++) {
                if (isValidMove(card, State.foundations[i], 'foundation')) {
                    DOM.foundations[i].classList.add('valid-destination');
                }
            }
        }
        
        // Check tableau
        for (let i = 0; i < 7; i++) {
            if (isValidMove(card, State.tableau[i], 'tableau')) {
                DOM.tableau[i].classList.add('valid-destination');
            }
        }
    }
    
    function findCardLocation(card) {
        // Check waste
        if (State.waste.includes(card)) {
            return { pile: State.waste, type: 'waste', index: -1 };
        }
        
        // Check foundations
        for (let i = 0; i < 4; i++) {
            if (State.foundations[i].includes(card)) {
                return { pile: State.foundations[i], type: 'foundation', index: i };
            }
        }
        
        // Check tableau
        for (let i = 0; i < 7; i++) {
            if (State.tableau[i].includes(card)) {
                return { pile: State.tableau[i], type: 'tableau', index: i };
            }
        }
        
        return { pile: null, type: null, index: -1 };
    }
    
    // ========================================================================
    // DRAG AND DROP
    // ========================================================================
    function handleDragStart(cardEl, e) {
        if (!State.settings.tapMode === false) return; // Drag always works
        if (State.inputLocked || State.gameWon) return;
        
        const cardId = parseInt(cardEl.dataset.cardId);
        const card = State.cards.get(cardId);
        
        if (!card || !card.faceUp) return;
        
        e.preventDefault();
        
        const { pile, type, index } = findCardLocation(card);
        
        // Get cards to drag (card + any below in tableau)
        const dragCards = [];
        if (type === 'tableau') {
            const cardIdx = pile.findIndex(c => c.id === card.id);
            for (let i = cardIdx; i < pile.length; i++) {
                dragCards.push(pile[i]);
            }
        } else {
            dragCards.push(card);
        }
        
        State.dragState = {
            card,
            cards: dragCards,
            pile,
            type,
            index,
            startX: e.clientX || e.touches[0].clientX,
            startY: e.clientY || e.touches[0].clientY,
            elements: []
        };
        
        // Create drag elements
        dragCards.forEach((c, i) => {
            const el = State.cardElements.get(c.id);
            el.classList.add('dragging');
            State.dragState.elements.push(el);
        });
        
        highlightValidDestinations(card);
        playSound('pickup');
    }
    
    function handleDragMove(e) {
        if (!State.dragState) return;
        
        e.preventDefault();
        
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        
        const dx = x - State.dragState.startX;
        const dy = y - State.dragState.startY;
        
        State.dragState.elements.forEach((el, i) => {
            el.style.transform = `translate(${dx}px, ${dy + i * 20}px)`;
            el.style.zIndex = 1000 + i;
        });
    }
    
    function handleDragEnd(e) {
        if (!State.dragState) return;
        
        const x = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        const y = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
        
        // Find drop target
        State.dragState.elements.forEach(el => {
            el.style.pointerEvents = 'none';
        });
        
        const dropTarget = document.elementFromPoint(x, y);
        
        State.dragState.elements.forEach(el => {
            el.style.pointerEvents = '';
            el.classList.remove('dragging');
            el.style.transform = '';
            el.style.zIndex = '';
        });
        
        clearSelection();
        
        // Try to find valid drop
        if (dropTarget) {
            const slot = dropTarget.closest('.card-slot');
            const cardTarget = dropTarget.closest('.card');
            
            if (slot) {
                const destType = slot.dataset.pile;
                const destIndex = parseInt(slot.dataset.index) || 0;
                
                let destPile;
                if (destType === 'foundation') {
                    destPile = State.foundations[destIndex];
                } else if (destType === 'tableau') {
                    destPile = State.tableau[destIndex];
                }
                
                if (destPile) {
                    moveCard(
                        State.dragState.card,
                        State.dragState.pile,
                        State.dragState.type,
                        State.dragState.index,
                        destPile,
                        destType,
                        destIndex
                    );
                }
            } else if (cardTarget) {
                const targetId = parseInt(cardTarget.dataset.cardId);
                const targetCard = State.cards.get(targetId);
                const { pile, type, index } = findCardLocation(targetCard);
                
                moveCard(
                    State.dragState.card,
                    State.dragState.pile,
                    State.dragState.type,
                    State.dragState.index,
                    pile,
                    type,
                    index
                );
            }
        }
        
        State.dragState = null;
        renderAllPiles();
    }
    
    // ========================================================================
    // HINTS
    // ========================================================================
    function showHint() {
        if (State.inputLocked || State.gameWon) return;
        
        clearSelection();
        
        const move = findBestMove();
        
        if (!move) {
            // No moves available
            playSound('invalid');
            return;
        }
        
        // Highlight source and destination
        const sourceEl = State.cardElements.get(move.card.id);
        if (sourceEl) {
            sourceEl.classList.add('hint-source');
        }
        
        if (move.destType === 'foundation') {
            DOM.foundations[move.destIndex].classList.add('valid-destination');
        } else if (move.destType === 'tableau') {
            DOM.tableau[move.destIndex].classList.add('valid-destination');
        }
        
        playSound('pickup');
        
        // Clear hint after duration
        setTimeout(() => {
            sourceEl?.classList.remove('hint-source');
            document.querySelectorAll('.valid-destination').forEach(el => {
                el.classList.remove('valid-destination');
            });
        }, CONFIG.HIGHLIGHT_DURATION);
    }
    
    function findBestMove() {
        // Priority: Foundation moves, then tableau moves, then stock
        
        // Check for foundation moves
        for (let i = 0; i < 7; i++) {
            const pile = State.tableau[i];
            if (pile.length === 0) continue;
            
            const card = pile[pile.length - 1];
            if (!card.faceUp) continue;
            
            const foundIdx = findFoundationForCard(card);
            if (foundIdx !== -1) {
                return { card, destType: 'foundation', destIndex: foundIdx };
            }
        }
        
        // Check waste for foundation
        if (State.waste.length > 0) {
            const card = State.waste[State.waste.length - 1];
            const foundIdx = findFoundationForCard(card);
            if (foundIdx !== -1) {
                return { card, destType: 'foundation', destIndex: foundIdx };
            }
        }
        
        // Check for tableau moves (prefer moves that reveal cards)
        for (let i = 0; i < 7; i++) {
            const pile = State.tableau[i];
            if (pile.length === 0) continue;
            
            // Find first face-up card
            let firstFaceUp = pile.findIndex(c => c.faceUp);
            if (firstFaceUp === -1) continue;
            
            const card = pile[firstFaceUp];
            
            for (let j = 0; j < 7; j++) {
                if (i === j) continue;
                
                if (isValidMove(card, State.tableau[j], 'tableau')) {
                    // Prefer moves that reveal hidden cards
                    if (firstFaceUp > 0 || pile.length === 1) {
                        return { card, destType: 'tableau', destIndex: j };
                    }
                }
            }
        }
        
        // Check waste for tableau moves
        if (State.waste.length > 0) {
            const card = State.waste[State.waste.length - 1];
            
            for (let j = 0; j < 7; j++) {
                if (isValidMove(card, State.tableau[j], 'tableau')) {
                    return { card, destType: 'tableau', destIndex: j };
                }
            }
        }
        
        // Suggest drawing from stock
        if (State.stock.length > 0 || State.waste.length > 0) {
            // Return null to indicate "try drawing"
            return null;
        }
        
        return null;
    }
    
    // ========================================================================
    // AUTO-FINISH
    // ========================================================================
    function checkAutoFinishAvailable() {
        // Auto-finish is available when all hidden cards are revealed
        let allRevealed = true;
        
        for (const pile of State.tableau) {
            for (const card of pile) {
                if (!card.faceUp) {
                    allRevealed = false;
                    break;
                }
            }
            if (!allRevealed) break;
        }
        
        // Also need stock/waste to be empty or all face-up
        if (State.stock.length > 0) {
            allRevealed = false;
        }
        
        DOM.autoFinishBtn.classList.toggle('hidden', !allRevealed || State.gameWon);
    }
    
    function autoFinish() {
        if (State.inputLocked || State.gameWon) return;
        
        State.inputLocked = true;
        
        function moveNext() {
            if (State.gameWon) {
                State.inputLocked = false;
                return;
            }
            
            // Find any card that can go to foundation
            let moved = false;
            
            // Check waste
            if (State.waste.length > 0) {
                const card = State.waste[State.waste.length - 1];
                const destIdx = findFoundationForCard(card);
                if (destIdx !== -1) {
                    State.history = []; // Clear history during auto-finish
                    State.waste.pop();
                    State.foundations[destIdx].push(card);
                    playSound('foundation');
                    renderAllPiles();
                    moved = true;
                }
            }
            
            // Check tableau
            if (!moved) {
                for (let i = 0; i < 7; i++) {
                    const pile = State.tableau[i];
                    if (pile.length === 0) continue;
                    
                    const card = pile[pile.length - 1];
                    const destIdx = findFoundationForCard(card);
                    if (destIdx !== -1) {
                        pile.pop();
                        State.foundations[destIdx].push(card);
                        playSound('foundation');
                        renderAllPiles();
                        moved = true;
                        break;
                    }
                }
            }
            
            checkWinCondition();
            
            if (moved && !State.gameWon) {
                setTimeout(moveNext, CONFIG.AUTO_MOVE_DELAY);
            } else {
                State.inputLocked = false;
                checkAutoFinishAvailable();
            }
        }
        
        moveNext();
    }
    
    // ========================================================================
    // WIN CONDITION
    // ========================================================================
    function checkWinCondition() {
        const totalInFoundations = State.foundations.reduce((sum, f) => sum + f.length, 0);
        
        if (totalInFoundations === 52) {
            handleWin();
        }
    }
    
    function handleWin() {
        State.gameWon = true;
        
        // Stop timer
        if (State.timerInterval) {
            clearInterval(State.timerInterval);
        }
        
        // Update stats
        State.stats.gamesWon++;
        State.stats.currentStreak++;
        
        const elapsed = State.startTime ? Math.floor((Date.now() - State.startTime) / 1000) : 0;
        if (!State.stats.bestTime || elapsed < State.stats.bestTime) {
            State.stats.bestTime = elapsed;
        }
        
        saveStats();
        clearGameState();
        
        // Prepare win modal content
        document.getElementById('win-moves').textContent = State.moves;
        document.getElementById('win-time').textContent = formatTime(elapsed);
        
        playSound('win');
        
        // Trigger the classic bouncing-cards animation, then show modal
        triggerWinAnimation(() => openModal(DOM.winModal));
    }
    
    // ========================================================================
    // WIN ANIMATION — Classic "bouncing cards" (à la Windows Solitaire)
    // ========================================================================
    function triggerWinAnimation(onComplete) {
        // Skip if user prefers reduced motion
        if (State.settings.reducedMotion) {
            setTimeout(onComplete, 400);
            return;
        }
        
        const canvas = document.createElement('canvas');
        canvas.id = 'win-canvas';
        canvas.style.cssText = [
            'position:fixed', 'top:0', 'left:0',
            'width:100%', 'height:100%',
            'z-index:1500', 'pointer-events:none'
        ].join(';');
        document.body.appendChild(canvas);
        
        // Size canvas to viewport in physical pixels for crisp rendering
        const DPR = window.devicePixelRatio || 1;
        const W = canvas.width  = window.innerWidth  * DPR;
        const H = canvas.height = window.innerHeight * DPR;
        const ctx = canvas.getContext('2d');
        ctx.scale(DPR, DPR);
        const VW = window.innerWidth, VH = window.innerHeight;
        
        // Locate the four foundation slots so cards launch from there
        const foundationRects = DOM.foundations.map(el => el.getBoundingClientRect());
        
        // Card display size (CSS px)
        const CW = 56, CH = 78;
        
        const SUITS = [
            { sym: '♠', col: '#1f2937' },
            { sym: '♥', col: '#dc2626' },
            { sym: '♦', col: '#dc2626' },
            { sym: '♣', col: '#1f2937' }
        ];
        
        // Spawn 6 waves of cards (one suit card per foundation, staggered)
        const GRAVITY    = 0.38;
        const BOUNCE_DAMP = 0.72;   // velocity kept on floor bounce
        const FRICTION    = 0.97;
        const TOTAL_FRAMES = 380;   // ≈ 6.3 s at 60 fps
        const MODAL_AFTER  = 380;
        
        const flyingCards = [];
        
        function spawnWave() {
            SUITS.forEach((suit, i) => {
                const rect = foundationRects[i] || foundationRects[0];
                const ox = rect.left + rect.width  / 2 - CW / 2;
                const oy = rect.top  + rect.height / 2 - CH / 2;
                flyingCards.push({
                    x: ox, y: oy,
                    vx: (Math.random() - 0.5) * 10,
                    vy: -(Math.random() * 10 + 7),
                    suit: suit.sym,
                    col:  suit.col,
                    bounces: 0
                });
            });
        }
        
        // Spawn initial wave immediately, then two more after short delays
        spawnWave();
        setTimeout(spawnWave, 700);
        setTimeout(spawnWave, 1400);
        
        // Helper: rounded rect path
        function roundRect(x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
        
        let frame = 0;
        let completeCalled = false;
        
        function animate() {
            ctx.clearRect(0, 0, VW, VH);
            
            flyingCards.forEach(card => {
                // Physics
                card.vy += GRAVITY;
                card.vx *= FRICTION;
                card.x  += card.vx;
                card.y  += card.vy;
                
                // Bounce off floor
                if (card.y + CH >= VH) {
                    card.y  = VH - CH;
                    card.vy = -Math.abs(card.vy) * BOUNCE_DAMP;
                    card.vx *= 0.85;
                    card.bounces++;
                }
                // Bounce off walls
                if (card.x < 0)       { card.x = 0;        card.vx =  Math.abs(card.vx); }
                if (card.x + CW > VW) { card.x = VW - CW;  card.vx = -Math.abs(card.vx); }
                
                // Draw card
                ctx.save();
                ctx.shadowColor   = 'rgba(0,0,0,0.35)';
                ctx.shadowBlur    = 6;
                ctx.shadowOffsetY = 3;
                ctx.fillStyle = '#ffffff';
                roundRect(card.x, card.y, CW, CH, 5);
                ctx.fill();
                ctx.shadowColor = 'transparent';
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Large centred suit
                ctx.fillStyle   = card.col;
                ctx.font        = 'bold 28px Arial, sans-serif';
                ctx.textAlign   = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(card.suit, card.x + CW / 2, card.y + CH / 2);
                
                // Small corner suit
                ctx.font        = '11px Arial, sans-serif';
                ctx.textAlign   = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(card.suit, card.x + 4, card.y + 4);
                
                ctx.restore();
            });
            
            frame++;
            
            // Fade the canvas out in the last 50 frames
            if (frame > TOTAL_FRAMES - 50) {
                const alpha = (TOTAL_FRAMES - frame) / 50;
                ctx.globalAlpha = 1 - alpha;
            }
            
            if (frame < TOTAL_FRAMES) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
                if (!completeCalled) {
                    completeCalled = true;
                    onComplete?.();
                }
            }
        }
        
        requestAnimationFrame(animate);
        
        // Allow clicking anywhere to skip to modal immediately
        const skipHandler = () => {
            if (!completeCalled) {
                completeCalled = true;
                canvas.remove();
                onComplete?.();
            }
            document.removeEventListener('pointerdown', skipHandler);
        };
        // Small delay so the first click that caused the win doesn't skip it
        setTimeout(() => document.addEventListener('pointerdown', skipHandler, { once: true }), 800);
    }
    
    // ========================================================================
    // UNDO
    // ========================================================================
    function saveHistory() {
        const snapshot = {
            stock: State.stock.map(c => c.id),
            waste: State.waste.map(c => c.id),
            foundations: State.foundations.map(f => f.map(c => c.id)),
            tableau: State.tableau.map(t => t.map(c => ({ id: c.id, faceUp: c.faceUp }))),
            moves: State.moves
        };
        
        State.history.push(snapshot);
        
        // Limit history size
        if (State.history.length > 100) {
            State.history.shift();
        }
        
        updateUndoButton();
    }
    
    function undo() {
        if (State.history.length === 0 || State.inputLocked || State.gameWon) return;
        
        const snapshot = State.history.pop();
        
        // Restore state
        State.stock = snapshot.stock.map(id => State.cards.get(id));
        State.stock.forEach(c => c.faceUp = false);
        
        State.waste = snapshot.waste.map(id => {
            const c = State.cards.get(id);
            c.faceUp = true;
            return c;
        });
        
        State.foundations = snapshot.foundations.map(f => 
            f.map(id => {
                const c = State.cards.get(id);
                c.faceUp = true;
                return c;
            })
        );
        
        State.tableau = snapshot.tableau.map(t =>
            t.map(({ id, faceUp }) => {
                const c = State.cards.get(id);
                c.faceUp = faceUp;
                return c;
            })
        );
        
        State.moves = snapshot.moves;
        
        clearSelection();
        renderAllPiles();
        updateUI();
        updateUndoButton();
        playSound('place');
        
        saveGameState();
    }
    
    function updateUndoButton() {
        DOM.undoBtn.disabled = State.history.length === 0;
    }
    
    // ========================================================================
    // TIMER & STATS
    // ========================================================================
    function startTimerIfNeeded() {
        if (!State.gameStarted) {
            State.gameStarted = true;
            State.startTime = Date.now();
            
            State.timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - State.startTime) / 1000);
                DOM.timeDisplay.textContent = formatTime(elapsed);
            }, 1000);
        }
    }
    
    function incrementMoves() {
        State.moves++;
        updateUI();
    }
    
    function updateUI() {
        DOM.movesDisplay.textContent = State.moves;
        updateUndoButton();
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // ========================================================================
    // AUDIO
    // ========================================================================
    function initAudio() {
        if (State.audioInitialized) return;
        
        try {
            State.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            State.audioInitialized = true;
            DOM.soundBanner.classList.add('hidden');
        } catch (e) {
            console.warn('Web Audio not available');
        }
    }
    
    function playSound(type) {
        if (!State.settings.soundEnabled || !State.audioContext) return;
        
        const ctx = State.audioContext;
        const vol = State.settings.volume;
        const now = ctx.currentTime;
        
        try {
            switch (type) {
                case 'pickup':
                    playSingleTone(ctx, CONFIG.PICKUP_FREQ, 0.08, vol * 0.3, 'sine');
                    break;
                    
                case 'place':
                    playSingleTone(ctx, CONFIG.PLACE_FREQ, 0.12, vol * 0.4, 'triangle');
                    break;
                    
                case 'invalid':
                    playSingleTone(ctx, CONFIG.INVALID_FREQ, 0.15, vol * 0.3, 'triangle');
                    break;
                    
                case 'foundation':
                    CONFIG.FOUNDATION_FREQ.forEach((freq, i) => {
                        playSingleTone(ctx, freq, 0.2, vol * 0.25, 'sine', i * 0.08);
                    });
                    break;
                    
                case 'win':
                    CONFIG.WIN_CHORD.forEach((freq, i) => {
                        playSingleTone(ctx, freq, 0.5, vol * 0.2, 'sine', i * 0.15);
                    });
                    // Add a nice arpeggio
                    const arpeggio = [523, 659, 784, 1047, 784, 659, 523];
                    arpeggio.forEach((freq, i) => {
                        playSingleTone(ctx, freq, 0.3, vol * 0.15, 'sine', 0.8 + i * 0.12);
                    });
                    break;
            }
        } catch (e) {
            // Audio error - silently ignore
        }
    }
    
    function playSingleTone(ctx, freq, duration, volume, waveType, delay = 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
    }
    
    // ========================================================================
    // PERSISTENCE
    // ========================================================================
    function loadSettings() {
        try {
            const saved = localStorage.getItem('solitaire_settings');
            if (saved) {
                State.settings = { ...State.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings');
        }
    }
    
    function saveSettings() {
        try {
            localStorage.setItem('solitaire_settings', JSON.stringify(State.settings));
        } catch (e) {
            console.warn('Failed to save settings');
        }
    }
    
    function loadStats() {
        try {
            const saved = localStorage.getItem('solitaire_stats');
            if (saved) {
                State.stats = { ...State.stats, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load stats');
        }
    }
    
    function saveStats() {
        try {
            localStorage.setItem('calmSolitaire_stats', JSON.stringify(State.stats));
        } catch (e) {
            console.warn('Failed to save stats');
        }
    }
    
    function loadGameState() {
        try {
            const saved = localStorage.getItem('calmSolitaire_game');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }
    
    function saveGameState() {
        if (State.gameWon) return;
        
        try {
            const gameState = {
                stock: State.stock.map(c => ({ ...c })),
                waste: State.waste.map(c => ({ ...c })),
                foundations: State.foundations.map(f => f.map(c => ({ ...c }))),
                tableau: State.tableau.map(t => t.map(c => ({ ...c }))),
                moves: State.moves,
                startTime: State.startTime,
                elapsed: State.startTime ? Date.now() - State.startTime : 0
            };
            localStorage.setItem('calmSolitaire_game', JSON.stringify(gameState));
        } catch (e) {
            console.warn('Failed to save game state');
        }
    }
    
    function clearGameState() {
        try {
            localStorage.removeItem('calmSolitaire_game');
        } catch (e) {}
    }
    
    function restoreGameState(savedGame) {
        State.cards.clear();
        State.cardElements.forEach(el => el.remove());
        State.cardElements.clear();
        
        // Restore cards
        const restoreCards = (arr) => arr.map(c => {
            State.cards.set(c.id, c);
            const el = Cards.createCardElement(c);
            State.cardElements.set(c.id, el);
            return c;
        });
        
        State.stock = restoreCards(savedGame.stock);
        State.waste = restoreCards(savedGame.waste);
        State.foundations = savedGame.foundations.map(f => restoreCards(f));
        State.tableau = savedGame.tableau.map(t => restoreCards(t));
        State.moves = savedGame.moves;
        State.history = [];
        State.gameWon = false;
        State.gameStarted = savedGame.elapsed > 0;
        
        if (State.gameStarted) {
            State.startTime = Date.now() - savedGame.elapsed;
            State.timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - State.startTime) / 1000);
                DOM.timeDisplay.textContent = formatTime(elapsed);
            }, 1000);
        }
        
        renderAllPiles();
        updateUI();
        checkAutoFinishAvailable();
        closeAllModals();
    }
    
    // ========================================================================
    // SETTINGS UI
    // ========================================================================
    function applySettings() {
        document.body.classList.toggle('reduced-motion', State.settings.reducedMotion);
        
        // Update settings UI
        document.getElementById('draw-1').classList.toggle('active', State.settings.drawCount === 1);
        document.getElementById('draw-3').classList.toggle('active', State.settings.drawCount === 3);
        document.getElementById('toggle-tap').classList.toggle('active', State.settings.tapMode);
        document.getElementById('toggle-auto').classList.toggle('active', State.settings.autoFoundation);
        document.getElementById('toggle-easy').classList.toggle('active', State.settings.easyMode);
        document.getElementById('toggle-sound').classList.toggle('active', State.settings.soundEnabled);
        document.getElementById('toggle-motion').classList.toggle('active', State.settings.reducedMotion);
        document.getElementById('volume-slider').value = State.settings.volume * 100;
        
        // Check system preference for reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !State.settings.reducedMotion) {
            State.settings.reducedMotion = true;
            document.body.classList.add('reduced-motion');
        }
    }
    
    function updateStatsDisplay() {
        document.getElementById('stat-played').textContent = State.stats.gamesPlayed;
        document.getElementById('stat-won').textContent = State.stats.gamesWon;
        
        const pct = State.stats.gamesPlayed > 0 
            ? Math.round((State.stats.gamesWon / State.stats.gamesPlayed) * 100) 
            : 0;
        document.getElementById('stat-percent').textContent = `${pct}%`;
        
        document.getElementById('stat-best').textContent = State.stats.bestTime 
            ? formatTime(State.stats.bestTime) 
            : '--:--';
        document.getElementById('stat-streak').textContent = State.stats.currentStreak;
    }
    
    // ========================================================================
    // MODALS
    // ========================================================================
    function openModal(modal) {
        modal.classList.add('active');
    }
    
    function closeModal(modal) {
        modal.classList.remove('active');
    }
    
    function closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }
    
    function showConfirm(title, text, okText, onOk, onCancel, cancelText = 'Cancel') {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-text').textContent = text;
        document.getElementById('confirm-ok').textContent = okText;
        document.getElementById('confirm-cancel').textContent = cancelText;
        
        const confirmOk = document.getElementById('confirm-ok');
        const confirmCancel = document.getElementById('confirm-cancel');
        
        const handleOk = () => {
            closeModal(DOM.confirmModal);
            confirmOk.removeEventListener('click', handleOk);
            confirmCancel.removeEventListener('click', handleCancel);
            onOk?.();
        };
        
        const handleCancel = () => {
            closeModal(DOM.confirmModal);
            confirmOk.removeEventListener('click', handleOk);
            confirmCancel.removeEventListener('click', handleCancel);
            onCancel?.();
        };
        
        confirmOk.addEventListener('click', handleOk);
        confirmCancel.addEventListener('click', handleCancel);
        
        openModal(DOM.confirmModal);
    }
    
    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================
    function setupEventListeners() {
        // Enable audio on first interaction
        document.addEventListener('pointerdown', () => initAudio(), { once: true });
        document.addEventListener('keydown', () => initAudio(), { once: true });
        
        DOM.soundBanner.addEventListener('click', () => {
            initAudio();
            playSound('pickup');
        });
        
        // Card interactions
        
        // --- Mouse double-click: send card straight to foundation ---
        // Use native 'dblclick' so the browser handles the timing reliably.
        // We prevent the default to stop text selection on fast clicks.
        DOM.gameArea.addEventListener('dblclick', (e) => {
            e.preventDefault();
            const cardEl = e.target.closest('.card');
            if (!cardEl || cardEl.classList.contains('face-down')) return;
            const cardId = parseInt(cardEl.dataset.cardId);
            sendCardToFoundation(State.cards.get(cardId));
        });
        
        // --- Touch double-tap: manual timing check (touch fires no dblclick) ---
        let _lastTapTime = 0;
        let _lastTapCardId = null;

        // Also suppress the second mouse down of a double-click so it doesn't
        // clear the selection/highlights before the dblclick event fires.
        let _lastMouseDownTime = 0;
        let _lastMouseCardId = null;
        
        DOM.gameArea.addEventListener('pointerdown', (e) => {
            const cardEl = e.target.closest('.card');
            const slotEl = e.target.closest('.card-slot');
            
            if (cardEl && !cardEl.classList.contains('face-down')) {
                // Mouse double-click suppression: keep selection/highlights stable
                if (e.pointerType === 'mouse') {
                    const now = Date.now();
                    const sameCard = _lastMouseCardId === cardEl.dataset.cardId;
                    const quick = (now - _lastMouseDownTime) < 350;
                    _lastMouseDownTime = now;
                    _lastMouseCardId = cardEl.dataset.cardId;
                    if (sameCard && quick) {
                        return;
                    }
                }

                // Touch double-tap detection
                if (e.pointerType === 'touch') {
                    const now = Date.now();
                    const sameCard = _lastTapCardId === cardEl.dataset.cardId;
                    const quickTap  = (now - _lastTapTime) < 350;
                    if (sameCard && quickTap) {
                        // This is the second tap — send to foundation
                        e.preventDefault();
                        _lastTapTime  = 0;   // reset so a third tap doesn't retrigger
                        _lastTapCardId = null;
                        const cardId = parseInt(cardEl.dataset.cardId);
                        sendCardToFoundation(State.cards.get(cardId));
                        return;
                    }
                    _lastTapTime  = now;
                    _lastTapCardId = cardEl.dataset.cardId;
                }
                
                if (State.settings.tapMode) {
                    handleCardClick(cardEl, e);
                } else {
                    handleDragStart(cardEl, e);
                }
            } else if (slotEl) {
                handleSlotClick(slotEl);
            }
        });
        
        // Drag support (always enabled for non-tap mode)
        document.addEventListener('pointermove', handleDragMove);
        document.addEventListener('pointerup', handleDragEnd);
        document.addEventListener('pointercancel', handleDragEnd);
        
        // Touch events for drag
        DOM.gameArea.addEventListener('touchstart', (e) => {
            const cardEl = e.target.closest('.card');
            if (cardEl && !cardEl.classList.contains('face-down') && !State.settings.tapMode) {
                handleDragStart(cardEl, e);
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (State.dragState) {
                e.preventDefault();
                handleDragMove(e);
            }
        }, { passive: false });
        
        document.addEventListener('touchend', handleDragEnd);
        
        // Top bar buttons
        DOM.undoBtn.addEventListener('click', undo);
        DOM.hintBtn.addEventListener('click', showHint);
        DOM.helpBtn.addEventListener('click', () => openModal(DOM.helpModal));
        DOM.settingsBtn.addEventListener('click', () => {
            applySettings();
            openModal(DOM.settingsModal);
        });
        
        // Bottom bar
        DOM.newGameBtn.addEventListener('click', () => {
            if (State.gameStarted && !State.gameWon) {
                showConfirm(
                    'New Game?',
                    'Start a new game? Current progress will be lost.',
                    'Start New Game',
                    () => {
                        clearGameState();
                        startNewGame();
                    }
                );
            } else {
                clearGameState();
                startNewGame();
            }
        });
        
        DOM.autoFinishBtn.addEventListener('click', autoFinish);
        
        // Modal closes
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                closeModal(modal);
            });
        });
        
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });
        
        // Settings toggles
        document.getElementById('draw-1').addEventListener('click', () => {
            State.settings.drawCount = 1;
            saveSettings();
            applySettings();
        });
        
        document.getElementById('draw-3').addEventListener('click', () => {
            State.settings.drawCount = 3;
            saveSettings();
            applySettings();
        });
        
        document.getElementById('toggle-tap').addEventListener('click', () => {
            State.settings.tapMode = !State.settings.tapMode;
            saveSettings();
            applySettings();
        });
        
        document.getElementById('toggle-auto').addEventListener('click', () => {
            State.settings.autoFoundation = !State.settings.autoFoundation;
            saveSettings();
            applySettings();
        });
        
        document.getElementById('toggle-easy').addEventListener('click', () => {
            State.settings.easyMode = !State.settings.easyMode;
            saveSettings();
            applySettings();
        });
        
        document.getElementById('toggle-sound').addEventListener('click', () => {
            State.settings.soundEnabled = !State.settings.soundEnabled;
            saveSettings();
            applySettings();
            if (State.settings.soundEnabled) playSound('pickup');
        });
        
        document.getElementById('toggle-motion').addEventListener('click', () => {
            State.settings.reducedMotion = !State.settings.reducedMotion;
            saveSettings();
            applySettings();
        });
        
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            State.settings.volume = e.target.value / 100;
            saveSettings();
        });
        
        // Stats
        document.getElementById('stats-btn').addEventListener('click', () => {
            closeModal(DOM.settingsModal);
            updateStatsDisplay();
            openModal(DOM.statsModal);
        });
        
        document.getElementById('reset-stats-btn').addEventListener('click', () => {
            showConfirm(
                'Reset Stats?',
                'This will permanently delete all your statistics.',
                'Reset',
                () => {
                    State.stats = {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        bestTime: null,
                        currentStreak: 0
                    };
                    saveStats();
                    updateStatsDisplay();
                }
            );
        });
        
        // Win modal
        document.getElementById('win-new-game').addEventListener('click', () => {
            closeModal(DOM.winModal);
            startNewGame();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
                showHint();
            } else if (e.key === 'Escape') {
                closeAllModals();
                clearSelection();
            }
        });
    }
    
    // ========================================================================
    // START
    // ========================================================================
    document.addEventListener('DOMContentLoaded', init);
})();
