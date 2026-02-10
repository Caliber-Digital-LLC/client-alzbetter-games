/**
 * Lucky Slots - Game Logic
 * AlzBetter Games
 */

// ============================================================================
// GAME CONFIGURATION
// ============================================================================
const SYMBOLS = ['star', 'heart', 'horseshoe', 'bell', 'seven', 'cherry', 'clover', 'diamond', 'bar'];

// Weighted reel strip - varied symbols
const REEL_STRIP = [
    'star', 'cherry', 'heart', 'clover', 'horseshoe',
    'bell', 'star', 'heart', 'seven', 'diamond',
    'heart', 'cherry', 'horseshoe', 'bell', 'star',
    'clover', 'heart', 'bell', 'horseshoe', 'seven',
    'cherry', 'star', 'bar', 'diamond', 'clover',
    'heart', 'bell', 'cherry', 'star', 'horseshoe',
];

const SPIN_DURATIONS = [900, 1200, 1500];
const INITIAL_CREDITS = 100;
const BET_OPTIONS = [1, 3, 5];

// ============================================================================
// SYMBOL SVGs
// ============================================================================
const SYMBOL_SVGS = {
    star: `<svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFD700"/>
                <stop offset="100%" stop-color="#FFA500"/>
            </linearGradient>
        </defs>
        <path d="M50 10 L61 39 L92 39 L67 58 L78 90 L50 71 L22 90 L33 58 L8 39 L39 39 Z"
              fill="url(#starGrad)" stroke="#DAA520" stroke-width="2"/>
    </svg>`,
    
    heart: `<svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FF6B8A"/>
                <stop offset="100%" stop-color="#E91E63"/>
            </linearGradient>
        </defs>
        <path d="M50 88 C20 60, 10 40, 25 25 C35 15, 50 20, 50 35 C50 20, 65 15, 75 25 C90 40, 80 60, 50 88 Z"
              fill="url(#heartGrad)" stroke="#C2185B" stroke-width="2"/>
    </svg>`,
    
    horseshoe: `<svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8B7355"/>
                <stop offset="50%" stop-color="#DAA520"/>
                <stop offset="100%" stop-color="#8B7355"/>
            </linearGradient>
        </defs>
        <path d="M20 85 L20 40 C20 20, 35 10, 50 10 C65 10, 80 20, 80 40 L80 85 L68 85 L68 42 C68 28, 60 22, 50 22 C40 22, 32 28, 32 42 L32 85 Z"
              fill="url(#shoeGrad)" stroke="#8B4513" stroke-width="2"/>
        <circle cx="26" cy="50" r="4" fill="#FFD700"/>
        <circle cx="74" cy="50" r="4" fill="#FFD700"/>
        <circle cx="26" cy="65" r="4" fill="#FFD700"/>
        <circle cx="74" cy="65" r="4" fill="#FFD700"/>
    </svg>`,
    
    bell: `<svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFD700"/>
                <stop offset="50%" stop-color="#FFC107"/>
                <stop offset="100%" stop-color="#FF9800"/>
            </linearGradient>
        </defs>
        <path d="M50 10 C50 10, 55 10, 55 18 C70 22, 80 35, 80 55 L80 70 L85 75 L85 80 L15 80 L15 75 L20 70 L20 55 C20 35, 30 22, 45 18 C45 10, 50 10, 50 10 Z"
              fill="url(#bellGrad)" stroke="#E65100" stroke-width="2"/>
        <ellipse cx="50" cy="88" rx="10" ry="6" fill="#FFD700" stroke="#E65100" stroke-width="1.5"/>
    </svg>`,
    
    seven: `<svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="sevenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#7B68EE"/>
                <stop offset="50%" stop-color="#9370DB"/>
                <stop offset="100%" stop-color="#6A5ACD"/>
            </linearGradient>
        </defs>
        <text x="50" y="75" text-anchor="middle" font-size="70" font-weight="bold" font-family="Georgia, serif"
              fill="url(#sevenGrad)" stroke="#4B0082" stroke-width="2">7</text>
    </svg>`,
    
    cherry: `<svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="cherryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FF4444"/>
                <stop offset="100%" stop-color="#CC0000"/>
            </linearGradient>
        </defs>
        <path d="M50 15 Q60 5, 70 15 Q80 30, 70 35" fill="none" stroke="#228B22" stroke-width="3"/>
        <ellipse cx="35" cy="65" rx="20" ry="22" fill="url(#cherryGrad)" stroke="#990000" stroke-width="2"/>
        <ellipse cx="65" cy="60" rx="20" ry="22" fill="url(#cherryGrad)" stroke="#990000" stroke-width="2"/>
        <ellipse cx="30" cy="58" rx="6" ry="4" fill="rgba(255,255,255,0.4)"/>
        <ellipse cx="60" cy="53" rx="6" ry="4" fill="rgba(255,255,255,0.4)"/>
        <path d="M35 43 Q45 25, 55 15" fill="none" stroke="#228B22" stroke-width="3"/>
        <path d="M65 38 Q60 20, 55 15" fill="none" stroke="#228B22" stroke-width="3"/>
        <ellipse cx="57" cy="12" rx="8" ry="5" fill="#228B22"/>
    </svg>`,
    
    clover: `<svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="cloverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#32CD32"/>
                <stop offset="100%" stop-color="#228B22"/>
            </linearGradient>
        </defs>
        <ellipse cx="50" cy="30" rx="18" ry="20" fill="url(#cloverGrad)" stroke="#006400" stroke-width="2"/>
        <ellipse cx="30" cy="50" rx="18" ry="20" fill="url(#cloverGrad)" stroke="#006400" stroke-width="2"/>
        <ellipse cx="70" cy="50" rx="18" ry="20" fill="url(#cloverGrad)" stroke="#006400" stroke-width="2"/>
        <ellipse cx="50" cy="70" rx="18" ry="20" fill="url(#cloverGrad)" stroke="#006400" stroke-width="2"/>
        <rect x="47" y="70" width="6" height="25" fill="#8B4513" rx="2"/>
    </svg>`,
    
    diamond: `<svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#87CEEB"/>
                <stop offset="30%" stop-color="#00BFFF"/>
                <stop offset="60%" stop-color="#E0FFFF"/>
                <stop offset="100%" stop-color="#00CED1"/>
            </linearGradient>
        </defs>
        <polygon points="50,10 85,40 50,90 15,40" fill="url(#diamondGrad)" stroke="#4169E1" stroke-width="2"/>
        <polygon points="50,10 65,40 50,35 35,40" fill="rgba(255,255,255,0.4)"/>
        <line x1="35" y1="40" x2="65" y2="40" stroke="#4169E1" stroke-width="1"/>
        <line x1="50" y1="10" x2="35" y2="40" stroke="#4169E1" stroke-width="1"/>
        <line x1="50" y1="10" x2="65" y2="40" stroke="#4169E1" stroke-width="1"/>
        <line x1="35" y1="40" x2="50" y2="90" stroke="#4169E1" stroke-width="1"/>
        <line x1="65" y1="40" x2="50" y2="90" stroke="#4169E1" stroke-width="1"/>
    </svg>`,
    
    bar: `<svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#C0C0C0"/>
                <stop offset="50%" stop-color="#808080"/>
                <stop offset="100%" stop-color="#404040"/>
            </linearGradient>
        </defs>
        <rect x="10" y="30" width="80" height="40" rx="5" fill="url(#barGrad)" stroke="#333" stroke-width="2"/>
        <text x="50" y="58" text-anchor="middle" font-size="24" font-weight="bold" font-family="Arial Black, sans-serif"
              fill="#FFD700" stroke="#8B4513" stroke-width="1">BAR</text>
    </svg>`
};

