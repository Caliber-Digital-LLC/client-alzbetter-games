/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ROULETTE - Game Logic
 * European roulette (0-36, single zero)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION (TUNING SECTION)
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Credits
  STARTING_CREDITS: 200,
  
  // Chip values
  CHIP_VALUES: [1, 5, 10],
  DEFAULT_CHIP: 5,
  
  // Player favor (65% chance to push on loss)
  PLAYER_FAVOR_RATE: 0.65,
  
  // Spin animation
  SPIN_DURATION: 5000,        // ms
  SPIN_ROTATIONS: 5,          // full wheel rotations
  BALL_DURATION: 5500,        // ball animation duration
  REDUCED_SPIN_DURATION: 2000,
  
  // Wheel appearance
  WHEEL_RADIUS: 180,
  BALL_RADIUS: 8,
};

// European wheel number sequence (clockwise from 0)
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Number colors
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

// Payouts
const PAYOUTS = {
  straight: 35,
  red: 1,
  black: 1,
  even: 1,
  odd: 1,
  low: 1,
  high: 1,
  dozen1: 2,
  dozen2: 2,
  dozen3: 2,
  col1: 2,
  col2: 2,
  col3: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════════

const GameState = {
  BETTING: 'BETTING',
  SPINNING: 'SPINNING',
  RESOLVED: 'RESOLVED',
};

const game = {
  state: GameState.BETTING,
  credits: CONFIG.STARTING_CREDITS,
  
  // Betting
  selectedChip: CONFIG.DEFAULT_CHIP,
  bets: {},           // { betType: amount } e.g., { red: 10, straight_17: 5 }
  lastBets: {},       // For rebet
  straightNumber: 17, // Currently selected straight-up number
  
  // Results
  lastResult: null,
  lastWin: 0,
  
  // Wheel
  wheelRotation: 0,
  ballAngle: 0,
  isAnimating: false,
  
  // Settings
  soundEnabled: true, // Enabled by default
  audioUnlocked: false,
  reducedMotion: false,
  volume: 0.6,
  
  // Mode
  simpleMode: true,
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

// ═══════════════════════════════════════════════════════════════════════════════
// NUMBER HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getNumberColor(num) {
  if (num === 0) return 'green';
  if (RED_NUMBERS.includes(num)) return 'red';
  return 'black';
}

function getNumberColorName(num) {
  if (num === 0) return 'Green';
  if (RED_NUMBERS.includes(num)) return 'Red';
  return 'Black';
}

function isEven(num) {
  return num !== 0 && num % 2 === 0;
}

function isOdd(num) {
  return num !== 0 && num % 2 === 1;
}

function isLow(num) {
  return num >= 1 && num <= 18;
}

function isHigh(num) {
  return num >= 19 && num <= 36;
}

function getDozen(num) {
  if (num === 0) return null;
  if (num <= 12) return 1;
  if (num <= 24) return 2;
  return 3;
}

function getColumn(num) {
  if (num === 0) return null;
  return ((num - 1) % 3) + 1;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BET HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getTotalBet() {
  return Object.values(game.bets).reduce((sum, amt) => sum + amt, 0);
}

function hasBets() {
  return getTotalBet() > 0;
}

function clearBets() {
  game.bets = {};
}

function placeBet(betType, amount) {
  if (game.state !== GameState.BETTING) return false;
  if (game.credits < amount) return false;
  
  game.bets[betType] = (game.bets[betType] || 0) + amount;
  game.credits -= amount;
  return true;
}

function rebet() {
  if (game.state !== GameState.BETTING) return false;
  if (Object.keys(game.lastBets).length === 0) return false;
  
  const totalNeeded = Object.values(game.lastBets).reduce((sum, amt) => sum + amt, 0);
  if (game.credits < totalNeeded) return false;
  
  // Clear current bets and restore last bets
  game.credits += getTotalBet(); // Return current bets
  game.bets = { ...game.lastBets };
  game.credits -= totalNeeded;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIN CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function calculateWinnings(result) {
  const winnings = [];
  let totalWin = 0;
  
  for (const [betType, amount] of Object.entries(game.bets)) {
    let won = false;
    let payout = 0;
    
    if (betType.startsWith('straight_')) {
      const num = parseInt(betType.split('_')[1]);
      if (result === num) {
        won = true;
        payout = amount * PAYOUTS.straight;
      }
    } else if (betType === 'red') {
      if (RED_NUMBERS.includes(result)) {
        won = true;
        payout = amount * PAYOUTS.red;
      }
    } else if (betType === 'black') {
      if (BLACK_NUMBERS.includes(result)) {
        won = true;
        payout = amount * PAYOUTS.black;
      }
    } else if (betType === 'even') {
      if (isEven(result)) {
        won = true;
        payout = amount * PAYOUTS.even;
      }
    } else if (betType === 'odd') {
      if (isOdd(result)) {
        won = true;
        payout = amount * PAYOUTS.odd;
      }
    } else if (betType === 'low') {
      if (isLow(result)) {
        won = true;
        payout = amount * PAYOUTS.low;
      }
    } else if (betType === 'high') {
      if (isHigh(result)) {
        won = true;
        payout = amount * PAYOUTS.high;
      }
    } else if (betType === 'dozen1') {
      if (getDozen(result) === 1) {
        won = true;
        payout = amount * PAYOUTS.dozen1;
      }
    } else if (betType === 'dozen2') {
      if (getDozen(result) === 2) {
        won = true;
        payout = amount * PAYOUTS.dozen2;
      }
    } else if (betType === 'dozen3') {
      if (getDozen(result) === 3) {
        won = true;
        payout = amount * PAYOUTS.dozen3;
      }
    } else if (betType === 'col1') {
      if (getColumn(result) === 1) {
        won = true;
        payout = amount * PAYOUTS.col1;
      }
    } else if (betType === 'col2') {
      if (getColumn(result) === 2) {
        won = true;
        payout = amount * PAYOUTS.col2;
      }
    } else if (betType === 'col3') {
      if (getColumn(result) === 3) {
        won = true;
        payout = amount * PAYOUTS.col3;
      }
    }
    
    if (won) {
      winnings.push({ betType, amount, payout: payout + amount }); // payout + original bet
      totalWin += payout + amount;
    }
  }
  
  return { winnings, totalWin };
}

function getBetDisplayName(betType) {
  if (betType.startsWith('straight_')) {
    return `#${betType.split('_')[1]}`;
  }
  const names = {
    red: 'Red',
    black: 'Black',
    even: 'Even',
    odd: 'Odd',
    low: '1-18',
    high: '19-36',
    dozen1: '1st 12',
    dozen2: '2nd 12',
    dozen3: '3rd 12',
    col1: 'Col 1',
    col2: 'Col 2',
    col3: 'Col 3',
  };
  return names[betType] || betType;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER FAVOR
// ═══════════════════════════════════════════════════════════════════════════════

function tryPlayerFavor(totalWin) {
  if (totalWin > 0) return false; // Only on loss
  return getRandomFloat() < CONFIG.PLAYER_FAVOR_RATE;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHEEL RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

const WheelRenderer = {
  canvas: null,
  ctx: null,
  
  init() {
    this.canvas = document.getElementById('wheel-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.draw(0);
  },
  
  draw(rotation = 0, highlightNumber = null) {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#5d4e37';
    ctx.fill();
    
    // Draw segments
    const segmentAngle = (Math.PI * 2) / WHEEL_NUMBERS.length;
    const innerRadius = radius * 0.65;
    
    WHEEL_NUMBERS.forEach((num, i) => {
      const startAngle = rotation + i * segmentAngle - Math.PI / 2 - segmentAngle / 2;
      const endAngle = startAngle + segmentAngle;
      
      // Segment color
      let color;
      if (num === 0) {
        color = '#2e7d32';
      } else if (RED_NUMBERS.includes(num)) {
        color = '#c62828';
      } else {
        color = '#1a1a1a';
      }
      
      // Highlight winning number
      if (highlightNumber !== null && num === highlightNumber) {
        color = num === 0 ? '#4caf50' : (RED_NUMBERS.includes(num) ? '#ef5350' : '#424242');
      }
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius * 0.95, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      
      // Segment border
      ctx.strokeStyle = '#d4a853';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw number
      const midAngle = startAngle + segmentAngle / 2;
      const textRadius = radius * 0.82;
      const textX = centerX + Math.cos(midAngle) * textRadius;
      const textY = centerY + Math.sin(midAngle) * textRadius;
      
      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, radius * 0.08)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), 0, 0);
      ctx.restore();
    });
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#3d2e1f';
    ctx.fill();
    ctx.strokeStyle = '#d4a853';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.05, centerY - radius * 0.05, 0,
      centerX, centerY, radius * 0.15
    );
    gradient.addColorStop(0, '#d4a853');
    gradient.addColorStop(1, '#8b6914');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Ball track
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.58, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 168, 83, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  },
  
  getNumberPosition(number) {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    const index = WHEEL_NUMBERS.indexOf(number);
    const segmentAngle = (Math.PI * 2) / WHEEL_NUMBERS.length;
    const angle = game.wheelRotation + index * segmentAngle - Math.PI / 2;
    
    const ballRadius = radius * 0.58;
    return {
      x: centerX + Math.cos(angle) * ballRadius,
      y: centerY + Math.sin(angle) * ballRadius,
    };
  },
};

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
  
  playClick() {
    if (!game.soundEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.08 * this.masterVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  },
  
  playChipPlace() {
    if (!game.soundEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.1 * this.masterVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  },
  
  playSpinStart() {
    if (!game.soundEnabled || !this.ctx) return;
    
    // Whoosh sound
    const duration = 0.5;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      const envelope = Math.sin(Math.PI * t / duration);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.15;
    }
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    
    const gain = this.ctx.createGain();
    gain.gain.value = 0.3 * this.masterVolume;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  },
  
  playBallClick() {
    if (!game.soundEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 2000 + Math.random() * 500;
    gain.gain.setValueAtTime(0.05 * this.masterVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.02);
  },
  
  playWin() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const notes = [523.25, 659.26, 783.99];
    const duration = 0.4;
    
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = this.ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.12 * this.masterVolume, startTime);
      gain.gain.linearRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  },
  
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
  
  playLoss() {
    if (!game.soundEnabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 180;
    gain.gain.setValueAtTime(0.08 * this.masterVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  },
  
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

// ═══════════════════════════════════════════════════════════════════════════════
// UI MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const UI = {
  els: {},
  
  init() {
    this.els = {
      credits: document.getElementById('credits-value'),
      totalBet: document.getElementById('total-bet-value'),
      instruction: document.getElementById('instruction'),
      
      // Result
      resultDisplay: document.getElementById('result-display'),
      resultNumber: document.getElementById('result-number'),
      resultColor: document.getElementById('result-color'),
      
      // Win
      winDisplay: document.getElementById('win-display'),
      winMessage: document.getElementById('win-message'),
      winAmount: document.getElementById('win-amount'),
      winBreakdown: document.getElementById('win-breakdown'),
      
      // Ball
      ballMarker: document.getElementById('ball-marker'),
      
      // Mode
      modeSimple: document.getElementById('mode-simple'),
      modeTable: document.getElementById('mode-table'),
      simpleBets: document.getElementById('simple-bets'),
      tableBets: document.getElementById('table-bets'),
      
      // Number picker
      selectedNumber: document.getElementById('selected-number'),
      numMinus: document.getElementById('num-minus'),
      numPlus: document.getElementById('num-plus'),
      pickRandom: document.getElementById('pick-random'),
      pickLast: document.getElementById('pick-last'),
      pickZero: document.getElementById('pick-zero'),
      addStraight: document.getElementById('add-straight'),
      toggleGrid: document.getElementById('toggle-grid'),
      numberGrid: document.getElementById('number-grid'),
      
      // Buttons
      btnClear: document.getElementById('btn-clear'),
      btnRebet: document.getElementById('btn-rebet'),
      btnSpin: document.getElementById('btn-spin'),
      
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
      reducedMotionToggle: document.getElementById('reduced-motion-toggle'),
    };
    
    this.generateNumberGrid();
    this.generateTableNumbers();
  },
  
  generateNumberGrid() {
    const grid = this.els.numberGrid;
    grid.innerHTML = '';
    
    // Zero first (spans 2 columns)
    const zeroBtn = document.createElement('button');
    zeroBtn.className = 'grid-num green';
    zeroBtn.textContent = '0';
    zeroBtn.dataset.num = '0';
    grid.appendChild(zeroBtn);
    
    // Numbers 1-36
    for (let i = 1; i <= 36; i++) {
      const btn = document.createElement('button');
      btn.className = `grid-num ${getNumberColor(i)}`;
      btn.textContent = i.toString();
      btn.dataset.num = i.toString();
      grid.appendChild(btn);
    }
  },
  
  generateTableNumbers() {
    const container = document.getElementById('table-numbers');
    if (!container) return;
    container.innerHTML = '';
    
    // Numbers 1-36 arranged in 12 rows, 3 columns
    // Row 1: 3, 6, 9, 12... (column 3)
    // Row 2: 2, 5, 8, 11... (column 2)
    // Row 3: 1, 4, 7, 10... (column 1)
    for (let row = 0; row < 12; row++) {
      for (let col = 2; col >= 0; col--) {
        const num = row * 3 + col + 1;
        const btn = document.createElement('button');
        btn.className = `table-num ${getNumberColor(num)}`;
        btn.textContent = num.toString();
        btn.dataset.num = num.toString();
        container.appendChild(btn);
      }
    }
  },
  
  updateCredits() {
    this.els.credits.textContent = game.credits;
  },
  
  updateTotalBet() {
    this.els.totalBet.textContent = getTotalBet();
  },
  
  updateInstruction(text) {
    this.els.instruction.textContent = text;
  },
  
  updateSelectedNumber() {
    const numEl = this.els.selectedNumber;
    const color = getNumberColor(game.straightNumber);
    
    numEl.className = `selected-number ${color}`;
    numEl.querySelector('.num-value').textContent = game.straightNumber;
    numEl.querySelector('.num-color').textContent = getNumberColorName(game.straightNumber);
    
    // Update grid selection
    document.querySelectorAll('.grid-num').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.num) === game.straightNumber);
    });
  },
  
  updateBetTiles() {
    // Update simple bet tiles
    document.querySelectorAll('.bet-tile, .add-straight-btn').forEach(tile => {
      const betType = tile.dataset.bet;
      let amount = 0;
      
      if (betType === 'straight') {
        // Sum all straight bets
        for (const [key, val] of Object.entries(game.bets)) {
          if (key.startsWith('straight_')) {
            amount += val;
          }
        }
      } else {
        amount = game.bets[betType] || 0;
      }
      
      const chipsEl = tile.querySelector('.bet-chips');
      if (chipsEl) {
        if (amount > 0) {
          chipsEl.textContent = amount;
          chipsEl.classList.remove('hidden');
          tile.classList.add('has-bet');
        } else {
          chipsEl.classList.add('hidden');
          tile.classList.remove('has-bet');
        }
      }
    });
    
    // Update table numbers
    document.querySelectorAll('.table-num').forEach(btn => {
      const num = parseInt(btn.dataset.num);
      const betKey = `straight_${num}`;
      const amount = game.bets[betKey] || 0;
      
      if (amount > 0) {
        btn.classList.add('has-bet');
        btn.dataset.chips = amount;
      } else {
        btn.classList.remove('has-bet');
        delete btn.dataset.chips;
      }
    });
  },
  
  updateChipSelector() {
    document.querySelectorAll('.chip').forEach(chip => {
      const value = parseInt(chip.dataset.value);
      const isSelected = value === game.selectedChip;
      chip.classList.toggle('selected', isSelected);
      chip.setAttribute('aria-checked', isSelected);
    });
  },
  
  updateButtons() {
    const isBetting = game.state === GameState.BETTING;
    const hasBetsPlaced = hasBets();
    const hasLastBets = Object.keys(game.lastBets).length > 0;
    
    this.els.btnClear.disabled = !isBetting || !hasBetsPlaced;
    this.els.btnRebet.disabled = !isBetting || !hasLastBets;
    this.els.btnSpin.disabled = !isBetting || !hasBetsPlaced;
    this.els.pickLast.disabled = game.lastResult === null;
    
    if (game.state === GameState.SPINNING) {
      this.els.btnSpin.textContent = 'Spinning…';
      this.els.btnSpin.classList.add('spinning');
    } else {
      this.els.btnSpin.textContent = 'SPIN';
      this.els.btnSpin.classList.remove('spinning');
    }
  },
  
  showResult(number) {
    const color = getNumberColor(number);
    
    this.els.resultNumber.textContent = number;
    this.els.resultNumber.className = `result-number ${color}`;
    this.els.resultColor.textContent = getNumberColorName(number);
    this.els.resultDisplay.classList.remove('hidden');
  },
  
  hideResult() {
    this.els.resultDisplay.classList.add('hidden');
  },
  
  showWin(totalWin, winnings, isPush = false) {
    if (isPush) {
      this.els.winMessage.textContent = 'Push!';
      this.els.winAmount.textContent = 'Bets Returned';
      this.els.winAmount.className = 'win-amount';
      this.els.winBreakdown.textContent = '';
    } else if (totalWin > 0) {
      this.els.winMessage.textContent = 'You Won!';
      this.els.winAmount.textContent = `+${totalWin}`;
      this.els.winAmount.className = 'win-amount';
      
      // Breakdown
      const breakdownText = winnings.map(w => 
        `${getBetDisplayName(w.betType)}: +${w.payout}`
      ).join(' • ');
      this.els.winBreakdown.textContent = breakdownText;
    } else {
      this.els.winMessage.textContent = 'No Win';
      this.els.winAmount.textContent = 'Try Again!';
      this.els.winAmount.className = 'win-amount loss';
      this.els.winBreakdown.textContent = '';
    }
    
    this.els.winDisplay.classList.remove('hidden');
  },
  
  hideWin() {
    this.els.winDisplay.classList.add('hidden');
  },
  
  setMode(simple) {
    // Table mode UI was removed; roulette now runs in simple mode only.
    game.simpleMode = true;
    const effectiveSimple = true;

    if (this.els.modeSimple) {
      this.els.modeSimple.classList.toggle('active', effectiveSimple);
      this.els.modeSimple.setAttribute('aria-pressed', effectiveSimple);
    }
    if (this.els.modeTable) {
      this.els.modeTable.classList.toggle('active', !effectiveSimple);
      this.els.modeTable.setAttribute('aria-pressed', !effectiveSimple);
    }

    if (this.els.simpleBets) {
      this.els.simpleBets.classList.toggle('hidden', !effectiveSimple);
    }
    if (this.els.tableBets) {
      this.els.tableBets.classList.toggle('hidden', effectiveSimple);
    }
  },
  
  toggleNumberGrid() {
    const grid = this.els.numberGrid;
    const toggle = this.els.toggleGrid;
    const isHidden = grid.classList.contains('hidden');
    
    grid.classList.toggle('hidden', !isHidden);
    toggle.textContent = isHidden ? 'Hide Number Grid ▲' : 'Show Number Grid ▼';
    toggle.setAttribute('aria-expanded', isHidden);
  },
  
  showBall() {
    this.els.ballMarker.classList.remove('hidden');
  },
  
  hideBall() {
    this.els.ballMarker.classList.add('hidden');
  },
  
  positionBall(x, y) {
    const container = document.querySelector('.wheel-container');
    const rect = container.getBoundingClientRect();
    
    this.els.ballMarker.style.left = `${x}px`;
    this.els.ballMarker.style.top = `${y}px`;
  },
  
  showGameOver() {
    this.els.gameoverOverlay.classList.remove('hidden');
  },
  
  hideGameOver() {
    this.els.gameoverOverlay.classList.add('hidden');
  },
  
  showModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('hidden');
    modalEl.classList.add('active');
  },
  
  hideModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('hidden');
    modalEl.classList.remove('active');
  },
  
  showSoundPrompt() {
    if (!this.els.soundPrompt) return;
    this.els.soundPrompt.classList.remove('hidden');
  },
  
  hideSoundPrompt() {
    if (!this.els.soundPrompt) return;
    this.els.soundPrompt.classList.add('hidden');
  },
  
  updateSoundIcon() {
    if (!this.els.iconSoundOn || !this.els.iconSoundOff) return;
    if (game.soundEnabled) {
      this.els.iconSoundOn.style.display = 'block';
      this.els.iconSoundOff.style.display = 'none';
    } else {
      this.els.iconSoundOn.style.display = 'none';
      this.els.iconSoundOff.style.display = 'block';
    }
  },
  
  applySettings() {
    document.body.classList.toggle('reduce-motion', game.reducedMotion);

    if (this.els.reducedMotionToggle && this.els.reducedMotionToggle.type === 'checkbox') {
      this.els.reducedMotionToggle.checked = game.reducedMotion;
    }

    if (this.els.volumeSlider) {
      this.els.volumeSlider.value = game.volume * 100;
    }
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
// SPIN ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

async function spin() {
  if (game.state !== GameState.BETTING) return;
  if (!hasBets()) return;
  
  // Save bets for rebet
  game.lastBets = { ...game.bets };
  
  // Determine result BEFORE animation
  const resultIndex = getRandomInt(WHEEL_NUMBERS.length);
  const result = WHEEL_NUMBERS[resultIndex];
  game.lastResult = result;
  
  // Start spinning
  game.state = GameState.SPINNING;
  
  UI.hideResult();
  UI.hideWin();
  UI.updateButtons();
  UI.updateInstruction('Spinning…');
  
  AudioManager.playSpinStart();
  
  // Animate wheel and ball
  const duration = game.reducedMotion ? CONFIG.REDUCED_SPIN_DURATION : CONFIG.SPIN_DURATION;
  const startTime = performance.now();
  const startRotation = game.wheelRotation;
  
  // Calculate target rotation to land on result
  const segmentAngle = (Math.PI * 2) / WHEEL_NUMBERS.length;
  const targetSegment = resultIndex * segmentAngle;
  const totalRotation = CONFIG.SPIN_ROTATIONS * Math.PI * 2 + targetSegment;
  
  UI.showBall();
  
  let lastClickTime = 0;
  const clickInterval = 150; // ms between ball clicks
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    
    // Update wheel rotation
    game.wheelRotation = startRotation + totalRotation * eased;
    WheelRenderer.draw(game.wheelRotation);
    
    // Ball position (orbits faster at start, slows down)
    const ballProgress = Math.min(elapsed / (duration * 1.1), 1);
    const ballEased = 1 - Math.pow(1 - ballProgress, 4);
    
    // Ball starts at outer edge, spirals in
    const canvas = document.getElementById('wheel-canvas');
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    const ballOrbitRadius = radius * (0.9 - 0.32 * ballEased);
    const ballAngle = -game.wheelRotation * 1.5 - Math.PI / 2;
    
    const ballX = centerX + Math.cos(ballAngle) * ballOrbitRadius - 8;
    const ballY = centerY + Math.sin(ballAngle) * ballOrbitRadius - 8;
    UI.positionBall(ballX, ballY);
    
    // Ball clicking sound
    if (game.soundEnabled && currentTime - lastClickTime > clickInterval * (1 + progress * 3)) {
      AudioManager.playBallClick();
      lastClickTime = currentTime;
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin(result);
    }
  }
  
  requestAnimationFrame(animate);
}

