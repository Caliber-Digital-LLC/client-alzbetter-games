/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO POKER - Game Logic
 * A senior-friendly Jacks or Better video poker game
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION (TUNING SECTION)
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Credits
  STARTING_CREDITS: 200,
  
  // Betting
  MIN_BET: 1,
  MAX_BET: 5,
  
  // Timing
  AUTO_PLAY_DELAY: 2500,    // ms between auto hands
  DEAL_DELAY: 150,          // ms between each card dealt
  DRAW_DELAY: 100,          // ms between each card drawn
  RESULT_DELAY: 500,        // ms before showing result
  
  // Lucky Boost (player favor mechanic)
  LUCKY_BOOST_ENABLED: true,
  LUCKY_BOOST_RATE: 0.08,   // 8% chance to upgrade losing hand
};

// Paytable multipliers (TUNING)
const PAYTABLE = {
  'royal-flush': { name: 'Royal Flush', multiplier: 250 },
  'straight-flush': { name: 'Straight Flush', multiplier: 50 },
  'four-of-a-kind': { name: 'Four of a Kind', multiplier: 25 },
  'full-house': { name: 'Full House', multiplier: 9 },
  'flush': { name: 'Flush', multiplier: 6 },
  'straight': { name: 'Straight', multiplier: 4 },
  'three-of-a-kind': { name: 'Three of a Kind', multiplier: 3 },
  'two-pair': { name: 'Two Pair', multiplier: 2 },
  'jacks-or-better': { name: 'Jacks or Better', multiplier: 1 },
};

// Card constants
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

// ═══════════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════════

const GameState = {
  READY_TO_DEAL: 'READY_TO_DEAL',
  DEALING: 'DEALING',
  HOLD_SELECTION: 'HOLD_SELECTION',
  DRAWING: 'DRAWING',
  SHOWING_RESULT: 'SHOWING_RESULT',
};

const game = {
  state: GameState.READY_TO_DEAL,
  credits: CONFIG.STARTING_CREDITS,
  bet: 1,
  
  // Deck and hand
  deck: [],
  hand: [null, null, null, null, null],
  held: [false, false, false, false, false],
  
  // Results
  lastWin: 0,
  lastHand: null,
  luckyBoostTriggered: false,
  
  // Auto play
  autoPlayEnabled: false,
  autoPlayTimer: null,
  
  // Settings
  soundEnabled: true,
  audioUnlocked: false,
  luckyBoostEnabled: true, // Always enabled for player enjoyment
  reducedMotion: false,
  highContrast: false,
  volume: 0.6,
};

// ═══════════════════════════════════════════════════════════════════════════════
// CRYPTO RNG
// ═══════════════════════════════════════════════════════════════════════════════

function getRandomInt(max) {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
}

function getRandomFloat() {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1);
}

// Fisher-Yates shuffle with crypto RNG
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank] });
    }
  }
  return deck;
}

function initializeDeck() {
  game.deck = shuffleDeck(createDeck());
}