// ============================================================================
// AUDIO MANAGER
// ============================================================================
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.muted = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('WebAudio not supported');
        }
    }

    setMuted(muted) {
        this.muted = muted;
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext || this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playSpinStart() {
        if (!this.audioContext || this.muted) return;
        
        const noise = this.audioContext.createBufferSource();
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
        }
        
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        noise.start();
    }

    playReelStop() {
        this.playTone(600, 0.08, 'sine', 0.15);
    }

    playWin() {
        const notes = [523, 659, 784]; // C5, E5, G5 triad
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.25), i * 150);
        });
    }

    playBigWin() {
        const notes = [523, 659, 784, 1047, 784, 1047]; // Ascending arpeggio
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.4, 'sine', 0.25), i * 180);
        });
    }
}

// ============================================================================
// GAME STATE
// ============================================================================
const game = {
    credits: INITIAL_CREDITS,
    bet: 1,
    spinning: false,
    reels: [
        { symbols: [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]], position: 0 },
        { symbols: [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]], position: 0 },
        { symbols: [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]], position: 0 }
    ],
    audio: new AudioManager(),
    soundEnabled: true
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================
let elements = {};

function initElements() {
    elements = {
        credits: document.getElementById('credits'),
        winAmount: document.getElementById('winAmount'),
        statusMessage: document.getElementById('statusMessage'),
        spinBtn: document.getElementById('spinBtn'),
        leverBtn: document.getElementById('leverBtn'),
        leverArm: document.getElementById('leverArm'),
        betOptions: document.getElementById('betOptions'),
        soundBtn: document.getElementById('soundBtn'),
        helpBtn: document.getElementById('helpBtn'),
        helpModal: document.getElementById('helpModal'),
        closeHelpBtn: document.getElementById('closeHelpBtn'),
        gotItBtn: document.getElementById('gotItBtn'),
        gameOverOverlay: document.getElementById('gameOverOverlay'),
        resetBtn: document.getElementById('resetBtn'),
        jackpotOverlay: document.getElementById('jackpotOverlay'),
        jackpotAmount: document.getElementById('jackpotAmount'),
        winCelebration: document.getElementById('winCelebration'),
        confettiContainer: document.getElementById('confettiContainer'),
        slotCabinet: document.querySelector('.slot-cabinet'),
        reelElements: [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ]
    };
}

