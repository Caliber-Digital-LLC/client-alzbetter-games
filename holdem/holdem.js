/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TEXAS HOLD'EM - Game Logic
 * A friendly Texas Hold'em game with AI opponents
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Chips
  STARTING_CHIPS: 200,
  
  // Blinds
  SMALL_BLIND: 1,
  BIG_BLIND: 2,
  
  // Player Favor (65% - bots make weaker decisions)
  PLAYER_FAVOR_RATE: 0.65,
  
  // Bot Timing
  BOT_THINK_MIN: 800,
  BOT_THINK_MAX: 2000,
  
  // Round Timing
  DEAL_DELAY: 300,
  REVEAL_DELAY: 500,
  RESULT_DISPLAY_TIME: 3000,
};

// Bot names
const BOT_NAMES = ['Sunny', 'Max'];

// Card constants
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

// Hand rankings
const HAND_RANKS = {
  'high-card': 0,
  'one-pair': 1,
  'two-pair': 2,
  'three-of-a-kind': 3,
  'straight': 4,
  'flush': 5,
  'full-house': 6,
  'four-of-a-kind': 7,
  'straight-flush': 8,
  'royal-flush': 9
};

const HAND_NAMES = {
  'high-card': 'High Card',
  'one-pair': 'One Pair',
  'two-pair': 'Two Pair',
  'three-of-a-kind': 'Three of a Kind',
  'straight': 'Straight',
  'flush': 'Flush',
  'full-house': 'Full House',
  'four-of-a-kind': 'Four of a Kind',
  'straight-flush': 'Straight Flush',
  'royal-flush': 'Royal Flush'
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════════

const GamePhase = {
  WAITING: 'WAITING',
  PREFLOP: 'PREFLOP',
  FLOP: 'FLOP',
  TURN: 'TURN',
  RIVER: 'RIVER',
  SHOWDOWN: 'SHOWDOWN'
};

const game = {
  phase: GamePhase.WAITING,
  deck: [],
  
  // Community cards
  community: [],
  
  // Players: 0 = player, 1 & 2 = bots
  players: [
    { name: 'You', chips: CONFIG.STARTING_CHIPS, cards: [], bet: 0, folded: false, isBot: false },
    { name: BOT_NAMES[0], chips: CONFIG.STARTING_CHIPS, cards: [], bet: 0, folded: false, isBot: true },
    { name: BOT_NAMES[1], chips: CONFIG.STARTING_CHIPS, cards: [], bet: 0, folded: false, isBot: true }
  ],
  
  // Positions
  dealerIndex: 0,
  currentPlayerIndex: 0,
  
  // Betting
  pot: 0,
  currentBet: 0,
  minRaise: CONFIG.BIG_BLIND,
  
  // Round tracking
  lastRaiser: -1,
  actionCount: 0,

  // Betting-round state (persists across re-entrant runBettingRound/playerAction)
  pendingPhase: null,
  pendingPlayers: null,
  
  // Settings
  soundEnabled: true,
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

function dealCard() {
  return game.deck.pop();
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAND EVALUATION
// ═══════════════════════════════════════════════════════════════════════════════

function evaluateHand(cards) {
  if (!cards || cards.length < 5) return { rank: 'high-card', value: 0, kickers: [] };
  
  // Get all 5-card combinations
  const combinations = getCombinations(cards, 5);
  let bestHand = { rank: 'high-card', value: 0, kickers: [] };
  
  for (const combo of combinations) {
    const hand = evaluateFiveCards(combo);
    if (compareHands(hand, bestHand) > 0) {
      bestHand = hand;
    }
  }
  
  return bestHand;
}

function getCombinations(arr, size) {
  const results = [];
  
  function combine(start, combo) {
    if (combo.length === size) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  
  combine(0, []);
  return results;
}

function evaluateFiveCards(cards) {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map(c => c.value);
  const suits = sorted.map(c => c.suit);
  
  // Count ranks
  const rankCounts = {};
  for (const card of cards) {
    rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
  }
  const counts = Object.entries(rankCounts)
    .map(([val, count]) => ({ value: parseInt(val), count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
  
  // Check flush
  const isFlush = suits.every(s => s === suits[0]);
  
  // Check straight
  let isStraight = false;
  let straightHigh = 0;
  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
  
  if (uniqueValues.length === 5) {
    if (uniqueValues[0] - uniqueValues[4] === 4) {
      isStraight = true;
      straightHigh = uniqueValues[0];
    }
    // Ace-low straight (wheel)
    if (uniqueValues[0] === 14 && uniqueValues[1] === 5) {
      isStraight = true;
      straightHigh = 5;
    }
  }
  
  // Check for royal
  const isRoyal = isStraight && isFlush && uniqueValues[0] === 14 && uniqueValues[4] === 10;
  
  // Determine hand rank
  if (isRoyal) {
    return { rank: 'royal-flush', value: 14, kickers: [] };
  }
  if (isStraight && isFlush) {
    return { rank: 'straight-flush', value: straightHigh, kickers: [] };
  }
  if (counts[0].count === 4) {
    return { rank: 'four-of-a-kind', value: counts[0].value, kickers: [counts[1].value] };
  }
  if (counts[0].count === 3 && counts[1].count === 2) {
    return { rank: 'full-house', value: counts[0].value, kickers: [counts[1].value] };
  }
  if (isFlush) {
    return { rank: 'flush', value: values[0], kickers: values.slice(1) };
  }
  if (isStraight) {
    return { rank: 'straight', value: straightHigh, kickers: [] };
  }
  if (counts[0].count === 3) {
    return { rank: 'three-of-a-kind', value: counts[0].value, kickers: [counts[1].value, counts[2].value] };
  }
  if (counts[0].count === 2 && counts[1].count === 2) {
    return { rank: 'two-pair', value: counts[0].value, kickers: [counts[1].value, counts[2].value] };
  }
  if (counts[0].count === 2) {
    return { rank: 'one-pair', value: counts[0].value, kickers: [counts[1].value, counts[2].value, counts[3].value] };
  }
  
  return { rank: 'high-card', value: values[0], kickers: values.slice(1) };
}

function compareHands(a, b) {
  const rankDiff = HAND_RANKS[a.rank] - HAND_RANKS[b.rank];
  if (rankDiff !== 0) return rankDiff;
  
  if (a.value !== b.value) return a.value - b.value;
  
  for (let i = 0; i < Math.max(a.kickers.length, b.kickers.length); i++) {
    const kickerA = a.kickers[i] || 0;
    const kickerB = b.kickers[i] || 0;
    if (kickerA !== kickerB) return kickerA - kickerB;
  }
  
  return 0; // Tie
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOT AI
// ═══════════════════════════════════════════════════════════════════════════════

function getBotDecision(botIndex) {
  const bot = game.players[botIndex];
  const amountToCall = game.currentBet - bot.bet;
  
  // Get bot's hand strength with available cards
  const availableCards = [...bot.cards, ...game.community];
  let handStrength = 0;
  
  if (availableCards.length >= 5) {
    const hand = evaluateHand(availableCards);
    handStrength = HAND_RANKS[hand.rank] / 9; // Normalize to 0-1
  } else if (availableCards.length === 2) {
    // Pre-flop: evaluate starting hand strength
    handStrength = evaluateStartingHand(bot.cards);
  }
  
  // Apply player favor - bot makes weaker decisions 65% of the time
  if (getRandomFloat() < CONFIG.PLAYER_FAVOR_RATE) {
    handStrength *= 0.5; // Bot underestimates their hand
  }
  
  // Decision logic
  const potOdds = amountToCall / (game.pot + amountToCall + 1);
  
  // If nothing to call, check/bet based on strength
  if (amountToCall === 0) {
    if (handStrength > 0.6) {
      // Strong hand - raise
      return { action: 'raise', amount: Math.min(CONFIG.BIG_BLIND * 2, bot.chips) };
    }
    return { action: 'check' };
  }
  
  // Calculate if call is worth it
  if (handStrength > potOdds + 0.1) {
    // Good odds - might raise or call
    if (handStrength > 0.7 && getRandomFloat() > 0.5) {
      return { action: 'raise', amount: Math.min(amountToCall + CONFIG.BIG_BLIND * 2, bot.chips) };
    }
    return { action: 'call' };
  } else if (handStrength > potOdds - 0.1) {
    // Marginal - usually call
    if (getRandomFloat() > 0.3) {
      return { action: 'call' };
    }
    return { action: 'fold' };
  }
  
  // Poor odds - fold (but sometimes bluff)
  if (getRandomFloat() < 0.1 && bot.chips > amountToCall) {
    return { action: 'call' }; // Occasional bluff call
  }
  
  return { action: 'fold' };
}

function evaluateStartingHand(cards) {
  if (cards.length !== 2) return 0;
  
  const [c1, c2] = cards.sort((a, b) => b.value - a.value);
  const isPair = c1.value === c2.value;
  const isSuited = c1.suit === c2.suit;
  const gap = c1.value - c2.value;
  
  let strength = 0;
  
  // Pairs
  if (isPair) {
    strength = 0.3 + (c1.value / 14) * 0.6; // Higher pairs are stronger
    if (c1.value >= 10) strength += 0.2; // Premium pairs
  } else {
    // High cards
    strength = ((c1.value + c2.value) / 28) * 0.4;
    
    // Suited bonus
    if (isSuited) strength += 0.1;
    
    // Connected bonus (straight potential)
    if (gap <= 4) strength += (5 - gap) * 0.02;
    
    // Both high cards bonus
    if (c1.value >= 11 && c2.value >= 10) strength += 0.15;
  }
  
  return Math.min(strength, 1);
}

async function executeBotAction(botIndex) {
  const bot = game.players[botIndex];
  if (bot.folded || bot.chips <= 0) return null;
  
  // Show thinking
  UI.showBotThinking(botIndex, true);
  
  // Random think time
  const thinkTime = CONFIG.BOT_THINK_MIN + getRandomInt(CONFIG.BOT_THINK_MAX - CONFIG.BOT_THINK_MIN);
  await sleep(thinkTime);
  
  const decision = getBotDecision(botIndex);
  
  UI.showBotThinking(botIndex, false);
  
  switch (decision.action) {
    case 'fold':
      bot.folded = true;
      UI.showBotAction(botIndex, 'Fold', 'fold');
      AudioManager.playFold();
      break;
    case 'check':
      UI.showBotAction(botIndex, 'Check');
      AudioManager.playCheck();
      break;
    case 'call':
      const callAmount = Math.min(game.currentBet - bot.bet, bot.chips);
      bot.chips -= callAmount;
      bot.bet += callAmount;
      game.pot += callAmount;
      UI.showBotAction(botIndex, `Call ${callAmount}`);
      AudioManager.playBet();
      break;
    case 'raise':
      const raiseAmount = Math.min(decision.amount, bot.chips);
      bot.chips -= raiseAmount;
      bot.bet += raiseAmount;
      game.pot += raiseAmount;
      game.currentBet = bot.bet;
      game.lastRaiser = botIndex;
      UI.showBotAction(botIndex, `Raise ${raiseAmount}`);
      AudioManager.playBet();
      break;
  }
  
  UI.updateAll();

  return decision.action;
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
  },
  
  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    game.volume = this.masterVolume;
  },
  
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!game.soundEnabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  
  playClick() {
    this.playTone(800, 0.05, 'sine', 0.2);
  },
  
  playDeal() {
    this.playTone(400, 0.08, 'triangle', 0.25);
  },
  
  playBet() {
    this.playTone(600, 0.1, 'sine', 0.3);
  },
  
  playCheck() {
    this.playTone(500, 0.05, 'sine', 0.15);
  },
  
  playFold() {
    this.playTone(300, 0.15, 'sine', 0.2);
  },
  
  playWin() {
    const now = this.ctx?.currentTime || 0;
    [523, 659, 784].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.3), i * 100);
    });
  },
  
  playLose() {
    this.playTone(250, 0.3, 'sawtooth', 0.2);
  },
  
  playReveal() {
    this.playTone(700, 0.08, 'square', 0.15);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const UI = {
  els: {},
  
  init() {
    // Cache elements
    this.els = {
      chipsValue: document.getElementById('chips-value'),
      potValue: document.getElementById('pot-value'),
      gameStatus: document.getElementById('game-status'),
      communityCards: document.getElementById('community-cards'),
      playerCards: document.getElementById('player-cards'),
      playerHandLabel: document.getElementById('player-hand-label'),
      resultDisplay: document.getElementById('result-display'),
      resultText: document.getElementById('result-text'),
      betToCall: document.getElementById('bet-to-call'),
      callAmount: document.getElementById('call-amount'),
      
      btnDeal: document.getElementById('btn-deal'),
      btnFold: document.getElementById('btn-fold'),
      btnCheckCall: document.getElementById('btn-check-call'),
      btnRaise: document.getElementById('btn-raise'),
      btnHelp: document.getElementById('btn-help'),
      btnSettings: document.getElementById('btn-settings'),
      btnSound: document.getElementById('btn-sound'),
      
      helpModal: document.getElementById('help-modal'),
      settingsModal: document.getElementById('settings-modal'),
      closeHelp: document.getElementById('close-help'),
      closeSettings: document.getElementById('close-settings'),
      volumeSlider: document.getElementById('volume-slider'),
      
      iconSoundOn: document.getElementById('icon-sound-on'),
      iconSoundOff: document.getElementById('icon-sound-off'),
      
      opponents: [
        document.getElementById('opponent-0'),
        document.getElementById('opponent-1')
      ],
      opponentActions: [
        document.getElementById('opponent-0-action'),
        document.getElementById('opponent-1-action')
      ],
      dealerButtons: [
        document.getElementById('dealer-0'),
        document.getElementById('dealer-1'),
        document.getElementById('dealer-player')
      ]
    };
    
    this.bindEvents();
    this.updateSoundIcon();
  },
  
  bindEvents() {
    const bind = (el, eventName, handler) => {
      if (!el) return;
      el.addEventListener(eventName, handler);
    };

    // Action buttons
    bind(this.els.btnDeal, 'click', () => startHand());
    bind(this.els.btnFold, 'click', () => playerAction('fold'));
    bind(this.els.btnCheckCall, 'click', () => playerAction('check-call'));
    bind(this.els.btnRaise, 'click', () => playerAction('raise'));
    
    // Sound toggle
    bind(this.els.btnSound, 'click', () => {
      game.soundEnabled = !game.soundEnabled;
      this.updateSoundIcon();
      AudioManager.unlock();
    });
    
    // Modals
    bind(this.els.btnHelp, 'click', () => this.showModal('help'));
    bind(this.els.btnSettings, 'click', () => this.showModal('settings'));
    bind(this.els.closeHelp, 'click', () => this.hideModal('help'));
    bind(this.els.closeSettings, 'click', () => this.hideModal('settings'));
    
    // Volume
    bind(this.els.volumeSlider, 'input', (e) => {
      AudioManager.setVolume(e.target.value / 100);
    });
    
    // Modal backdrop click
    bind(this.els.helpModal, 'click', (e) => {
      if (e.target === this.els.helpModal) this.hideModal('help');
    });
    bind(this.els.settingsModal, 'click', (e) => {
      if (e.target === this.els.settingsModal) this.hideModal('settings');
    });
  },
  
  updateAll() {
    const player = game.players[0];
    
    // Update chips
    this.els.chipsValue.textContent = player.chips;
    this.els.potValue.textContent = game.pot;
    
    // Update opponents
    for (let i = 1; i <= 2; i++) {
      const bot = game.players[i];
      const opponentEl = this.els.opponents[i - 1];
      opponentEl.querySelector('.opponent-chips').textContent = bot.chips;
      opponentEl.classList.toggle('folded', bot.folded);
      opponentEl.classList.toggle('active', game.currentPlayerIndex === i && game.phase !== GamePhase.WAITING);
    }
    
    // Update dealer button
    this.els.dealerButtons.forEach((btn, i) => {
      if (!btn) return;

      // On a fresh game / between hands, don't show a dealer marker.
      if (game.phase === GamePhase.WAITING) {
        btn.classList.add('hidden');
        return;
      }

      const playerIndex = i === 2 ? 0 : i + 1;
      btn.classList.toggle('hidden', game.dealerIndex !== playerIndex);
    });
    
    // Update bet to call
    const toCall = game.currentBet - player.bet;
    if (toCall > 0 && !player.folded && game.phase !== GamePhase.WAITING && game.phase !== GamePhase.SHOWDOWN) {
      this.els.betToCall.classList.remove('hidden');
      this.els.callAmount.textContent = toCall;
    } else {
      this.els.betToCall.classList.add('hidden');
    }
    
    // Update action buttons
    this.updateButtons();
    
    // Update player hand label
    this.updatePlayerHandLabel();
  },
  
  updateButtons() {
    const player = game.players[0];
    const isPlayerTurn = game.currentPlayerIndex === 0 && game.phase !== GamePhase.WAITING && game.phase !== GamePhase.SHOWDOWN;
    const toCall = game.currentBet - player.bet;
    
    this.els.btnDeal.style.display = game.phase === GamePhase.WAITING ? 'block' : 'none';
    this.els.btnFold.style.display = game.phase !== GamePhase.WAITING ? 'block' : 'none';
    this.els.btnCheckCall.style.display = game.phase !== GamePhase.WAITING ? 'block' : 'none';
    this.els.btnRaise.style.display = game.phase !== GamePhase.WAITING ? 'block' : 'none';
    
    this.els.btnFold.disabled = !isPlayerTurn;
    this.els.btnCheckCall.disabled = !isPlayerTurn;
    this.els.btnRaise.disabled = !isPlayerTurn || player.chips <= toCall;
    
    // Update check/call button text
    if (toCall > 0) {
      this.els.btnCheckCall.textContent = `Call ${toCall}`;
    } else {
      this.els.btnCheckCall.textContent = 'Check';
    }
  },
  
  updatePlayerHandLabel() {
    const player = game.players[0];
    const availableCards = [...player.cards, ...game.community];
    
    if (availableCards.length >= 5) {
      const hand = evaluateHand(availableCards);
      this.els.playerHandLabel.textContent = HAND_NAMES[hand.rank];
    } else if (player.cards.length > 0) {
      this.els.playerHandLabel.textContent = '';
    } else {
      this.els.playerHandLabel.textContent = '';
    }
  },
  
  updateSoundIcon() {
    if (this.els.iconSoundOn) this.els.iconSoundOn.style.display = game.soundEnabled ? 'block' : 'none';
    if (this.els.iconSoundOff) this.els.iconSoundOff.style.display = game.soundEnabled ? 'none' : 'block';
  },
  
  setStatus(text) {
    this.els.gameStatus.textContent = text;
  },
  
  showBotThinking(botIndex, thinking) {
    const opponentEl = this.els.opponents[botIndex - 1];
    opponentEl.classList.toggle('thinking', thinking);
    if (thinking) {
      this.els.opponentActions[botIndex - 1].textContent = 'Thinking...';
    }
  },
  
  showBotAction(botIndex, action, type = '') {
    const actionEl = this.els.opponentActions[botIndex - 1];
    actionEl.textContent = action;
    actionEl.className = 'opponent-action' + (type ? ` ${type}` : '');
  },
  
  clearBotActions() {
    this.els.opponentActions.forEach(el => {
      el.textContent = '';
      el.className = 'opponent-action';
    });
  },
  
  renderCard(card, element, faceDown = false) {
    if (faceDown) {
      element.className = 'card face-down';
      element.innerHTML = '';
    } else {
      const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
      element.className = `card ${isRed ? 'red' : 'black'}`;
      element.innerHTML = `
        <span class="rank">${card.rank}</span>
        <span class="suit">${SUIT_SYMBOLS[card.suit]}</span>
      `;
    }
  },
  
  renderPlayerCards() {
    const player = game.players[0];
    const card0El = document.getElementById('player-card-0');
    const card1El = document.getElementById('player-card-1');
    
    if (player.cards.length >= 2) {
      this.renderCard(player.cards[0], card0El);
      this.renderCard(player.cards[1], card1El);
    } else {
      card0El.className = 'card empty';
      card1El.className = 'card empty';
      card0El.innerHTML = '';
      card1El.innerHTML = '';
    }
  },
  
  renderOpponentCards(botIndex, reveal = false) {
    const opponent = game.players[botIndex];
    const opponentEl = this.els.opponents[botIndex - 1];
    const cardsContainer = opponentEl.querySelector('.opponent-cards');
    
    if (opponent.cards.length >= 2) {
      const cards = cardsContainer.querySelectorAll('.card');
      cards[0].className = 'card face-down small';
      cards[1].className = 'card face-down small';
      
      if (reveal && !opponent.folded) {
        // Reveal opponent cards
        setTimeout(() => {
          const isRed1 = opponent.cards[0].suit === 'hearts' || opponent.cards[0].suit === 'diamonds';
          cards[0].className = `card small ${isRed1 ? 'red' : 'black'} revealed`;
          cards[0].innerHTML = `<span class="rank">${opponent.cards[0].rank}</span><span class="suit">${SUIT_SYMBOLS[opponent.cards[0].suit]}</span>`;
          AudioManager.playReveal();
        }, 200);
        
        setTimeout(() => {
          const isRed2 = opponent.cards[1].suit === 'hearts' || opponent.cards[1].suit === 'diamonds';
          cards[1].className = `card small ${isRed2 ? 'red' : 'black'} revealed`;
          cards[1].innerHTML = `<span class="rank">${opponent.cards[1].rank}</span><span class="suit">${SUIT_SYMBOLS[opponent.cards[1].suit]}</span>`;
          AudioManager.playReveal();
        }, 400);
      }
    }
  },
  
  renderCommunityCards() {
    const slots = this.els.communityCards.querySelectorAll('.card-slot');
    
    for (let i = 0; i < 5; i++) {
      const slot = slots[i];
      
      if (game.community[i]) {
        slot.classList.remove('empty');
        const card = game.community[i];
        const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
        slot.innerHTML = `
          <div class="card ${isRed ? 'red' : 'black'}">
            <span class="rank">${card.rank}</span>
            <span class="suit">${SUIT_SYMBOLS[card.suit]}</span>
          </div>
        `;
      } else {
        slot.classList.add('empty');
        slot.innerHTML = '';
      }
    }
  },
  
  clearTable() {
    // Clear player cards
    const card0El = document.getElementById('player-card-0');
    const card1El = document.getElementById('player-card-1');
    card0El.className = 'card empty';
    card1El.className = 'card empty';
    card0El.innerHTML = '';
    card1El.innerHTML = '';
    
    // Clear opponent cards
    for (let i = 1; i <= 2; i++) {
      const opponentEl = this.els.opponents[i - 1];
      const cards = opponentEl.querySelectorAll('.card');
      cards.forEach(card => {
        card.className = 'card face-down small';
        card.innerHTML = '';
      });
    }
    
    // Clear community cards
    const slots = this.els.communityCards.querySelectorAll('.card-slot');
    slots.forEach(slot => {
      slot.classList.add('empty');
      slot.innerHTML = '';
    });
    
    this.els.playerHandLabel.textContent = '';
  },
  
  showResult(text, isWin) {
    this.els.resultDisplay.classList.remove('hidden', 'win', 'lose');
    this.els.resultDisplay.classList.add(isWin ? 'win' : 'lose');
    this.els.resultText.textContent = text;
  },
  
  hideResult() {
    this.els.resultDisplay.classList.add('hidden');
  },
  
  showModal(type) {
    if (type === 'help') {
      this.els.helpModal.classList.remove('hidden');
    } else if (type === 'settings') {
      this.els.settingsModal.classList.remove('hidden');
    }
    AudioManager.playClick();
  },
  
  hideModal(type) {
    if (type === 'help') {
      this.els.helpModal.classList.add('hidden');
    } else if (type === 'settings') {
      this.els.settingsModal.classList.add('hidden');
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startHand() {
  // Check if player has chips
  if (game.players[0].chips < CONFIG.BIG_BLIND) {
    resetGame();
    return;
  }
  
  AudioManager.unlock();
  UI.hideResult();
  UI.clearBotActions();
  UI.clearTable();
  
  // Reset for new hand
  game.deck = shuffleDeck(createDeck());
  game.community = [];
  game.pot = 0;
  game.currentBet = 0;
  game.lastRaiser = -1;
  game.actionCount = 0;
  
  // Reset player states
  for (const player of game.players) {
    player.cards = [];
    player.bet = 0;
    player.folded = false;
  }
  
  // Move dealer button
  game.dealerIndex = (game.dealerIndex + 1) % 3;
  
  // Post blinds
  const smallBlindIndex = (game.dealerIndex + 1) % 3;
  const bigBlindIndex = (game.dealerIndex + 2) % 3;
  
  // Small blind
  const sbPlayer = game.players[smallBlindIndex];
  const sbAmount = Math.min(CONFIG.SMALL_BLIND, sbPlayer.chips);
  sbPlayer.chips -= sbAmount;
  sbPlayer.bet = sbAmount;
  game.pot += sbAmount;
  
  // Big blind
  const bbPlayer = game.players[bigBlindIndex];
  const bbAmount = Math.min(CONFIG.BIG_BLIND, bbPlayer.chips);
  bbPlayer.chips -= bbAmount;
  bbPlayer.bet = bbAmount;
  game.pot += bbAmount;
  game.currentBet = CONFIG.BIG_BLIND;
  
  UI.setStatus('Dealing cards...');
  
  // Deal hole cards
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      game.players[j].cards.push(dealCard());
    }
  }
  
  await sleep(CONFIG.DEAL_DELAY);
  UI.renderPlayerCards();
  AudioManager.playDeal();
  
  await sleep(CONFIG.DEAL_DELAY);
  UI.renderOpponentCards(1);
  AudioManager.playDeal();
  
  await sleep(CONFIG.DEAL_DELAY);
  UI.renderOpponentCards(2);
  AudioManager.playDeal();
  
  // Start pre-flop betting
  game.phase = GamePhase.PREFLOP;
  game.currentPlayerIndex = (bigBlindIndex + 1) % 3;
  
  UI.updateAll();
  UI.setStatus('Pre-flop betting');
  
  await runBettingRound();
}

async function runBettingRound() {
  function resetPendingForCurrentPhase() {
    game.pendingPhase = game.phase;
    game.pendingPlayers = new Set();
    for (let i = 0; i < game.players.length; i++) {
      const p = game.players[i];
      if (!p.folded && p.chips > 0) {
        game.pendingPlayers.add(i);
      }
    }
    game.lastRaiser = -1;
  }

  if (game.pendingPhase !== game.phase || !game.pendingPlayers) {
    resetPendingForCurrentPhase();
  }

  // Step the round forward until it's the human's turn, the round ends, or we hit a safety limit.
  for (let safety = 0; safety < 60; safety++) {
    const remainingPlayers = game.players.filter(p => !p.folded).length;
    if (remainingPlayers <= 1) {
      await endHand();
      return;
    }

    const allCalledOrAllInOrFolded = game.players.every(p =>
      p.folded || p.chips <= 0 || p.bet === game.currentBet
    );

    if (allCalledOrAllInOrFolded && game.pendingPlayers.size === 0) {
      game.pendingPlayers = null;
      await nextPhase();
      return;
    }

    // Find next player who both can act and still owes an action in this street.
    let attempts = 0;
    while (
      attempts < 3 &&
      (
        game.players[game.currentPlayerIndex].folded ||
        game.players[game.currentPlayerIndex].chips <= 0 ||
        !game.pendingPlayers.has(game.currentPlayerIndex)
      )
    ) {
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 3;
      attempts++;
    }

    // If nobody can act, but bets are aligned, move on.
    if (
      game.players[game.currentPlayerIndex].folded ||
      game.players[game.currentPlayerIndex].chips <= 0 ||
      !game.pendingPlayers.has(game.currentPlayerIndex)
    ) {
      if (allCalledOrAllInOrFolded) {
        game.pendingPlayers = null;
        await nextPhase();
      }
      return;
    }

    const playerIndex = game.currentPlayerIndex;
    const player = game.players[playerIndex];

    UI.updateAll();

    if (!player.isBot) {
      UI.setStatus('Your turn');
      return;
    }

    const prevBet = game.currentBet;
    const botAction = await executeBotAction(playerIndex);

    // Bot may have been unable to act (e.g. just went all-in earlier).
    if (botAction) {
      game.pendingPlayers.delete(playerIndex);

      // If bot raised, everyone else with chips must respond.
      if (botAction === 'raise' && game.currentBet > prevBet) {
        const newPending = new Set();
        for (let i = 0; i < game.players.length; i++) {
          if (i === playerIndex) continue;
          const p = game.players[i];
          if (!p.folded && p.chips > 0) newPending.add(i);
        }
        game.pendingPlayers = newPending;
      }
    }

    game.currentPlayerIndex = (playerIndex + 1) % 3;
  }

  // Safety fallback: avoid soft-locking the UI.
  game.pendingPlayers = null;
  await nextPhase();
}

async function playerAction(action) {
  const player = game.players[0];
  const toCall = game.currentBet - player.bet;

  function ensurePendingReady() {
    if (game.pendingPhase === game.phase && game.pendingPlayers) return;
    game.pendingPhase = game.phase;
    game.pendingPlayers = new Set();
    for (let i = 0; i < game.players.length; i++) {
      const p = game.players[i];
      if (!p.folded && p.chips > 0) game.pendingPlayers.add(i);
    }
    game.lastRaiser = -1;
  }

  ensurePendingReady();
  const prevBet = game.currentBet;
  
  switch (action) {
    case 'fold':
      player.folded = true;
      AudioManager.playFold();
      break;
      
    case 'check-call':
      if (toCall > 0) {
        const callAmount = Math.min(toCall, player.chips);
        player.chips -= callAmount;
        player.bet += callAmount;
        game.pot += callAmount;
        AudioManager.playBet();
      } else {
        AudioManager.playCheck();
      }
      break;
      
    case 'raise':
      // Simple raise: double the current bet
      const targetBet = Math.min(
        game.currentBet + CONFIG.BIG_BLIND * 2,
        player.bet + player.chips
      );
      const actualRaise = targetBet - player.bet;

      if (actualRaise > 0) {
        player.chips -= actualRaise;
        player.bet = targetBet;
        game.pot += actualRaise;
        game.currentBet = targetBet;
        game.lastRaiser = 0;
        AudioManager.playBet();
      } else {
        // Can't raise (not enough chips); treat as check/call.
        if (toCall > 0) {
          const callAmount = Math.min(toCall, player.chips);
          player.chips -= callAmount;
          player.bet += callAmount;
          game.pot += callAmount;
          AudioManager.playBet();
        } else {
          AudioManager.playCheck();
        }
      }
      break;
  }

  // Mark player as having acted this street
  if (game.pendingPlayers) {
    game.pendingPlayers.delete(0);
  }

  // If player raised, everyone else with chips must respond.
  if (action === 'raise' && game.pendingPlayers && game.currentBet > prevBet) {
    const newPending = new Set();
    for (let i = 0; i < game.players.length; i++) {
      if (i === 0) continue;
      const p = game.players[i];
      if (!p.folded && p.chips > 0) newPending.add(i);
    }
    game.pendingPlayers = newPending;
  }
  
  UI.updateAll();
  
  // Check if only one player left
  const remainingPlayers = game.players.filter(p => !p.folded);
  if (remainingPlayers.length === 1) {
    await endHand();
    return;
  }
  
  // Continue betting round
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 3;
  await runBettingRound();
}

async function nextPhase() {
  // Reset bets for new round
  for (const player of game.players) {
    player.bet = 0;
  }
  game.currentBet = 0;
  game.lastRaiser = -1;

  // Reset betting-round pending state for the new street
  game.pendingPhase = null;
  game.pendingPlayers = null;
  
  // Check if we should skip straight to showdown (all but one player is all-in)
  const activePlayers = game.players.filter(p => !p.folded && p.chips > 0);
  const allInPlayers = game.players.filter(p => !p.folded && p.chips === 0);
  
  if (activePlayers.length <= 1 && allInPlayers.length > 0) {
    // Fast forward to showdown
    while (game.phase !== GamePhase.RIVER) {
      if (game.phase === GamePhase.PREFLOP) {
        game.phase = GamePhase.FLOP;
        for (let i = 0; i < 3; i++) game.community.push(dealCard());
      } else if (game.phase === GamePhase.FLOP) {
        game.phase = GamePhase.TURN;
        game.community.push(dealCard());
      } else if (game.phase === GamePhase.TURN) {
        game.phase = GamePhase.RIVER;
        game.community.push(dealCard());
      }
    }
    UI.renderCommunityCards();
    await sleep(1000);
    await showdown();
    return;
  }
  
  switch (game.phase) {
    case GamePhase.PREFLOP:
      // Deal flop
      game.phase = GamePhase.FLOP;
      UI.setStatus('Dealing the flop...');
      for (let i = 0; i < 3; i++) {
        await sleep(CONFIG.DEAL_DELAY);
        game.community.push(dealCard());
        UI.renderCommunityCards();
        AudioManager.playDeal();
      }
      break;
      
    case GamePhase.FLOP:
      // Deal turn
      game.phase = GamePhase.TURN;
      UI.setStatus('Dealing the turn...');
      await sleep(CONFIG.DEAL_DELAY);
      game.community.push(dealCard());
      UI.renderCommunityCards();
      AudioManager.playDeal();
      break;
      
    case GamePhase.TURN:
      // Deal river
      game.phase = GamePhase.RIVER;
      UI.setStatus('Dealing the river...');
      await sleep(CONFIG.DEAL_DELAY);
      game.community.push(dealCard());
      UI.renderCommunityCards();
      AudioManager.playDeal();
      break;
      
    case GamePhase.RIVER:
      // Go to showdown
      await showdown();
      return;
  }
  
  // Start new betting round (first active player after dealer)
  game.currentPlayerIndex = (game.dealerIndex + 1) % 3;
  while (game.players[game.currentPlayerIndex].folded || game.players[game.currentPlayerIndex].chips <= 0) {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 3;
  }
  
  UI.updateAll();
  
  await sleep(500);
  await runBettingRound();
}

async function showdown() {
  game.phase = GamePhase.SHOWDOWN;
  UI.setStatus('Showdown!');
  
  // Reveal opponent cards
  for (let i = 1; i <= 2; i++) {
    if (!game.players[i].folded) {
      UI.renderOpponentCards(i, true);
    }
  }
  
  await sleep(800);
  
  // Evaluate all hands
  const results = [];
  for (let i = 0; i < 3; i++) {
    const player = game.players[i];
    if (!player.folded) {
      const hand = evaluateHand([...player.cards, ...game.community]);
      results.push({ index: i, hand, player });
    }
  }
  
  // Sort by hand strength
  results.sort((a, b) => compareHands(b.hand, a.hand));
  
  // Determine winner(s)
  const winners = [results[0]];
  for (let i = 1; i < results.length; i++) {
    if (compareHands(results[i].hand, results[0].hand) === 0) {
      winners.push(results[i]);
    }
  }
  
  // Award pot
  const winAmount = Math.floor(game.pot / winners.length);
  for (const winner of winners) {
    winner.player.chips += winAmount;
  }
  
  // Show result
  const playerWon = winners.some(w => w.index === 0);
  const playerHand = results.find(r => r.index === 0);
  
  if (playerWon) {
    const winText = winners.length > 1 ? `Split pot! +${winAmount}` : `You win! +${winAmount}`;
    UI.showResult(`${winText}\n${HAND_NAMES[playerHand.hand.rank]}`, true);
    AudioManager.playWin();
  } else {
    UI.showResult(`${winners[0].player.name} wins\n${HAND_NAMES[winners[0].hand.rank]}`, false);
    AudioManager.playLose();
  }
  
  game.pot = 0;
  UI.updateAll();
  
  // Prepare for next hand
  await sleep(CONFIG.RESULT_DISPLAY_TIME);
  await prepareNextHand();
}

async function endHand() {
  // Someone won without showdown
  const winner = game.players.find(p => !p.folded && p.chips > 0) || game.players.find(p => !p.folded);
  winner.chips += game.pot;
  
  const playerWon = winner === game.players[0];
  
  if (playerWon) {
    UI.showResult(`You win! +${game.pot}`, true);
    AudioManager.playWin();
  } else {
    UI.showResult(`${winner.name} wins!`, false);
    AudioManager.playLose();
  }
  
  game.pot = 0;
  UI.updateAll();
  
  await sleep(CONFIG.RESULT_DISPLAY_TIME);
  await prepareNextHand();
}

async function prepareNextHand() {
  game.phase = GamePhase.WAITING;
  UI.hideResult();
  UI.clearTable();
  UI.clearBotActions();
  
  // Eliminate broke players (bots just get reset chips)
  for (let i = 1; i <= 2; i++) {
    if (game.players[i].chips <= 0) {
      game.players[i].chips = CONFIG.STARTING_CHIPS;
    }
  }
  
  // Check if player busted
  if (game.players[0].chips <= 0) {
    UI.setStatus('Out of chips! Tap DEAL to restart');
  } else {
    UI.setStatus('Tap DEAL to continue');
  }
  
  UI.updateAll();
}

function resetGame() {
  for (const player of game.players) {
    player.chips = CONFIG.STARTING_CHIPS;
    player.cards = [];
    player.bet = 0;
    player.folded = false;
  }
  
  game.phase = GamePhase.WAITING;
  game.pot = 0;
  game.community = [];
  game.dealerIndex = 0;
  
  UI.clearTable();
  UI.hideResult();
  UI.setStatus('Tap DEAL to start');
  UI.updateAll();
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function init() {
  UI.init();
  AudioManager.init();
  UI.updateAll();
  UI.setStatus('Tap DEAL to start');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