function dealCard() {
  if (game.deck.length === 0) {
    initializeDeck();
  }
  return game.deck.pop();
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAND EVALUATION
// ═══════════════════════════════════════════════════════════════════════════════

function getHandInfo(hand) {
  // Sort by rank value
  const sorted = [...hand].sort((a, b) => a.value - b.value);
  const values = sorted.map(c => c.value);
  const suits = hand.map(c => c.suit);
  
  // Count ranks
  const rankCounts = {};
  for (const card of hand) {
    rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
  }
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
  // Check flush
  const isFlush = suits.every(s => s === suits[0]);
  
  // Check straight (including A-2-3-4-5 wheel)
  let isStraight = false;
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  
  if (uniqueValues.length === 5) {
    // Normal straight
    if (uniqueValues[4] - uniqueValues[0] === 4) {
      isStraight = true;
    }
    // Ace-low straight (wheel): A-2-3-4-5
    if (uniqueValues[0] === 2 && uniqueValues[1] === 3 && uniqueValues[2] === 4 && 
        uniqueValues[3] === 5 && uniqueValues[4] === 14) {
      isStraight = true;
    }
  }
  
  // Check for royal (10-J-Q-K-A)
  const isRoyal = uniqueValues.length === 5 && 
    uniqueValues[0] === 10 && uniqueValues[4] === 14;
  
  return { sorted, values, suits, rankCounts, counts, isFlush, isStraight, isRoyal };
}

function evaluateHand(hand) {
  if (!hand || hand.length !== 5 || hand.some(c => !c)) {
    return null;
  }
  
  const info = getHandInfo(hand);
  const { counts, isFlush, isStraight, isRoyal, rankCounts } = info;
  
  // Royal Flush
  if (isFlush && isStraight && isRoyal) {
    return 'royal-flush';
  }
  
  // Straight Flush
  if (isFlush && isStraight) {
    return 'straight-flush';
  }
  
  // Four of a Kind
  if (counts[0] === 4) {
    return 'four-of-a-kind';
  }
  
  // Full House
  if (counts[0] === 3 && counts[1] === 2) {
    return 'full-house';
  }
  
  // Flush
  if (isFlush) {
    return 'flush';
  }
  
  // Straight
  if (isStraight) {
    return 'straight';
  }
  
  // Three of a Kind
  if (counts[0] === 3) {
    return 'three-of-a-kind';
  }
  
  // Two Pair
  if (counts[0] === 2 && counts[1] === 2) {
    return 'two-pair';
  }
  
  // Jacks or Better (pair of J, Q, K, or A)
  if (counts[0] === 2) {
    for (const [value, count] of Object.entries(rankCounts)) {
      if (count === 2 && parseInt(value) >= 11) { // J=11, Q=12, K=13, A=14
        return 'jacks-or-better';
      }
    }
  }
  
  return null; // No winning hand
}

function getWinningCardIndices(hand, handType) {
  if (!handType) return [];
  
  const info = getHandInfo(hand);
  const { rankCounts } = info;
  const indices = [];
  
  switch (handType) {
    case 'royal-flush':
    case 'straight-flush':
    case 'flush':
    case 'straight':
      // All cards are part of the winning hand
      return [0, 1, 2, 3, 4];
    
    case 'four-of-a-kind':
      // Find the four matching cards
      for (const [value, count] of Object.entries(rankCounts)) {
        if (count === 4) {
          hand.forEach((card, i) => {
            if (card.value === parseInt(value)) indices.push(i);
          });
        }
      }
      break;
    
    case 'full-house':
    case 'two-pair':
      // All cards except maybe the kicker
      for (const [value, count] of Object.entries(rankCounts)) {
        if (count >= 2) {
          hand.forEach((card, i) => {
            if (card.value === parseInt(value)) indices.push(i);
          });
        }
      }
      break;
    
    case 'three-of-a-kind':
      for (const [value, count] of Object.entries(rankCounts)) {
        if (count === 3) {
          hand.forEach((card, i) => {
            if (card.value === parseInt(value)) indices.push(i);
          });
        }
      }
      break;
    
    case 'jacks-or-better':
      for (const [value, count] of Object.entries(rankCounts)) {
        if (count === 2 && parseInt(value) >= 11) {
          hand.forEach((card, i) => {
            if (card.value === parseInt(value)) indices.push(i);
          });
        }
      }
      break;
  }
  
  return indices;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LUCKY BOOST
// ═══════════════════════════════════════════════════════════════════════════════

function tryLuckyBoost() {
  if (!game.luckyBoostEnabled) return false;
  
  // Only trigger on losing hands
  const currentHand = evaluateHand(game.hand);
  if (currentHand) return false; // Already a winner
  
  // Random chance to trigger
  if (getRandomFloat() > CONFIG.LUCKY_BOOST_RATE) return false;
  
  // Try to upgrade to Jacks or Better by replacing non-held cards
  const nonHeldIndices = game.held.map((h, i) => h ? -1 : i).filter(i => i >= 0);
  
  if (nonHeldIndices.length === 0) {
    // All cards were held, can't modify - return bet as push
    game.luckyBoostTriggered = true;
    return 'push';
  }
  
  // Check if we have any high cards (J, Q, K, A) to pair
  const highCards = game.hand.filter((c, i) => game.held[i] && c.value >= 11);
  
  if (highCards.length > 0 && nonHeldIndices.length > 0) {
    // Try to give them a pair of the high card
    const targetValue = highCards[0].value;
    const targetRank = highCards[0].rank;
    
    // Find a card in the deck with matching rank but different suit
    const existingSuits = game.hand.filter(c => c.value === targetValue).map(c => c.suit);
    const matchingCard = game.deck.find(c => c.value === targetValue && !existingSuits.includes(c.suit));
    
    if (matchingCard) {
      // Replace one non-held card with the matching card
      const replaceIndex = nonHeldIndices[0];
      game.hand[replaceIndex] = matchingCard;
      game.luckyBoostTriggered = true;
      return 'upgrade';
    }
  }
  
  // Couldn't upgrade naturally, return bet as push
  game.luckyBoostTriggered = true;
  return 'push';
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const AudioManager = {
  ctx: null,
  masterVolume: 0.6,
  
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('WebAudio not supported');
    }
  },
  
  async unlock() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    game.audioUnlocked = true;
    game.soundEnabled = true;
    UI.updateSoundIcon();
    UI.hideSoundPrompt();
  },
  
  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    game.volume = this.masterVolume;
    saveSettings();
  },
  
  // Soft click
  playClick() {
    if (!game.soundEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.1 * this.masterVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  },
  
  // Card deal swish
  playDeal() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const duration = 0.1;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      const envelope = Math.exp(-t * 30);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.2;
    }
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    const gain = this.ctx.createGain();
    gain.gain.value = 0.3 * this.masterVolume;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  },
  
  // Card hold click
  playHold() {
    if (!game.soundEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1 * this.masterVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  },
  
  // Win sound - pleasant chord
  playWin() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const notes = [523.25, 659.26, 783.99]; // C5, E5, G5
    const duration = 0.4;
    
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = this.ctx.currentTime + i * 0.05;
      gain.gain.setValueAtTime(0.12 * this.masterVolume, startTime);
      gain.gain.linearRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  },
  
  // Big win - longer flourish
  playBigWin() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const notes = [523.25, 659.26, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = this.ctx.currentTime + i * 0.1;
      const amp = i < 4 ? 0.15 : 0.1;
      gain.gain.setValueAtTime(amp * this.masterVolume, startTime);
      gain.gain.linearRampToValueAtTime(0.001, startTime + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  },
  
  // Loss - neutral tone
  playLoss() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.08 * this.masterVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  },
  
  // Lucky boost - magical chime
  playLuckyBoost() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const notes = [880, 1174.66, 1396.91];
    
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = this.ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.12 * this.masterVolume, startTime);
      gain.gain.linearRampToValueAtTime(0.001, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const UI = {
  els: {},
  
  init() {
    this.els = {
      credits: document.getElementById('credits-value'),
      betValue: document.getElementById('bet-value'),
      winDisplay: document.getElementById('win-display'),
      winValue: document.getElementById('win-value'),
      instruction: document.getElementById('instruction'),
      
      // Cards
      cardsArea: document.getElementById('cards-area'),
      cards: [0, 1, 2, 3, 4].map(i => document.getElementById(`card-${i}`)),
      holds: [0, 1, 2, 3, 4].map(i => document.getElementById(`hold-${i}`)),
      
      // Paytable
      paytableToggle: document.getElementById('paytable-toggle'),
      paytable: document.getElementById('paytable'),
      
      // Result
      resultDisplay: document.getElementById('result-display'),
      resultHand: document.getElementById('result-hand'),
      resultPayout: document.getElementById('result-payout'),
      
      // Buttons
      betMinus: document.getElementById('bet-minus'),
      betPlus: document.getElementById('bet-plus'),
      btnDeal: document.getElementById('btn-deal'),
      btnClearHolds: document.getElementById('btn-clear-holds'),
      autoPlay: document.getElementById('auto-play'),
      
      // Overlays
      gameoverOverlay: document.getElementById('gameover-overlay'),
      btnResetCredits: document.getElementById('btn-reset-credits'),
      
      // Modals
      helpModal: document.getElementById('help-modal'),
      settingsModal: document.getElementById('settings-modal'),
      
      // Sound
      soundPrompt: document.getElementById('sound-prompt'),
      enableSound: document.getElementById('enable-sound'),
      btnSound: document.getElementById('btn-sound'),
      iconSoundOn: document.getElementById('icon-sound-on'),
      iconSoundOff: document.getElementById('icon-sound-off'),
      
      // Settings
      volumeSlider: document.getElementById('volume-slider'),
      luckyBoostToggle: document.getElementById('lucky-boost-toggle'),
      highContrastToggle: document.getElementById('high-contrast-toggle'),
      reducedMotionToggle: document.getElementById('reduced-motion-toggle'),
    };
  },
  
  updateCredits() {
    this.els.credits.textContent = game.credits;
  },
  
  updateBet() {
    this.els.betValue.textContent = game.bet;
    this.els.betMinus.disabled = game.bet <= CONFIG.MIN_BET || game.state !== GameState.READY_TO_DEAL;
    this.els.betPlus.disabled = game.bet >= CONFIG.MAX_BET || game.state !== GameState.READY_TO_DEAL;
  },
  
  updateWin(amount) {
    if (amount > 0) {
      this.els.winValue.textContent = `+${amount}`;
      this.els.winDisplay.classList.remove('hidden');
    } else {
      this.els.winDisplay.classList.add('hidden');
    }
  },
  
  updateInstruction(text) {
    this.els.instruction.textContent = text;
  },
  
  // Card rendering
  renderCard(index, card, animate = false) {
    const cardEl = this.els.cards[index];
    const front = cardEl.querySelector('.card-front');
    
    if (!card) {
      cardEl.className = 'card empty';
      cardEl.setAttribute('aria-label', `Card ${index + 1}: Empty`);
      front.innerHTML = '';
      return;
    }
    
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    cardEl.className = `card ${isRed ? 'red' : 'black'}`;
    
    if (animate) {
      cardEl.classList.add(game.state === GameState.DEALING ? 'dealing' : 'drawing');
      setTimeout(() => cardEl.classList.remove('dealing', 'drawing'), 300);
    }
    
    const suitSymbol = SUIT_SYMBOLS[card.suit];
    const suitName = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
    const rankName = card.rank === 'J' ? 'Jack' : card.rank === 'Q' ? 'Queen' : 
                     card.rank === 'K' ? 'King' : card.rank === 'A' ? 'Ace' : card.rank;
    
    cardEl.setAttribute('aria-label', `Card ${index + 1}: ${rankName} of ${suitName}${game.held[index] ? ', Hold selected' : ''}`);
    
    front.innerHTML = `
      <div class="card-corner top-left">
        <span>${card.rank}</span>
        <span>${suitSymbol}</span>
      </div>
      <span class="card-value">${card.rank}</span>
      <span class="card-suit">${suitSymbol}</span>
      <div class="card-corner bottom-right">
        <span>${card.rank}</span>
        <span>${suitSymbol}</span>
      </div>
    `;
  },
  
  renderHand(animate = false) {
    game.hand.forEach((card, i) => {
      if (animate) {
        setTimeout(() => this.renderCard(i, card, true), i * CONFIG.DEAL_DELAY);
      } else {
        this.renderCard(i, card, false);
      }
    });
  },
  
  updateHolds() {
    game.held.forEach((isHeld, i) => {
      const holdEl = this.els.holds[i];
      const cardEl = this.els.cards[i];
      
      if (isHeld) {
        holdEl.classList.remove('hidden');
        cardEl.classList.add('held');
      } else {
        holdEl.classList.add('hidden');
        cardEl.classList.remove('held');
      }
      
      // Update aria label
      if (game.hand[i]) {
        const currentLabel = cardEl.getAttribute('aria-label').replace(', Hold selected', '');
        cardEl.setAttribute('aria-label', currentLabel + (isHeld ? ', Hold selected' : ''));
      }
    });
    
    // Update clear holds button
    this.els.btnClearHolds.disabled = !game.held.some(h => h) || game.state !== GameState.HOLD_SELECTION;
  },
  
  highlightWinningCards(indices) {
    this.els.cards.forEach((cardEl, i) => {
      if (indices.includes(i)) {
        cardEl.classList.add('winning');
      } else {
        cardEl.classList.remove('winning');
      }
    });
  },
  
  clearWinningHighlights() {
    this.els.cards.forEach(cardEl => cardEl.classList.remove('winning'));
  },
  
  highlightPaytableRow(handType) {
    document.querySelectorAll('.paytable-row').forEach(row => {
      row.classList.remove('highlight', 'win');
      if (handType && row.dataset.hand === handType) {
        row.classList.add('win');
      }
    });
  },
  
  showResult(handType, payout, isLucky = false) {
    const resultEl = this.els.resultDisplay;
    resultEl.classList.remove('hidden', 'lose', 'lucky');
    
    if (isLucky) {
      resultEl.classList.add('lucky');
      this.els.resultHand.textContent = '🍀 Lucky Break!';
      this.els.resultPayout.textContent = 'Bet returned';
    } else if (handType && payout > 0) {
      this.els.resultHand.textContent = PAYTABLE[handType].name;
      this.els.resultPayout.textContent = `+${payout} credits`;
    } else {
      resultEl.classList.add('lose');
      this.els.resultHand.textContent = 'No Win';
      this.els.resultPayout.textContent = 'Try again!';
    }
  },
  
  hideResult() {
    this.els.resultDisplay.classList.add('hidden');
  },
  
  updateDealButton() {
    const btn = this.els.btnDeal;
    
    switch (game.state) {
      case GameState.READY_TO_DEAL:
        btn.textContent = 'DEAL';
        btn.disabled = game.credits < game.bet;
        break;
      case GameState.HOLD_SELECTION:
        btn.textContent = 'DRAW';
        btn.disabled = false;
        break;
      case GameState.DEALING:
      case GameState.DRAWING:
      case GameState.SHOWING_RESULT:
        btn.disabled = true;
        break;
    }
  },
  
  togglePaytable() {
    const toggle = this.els.paytableToggle;
    const paytable = this.els.paytable;
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    
    toggle.setAttribute('aria-expanded', !isExpanded);
    paytable.classList.toggle('collapsed', isExpanded);
  },
  
  showGameOver() {
    this.els.gameoverOverlay.classList.remove('hidden');
  },
  
  hideGameOver() {
    this.els.gameoverOverlay.classList.add('hidden');
  },
  
  showModal(modalEl) {
    modalEl.classList.remove('hidden');
  },
  
  hideModal(modalEl) {
    modalEl.classList.add('hidden');
  },
  
  showSoundPrompt() {
    this.els.soundPrompt.classList.remove('hidden');
  },
  
  hideSoundPrompt() {
    this.els.soundPrompt.classList.add('hidden');
  },
  
  updateSoundIcon() {
    if (game.soundEnabled) {
      this.els.iconSoundOn.style.display = 'block';
      this.els.iconSoundOff.style.display = 'none';
    } else {
      this.els.iconSoundOn.style.display = 'none';
      this.els.iconSoundOff.style.display = 'block';
    }
  },
  
  applySettings() {
    document.body.classList.toggle('high-contrast', game.highContrast);
    this.els.highContrastToggle.checked = game.highContrast;
    
    document.body.classList.toggle('reduce-motion', game.reducedMotion);
    this.els.reducedMotionToggle.checked = game.reducedMotion;
    
    this.els.luckyBoostToggle.checked = game.luckyBoostEnabled;
    this.els.volumeSlider.value = game.volume * 100;
    AudioManager.masterVolume = game.volume;
  },
  
  showConfetti() {
    if (game.reducedMotion) return;
    
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    
    const colors = ['#d4a853', '#e8c882', '#4ade80', '#60a5fa', '#f472b6'];
    
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (2 + Math.random()) + 's';
      container.appendChild(confetti);
    }
    
    setTimeout(() => container.remove(), 4000);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

function changeBet(delta) {
  if (game.state !== GameState.READY_TO_DEAL) return;
  
  const newBet = game.bet + delta;
  if (newBet >= CONFIG.MIN_BET && newBet <= CONFIG.MAX_BET) {
    game.bet = newBet;
    AudioManager.playClick();
    UI.updateBet();
    saveSettings();
  }
}

function toggleHold(index) {
  if (game.state !== GameState.HOLD_SELECTION) return;
  if (!game.hand[index]) return;
  
  game.held[index] = !game.held[index];
  AudioManager.playHold();
  UI.updateHolds();
}

function clearHolds() {
  if (game.state !== GameState.HOLD_SELECTION) return;
  
  game.held = [false, false, false, false, false];
  AudioManager.playClick();
  UI.updateHolds();
}

async function deal() {
  if (game.state !== GameState.READY_TO_DEAL) return;
  if (game.credits < game.bet) return;
  
  // Deduct bet
  game.credits -= game.bet;
  game.lastWin = 0;
  game.lastHand = null;
  game.luckyBoostTriggered = false;
  game.held = [false, false, false, false, false];
  
  UI.updateCredits();
  UI.updateWin(0);
  UI.hideResult();
  UI.clearWinningHighlights();
  UI.highlightPaytableRow(null);
  
  // Initialize deck and deal
  initializeDeck();
  game.state = GameState.DEALING;
  UI.updateDealButton();
  UI.updateInstruction('Dealing...');
  
  // Deal 5 cards with animation
  for (let i = 0; i < 5; i++) {
    game.hand[i] = dealCard();
  }
  
  UI.renderHand(true);
  
  // Wait for deal animation to complete
  const dealTime = 5 * CONFIG.DEAL_DELAY + 300;
  await new Promise(resolve => setTimeout(resolve, dealTime));
  
  // Enter hold selection phase
  game.state = GameState.HOLD_SELECTION;
  UI.updateDealButton();
  UI.updateHolds();
  UI.updateInstruction('Tap cards to HOLD, then tap DRAW.');
  
  // Check for auto-hold (optional: you could auto-hold winning hands)
}

async function draw() {
  if (game.state !== GameState.HOLD_SELECTION) return;
  
  game.state = GameState.DRAWING;
  UI.updateDealButton();
  UI.updateInstruction('Drawing...');
  
  // Replace non-held cards
  const replaceIndices = [];
  for (let i = 0; i < 5; i++) {
    if (!game.held[i]) {
      replaceIndices.push(i);
      game.hand[i] = dealCard();
    }
  }
  
  // Animate replacements
  replaceIndices.forEach((idx, i) => {
    setTimeout(() => {
      AudioManager.playDeal();
      UI.renderCard(idx, game.hand[idx], true);
    }, i * CONFIG.DRAW_DELAY);
  });
  
  // Wait for draw animation
  const drawTime = replaceIndices.length * CONFIG.DRAW_DELAY + 300;
  await new Promise(resolve => setTimeout(resolve, drawTime));
  
  // Apply lucky boost if needed (before evaluation)
  const luckyResult = tryLuckyBoost();
  if (luckyResult === 'upgrade') {
    // Re-render hand to show upgraded cards
    UI.renderHand(false);
  }
  
  // Evaluate final hand
  await showResult(luckyResult);
}

async function showResult(luckyResult) {
  game.state = GameState.SHOWING_RESULT;
  
  await new Promise(resolve => setTimeout(resolve, CONFIG.RESULT_DELAY));
  
  const handType = evaluateHand(game.hand);
  game.lastHand = handType;
  
  let payout = 0;
  let isLucky = false;
  
  if (handType) {
    // Winner!
    payout = game.bet * PAYTABLE[handType].multiplier;
    game.credits += payout;
    game.lastWin = payout;
    
    // Highlight winning cards
    const winningIndices = getWinningCardIndices(game.hand, handType);
    UI.highlightWinningCards(winningIndices);
    UI.highlightPaytableRow(handType);
    
    // Play sound
    if (payout >= game.bet * 9) {
      AudioManager.playBigWin();
      UI.showConfetti();
    } else {
      AudioManager.playWin();
    }
    
    UI.updateInstruction(`${PAYTABLE[handType].name}! +${payout} credits`);
  } else if (luckyResult === 'push') {
    // Lucky push - return bet
    game.credits += game.bet;
    isLucky = true;
    AudioManager.playLuckyBoost();
    UI.updateInstruction('🍀 Lucky break! Bet returned.');
  } else if (luckyResult === 'upgrade') {
    // Lucky upgrade resulted in a win
    const upgradedHand = evaluateHand(game.hand);
    if (upgradedHand) {
      payout = game.bet * PAYTABLE[upgradedHand].multiplier;
      game.credits += payout;
      game.lastWin = payout;
      isLucky = true;
      
      const winningIndices = getWinningCardIndices(game.hand, upgradedHand);
      UI.highlightWinningCards(winningIndices);
      UI.highlightPaytableRow(upgradedHand);
      
      AudioManager.playLuckyBoost();
      UI.updateInstruction(`🍀 Lucky! ${PAYTABLE[upgradedHand].name}! +${payout}`);
    }
  } else {
    // Loss
    AudioManager.playLoss();
    UI.updateInstruction('No win. Try again!');
  }
  
  UI.updateCredits();
  UI.updateWin(game.lastWin);
  UI.showResult(handType, payout, isLucky && !handType);
  
  // Check for game over
  if (game.credits <= 0) {
    setTimeout(() => UI.showGameOver(), 1500);
    game.autoPlayEnabled = false;
    UI.els.autoPlay.checked = false;
    return;
  }
  
  // Prepare for next hand
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  game.state = GameState.READY_TO_DEAL;
  UI.updateDealButton();
  UI.updateBet();
  UI.updateInstruction('Set your bet, then tap DEAL.');
  
  // Auto play
  scheduleAutoPlay();
}

function handleDealButton() {
  if (game.state === GameState.READY_TO_DEAL) {
    deal();
  } else if (game.state === GameState.HOLD_SELECTION) {
    draw();
  }
}

function resetCredits() {
  game.credits = CONFIG.STARTING_CREDITS;
  game.bet = 1;
  game.hand = [null, null, null, null, null];
  game.held = [false, false, false, false, false];
  game.lastWin = 0;
  game.lastHand = null;
  game.state = GameState.READY_TO_DEAL;
  
  UI.hideGameOver();
  UI.hideResult();
  UI.updateCredits();
  UI.updateBet();
  UI.updateWin(0);
  UI.renderHand(false);
  UI.updateHolds();
  UI.clearWinningHighlights();
  UI.highlightPaytableRow(null);
  UI.updateDealButton();
  UI.updateInstruction('Set your bet, then tap DEAL.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO PLAY
// ═══════════════════════════════════════════════════════════════════════════════

function scheduleAutoPlay() {
  if (!game.autoPlayEnabled) return;
  if (!game.audioUnlocked) return;
  if (game.credits < game.bet) return;
  if (game.state !== GameState.READY_TO_DEAL) return;
  
  clearTimeout(game.autoPlayTimer);
  
  game.autoPlayTimer = setTimeout(() => {
    if (game.autoPlayEnabled && game.state === GameState.READY_TO_DEAL) {
      deal();
    }
  }, CONFIG.AUTO_PLAY_DELAY);
}

function toggleAutoPlay() {
  game.autoPlayEnabled = UI.els.autoPlay.checked;
  
  if (game.autoPlayEnabled) {
    scheduleAutoPlay();
  } else {
    clearTimeout(game.autoPlayTimer);
  }
  
  saveSettings();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════════

function saveSettings() {
  const settings = {
    soundEnabled: game.soundEnabled,
    volume: game.volume,
    luckyBoostEnabled: game.luckyBoostEnabled,
    highContrast: game.highContrast,
    reducedMotion: game.reducedMotion,
    lastBet: game.bet,
  };
  
  try {
    localStorage.setItem('pokerSettings', JSON.stringify(settings));
  } catch (e) {
    // Storage unavailable
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('pokerSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      game.volume = settings.volume ?? 0.6;
      game.luckyBoostEnabled = settings.luckyBoostEnabled ?? true;
      game.highContrast = settings.highContrast ?? false;
      game.reducedMotion = settings.reducedMotion ?? false;
      game.bet = Math.min(Math.max(settings.lastBet ?? 1, CONFIG.MIN_BET), CONFIG.MAX_BET);
      
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        game.reducedMotion = true;
      }
    }
  } catch (e) {
    // Use defaults
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
  // Sound enable
  UI.els.enableSound.addEventListener('click', async () => {
    await AudioManager.unlock();
    AudioManager.playClick();
  });
  
  // Sound toggle
  UI.els.btnSound.addEventListener('click', () => {
    if (!game.audioUnlocked) {
      AudioManager.unlock();
      return;
    }
    game.soundEnabled = !game.soundEnabled;
    UI.updateSoundIcon();
    if (game.soundEnabled) AudioManager.playClick();
    saveSettings();
  });
  
  // Bet controls
  UI.els.betMinus.addEventListener('click', () => changeBet(-1));
  UI.els.betPlus.addEventListener('click', () => changeBet(1));
  
  // Deal/Draw button
  UI.els.btnDeal.addEventListener('click', () => {
    if (!game.audioUnlocked) {
      AudioManager.unlock();
    }
    handleDealButton();
  });
  
  // Clear holds
  UI.els.btnClearHolds.addEventListener('click', clearHolds);
  
  // Card click handlers
  UI.els.cards.forEach((cardEl, index) => {
    cardEl.addEventListener('click', () => toggleHold(index));
    cardEl.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        toggleHold(index);
      }
    });
  });
  
  // Paytable toggle
  UI.els.paytableToggle.addEventListener('click', () => {
    AudioManager.playClick();
    UI.togglePaytable();
  });
  
  // Auto play
  UI.els.autoPlay.addEventListener('change', toggleAutoPlay);
  
  // Reset credits
  UI.els.btnResetCredits.addEventListener('click', () => {
    AudioManager.playClick();
    resetCredits();
  });
  
  // Help modal
  document.getElementById('btn-help').addEventListener('click', () => {
    AudioManager.playClick();
    UI.showModal(UI.els.helpModal);
  });
  document.getElementById('close-help').addEventListener('click', () => {
    AudioManager.playClick();
    UI.hideModal(UI.els.helpModal);
  });
  
  // Settings modal
  document.getElementById('btn-settings').addEventListener('click', () => {
    AudioManager.playClick();
    UI.showModal(UI.els.settingsModal);
  });
  document.getElementById('close-settings').addEventListener('click', () => {
    AudioManager.playClick();
    UI.hideModal(UI.els.settingsModal);
  });
  
  // Settings controls
  UI.els.volumeSlider.addEventListener('input', (e) => {
    AudioManager.setVolume(e.target.value / 100);
  });
  
  UI.els.luckyBoostToggle.addEventListener('change', (e) => {
    game.luckyBoostEnabled = e.target.checked;
    saveSettings();
  });
  
  UI.els.highContrastToggle.addEventListener('change', (e) => {
    game.highContrast = e.target.checked;
    document.body.classList.toggle('high-contrast', game.highContrast);
    saveSettings();
  });
  
  UI.els.reducedMotionToggle.addEventListener('change', (e) => {
    game.reducedMotion = e.target.checked;
    document.body.classList.toggle('reduce-motion', game.reducedMotion);
    saveSettings();
  });
  
  // Close modals on backdrop click
  UI.els.helpModal.addEventListener('click', (e) => {
    if (e.target === UI.els.helpModal) UI.hideModal(UI.els.helpModal);
  });
  UI.els.settingsModal.addEventListener('click', (e) => {
    if (e.target === UI.els.settingsModal) UI.hideModal(UI.els.settingsModal);
  });
  
  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'BUTTON') {
      e.preventDefault();
      handleDealButton();
    }
    if (e.code === 'Escape') {
      UI.hideModal(UI.els.helpModal);
      UI.hideModal(UI.els.settingsModal);
    }
    // Number keys 1-5 to toggle holds
    if (game.state === GameState.HOLD_SELECTION) {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        toggleHold(num - 1);
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function init() {
  UI.init();
  loadSettings();
  UI.applySettings();
  
  AudioManager.init();
  AudioManager.masterVolume = game.volume;
  
  // Initialize UI
  UI.updateCredits();
  UI.updateBet();
  UI.updateWin(0);
  UI.renderHand(false);
  UI.updateHolds();
  UI.updateDealButton();
  UI.updateInstruction('Set your bet, then tap DEAL.');
  
  // Hide sound prompt (sound enabled by default)
  UI.hideSoundPrompt();
  
  // Setup events
  setupEventListeners();
  
  console.log('Video Poker initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