function finishSpin(result) {
  // Position ball on winning number
  const pos = WheelRenderer.getNumberPosition(result);
  UI.positionBall(pos.x - 8, pos.y - 8);
  
  // Highlight winning number
  WheelRenderer.draw(game.wheelRotation, result);
  
  // Calculate winnings
  const { winnings, totalWin } = calculateWinnings(result);
  
  // Check player favor (65% chance to push on loss)
  const isPush = tryPlayerFavor(totalWin);
  
  // Apply winnings
  if (isPush) {
    // Return all bets
    const totalBet = Object.values(game.bets).reduce((sum, amt) => sum + amt, 0);
    game.credits += totalBet;
    game.lastWin = 0;
  } else if (totalWin > 0) {
    game.credits += totalWin;
    game.lastWin = totalWin;
  } else {
    game.lastWin = 0;
  }
  
  // Update UI
  UI.showResult(result);
  UI.showWin(totalWin, winnings, isPush);
  UI.updateCredits();
  
  // Play sound
  if (isPush) {
    AudioManager.playPush();
  } else if (totalWin >= getTotalBet() * 10) {
    AudioManager.playBigWin();
    UI.showConfetti();
  } else if (totalWin > 0) {
    AudioManager.playWin();
  } else {
    AudioManager.playLoss();
  }
  
  // Clear bets and prepare for next round
  clearBets();
  
  // Update instruction
  if (isPush) {
    UI.updateInstruction('Push! Bets returned.');
  } else if (totalWin > 0) {
    UI.updateInstruction(`You won ${totalWin} credits!`);
  } else {
    UI.updateInstruction('No win this time. Try again!');
  }
  
  // Check for game over
  if (game.credits <= 0) {
    setTimeout(() => UI.showGameOver(), 1500);
    return;
  }
  
  // Ready for next spin
  setTimeout(() => {
    game.state = GameState.BETTING;
    UI.hideBall();
    UI.updateButtons();
    UI.updateBetTiles();
    UI.updateTotalBet();
    
    if (totalWin === 0 && !isPush) {
      UI.updateInstruction('Place your bets for the next spin.');
    }
  }, 2000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function handleBetClick(betType) {
  if (game.state !== GameState.BETTING) return;
  
  let actualBetType = betType;
  if (betType === 'straight') {
    actualBetType = `straight_${game.straightNumber}`;
  }
  
  if (placeBet(actualBetType, game.selectedChip)) {
    AudioManager.playChipPlace();
    UI.updateCredits();
    UI.updateTotalBet();
    UI.updateBetTiles();
    UI.updateButtons();
    UI.updateInstruction(`Bet placed. Add more or press SPIN.`);
  }
}

function handleTableNumberClick(num) {
  if (game.state !== GameState.BETTING) return;
  
  const betType = `straight_${num}`;
  if (placeBet(betType, game.selectedChip)) {
    AudioManager.playChipPlace();
    UI.updateCredits();
    UI.updateTotalBet();
    UI.updateBetTiles();
    UI.updateButtons();
  }
}

function handleClear() {
  if (game.state !== GameState.BETTING) return;
  
  // Return bets to credits
  game.credits += getTotalBet();
  clearBets();
  
  AudioManager.playClick();
  UI.updateCredits();
  UI.updateTotalBet();
  UI.updateBetTiles();
  UI.updateButtons();
  UI.updateInstruction('Bets cleared. Place new bets.');
}

function handleRebet() {
  if (rebet()) {
    AudioManager.playChipPlace();
    UI.updateCredits();
    UI.updateTotalBet();
    UI.updateBetTiles();
    UI.updateButtons();
    UI.updateInstruction('Last bet restored. Press SPIN or add more.');
  }
}

function handleChipSelect(value) {
  game.selectedChip = value;
  AudioManager.playClick();
  UI.updateChipSelector();
}

function changeNumber(delta) {
  game.straightNumber = (game.straightNumber + delta + 37) % 37;
  AudioManager.playClick();
  UI.updateSelectedNumber();
}

function selectNumber(num) {
  game.straightNumber = num;
  AudioManager.playClick();
  UI.updateSelectedNumber();
}

function pickRandom() {
  game.straightNumber = getRandomInt(37);
  AudioManager.playClick();
  UI.updateSelectedNumber();
}

function pickLastWin() {
  if (game.lastResult !== null) {
    game.straightNumber = game.lastResult;
    AudioManager.playClick();
    UI.updateSelectedNumber();
  }
}

function resetCredits() {
  game.credits = CONFIG.STARTING_CREDITS;
  game.state = GameState.BETTING;
  clearBets();
  
  UI.hideGameOver();
  UI.hideResult();
  UI.hideWin();
  UI.hideBall();
  UI.updateCredits();
  UI.updateTotalBet();
  UI.updateBetTiles();
  UI.updateButtons();
  UI.updateInstruction('Fresh start! Place your bets.');
  
  WheelRenderer.draw(game.wheelRotation);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════════

function saveSettings() {
  const settings = {
    soundEnabled: game.soundEnabled,
    volume: game.volume,
    reducedMotion: game.reducedMotion,
    selectedChip: game.selectedChip,
    lastBets: game.lastBets,
  };
  
  try {
    localStorage.setItem('rouletteSettings', JSON.stringify(settings));
  } catch (e) {
    // Storage unavailable
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('rouletteSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      game.volume = settings.volume ?? 0.6;
      game.reducedMotion = settings.reducedMotion ?? false;
      game.selectedChip = settings.selectedChip ?? CONFIG.DEFAULT_CHIP;
      game.lastBets = settings.lastBets ?? {};
      
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
  
  // Chip selection
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      handleChipSelect(parseInt(chip.dataset.value));
    });
  });
  
  // Bet tiles
  document.querySelectorAll('.bet-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      handleBetClick(tile.dataset.bet);
    });
  });
  
  // Add straight bet button
  UI.els.addStraight.addEventListener('click', () => {
    handleBetClick('straight');
  });
  
  // Number controls
  UI.els.numMinus.addEventListener('click', () => changeNumber(-1));
  UI.els.numPlus.addEventListener('click', () => changeNumber(1));
  UI.els.pickRandom.addEventListener('click', pickRandom);
  UI.els.pickLast.addEventListener('click', pickLastWin);
  UI.els.pickZero.addEventListener('click', () => selectNumber(0));
  
  // Number grid
  UI.els.toggleGrid.addEventListener('click', () => UI.toggleNumberGrid());
  UI.els.numberGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.grid-num');
    if (btn) {
      selectNumber(parseInt(btn.dataset.num));
    }
  });
  
  // Mode toggle (table mode removed; keep guarded for safety)
  if (UI.els.modeSimple) {
    UI.els.modeSimple.addEventListener('click', () => {
      AudioManager.playClick();
      UI.setMode(true);
    });
  }
  if (UI.els.modeTable) {
    UI.els.modeTable.addEventListener('click', () => {
      AudioManager.playClick();
      UI.setMode(false);
    });
  }
  
  // Table number clicks
  document.getElementById('table-numbers')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.table-num');
    if (btn) {
      handleTableNumberClick(parseInt(btn.dataset.num));
    }
  });
  
  // Table zero
  document.querySelector('.table-num.zero')?.addEventListener('click', () => {
    handleTableNumberClick(0);
  });
  
  // Table outside bets
  document.querySelectorAll('.table-outside-btn, .table-dozen, .table-col').forEach(btn => {
    btn.addEventListener('click', () => {
      handleBetClick(btn.dataset.bet);
    });
  });
  
  // Action buttons
  UI.els.btnClear.addEventListener('click', handleClear);
  UI.els.btnRebet.addEventListener('click', handleRebet);
  UI.els.btnSpin.addEventListener('click', () => {
    if (!game.audioUnlocked) {
      AudioManager.unlock();
    }
    spin();
  });
  
  // Reset credits
  UI.els.btnResetCredits.addEventListener('click', () => {
    AudioManager.playClick();
    resetCredits();
  });
  
  // Help modal
  document.getElementById('btn-help')?.addEventListener('click', () => {
    AudioManager.playClick();
    UI.showModal(UI.els.helpModal);
  });
  document.getElementById('close-help')?.addEventListener('click', () => {
    AudioManager.playClick();
    UI.hideModal(UI.els.helpModal);
  });
  
  // Close help on "Got It!" button
  const closeHelpBtn = document.getElementById('close-help-btn');
  if(closeHelpBtn) {
      closeHelpBtn.addEventListener('click', () => {
          AudioManager.playClick();
          UI.hideModal(UI.els.helpModal);
      });
  }
  
  // Settings modal (button may not exist in the header)
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    AudioManager.playClick();
    UI.showModal(UI.els.settingsModal);
  });
  document.getElementById('close-settings')?.addEventListener('click', () => {
    AudioManager.playClick();
    UI.hideModal(UI.els.settingsModal);
  });
  
  // Settings controls
  UI.els.volumeSlider?.addEventListener('input', (e) => {
    AudioManager.setVolume(e.target.value / 100);
  });
  
  if (UI.els.reducedMotionToggle && UI.els.reducedMotionToggle.type === 'checkbox') {
    UI.els.reducedMotionToggle.addEventListener('change', (e) => {
      game.reducedMotion = e.target.checked;
      document.body.classList.toggle('reduce-motion', game.reducedMotion);
      saveSettings();
    });
  }
  
  // Close modals on backdrop click
  UI.els.helpModal?.addEventListener('click', (e) => {
    if (e.target === UI.els.helpModal) UI.hideModal(UI.els.helpModal);
  });
  UI.els.settingsModal?.addEventListener('click', (e) => {
    if (e.target === UI.els.settingsModal) UI.hideModal(UI.els.settingsModal);
  });
  
  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'BUTTON') {
      e.preventDefault();
      if (game.state === GameState.BETTING && hasBets()) {
        spin();
      }
    }
    if (e.code === 'Escape') {
      UI.hideModal(UI.els.helpModal);
      UI.hideModal(UI.els.settingsModal);
    }
  });
  
  // Window resize - redraw wheel
  window.addEventListener('resize', () => {
    WheelRenderer.init();
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
  
  WheelRenderer.init();
  
  // Initialize UI
  UI.updateCredits();
  UI.updateTotalBet();
  UI.updateSelectedNumber();
  UI.updateChipSelector();
  UI.updateBetTiles();
  UI.updateButtons();
  UI.setMode(true);
  UI.updateInstruction('Select a chip, then tap a bet to place it.');
  
  // Setup events
  setupEventListeners();
  
  console.log('Roulette initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
