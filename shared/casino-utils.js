/**
 * AlzBetter Games - Shared Casino Utilities
 * Common JavaScript functions for all games
 */

/* ============================================================================
   SOUND MANAGER
   ============================================================================ */
const SoundManager = {
    enabled: false,
    volume: 0.7,
    sounds: {},

    init(soundConfig = {}) {
        // Load sound preference from localStorage (sound on by default)
        const saved = localStorage.getItem('casino-sound-enabled');
        this.enabled = saved !== null ? saved === 'true' : true;
        
        const savedVolume = localStorage.getItem('casino-sound-volume');
        this.volume = savedVolume !== null ? parseFloat(savedVolume) : 0.7;

        // Pre-load sounds
        Object.entries(soundConfig).forEach(([name, url]) => {
            this.sounds[name] = new Audio(url);
            this.sounds[name].volume = this.volume;
        });

        return this;
    },

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('casino-sound-enabled', this.enabled);
        return this.enabled;
    },

    setEnabled(value) {
        this.enabled = value;
        localStorage.setItem('casino-sound-enabled', value);
    },

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        localStorage.setItem('casino-sound-volume', this.volume);
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    },

    play(name) {
        if (!this.enabled || !this.sounds[name]) return;
        
        const sound = this.sounds[name];
        sound.currentTime = 0;
        sound.play().catch(() => {
            // Ignore autoplay errors
        });
    },

    playWin() {
        this.play('win');
    },

    playLose() {
        this.play('lose');
    },

    playClick() {
        this.play('click');
    },

    playCard() {
        this.play('card');
    },

    playSpin() {
        this.play('spin');
    },

    playChip() {
        this.play('chip');
    }
};

/* ============================================================================
   MODAL MANAGER
   ============================================================================ */
const ModalManager = {
    activeModal: null,

    open(modalId) {
        const overlay = document.getElementById(modalId);
        if (!overlay) return;
        
        overlay.classList.add('active');
        this.activeModal = overlay;
        
        // Trap focus
        const modal = overlay.querySelector('.modal');
        const focusable = modal?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable?.length) {
            focusable[0].focus();
        }
        
        // Close on escape
        document.addEventListener('keydown', this._handleEscape);
        
        // Close on overlay click
        overlay.addEventListener('click', this._handleOverlayClick);
    },

    close() {
        if (!this.activeModal) return;
        
        this.activeModal.classList.remove('active');
        document.removeEventListener('keydown', this._handleEscape);
        this.activeModal.removeEventListener('click', this._handleOverlayClick);
        this.activeModal = null;
    },

    _handleEscape(e) {
        if (e.key === 'Escape') {
            ModalManager.close();
        }
    },

    _handleOverlayClick(e) {
        if (e.target.classList.contains('modal-overlay')) {
            ModalManager.close();
        }
    }
};

/* ============================================================================
   CONFETTI EFFECT
   ============================================================================ */
function createConfetti(container, count = 50) {
    const colors = ['#d4a853', '#e9c67e', '#f472b6', '#60a5fa', '#34d399', '#f97316', '#a78bfa'];
    
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (2 + Math.random()) + 's';
        container.appendChild(confetti);
    }
    
    // Clean up after animation
    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

function showWinCelebration() {
    const container = document.querySelector('.win-celebration');
    if (!container) return;
    
    container.classList.remove('hidden');
    createConfetti(container);
    
    setTimeout(() => {
        container.classList.add('hidden');
    }, 3500);
}

/* ============================================================================
   COINS/CHIPS STORAGE
   ============================================================================ */
const ChipManager = {
    storageKey: 'casino-chips',
    defaultChips: 1000,

    get() {
        const saved = localStorage.getItem(this.storageKey);
        return saved !== null ? parseInt(saved, 10) : this.defaultChips;
    },

    set(amount) {
        localStorage.setItem(this.storageKey, Math.max(0, amount));
        return this.get();
    },

    add(amount) {
        return this.set(this.get() + amount);
    },

    subtract(amount) {
        return this.set(this.get() - amount);
    },

    reset() {
        localStorage.removeItem(this.storageKey);
        return this.defaultChips;
    },

    canAfford(amount) {
        return this.get() >= amount;
    }
};

/* ============================================================================
   WIN RATE ADJUSTMENT (65% player favor)
   ============================================================================ */
function shouldPlayerWin(baseWinRate = 0.65) {
    return Math.random() < baseWinRate;
}

// Adjust outcome probabilities to favor the player
function adjustedRandom(favorableOutcomes, allOutcomes, targetWinRate = 0.65) {
    // If random favors player, pick from favorable outcomes
    if (shouldPlayerWin(targetWinRate) && favorableOutcomes.length > 0) {
        return favorableOutcomes[Math.floor(Math.random() * favorableOutcomes.length)];
    }
    // Otherwise pick from all outcomes
    return allOutcomes[Math.floor(Math.random() * allOutcomes.length)];
}

/* ============================================================================
   FORMAT HELPERS
   ============================================================================ */
function formatChips(amount) {
    return amount.toLocaleString();
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/* ============================================================================
   LOCAL STORAGE HELPERS
   ============================================================================ */
function saveGameState(gameId, state) {
    localStorage.setItem(`casino-${gameId}-state`, JSON.stringify(state));
}

function loadGameState(gameId, defaultState = {}) {
    try {
        const saved = localStorage.getItem(`casino-${gameId}-state`);
        return saved ? JSON.parse(saved) : defaultState;
    } catch {
        return defaultState;
    }
}

function clearGameState(gameId) {
    localStorage.removeItem(`casino-${gameId}-state`);
}

/* ============================================================================
   ANIMATION HELPERS
   ============================================================================ */
function animateValue(element, start, end, duration = 500) {
    const startTime = performance.now();
    const diff = end - start;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + diff * eased);
        
        element.textContent = formatChips(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/* ============================================================================
   DECK UTILITIES (for card games)
   ============================================================================ */
const DeckUtils = {
    suits: ['♠', '♥', '♦', '♣'],
    values: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],

    createDeck(numDecks = 1) {
        const deck = [];
        for (let d = 0; d < numDecks; d++) {
            for (const suit of this.suits) {
                for (const value of this.values) {
                    deck.push({ suit, value, color: ['♥', '♦'].includes(suit) ? 'red' : 'black' });
                }
            }
        }
        return deck;
    },

    shuffle(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    dealCards(deck, count) {
        return deck.splice(0, count);
    },

    getCardValue(card, aceHigh = true) {
        const val = card.value;
        if (val === 'A') return aceHigh ? 11 : 1;
        if (['K', 'Q', 'J'].includes(val)) return 10;
        return parseInt(val, 10);
    }
};

/* ============================================================================
   HAPTIC FEEDBACK (for touch devices)
   ============================================================================ */
function vibrate(pattern = 10) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

/* ============================================================================
   EXPORTS (for module usage)
   ============================================================================ */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SoundManager,
        ModalManager,
        ChipManager,
        DeckUtils,
        createConfetti,
        showWinCelebration,
        shouldPlayerWin,
        adjustedRandom,
        formatChips,
        formatNumber,
        saveGameState,
        loadGameState,
        clearGameState,
        animateValue,
        vibrate
    };
}