// ============================================================================
// REEL RENDERING
// ============================================================================
function renderReelSymbols(reelElement, symbols) {
    const strip = reelElement.querySelector('.reel-strip');
    strip.innerHTML = '';
    
    symbols.forEach((symbol, idx) => {
        const symbolEl = document.createElement('div');
        symbolEl.className = 'symbol';
        if (idx !== 1) symbolEl.classList.add('dimmed');
        symbolEl.innerHTML = SYMBOL_SVGS[symbol];
        strip.appendChild(symbolEl);
    });
}

function updateReels() {
    game.reels.forEach((reel, idx) => {
        renderReelSymbols(elements.reelElements[idx], reel.symbols);
    });
}

// ============================================================================
// WIN EVALUATION
// ============================================================================
function evaluateWin(finalReels, currentBet) {
    const middleRow = finalReels.map(r => r[1]);
    const topRow = finalReels.map(r => r[0]);
    const bottomRow = finalReels.map(r => r[2]);
    
    // Three 7s - JACKPOT! (50x bet)
    if (middleRow[0] === 'seven' && middleRow[1] === 'seven' && middleRow[2] === 'seven') {
        return { type: 'jackpot', amount: 50 * currentBet };
    }
    
    // Three of a kind on middle row (10x bet)
    if (middleRow[0] === middleRow[1] && middleRow[1] === middleRow[2]) {
        return { type: 'three', amount: 10 * currentBet };
    }
    
    // Three of a kind on top or bottom row (5x bet)
    if (topRow[0] === topRow[1] && topRow[1] === topRow[2]) {
        return { type: 'three', amount: 5 * currentBet };
    }
    if (bottomRow[0] === bottomRow[1] && bottomRow[1] === bottomRow[2]) {
        return { type: 'three', amount: 5 * currentBet };
    }
    
    // Two of a kind on middle row (2x bet)
    if (middleRow[0] === middleRow[1] || middleRow[1] === middleRow[2]) {
        return { type: 'two', amount: 2 * currentBet };
    }
    
    // Two matching at edges (1x bet)
    if (middleRow[0] === middleRow[2]) {
        return { type: 'two', amount: 1 * currentBet };
    }
    
    return { type: 'none', amount: 0 };
}

