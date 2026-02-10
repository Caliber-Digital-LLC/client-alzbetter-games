/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CRAPS - Game Logic
 * A senior-friendly casino craps game
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION (TUNING SECTION)
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Credits
  STARTING_CREDITS: 200,
  
  // Betting
  BET_INCREMENT: 5,
  MIN_BET: 5,
  MAX_BET: 50,
  
  // Timing
  AUTO_ROLL_DELAY: 2500,   // ms between auto rolls
  DICE_ANIMATION_MS: 400,  // dice shake duration
  RESULT_DELAY_MS: 800,    // delay before showing result
  
  // Player favor (65% chance to push on loss)
  PLAYER_FAVOR_RATE: 0.65,
  
  // History
  MAX_HISTORY: 6,
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════════

const GameState = {
  IDLE_BETTING: 'IDLE_BETTING',
  ROLLING: 'ROLLING',
  POINT_PHASE: 'POINT_PHASE',
  ROUND_END: 'ROUND_END',
};

const game = {
  state: GameState.IDLE_BETTING,
  credits: CONFIG.STARTING_CREDITS,
  point: null,
  isComeOut: true,
  
  // Current bets
  bets: {
    pass: 0,
    dontPass: 0,
    field: 0,
  },
  
  // Dice values
  dice: [1, 1],
  
  // Roll history
  history: [],
  
  // Auto roll
  autoRollEnabled: false,
  autoRollTimer: null,
  
  // Settings
  soundEnabled: true,
  audioUnlocked: false,
  reducedMotion: false,
  volume: 0.6,
};

// ═══════════════════════════════════════════════════════════════════════════════
// CRYPTO RNG
// ═══════════════════════════════════════════════════════════════════════════════

function rollDie() {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return (array[0] % 6) + 1;
}

function rollDice() {
  return [rollDie(), rollDie()];
}

