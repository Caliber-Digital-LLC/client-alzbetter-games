/**
 * Blackjack - Game Logic
 * AlzBetter Games
 */

// ============================================================================
// CONSTANTS
// ============================================================================
const INITIAL_CREDITS = 500;
const CHIP_VALUES = [10, 20, 50, 100];
const DECK_COUNT = 4;
const SHUFFLE_THRESHOLD = 0.25;
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// ============================================================================
// AUDIO MANAGER
// ============================================================================
class AudioManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(m) {
        this.muted = m;
    }

    playTone(freq, type, dur, vol, delay = 0) {
        if (!this.ctx || this.muted) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + delay;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.1);
    }

    playDeal() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    playChip() {
        this.playTone(1200, 'sine', 0.08, 0.15);
        this.playTone(800, 'sine', 0.06, 0.1, 0.03);
    }

    playClick() {
        this.playTone(600, 'sine', 0.04, 0.1);
    }

    playWin() {
        this.playTone(523.25, 'sine', 0.25, 0.12, 0);
        this.playTone(659.25, 'sine', 0.25, 0.12, 0.1);
        this.playTone(783.99, 'sine', 0.35, 0.12, 0.2);
    }

    playBlackjack() {
        this.playWin();
        this.playTone(1046.50, 'sine', 0.4, 0.15, 0.3);
    }

    playLoss() {
        this.playTone(200, 'triangle', 0.25, 0.1);
        this.playTone(150, 'triangle', 0.3, 0.08, 0.1);
    }
}

// ============================================================================
// CARD RENDERING
// ============================================================================
function createCardSVG(card) {
    if (card.isHidden) {
        return `<svg viewBox="0 0 100 140">
            <defs>
                <pattern id="diamondPattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                    <rect width="16" height="16" fill="#3b5998"/>
                    <path d="M8 0 L16 8 L8 16 L0 8 Z" fill="#4a69bd" opacity="0.6"/>
                    <path d="M8 4 L12 8 L8 12 L4 8 Z" fill="#6a89cc" opacity="0.4"/>
                </pattern>
            </defs>
            <rect x="0" y="0" width="100" height="140" rx="8" fill="#e8e8e8"/>
            <rect x="4" y="4" width="92" height="132" rx="6" fill="url(#diamondPattern)"/>
            <rect x="4" y="4" width="92" height="132" rx="6" fill="none" stroke="#2c3e50" stroke-width="1" opacity="0.3"/>
        </svg>`;
    }

    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const color = isRed ? '#dc2626' : '#1e293b';
    const suitSymbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit];

    let centerContent = `<text x="50" y="80" font-size="36" fill="${color}" text-anchor="middle" dominant-baseline="middle">${suitSymbol}</text>`;
    
    if (['J', 'Q', 'K'].includes(card.rank)) {
        const faceColors = {
            J: { primary: '#4a5568', accent: '#ecc94b' },
            Q: { primary: '#9f7aea', accent: '#faf089' },
            K: { primary: '#e53e3e', accent: '#faf089' }
        }[card.rank];
        
        centerContent = `<g transform="translate(25, 35)">
            ${card.rank === 'K' ? `<path d="M25 5 L30 15 L35 5 L40 15 L45 5 L45 20 L5 20 L5 5 L10 15 L15 5 L20 15 Z" fill="${faceColors.accent}" stroke="#b7791f" stroke-width="1"/>` : ''}
            ${card.rank === 'Q' ? `<ellipse cx="25" cy="12" rx="18" ry="10" fill="${faceColors.accent}" stroke="#b7791f" stroke-width="1"/>` : ''}
            ${card.rank === 'J' ? `<path d="M10 15 L40 15 L38 5 L12 5 Z" fill="${faceColors.primary}" stroke="#2d3748" stroke-width="1"/>` : ''}
            <ellipse cx="25" cy="35" rx="15" ry="18" fill="#fbd38d" stroke="#d69e2e" stroke-width="1"/>
            <circle cx="20" cy="32" r="2" fill="#2d3748"/>
            <circle cx="30" cy="32" r="2" fill="#2d3748"/>
            <path d="M20 40 Q25 44 30 40" fill="none" stroke="#c53030" stroke-width="1.5"/>
            <path d="M10 55 L15 50 L25 55 L35 50 L40 55 L40 70 L10 70 Z" fill="${faceColors.primary}"/>
        </g>`;
    }

    return `<svg viewBox="0 0 100 140">
        <rect x="0" y="0" width="100" height="140" rx="8" fill="#ffffff"/>
        <rect x="0" y="0" width="100" height="140" rx="8" fill="none" stroke="#d1d5db" stroke-width="1"/>
        <text x="8" y="22" font-size="18" font-weight="bold" fill="${color}" font-family="Georgia, serif">${card.rank}</text>
        <text x="10" y="38" font-size="16" fill="${color}">${suitSymbol}</text>
        <g transform="rotate(180, 50, 70)">
            <text x="8" y="22" font-size="18" font-weight="bold" fill="${color}" font-family="Georgia, serif">${card.rank}</text>
            <text x="10" y="38" font-size="16" fill="${color}">${suitSymbol}</text>
        </g>
        ${centerContent}
    </svg>`;
}