// Generate final positions with player-favored odds (~55% win rate)
function generateFinalPositions() {
    const positions = [];
    const shouldWin = Math.random() < 0.55; // 55% chance to win
    
    if (shouldWin) {
        // Bias towards winning combinations
        const winType = Math.random();
        
        if (winType < 0.02) {
            // Rare jackpot - three 7s
            const sevenIndex = REEL_STRIP.indexOf('seven');
            positions.push(sevenIndex, sevenIndex, sevenIndex);
        } else if (winType < 0.15) {
            // Three of a kind (common symbol)
            const symbol = ['star', 'heart'][Math.floor(Math.random() * 2)];
            const indices = REEL_STRIP.map((s, i) => s === symbol ? i : -1).filter(i => i >= 0);
            const idx = indices[Math.floor(Math.random() * indices.length)];
            positions.push(idx, idx, idx);
        } else {
            // Two of a kind - most common win
            const symbol = SYMBOLS[Math.floor(Math.random() * (SYMBOLS.length - 1))]; // Exclude seven
            const indices = REEL_STRIP.map((s, i) => s === symbol ? i : -1).filter(i => i >= 0);
            const idx1 = indices[Math.floor(Math.random() * indices.length)];
            const idx2 = indices[Math.floor(Math.random() * indices.length)];
            const idx3 = Math.floor(Math.random() * REEL_STRIP.length);
            
            // Randomly place the pair
            if (Math.random() < 0.5) {
                positions.push(idx1, idx2, idx3);
            } else {
                positions.push(idx3, idx1, idx2);
            }
        }
    } else {
        // Guaranteed losing combination - ensure all 3 middle symbols are different
        let attempts = 0;
        while (attempts < 50) {
            const pos1 = Math.floor(Math.random() * REEL_STRIP.length);
            const pos2 = Math.floor(Math.random() * REEL_STRIP.length);
            const pos3 = Math.floor(Math.random() * REEL_STRIP.length);
            
            const sym1 = REEL_STRIP[pos1];
            const sym2 = REEL_STRIP[pos2];
            const sym3 = REEL_STRIP[pos3];
            
            // Check middle row - all must be different to guarantee loss
            if (sym1 !== sym2 && sym2 !== sym3 && sym1 !== sym3) {
                // Also check top and bottom rows won't accidentally win
                const top1 = REEL_STRIP[(pos1 - 1 + REEL_STRIP.length) % REEL_STRIP.length];
                const top2 = REEL_STRIP[(pos2 - 1 + REEL_STRIP.length) % REEL_STRIP.length];
                const top3 = REEL_STRIP[(pos3 - 1 + REEL_STRIP.length) % REEL_STRIP.length];
                const bot1 = REEL_STRIP[(pos1 + 1) % REEL_STRIP.length];
                const bot2 = REEL_STRIP[(pos2 + 1) % REEL_STRIP.length];
                const bot3 = REEL_STRIP[(pos3 + 1) % REEL_STRIP.length];
                
                const topWin = (top1 === top2 && top2 === top3);
                const botWin = (bot1 === bot2 && bot2 === bot3);
                
                if (!topWin && !botWin) {
                    positions.push(pos1, pos2, pos3);
                    break;
                }
            }
            attempts++;
        }
        
        // Fallback if we can't find a losing combo (shouldn't happen)
        if (positions.length === 0) {
            positions.push(0, 5, 10); // Known different symbols
        }
    }
    
    return positions;
}