// Player favor: 65% chance to push on loss
function shouldTriggerPlayerFavor() {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return (array[0] / 0xFFFFFFFF) < CONFIG.PLAYER_FAVOR_RATE;
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
  
  // Soft click sound
  playClick() {
    if (!game.soundEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.1 * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialDecayTo = gain.gain.exponentialRampToValueAtTime || gain.gain.linearRampToValueAtTime;
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  },
  
  // Dice rattle sound
  playDiceRoll() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const duration = 0.35;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate filtered noise that sounds like dice rattling
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      const envelope = Math.exp(-t * 8);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    const gain = this.ctx.createGain();
    gain.gain.value = 0.4 * this.masterVolume;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  },
  
  // Dice land ticks
  playDiceLand() {
    if (!game.soundEnabled || !this.ctx) return;
    
    // Two soft ticks
    [0, 0.08].forEach(delay => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = 400 + Math.random() * 100;
      gain.gain.setValueAtTime(0.15 * this.masterVolume, this.ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.08);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.08);
    });
  },
  
  // Win sound - pleasant chord
  playWin() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const notes = [523.25, 659.26, 783.99]; // C5, E5, G5 major chord
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
  
  // Big win sound - arpeggio flourish
  playBigWin() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const notes = [523.25, 659.26, 783.99, 1046.5, 783.99, 1046.5]; // C5 E5 G5 C6 G5 C6
    
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = this.ctx.currentTime + i * 0.08;
      const amp = i < 4 ? 0.15 : 0.1;
      gain.gain.setValueAtTime(amp * this.masterVolume, startTime);
      gain.gain.linearRampToValueAtTime(0.001, startTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  },
  
  // Loss sound - neutral low tone
  playLoss() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 220; // A3
    gain.gain.setValueAtTime(0.1 * this.masterVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  },
  
  // Push sound - neutral tone
  playPush() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = 440; // A4
    gain.gain.setValueAtTime(0.08 * this.masterVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  },
};
    if (!game.soundEnabled || !this.ctx) return;
    
    const notes = [880, 1174.66, 1396.91]; // A5, D6, F6
    
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
  // Element references (cached on init)
  els: {},
  
  init() {
    // Cache all element references
    this.els = {
      credits: document.getElementById('credits-value'),
      betValue: document.getElementById('bet-value'),
      phaseLabel: document.getElementById('phase-label'),
      pointValue: document.getElementById('point-value'),
      instruction: document.getElementById('instruction'),
      diceArea: document.getElementById('dice-area'),
      die1: document.getElementById('die1'),
      die2: document.getElementById('die2'),
      rollTotal: document.getElementById('roll-total'),
      rollHistory: document.getElementById('roll-history'),
      
      // Bet displays
      passBetAmount: document.getElementById('pass-bet-amount'),
      dontpassBetAmount: document.getElementById('dontpass-bet-amount'),
      fieldBetAmount: document.getElementById('field-bet-amount'),
      
      // Bet cards
      passBetCard: document.getElementById('pass-bet-card'),
      dontpassBetCard: document.getElementById('dontpass-bet-card'),
      fieldBetCard: document.getElementById('field-bet-card'),
      
      // Buttons
      btnRoll: document.getElementById('btn-roll'),
      btnClear: document.getElementById('btn-clear'),
      autoRoll: document.getElementById('auto-roll'),
      
      // More bets
      moreBetsToggle: document.getElementById('more-bets-toggle'),
      moreBets: document.getElementById('more-bets'),
      
      // Overlays
      resultOverlay: document.getElementById('result-overlay'),
      resultIcon: document.getElementById('result-icon'),
      resultTitle: document.getElementById('result-title'),
      resultMessage: document.getElementById('result-message'),
      resultPayout: document.getElementById('result-payout'),
      btnContinue: document.getElementById('btn-continue'),
      
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
      reducedMotionToggle: document.getElementById('reduced-motion-toggle'),
    };
  },
  
  updateCredits() {
    this.els.credits.textContent = game.credits;
  },
  
  updateBetValue() {
    const total = game.bets.pass + game.bets.dontPass + game.bets.field;
    this.els.betValue.textContent = total;
  },
  
  updatePhase() {
    if (game.isComeOut) {
      this.els.phaseLabel.textContent = 'Come-Out Roll';
      this.els.pointValue.textContent = '—';
      this.els.pointValue.classList.remove('active');
    } else {
      this.els.phaseLabel.textContent = 'Rolling for Point';
      this.els.pointValue.textContent = game.point;
      this.els.pointValue.classList.add('active');
    }
  },
  
  updateInstruction(text) {
    this.els.instruction.textContent = text;
  },
  
  updateBetDisplays() {
    this.els.passBetAmount.textContent = game.bets.pass;
    this.els.dontpassBetAmount.textContent = game.bets.dontPass;
    this.els.fieldBetAmount.textContent = game.bets.field;
    
    // Update card active states
    this.els.passBetCard.classList.toggle('active', game.bets.pass > 0);
    this.els.dontpassBetCard.classList.toggle('active', game.bets.dontPass > 0);
    this.els.fieldBetCard.classList.toggle('active', game.bets.field > 0);
    
    this.updateBetValue();
  },
  
  lockBets(locked, lockField = false) {
    // Lock/unlock Pass and Don't Pass during point phase
    this.els.passBetCard.classList.toggle('locked', locked);
    this.els.dontpassBetCard.classList.toggle('locked', locked);
    
    if (lockField) {
      this.els.fieldBetCard.classList.toggle('locked', true);
    } else {
      this.els.fieldBetCard.classList.toggle('locked', false);
    }
    
    // Disable all bet buttons if rolling
    const allBetBtns = document.querySelectorAll('.bet-btn');
    allBetBtns.forEach(btn => {
      btn.disabled = game.state === GameState.ROLLING;
    });
  },
  
  renderDie(dieEl, value) {
    const svg = dieEl.querySelector('.die-svg');
    svg.innerHTML = this.getDieSVG(value);
  },
  
  getDieSVG(value) {
    const pipColor = '#1a1a1a';
    const pipR = 8;
    
    // Pip positions for each face
    const positions = {
      1: [[50, 50]],
      2: [[25, 25], [75, 75]],
      3: [[25, 25], [50, 50], [75, 75]],
      4: [[25, 25], [75, 25], [25, 75], [75, 75]],
      5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
      6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
    };
    
    const pips = positions[value] || [];
    const pipsSVG = pips.map(([x, y]) => 
      `<circle cx="${x}" cy="${y}" r="${pipR}" fill="${pipColor}"/>`
    ).join('');
    
    return pipsSVG;
  },
  
  renderDice() {
    this.renderDie(this.els.die1, game.dice[0]);
    this.renderDie(this.els.die2, game.dice[1]);
    
    const total = game.dice[0] + game.dice[1];
    this.els.rollTotal.textContent = total;
    this.els.rollTotal.classList.add('highlight');
    setTimeout(() => this.els.rollTotal.classList.remove('highlight'), 300);
  },
  
  animateDiceRoll(callback) {
    const die1 = this.els.die1;
    const die2 = this.els.die2;
    
    die1.classList.add('rolling');
    die2.classList.add('rolling');
    
    AudioManager.playDiceRoll();
    
    // Hide the roll total during animation
    this.els.rollTotal.textContent = '';
    
    // Animate random faces during roll
    let animFrames = 0;
    const maxFrames = game.reducedMotion ? 2 : 8;
    const interval = setInterval(() => {
      this.renderDie(die1, rollDie());
      this.renderDie(die2, rollDie());
      animFrames++;
      if (animFrames >= maxFrames) {
        clearInterval(interval);
      }
    }, 50);
    
    const animDuration = game.reducedMotion ? 150 : CONFIG.DICE_ANIMATION_MS;
    
    setTimeout(() => {
      clearInterval(interval);
      die1.classList.remove('rolling');
      die2.classList.remove('rolling');
      
      // Show final dice values
      this.renderDice();
      AudioManager.playDiceLand();
      
      if (callback) callback();
    }, animDuration);
  },
  
  updateHistory() {
    const historyEl = this.els.rollHistory;
    historyEl.innerHTML = '';
    
    game.history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.textContent = item.total;
      
      if (item.total === 7) div.classList.add('seven');
      else if (item.total === game.point) div.classList.add('point');
      else if ([2, 3, 12].includes(item.total)) div.classList.add('craps');
      
      historyEl.appendChild(div);
    });
  },
  
  showResult(type, title, message, payout) {
    const icons = {
      win: '🎉',
      bigwin: '🏆',
      lose: '😔',
      push: '🤝',
    };
    
    this.els.resultIcon.textContent = icons[type] || '🎲';
    this.els.resultTitle.textContent = title;
    this.els.resultTitle.className = 'result-title ' + (type === 'win' || type === 'bigwin' ? 'win' : type === 'lose' ? 'lose' : 'push');
    this.els.resultMessage.textContent = message;
    this.els.resultPayout.textContent = payout || '';
    this.els.resultOverlay.classList.remove('hidden');
    
    // Play appropriate sound
    if (type === 'bigwin') {
      AudioManager.playBigWin();
      this.showConfetti();
    } else if (type === 'win') {
      AudioManager.playWin();
    } else if (type === 'lose') {
      AudioManager.playLoss();
    } else {
      AudioManager.playPush();
    }
  },
  
  hideResult() {
    this.els.resultOverlay.classList.add('hidden');
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
  
  toggleMoreBets() {
    const toggle = this.els.moreBetsToggle;
    const container = this.els.moreBets;
    
    toggle.classList.toggle('expanded');
    container.classList.toggle('collapsed');
  },
  
  setRollButtonEnabled(enabled) {
    this.els.btnRoll.disabled = !enabled;
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
  
  applySettings() {
    // High contrast
  applySettings() {
    // Reduced motion
    document.body.classList.toggle('reduce-motion', game.reducedMotion);
    this.els.reducedMotionToggle.checked = game.reducedMotion;
    
    // Volume
    this.els.volumeSlider.value = game.volume * 100;
    AudioManager.masterVolume = game.volume;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

function getTotalBet() {
  return game.bets.pass + game.bets.dontPass + game.bets.field;
}

function canPlaceBet(amount) {
  return game.credits >= amount;
}

function placeBet(betType, amount) {
  if (game.state !== GameState.IDLE_BETTING && game.state !== GameState.POINT_PHASE) return;
  
  // During point phase, only field bets can be changed
  if (game.state === GameState.POINT_PHASE && betType !== 'field') return;
  
  // During come-out, pass/dontPass can't both be bet
  if (game.isComeOut) {
    if (betType === 'pass' && game.bets.dontPass > 0) return;
    if (betType === 'dontPass' && game.bets.pass > 0) return;
  }
  
  const newBet = game.bets[betType] + amount;
  
  if (newBet < 0) {
    // Return credits when reducing bet
    const returned = game.bets[betType];
    game.bets[betType] = 0;
    game.credits += returned;
  } else if (newBet > CONFIG.MAX_BET) {
    // Cap at max
    const diff = CONFIG.MAX_BET - game.bets[betType];
    if (diff > 0 && canPlaceBet(diff)) {
      game.bets[betType] = CONFIG.MAX_BET;
      game.credits -= diff;
    }
  } else if (amount > 0 && canPlaceBet(amount)) {
    game.bets[betType] = newBet;
    game.credits -= amount;
  } else if (amount < 0) {
    // Decreasing bet
    const decrease = Math.min(Math.abs(amount), game.bets[betType]);
    game.bets[betType] -= decrease;
    game.credits += decrease;
  }
  
  AudioManager.playClick();
  UI.updateCredits();
  UI.updateBetDisplays();
  updateInstruction();
}

function clearAllBets() {
  if (game.state !== GameState.IDLE_BETTING) return;
  
  game.credits += game.bets.pass + game.bets.dontPass + game.bets.field;
  game.bets = { pass: 0, dontPass: 0, field: 0 };
  
  AudioManager.playClick();
  UI.updateCredits();
  UI.updateBetDisplays();
  updateInstruction();
}

function updateInstruction() {
  const hasBet = game.bets.pass > 0 || game.bets.dontPass > 0;
  
  if (game.state === GameState.IDLE_BETTING) {
    if (game.isComeOut) {
      if (!hasBet) {
        UI.updateInstruction('Place your Pass Line bet, then tap ROLL.');
      } else {
        UI.updateInstruction('Ready! Tap ROLL to start.');
      }
    }
  } else if (game.state === GameState.POINT_PHASE) {
    UI.updateInstruction(`Point is ${game.point}. Roll ${game.point} to win, 7 to lose.`);
  }
}

function canRoll() {
  if (game.state === GameState.ROLLING) return false;
  if (game.state === GameState.ROUND_END) return false;
  
  // Must have a bet to roll during come-out
  if (game.isComeOut) {
    return game.bets.pass > 0 || game.bets.dontPass > 0;
  }
  
  return true;
}

function performRoll() {
  if (!canRoll()) return;
  
  game.state = GameState.ROLLING;
  
  UI.setRollButtonEnabled(false);
  UI.lockBets(true, true);
  
  // Roll the dice
  game.dice = rollDice();
  
  // Animate and then resolve
  UI.animateDiceRoll(() => {
    const total = game.dice[0] + game.dice[1];
    
    // Add to history
    game.history.unshift({ dice: [...game.dice], total });
    if (game.history.length > CONFIG.MAX_HISTORY) {
      game.history.pop();
    }
    UI.updateHistory();
    
    // Resolve the roll after a brief delay
    setTimeout(() => resolveRoll(total), CONFIG.RESULT_DELAY_MS);
  });
}

function resolveRoll(total) {
  let results = [];
  let totalPayout = 0;
  let showResult = false;
  let resultType = 'push';
  let resultTitle = '';
  let resultMessage = '';
  let triggerPush = false;
  
  // ─── Resolve Field bet (one-roll) ───
  if (game.bets.field > 0) {
    const fieldWins = [2, 3, 4, 9, 10, 11, 12];
    
    if (fieldWins.includes(total)) {
      // 2 and 12 pay 2:1, others pay 1:1
      const multiplier = (total === 2 || total === 12) ? 2 : 1;
      const payout = game.bets.field * (1 + multiplier);
      game.credits += payout;
      totalPayout += payout - game.bets.field;
      results.push({ bet: 'Field', result: 'win', payout: payout - game.bets.field });
    } else {
      results.push({ bet: 'Field', result: 'lose', payout: -game.bets.field });
    }
    game.bets.field = 0;
  }
  
  // ─── Come-Out Roll Resolution ───
  if (game.isComeOut) {
    // Natural (7 or 11)
    if (total === 7 || total === 11) {
      // Pass wins
      if (game.bets.pass > 0) {
        const payout = game.bets.pass * 2;
        game.credits += payout;
        totalPayout += game.bets.pass;
        results.push({ bet: 'Pass Line', result: 'win', payout: game.bets.pass });
        showResult = true;
        resultType = 'win';
        resultTitle = total === 7 ? 'Natural 7!' : 'Natural 11!';
        resultMessage = 'Pass Line wins!';
      }
      // Don't Pass loses (except 12 is push on come-out for Don't Pass - but that's for craps numbers)
      if (game.bets.dontPass > 0) {
        results.push({ bet: "Don't Pass", result: 'lose', payout: -game.bets.dontPass });
        showResult = true;
        resultType = 'lose';
        resultTitle = 'Seven Out!';
        resultMessage = "Don't Pass loses.";
      }
      
      // Round ends - reset bets
      game.bets.pass = 0;
      game.bets.dontPass = 0;
    }
    // Craps (2, 3, 12)
    else if (total === 2 || total === 3 || total === 12) {
      // Pass loses
      if (game.bets.pass > 0) {
        // Check for player favor (65% chance to push on loss)
        if (shouldTriggerPlayerFavor()) {
          triggerPush = true;
          game.credits += game.bets.pass; // Return bet
          results.push({ bet: 'Pass Line', result: 'push', payout: 0 });
        } else {
          results.push({ bet: 'Pass Line', result: 'lose', payout: -game.bets.pass });
        }
        showResult = true;
        resultType = triggerPush ? 'push' : 'lose';
        resultTitle = 'Craps!';
        resultMessage = triggerPush ? 'Push! Bet returned.' : 'Pass Line loses.';
      }
      // Don't Pass: 2 or 3 wins, 12 is push
      if (game.bets.dontPass > 0) {
        if (total === 12) {
          // Push - return bet
          game.credits += game.bets.dontPass;
          results.push({ bet: "Don't Pass", result: 'push', payout: 0 });
          showResult = true;
          resultType = 'push';
          resultMessage = "12 is a push on Don't Pass.";
        } else {
          // 2 or 3 - Don't Pass wins
          const payout = game.bets.dontPass * 2;
          game.credits += payout;
          totalPayout += game.bets.dontPass;
          results.push({ bet: "Don't Pass", result: 'win', payout: game.bets.dontPass });
          showResult = true;
          resultType = 'win';
          resultTitle = 'Craps!';
          resultMessage = "Don't Pass wins!";
        }
      }
      
      // Round ends
      game.bets.pass = 0;
      game.bets.dontPass = 0;
    }
    // Point established (4, 5, 6, 8, 9, 10)
    else {
      game.point = total;
      game.isComeOut = false;
      game.state = GameState.POINT_PHASE;
      
      UI.updatePhase();
      UI.updateInstruction(`Point is ${game.point}. Roll ${game.point} to win, 7 to lose.`);
      UI.updateBetDisplays();
      UI.updateCredits();
      UI.lockBets(true, false); // Lock Pass/Don't but allow Field
      UI.setRollButtonEnabled(true);
      
      scheduleAutoRoll();
      return;
    }
  }
  // ─── Point Phase Resolution ───
  else {
    // Hit the point - Pass wins
    if (total === game.point) {
      if (game.bets.pass > 0) {
        const payout = game.bets.pass * 2;
        game.credits += payout;
        totalPayout += game.bets.pass;
        results.push({ bet: 'Pass Line', result: 'win', payout: game.bets.pass });
        showResult = true;
        resultType = totalPayout >= 20 ? 'bigwin' : 'win';
        resultTitle = `Hit the ${game.point}!`;
        resultMessage = 'Pass Line wins!';
      }
      if (game.bets.dontPass > 0) {
        // Check for player favor (65% chance to push on loss)
        if (shouldTriggerPlayerFavor()) {
          triggerPush = true;
          game.credits += game.bets.dontPass;
          results.push({ bet: "Don't Pass", result: 'push', payout: 0 });
        } else {
          results.push({ bet: "Don't Pass", result: 'lose', payout: -game.bets.dontPass });
        }
        if (!showResult) {
          showResult = true;
          resultType = triggerPush ? 'push' : 'lose';
          resultTitle = `Hit the ${game.point}!`;
          resultMessage = triggerPush ? 'Push! Bet returned.' : "Don't Pass loses.";
        }
      }
      
      // Round ends
      game.bets.pass = 0;
      game.bets.dontPass = 0;
      game.point = null;
      game.isComeOut = true;
    }
    // Seven out - Don't Pass wins
    else if (total === 7) {
      if (game.bets.dontPass > 0) {
        const payout = game.bets.dontPass * 2;
        game.credits += payout;
        totalPayout += game.bets.dontPass;
        results.push({ bet: "Don't Pass", result: 'win', payout: game.bets.dontPass });
        showResult = true;
        resultType = 'win';
        resultTitle = 'Seven Out!';
        resultMessage = "Don't Pass wins!";
      }
      if (game.bets.pass > 0) {
        // Check for player favor (65% chance to push on loss)
        if (shouldTriggerPlayerFavor()) {
          triggerPush = true;
          game.credits += game.bets.pass;
          results.push({ bet: 'Pass Line', result: 'push', payout: 0 });
        } else {
          results.push({ bet: 'Pass Line', result: 'lose', payout: -game.bets.pass });
        }
        if (!showResult) {
          showResult = true;
          resultType = triggerPush ? 'push' : 'lose';
          resultTitle = 'Seven Out!';
          resultMessage = triggerPush ? 'Push! Bet returned.' : 'Pass Line loses.';
        }
      }
      
      // Round ends
      game.bets.pass = 0;
      game.bets.dontPass = 0;
      game.point = null;
      game.isComeOut = true;
    }
    // Other number - continue point phase
    else {
      game.state = GameState.POINT_PHASE;
      UI.updateBetDisplays();
      UI.updateCredits();
      UI.lockBets(true, false);
      UI.setRollButtonEnabled(true);
      
      scheduleAutoRoll();
      return;
    }
  }
  
  // ─── Round End ───
  game.state = GameState.ROUND_END;
  UI.updateCredits();
  UI.updateBetDisplays();
  UI.updatePhase();
  
  // Show result overlay
  if (showResult) {
    let payoutText = '';
    if (totalPayout > 0) {
      payoutText = `+${totalPayout} credits`;
    } else if (totalPayout < 0) {
      payoutText = `${totalPayout} credits`;
    }
    
    UI.showResult(resultType, resultTitle, resultMessage, payoutText);
  } else {
    // No main bet result, just continue
    endRound();
  }
  
  // Check for game over
  if (game.credits <= 0) {
    setTimeout(() => {
      UI.hideResult();
      UI.showGameOver();
    }, 1500);
  }
}

function endRound() {
  // Stop auto roll if no credits
  if (game.credits <= 0) {
    game.autoRollEnabled = false;
    UI.els.autoRoll.checked = false;
    clearTimeout(game.autoRollTimer);
    return;
  }
  
  game.state = GameState.IDLE_BETTING;
  game.isComeOut = true;
  game.point = null;
  
  UI.updatePhase();
  UI.updateBetDisplays();
  UI.lockBets(false, false);
  UI.setRollButtonEnabled(true);
  updateInstruction();
  
  scheduleAutoRoll();
}

function continueGame() {
  UI.hideResult();
  endRound();
}

function resetCredits() {
  game.credits = CONFIG.STARTING_CREDITS;
  game.bets = { pass: 0, dontPass: 0, field: 0 };
  game.history = [];
  game.point = null;
  game.isComeOut = true;
  game.state = GameState.IDLE_BETTING;
  
  UI.hideGameOver();
  UI.hideResult();
  UI.updateCredits();
  UI.updateBetDisplays();
  UI.updatePhase();
  UI.updateHistory();
  UI.lockBets(false, false);
  UI.setRollButtonEnabled(true);
  updateInstruction();
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO ROLL
// ═══════════════════════════════════════════════════════════════════════════════

function scheduleAutoRoll() {
  if (!game.autoRollEnabled) return;
  if (!game.audioUnlocked) return; // Don't auto roll until user has interacted
  if (game.credits <= 0) return;
  if (game.state === GameState.ROLLING || game.state === GameState.ROUND_END) return;
  
  clearTimeout(game.autoRollTimer);
  
  game.autoRollTimer = setTimeout(() => {
    if (!game.autoRollEnabled) return;
    
    // If no bet placed during come-out, place minimum pass bet
    if (game.isComeOut && game.bets.pass === 0 && game.bets.dontPass === 0) {
      if (canPlaceBet(CONFIG.MIN_BET)) {
        placeBet('pass', CONFIG.MIN_BET);
      }
    }
    
    if (canRoll()) {
      performRoll();
    }
  }, CONFIG.AUTO_ROLL_DELAY);
}

function toggleAutoRoll() {
  game.autoRollEnabled = UI.els.autoRoll.checked;
  
  if (game.autoRollEnabled) {
    scheduleAutoRoll();
  } else {
    clearTimeout(game.autoRollTimer);
  }
  
  saveSettings();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS & PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════════

function saveSettings() {
  const settings = {
    soundEnabled: game.soundEnabled,
    volume: game.volume,
    reducedMotion: game.reducedMotion,
    lastBet: game.bets.pass || game.bets.dontPass || CONFIG.MIN_BET,
  };
  
  try {
    localStorage.setItem('crapsSettings', JSON.stringify(settings));
  } catch (e) {
    // Storage unavailable, ignore
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('crapsSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      game.volume = settings.volume ?? 0.6;
      game.reducedMotion = settings.reducedMotion ?? false;
      
      // Check system preference for reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        game.reducedMotion = true;
      }
    }
  } catch (e) {
    // Storage unavailable, use defaults
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
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
  
  // Pass Line betting
  document.getElementById('pass-minus').addEventListener('click', () => placeBet('pass', -CONFIG.BET_INCREMENT));
  document.getElementById('pass-plus').addEventListener('click', () => placeBet('pass', CONFIG.BET_INCREMENT));
  document.getElementById('pass-quick').addEventListener('click', () => placeBet('pass', CONFIG.BET_INCREMENT));
  
  // Don't Pass betting
  document.getElementById('dontpass-minus').addEventListener('click', () => placeBet('dontPass', -CONFIG.BET_INCREMENT));
  document.getElementById('dontpass-plus').addEventListener('click', () => placeBet('dontPass', CONFIG.BET_INCREMENT));
  document.getElementById('dontpass-quick').addEventListener('click', () => placeBet('dontPass', CONFIG.BET_INCREMENT));
  
  // Field betting
  document.getElementById('field-minus').addEventListener('click', () => placeBet('field', -CONFIG.BET_INCREMENT));
  document.getElementById('field-plus').addEventListener('click', () => placeBet('field', CONFIG.BET_INCREMENT));
  document.getElementById('field-quick').addEventListener('click', () => placeBet('field', CONFIG.BET_INCREMENT));
  
  // Roll button
  UI.els.btnRoll.addEventListener('click', () => {
    if (!game.audioUnlocked) {
      AudioManager.unlock();
    }
    performRoll();
  });
  
  // Clear bets
  UI.els.btnClear.addEventListener('click', clearAllBets);
  
  // Auto roll toggle
  UI.els.autoRoll.addEventListener('change', toggleAutoRoll);
  
  // More bets toggle
  UI.els.moreBetsToggle.addEventListener('click', () => {
    AudioManager.playClick();
    UI.toggleMoreBets();
  });
  
  // Continue button
  UI.els.btnContinue.addEventListener('click', continueGame);
  
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
  
  // Volume slider
  UI.els.volumeSlider.addEventListener('input', (e) => {
    AudioManager.setVolume(e.target.value / 100);
  });
  
  // Reduced motion toggle
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
    if (e.code === 'Space' || e.code === 'Enter') {
      if (UI.els.resultOverlay.classList.contains('hidden') === false) {
        continueGame();
      } else if (canRoll()) {
        performRoll();
      }
    }
    if (e.code === 'Escape') {
      UI.hideModal(UI.els.helpModal);
      UI.hideModal(UI.els.settingsModal);
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
  
  // Initialize audio manager (won't play until unlocked)
  AudioManager.init();
  AudioManager.masterVolume = game.volume;
  
  // Initialize UI
  UI.updateCredits();
  UI.updateBetDisplays();
  UI.updatePhase();
  UI.renderDie(UI.els.die1, 1);
  UI.renderDie(UI.els.die2, 1);
  UI.els.rollTotal.textContent = '';
  updateInstruction();
  
  // Hide sound prompt (sound enabled by default)
  UI.hideSoundPrompt();
  
  // Setup events
  setupEventListeners();
  
  console.log('Craps initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