// ============================================================================
// DECK FUNCTIONS
// ============================================================================
function getRankValue(rank) {
    if (rank === 'A') return 11;
    if (['K', 'Q', 'J'].includes(rank)) return 10;
    return parseInt(rank);
}

function createDeck(count) {
    const deck = [];
    for (let i = 0; i < count; i++) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({
                    suit,
                    rank,
                    value: getRankValue(rank),
                    id: `${i}-${suit}-${rank}-${Math.random().toString(36).substr(2, 9)}`
                });
            }
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    const newDeck = [...deck];
    const array = new Uint32Array(newDeck.length);
    window.crypto.getRandomValues(array);
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = array[i] % (i + 1);
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

function calculateHand(cards) {
    let total = 0;
    let aces = 0;
    for (const c of cards) {
        if (c.isHidden) continue;
        total += c.value;
        if (c.rank === 'A') aces++;
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

// ============================================================================
// GAME STATE
// ============================================================================
const game = {
    credits: INITIAL_CREDITS,
    currentBet: 0,
    deck: [],
    playerHand: [],
    dealerHand: [],
    state: 'BETTING', // BETTING, DEALING, PLAYER_TURN, DEALER_TURN, RESOLVED
    isDoubled: false,
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
        betDisplay: document.getElementById('betDisplay'),
        betChip: document.getElementById('betChip'),
        betAmount: document.getElementById('betAmount'),
        dealerHand: document.getElementById('dealerHand'),
        playerHand: document.getElementById('playerHand'),
        dealerTotal: document.getElementById('dealerTotal'),
        playerTotal: document.getElementById('playerTotal'),
        statusMessage: document.getElementById('statusMessage'),
        bettingControls: document.getElementById('bettingControls'),
        playingControls: document.getElementById('playingControls'),
        resolvedControls: document.getElementById('resolvedControls'),
        dealBtn: document.getElementById('dealBtn'),
        clearBtn: document.getElementById('clearBtn'),
        hitBtn: document.getElementById('hitBtn'),
        standBtn: document.getElementById('standBtn'),
        doubleBtn: document.getElementById('doubleBtn'),
        newHandBtn: document.getElementById('newHandBtn'),
        soundBtn: document.getElementById('soundBtn'),
        helpBtn: document.getElementById('helpBtn'),
        rulesModal: document.getElementById('rulesModal'),
        closeRulesBtn: document.getElementById('closeRulesBtn'),
        gotItBtn: document.getElementById('gotItBtn'),
        chips: document.querySelectorAll('.chip')
    };
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateCredits() {
    elements.credits.textContent = game.credits;
}

function updateBetDisplay() {
    if (game.currentBet > 0) {
        elements.betDisplay.classList.remove('hidden');
        elements.betAmount.textContent = game.currentBet;
        elements.clearBtn.classList.remove('hidden');
        
        // Update chip color based on bet
        const chipColor = game.currentBet <= 10 ? '#3b82f6' : 
                         game.currentBet <= 20 ? '#ec4899' : 
                         game.currentBet <= 50 ? '#22c55e' : '#ef4444';
        elements.betChip.innerHTML = `<svg viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="28" fill="${chipColor}" stroke="${chipColor}" stroke-width="3"/>
            <circle cx="30" cy="30" r="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 4" opacity="0.5"/>
            <circle cx="30" cy="30" r="18" fill="${chipColor}"/>
        </svg>`;
    } else {
        elements.betDisplay.classList.add('hidden');
        elements.clearBtn.classList.add('hidden');
    }
    
    // Update chip states
    elements.chips.forEach(chip => {
        const value = parseInt(chip.dataset.value);
        chip.disabled = game.credits < value;
    });
}

function renderHand(containerEl, hand, rotate = true) {
    containerEl.innerHTML = '';
    hand.forEach((card, i) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'playing-card';
        if (rotate) {
            const rotationAngle = (i - (hand.length - 1) / 2) * 5;
            cardEl.style.transform = `rotate(${rotationAngle}deg)`;
        }
        cardEl.innerHTML = createCardSVG(card);
        containerEl.appendChild(cardEl);
    });
}

function updateTotals() {
    const playerT = calculateHand(game.playerHand);
    const dealerT = calculateHand(game.dealerHand);
    
    if (game.playerHand.length > 0) {
        elements.playerTotal.classList.remove('hidden');
        elements.playerTotal.textContent = playerT;
    } else {
        elements.playerTotal.classList.add('hidden');
    }
    
    if (game.dealerHand.length > 0) {
        elements.dealerTotal.classList.remove('hidden');
        elements.dealerTotal.textContent = dealerT;
    } else {
        elements.dealerTotal.classList.add('hidden');
    }
}

function setStatus(msg) {
    if (msg) {
        elements.statusMessage.textContent = msg;
        elements.statusMessage.classList.remove('hidden');
    } else {
        elements.statusMessage.classList.add('hidden');
    }
}

function setGameState(state) {
    game.state = state;
    
    elements.bettingControls.classList.toggle('hidden', state !== 'BETTING');
    elements.playingControls.classList.toggle('hidden', state !== 'PLAYER_TURN');
    elements.resolvedControls.classList.toggle('hidden', state !== 'RESOLVED');
    
    // Update double button visibility
    if (state === 'PLAYER_TURN') {
        const canDouble = game.playerHand.length === 2 && game.credits >= game.currentBet;
        elements.doubleBtn.classList.toggle('hidden', !canDouble);
    }
}

// ============================================================================
// GAME ACTIONS
// ============================================================================
function addChip(value) {
    if (game.state !== 'BETTING') return;
    if (game.credits >= value) {
        game.audio.init();
        game.audio.playChip();
        game.currentBet += value;
        game.credits -= value;
        updateCredits();
        updateBetDisplay();
    }
}

function clearBet() {
    if (game.state !== 'BETTING') return;
    game.credits += game.currentBet;
    game.currentBet = 0;
    updateCredits();
    updateBetDisplay();
}

async function deal() {
    if (game.state !== 'BETTING') return;
    
    // Default bet to 20 if none selected
    let betAmount = game.currentBet;
    if (betAmount === 0) {
        betAmount = Math.min(20, game.credits);
        game.currentBet = betAmount;
        game.credits -= betAmount;
        updateCredits();
        updateBetDisplay();
    }
    
    if (betAmount === 0) return;
    
    game.audio.init();
    game.audio.playClick();
    
    setGameState('DEALING');
    game.playerHand = [];
    game.dealerHand = [];
    game.isDoubled = false;
    setStatus('');
    renderHand(elements.playerHand, []);
    renderHand(elements.dealerHand, []);
    updateTotals();
    
    // Check shuffle
    if (game.deck.length < (52 * DECK_COUNT * SHUFFLE_THRESHOLD)) {
        setStatus('Shuffling...');
        await sleep(1000);
        game.deck = shuffleDeck(createDeck(DECK_COUNT));
        setStatus('');
    }
    
    // Deal cards
    const pCard1 = game.deck.pop();
    const dCard1 = game.deck.pop();
    const pCard2 = game.deck.pop();
    const dCard2 = { ...game.deck.pop(), isHidden: true };
    
    game.audio.playDeal();
    game.playerHand = [pCard1];
    renderHand(elements.playerHand, game.playerHand);
    await sleep(300);
    
    game.audio.playDeal();
    game.dealerHand = [dCard1];
    renderHand(elements.dealerHand, game.dealerHand);
    await sleep(300);
    
    game.audio.playDeal();
    game.playerHand = [pCard1, pCard2];
    renderHand(elements.playerHand, game.playerHand);
    await sleep(300);
    
    game.audio.playDeal();
    game.dealerHand = [dCard1, dCard2];
    renderHand(elements.dealerHand, game.dealerHand);
    updateTotals();
    await sleep(400);
    
    // Check blackjack
    const pTotal = calculateHand(game.playerHand);
    if (pTotal === 21) {
        const revealedDealerHand = [dCard1, { ...dCard2, isHidden: false }];
        const dTotal = calculateHand(revealedDealerHand);
        game.dealerHand = revealedDealerHand;
        renderHand(elements.dealerHand, game.dealerHand);
        updateTotals();
        
        if (dTotal === 21) {
            endRound('push', 'Push - Both Blackjack!');
        } else {
            endRound('blackjack', 'Blackjack! You win!');
        }
    } else {
        setGameState('PLAYER_TURN');
    }
}

async function hit() {
    if (game.state !== 'PLAYER_TURN') return;
    game.audio.playDeal();
    
    const card = game.deck.pop();
    game.playerHand.push(card);
    renderHand(elements.playerHand, game.playerHand);
    updateTotals();
    
    if (calculateHand(game.playerHand) > 21) {
        await sleep(500);
        endRound('loss', 'Busted!');
    }
}

async function stand() {
    if (game.state !== 'PLAYER_TURN') return;
    game.audio.playClick();
    setGameState('DEALER_TURN');
    await playDealer();
}

async function doubleDown() {
    if (game.state !== 'PLAYER_TURN' || game.playerHand.length !== 2 || game.credits < game.currentBet) return;
    
    game.audio.playChip();
    game.credits -= game.currentBet;
    game.currentBet *= 2;
    game.isDoubled = true;
    updateCredits();
    updateBetDisplay();
    
    // Deal one card
    game.audio.playDeal();
    const card = game.deck.pop();
    game.playerHand.push(card);
    renderHand(elements.playerHand, game.playerHand);
    updateTotals();
    
    await sleep(500);
    
    if (calculateHand(game.playerHand) > 21) {
        endRound('loss', 'Busted!');
    } else {
        setGameState('DEALER_TURN');
        await playDealer();
    }
}

async function playDealer() {
    await sleep(500);
    
    // Reveal hole card
    game.dealerHand[1].isHidden = false;
    renderHand(elements.dealerHand, game.dealerHand);
    updateTotals();
    game.audio.playDeal();
    
    await sleep(600);
    
    // Dealer hits until 17
    while (calculateHand(game.dealerHand) < 17) {
        await sleep(800);
        const card = game.deck.pop();
        game.dealerHand.push(card);
        renderHand(elements.dealerHand, game.dealerHand);
        updateTotals();
        game.audio.playDeal();
    }
    
    await sleep(500);
    resolveRound(calculateHand(game.dealerHand));
}

function resolveRound(dealerTotal) {
    const playerTotal = calculateHand(game.playerHand);
    
    if (dealerTotal > 21) {
        endRound('win', 'Dealer Busts! You win!');
    } else if (playerTotal > dealerTotal) {
        endRound('win', 'You win!');
    } else if (playerTotal < dealerTotal) {
        endRound('loss', 'Dealer wins');
    } else {
        endRound('push', 'Push');
    }
}

function endRound(result, message) {
    setGameState('RESOLVED');
    setStatus(message);
    
    if (result === 'blackjack') {
        game.credits += Math.floor(game.currentBet * 2.5);
        game.audio.playBlackjack();
    } else if (result === 'win') {
        game.credits += game.currentBet * 2;
        game.audio.playWin();
    } else if (result === 'push') {
        game.credits += game.currentBet;
        game.audio.playClick();
    } else {
        game.audio.playLoss();
    }
    
    updateCredits();
}

function newHand() {
    game.currentBet = 0;
    game.playerHand = [];
    game.dealerHand = [];
    setStatus('');
    renderHand(elements.playerHand, []);
    renderHand(elements.dealerHand, []);
    updateTotals();
    
    if (game.credits <= 0) {
        game.credits = INITIAL_CREDITS;
        updateCredits();
    }
    
    setGameState('BETTING');
    updateBetDisplay();
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
        game.audio.init();
    } else {
        onIcon.classList.add('hidden');
        offIcon.classList.remove('hidden');
    }
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================
function openRulesModal() {
    elements.rulesModal.classList.add('active');
}

function closeRulesModal() {
    elements.rulesModal.classList.remove('active');
}

// ============================================================================
// HELPERS
// ============================================================================
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function initEventListeners() {
    // Chips
    elements.chips.forEach(chip => {
        chip.addEventListener('click', () => addChip(parseInt(chip.dataset.value)));
    });
    
    // Action buttons
    elements.dealBtn.addEventListener('click', deal);
    elements.clearBtn.addEventListener('click', clearBet);
    elements.hitBtn.addEventListener('click', hit);
    elements.standBtn.addEventListener('click', stand);
    elements.doubleBtn.addEventListener('click', doubleDown);
    elements.newHandBtn.addEventListener('click', newHand);
    
    // Sound
    elements.soundBtn.addEventListener('click', toggleSound);
    
    // Rules modal
    elements.helpBtn.addEventListener('click', openRulesModal);
    elements.closeRulesBtn.addEventListener('click', closeRulesModal);
    elements.gotItBtn.addEventListener('click', closeRulesModal);
    elements.rulesModal.addEventListener('click', (e) => {
        if (e.target === elements.rulesModal) closeRulesModal();
    });
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (elements.rulesModal.classList.contains('active')) {
            if (e.key === 'Escape') closeRulesModal();
            return;
        }
        
        if (game.state === 'BETTING') {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                deal();
            }
        } else if (game.state === 'PLAYER_TURN') {
            if (e.key === 'h') hit();
            else if (e.key === 's') stand();
            else if (e.key === 'd') doubleDown();
        } else if (game.state === 'RESOLVED') {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                newHand();
            }
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================
function init() {
    initElements();
    initEventListeners();
    
    // Initialize deck
    game.deck = shuffleDeck(createDeck(DECK_COUNT));
    
    updateCredits();
    updateBetDisplay();
    setGameState('BETTING');
    
    // Sound is on by default - init AudioContext on first user interaction
    const savedSound = localStorage.getItem('casino-sound-enabled');
    if (savedSound === 'false') {
        // User explicitly disabled sound
        game.soundEnabled = false;
        game.audio.setMuted(true);
        const onIcon = elements.soundBtn.querySelector('.sound-on-icon');
        const offIcon = elements.soundBtn.querySelector('.sound-off-icon');
        onIcon.classList.add('hidden');
        offIcon.classList.remove('hidden');
    } else {
        // Sound on by default - init AudioContext on first click
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