// ============================================================================
// SPIN LOGIC
// ============================================================================
function spin() {
    if (game.spinning || game.credits < game.bet) return;
    
    // Initialize audio on first interaction
    if (!game.audio.initialized) {
        game.audio.init();
    }
    
    // Deduct bet
    game.credits -= game.bet;
    updateCredits();
    
    game.spinning = true;
    elements.spinBtn.disabled = true;
    elements.spinBtn.classList.add('spinning');
    elements.leverBtn.disabled = true;
    elements.leverBtn.classList.add('pulled');
    elements.winAmount.textContent = '0';
    elements.statusMessage.textContent = 'Spinning...';
    
    game.audio.playSpinStart();
    
    // Generate final positions
    const finalPositions = generateFinalPositions();
    
    // Start spinning animation
    elements.reelElements.forEach(reel => {
        reel.classList.add('spinning');
        // Add random symbols during spin
        const strip = reel.querySelector('.reel-strip');
        strip.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const symbol = REEL_STRIP[Math.floor(Math.random() * REEL_STRIP.length)];
            const symbolEl = document.createElement('div');
            symbolEl.className = 'symbol';
            symbolEl.innerHTML = SYMBOL_SVGS[symbol];
            strip.appendChild(symbolEl);
        }
    });
    
    // Stop reels one by one
    finalPositions.forEach((pos, reelIdx) => {
        setTimeout(() => {
            const reel = elements.reelElements[reelIdx];
            reel.classList.remove('spinning');
            reel.classList.add('stopping');
            
            // Set final symbols
            const symbolIdx = pos;
            const topIdx = (symbolIdx - 1 + REEL_STRIP.length) % REEL_STRIP.length;
            const bottomIdx = (symbolIdx + 1) % REEL_STRIP.length;
            const finalSymbols = [REEL_STRIP[topIdx], REEL_STRIP[symbolIdx], REEL_STRIP[bottomIdx]];
            
            game.reels[reelIdx].symbols = finalSymbols;
            game.reels[reelIdx].position = pos;
            
            // Render after short delay for animation
            setTimeout(() => {
                reel.classList.remove('stopping');
                renderReelSymbols(reel, finalSymbols);
                game.audio.playReelStop();
            }, 400);
            
            // Evaluate win after last reel
            if (reelIdx === 2) {
                setTimeout(() => {
                    const finalReelSymbols = game.reels.map(r => r.symbols);
                    const result = evaluateWin(finalReelSymbols, game.bet);
                    
                    handleWinResult(result);
                    
                    game.spinning = false;
                    elements.spinBtn.disabled = false;
                    elements.spinBtn.classList.remove('spinning');
                    elements.leverBtn.disabled = false;
                    elements.leverBtn.classList.remove('pulled');
                    
                    // Check game over
                    if (game.credits <= 0) {
                        setTimeout(() => showGameOver(), 500);
                    }
                }, 600);
            }
        }, SPIN_DURATIONS[reelIdx]);
    });
}

function handleWinResult(result) {
    if (result.amount > 0) {
        game.credits += result.amount;
        updateCredits();
        
        elements.winAmount.textContent = result.amount;
        elements.winAmount.classList.add('animating');
        setTimeout(() => elements.winAmount.classList.remove('animating'), 500);
        
        elements.slotCabinet.classList.add('winning');
        setTimeout(() => elements.slotCabinet.classList.remove('winning'), 1000);
        
        if (result.type === 'jackpot') {
            elements.jackpotAmount.textContent = `+${result.amount} Credits!`;
            elements.jackpotOverlay.classList.remove('hidden');
            elements.statusMessage.textContent = `🎰 JACKPOT! +${result.amount} Credits! 🎰`;
            game.audio.playBigWin();
            createJackpotConfetti();
        } else if (result.type === 'three') {
            elements.statusMessage.textContent = `Big Win! +${result.amount} Credits!`;
            game.audio.playBigWin();
            showConfetti();
        } else {
            elements.statusMessage.textContent = `Winner! +${result.amount} Credit${result.amount > 1 ? 's' : ''}!`;
            game.audio.playWin();
            showConfetti();
        }
    } else {
        elements.statusMessage.textContent = 'Try again!';
    }
}

// ============================================================================
// CONFETTI
// ============================================================================
function showConfetti() {
    const container = elements.winCelebration;
    container.classList.remove('hidden');
    createConfetti(container, 30);
    setTimeout(() => container.classList.add('hidden'), 2500);
}

function createJackpotConfetti() {
    const container = elements.confettiContainer;
    container.innerHTML = '';
    
    const colors = ['#FFD700', '#FF6B8A', '#7B68EE', '#4ECDC4', '#FFA500', '#FF4444', '#44FF44'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 1 + 's';
        confetti.style.animationDuration = (3 + Math.random() * 2) + 's';
        confetti.style.width = (8 + Math.random() * 16) + 'px';
        confetti.style.height = confetti.style.width;
        container.appendChild(confetti);
    }
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateCredits() {
    elements.credits.textContent = game.credits;
}

function updateBet(newBet) {
    if (game.spinning || game.credits < newBet) return;
    
    game.bet = newBet;
    
    // Update bet buttons
    elements.betOptions.querySelectorAll('.bet-option').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.bet) === newBet);
        btn.disabled = game.credits < parseInt(btn.dataset.bet);
    });
}

function showGameOver() {
    elements.gameOverOverlay.classList.remove('hidden');
    elements.statusMessage.textContent = 'Thanks for playing!';
}

function resetGame() {
    game.credits = INITIAL_CREDITS;
    game.bet = 1;
    game.spinning = false;
    
    updateCredits();
    updateBet(1);
    updateReels();
    
    elements.gameOverOverlay.classList.add('hidden');
    elements.winAmount.textContent = '0';
    elements.statusMessage.textContent = 'Tap Spin to play';
}

// ============================================================================
// SOUND TOGGLE
// ============================================================================
function toggleSound() {
    game.soundEnabled = !game.soundEnabled;
    game.audio.setMuted(!game.soundEnabled);
    
    // Save preference
    localStorage.setItem('casino-sound-enabled', game.soundEnabled ? 'true' : 'false');
    
    const onIcon = elements.soundBtn.querySelector('.sound-on-icon');
    const offIcon = elements.soundBtn.querySelector('.sound-off-icon');
    
    if (game.soundEnabled) {
        onIcon.classList.remove('hidden');
        offIcon.classList.add('hidden');
        elements.soundBtn.classList.add('sound-on');
        elements.soundBtn.classList.remove('sound-off');
        game.audio.init();
    } else {
        onIcon.classList.add('hidden');
        offIcon.classList.remove('hidden');
        elements.soundBtn.classList.remove('sound-on');
        elements.soundBtn.classList.add('sound-off');
    }
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================
function openHelpModal() {
    elements.helpModal.classList.add('active');
}

function closeHelpModal() {
    elements.helpModal.classList.remove('active');
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function initEventListeners() {
    // Spin
    elements.spinBtn.addEventListener('click', spin);
    elements.leverBtn.addEventListener('mousedown', spin);
    elements.leverBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        spin();
    });
    
    // Bet selection
    elements.betOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('bet-option')) {
            updateBet(parseInt(e.target.dataset.bet));
        }
    });
    
    // Sound
    elements.soundBtn.addEventListener('click', toggleSound);
    
    // Help modal
    elements.helpBtn.addEventListener('click', openHelpModal);
    elements.closeHelpBtn.addEventListener('click', closeHelpModal);
    elements.gotItBtn.addEventListener('click', closeHelpModal);
    elements.helpModal.addEventListener('click', (e) => {
        if (e.target === elements.helpModal) closeHelpModal();
    });
    
    // Game over reset
    elements.resetBtn.addEventListener('click', resetGame);
    
    // Jackpot overlay close
    elements.jackpotOverlay.addEventListener('click', () => {
        elements.jackpotOverlay.classList.add('hidden');
    });
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            if (!elements.helpModal.classList.contains('active') && 
                elements.jackpotOverlay.classList.contains('hidden') &&
                elements.gameOverOverlay.classList.contains('hidden')) {
                e.preventDefault();
                spin();
            }
        }
        if (e.key === 'Escape') {
            closeHelpModal();
            elements.jackpotOverlay.classList.add('hidden');
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================
function init() {
    initElements();
    initEventListeners();
    updateReels();
    updateCredits();
    updateBet(1);
    
    // Initialize sound (on by default)
    const savedSound = localStorage.getItem('casino-sound-enabled');
    if (savedSound === 'false') {
        // User explicitly disabled sound - turn it off
        game.soundEnabled = false;
        game.audio.setMuted(true);
        const onIcon = elements.soundBtn.querySelector('.sound-on-icon');
        const offIcon = elements.soundBtn.querySelector('.sound-off-icon');
        onIcon.classList.add('hidden');
        offIcon.classList.remove('hidden');
    } else {
        // Sound on by default - init AudioContext on first user interaction
        const initAudioOnInteraction = () => {
            game.audio.init();
            document.removeEventListener('click', initAudioOnInteraction);
            document.removeEventListener('touchstart', initAudioOnInteraction);
        };
        document.addEventListener('click', initAudioOnInteraction);
        document.addEventListener('touchstart', initAudioOnInteraction);
    }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
