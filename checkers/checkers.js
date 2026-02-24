/* global ModalManager */

// ============================================================================
// SETTINGS + AUDIO
// ============================================================================
const SOUND_KEY = 'casino-sound-enabled';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  tone(freq, type, dur, vol, delay = 0) {
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

  click() {
    this.tone(650, 'sine', 0.05, 0.10);
  }

  move() {
    this.tone(520, 'sine', 0.08, 0.10);
    this.tone(780, 'sine', 0.06, 0.07, 0.03);
  }

  capture() {
    this.tone(220, 'triangle', 0.10, 0.12);
    this.tone(180, 'triangle', 0.12, 0.10, 0.05);
  }

  king() {
    this.tone(523.25, 'sine', 0.18, 0.11);
    this.tone(659.25, 'sine', 0.18, 0.11, 0.10);
    this.tone(783.99, 'sine', 0.22, 0.11, 0.20);
  }

  invalid() {
    this.tone(190, 'sawtooth', 0.08, 0.06);
  }

  win() {
    this.tone(523.25, 'sine', 0.22, 0.12);
    this.tone(659.25, 'sine', 0.22, 0.12, 0.10);
    this.tone(783.99, 'sine', 0.28, 0.12, 0.20);
    this.tone(1046.5, 'sine', 0.35, 0.12, 0.30);
  }
}

const audio = new AudioManager();

function loadSoundEnabled() {
  const saved = localStorage.getItem(SOUND_KEY);
  return saved !== null ? saved === 'true' : true;
}

function setSoundEnabled(enabled) {
  localStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
}

// ============================================================================
// GAME STATE
// ============================================================================
const SIZE = 8;
const PLAYER = 'red';
const AI = 'black';

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function opponent(color) {
  return color === PLAYER ? AI : PLAYER;
}

function isDarkSquare(r, c) {
  return (r + c) % 2 === 1;
}

function createInitialBoard() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (isDarkSquare(r, c)) board[r][c] = { color: AI, king: false };
    }
  }

  for (let r = 5; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (isDarkSquare(r, c)) board[r][c] = { color: PLAYER, king: false };
    }
  }

  return board;
}

function countPieces(board) {
  let red = 0;
  let black = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.color === PLAYER) red++;
      else black++;
    }
  }
  return { red, black };
}

function directionsFor(piece) {
  if (piece.king) return [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  return piece.color === PLAYER
    ? [
      [-1, -1],
      [-1, 1],
    ]
    : [
      [1, -1],
      [1, 1],
    ];
}

function maybeKing(piece, toR) {
  if (piece.king) return piece;
  if (piece.color === PLAYER && toR === 0) return { ...piece, king: true };
  if (piece.color === AI && toR === SIZE - 1) return { ...piece, king: true };
  return piece;
}

function generateSimpleMoves(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];

  const moves = [];
  for (const [dr, dc] of directionsFor(piece)) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    if (board[nr][nc] !== null) continue;

    moves.push({
      from: { r, c },
      path: [{ r, c }, { r: nr, c: nc }],
      to: { r: nr, c: nc },
      captures: [],
    });
  }
  return moves;
}

function generateCaptureSequences(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];

  const results = [];

  function dfs(currBoard, cr, cc, currPiece, path, captures) {
    let extended = false;

    for (const [dr, dc] of directionsFor(currPiece)) {
      const mr = cr + dr;
      const mc = cc + dc;
      const lr = cr + dr * 2;
      const lc = cc + dc * 2;

      if (!inBounds(lr, lc) || !inBounds(mr, mc)) continue;
      const mid = currBoard[mr][mc];
      if (!mid || mid.color === currPiece.color) continue;
      if (currBoard[lr][lc] !== null) continue;

      extended = true;

      const nextBoard = cloneBoard(currBoard);
      nextBoard[cr][cc] = null;
      nextBoard[mr][mc] = null;

      const movedPiece = maybeKing({ ...currPiece }, lr);
      nextBoard[lr][lc] = movedPiece;

      dfs(
        nextBoard,
        lr,
        lc,
        movedPiece,
        [...path, { r: lr, c: lc }],
        [...captures, { r: mr, c: mc }]
      );
    }

    if (!extended && captures.length > 0) {
      results.push({
        from: { r, c },
        path,
        to: path[path.length - 1],
        captures,
      });
    }
  }

  dfs(board, r, c, piece, [{ r, c }], []);
  return results;
}

function getAllLegalMoves(board, color) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;

      const captures = generateCaptureSequences(board, r, c);
      moves.push(...captures);
      moves.push(...generateSimpleMoves(board, r, c));
    }
  }
  // Casual rules: captures are not forced; we return all.
  return moves;
}

function getMovesForSquare(board, color, r, c, mustCaptureContinuation = false) {
  if (mustCaptureContinuation) {
    return generateCaptureSequences(board, r, c);
  }

  const all = [];
  all.push(...generateCaptureSequences(board, r, c));
  all.push(...generateSimpleMoves(board, r, c));
  return all;
}

function applyMove(board, move) {
  const next = cloneBoard(board);
  const { r: fr, c: fc } = move.from;

  const piece = next[fr][fc];
  next[fr][fc] = null;

  for (const cap of move.captures) {
    next[cap.r][cap.c] = null;
  }

  const finalPos = move.to;
  const movedPiece = maybeKing({ ...piece }, finalPos.r);
  next[finalPos.r][finalPos.c] = movedPiece;

  return { board: next, becameKing: movedPiece.king && !piece.king };
}

function anyCaptureFrom(board, r, c) {
  return generateCaptureSequences(board, r, c).length > 0;
}

// ============================================================================
// UI + INTERACTION
// ============================================================================
const dom = {
  board: document.getElementById('board'),
  statusLine: document.getElementById('statusLine'),
  turnLabel: document.getElementById('turnLabel'),
  redCount: document.getElementById('redCount'),
  blackCount: document.getElementById('blackCount'),
  newGameBtn: document.getElementById('newGameBtn'),
  soundBtn: document.getElementById('soundBtn'),
  helpBtn: document.getElementById('helpBtn'),
  closeRulesBtn: document.getElementById('closeRulesBtn'),
  gotItBtn: document.getElementById('gotItBtn'),
};

const state = {
  board: createInitialBoard(),
  turn: PLAYER,
  selected: null, // {r,c}
  hintTargets: new Map(), // key "r,c" -> { capture: bool }
  mustContinueCapture: false,
  soundEnabled: loadSoundEnabled(),
  aiThinking: false,
  aiFocus: 0.62, // 0..1, fluctuates to feel like a friendly human
  drag: null, // {from:{r,c}, ghostEl, pointerId}
};

function setStatus(text) {
  dom.statusLine.textContent = text;
}

function setTurnLabel() {
  dom.turnLabel.textContent = state.turn === PLAYER ? 'You' : 'Computer';
}

function syncCounts() {
  const { red, black } = countPieces(state.board);
  dom.redCount.textContent = String(red);
  dom.blackCount.textContent = String(black);
}

function updateSoundUI() {
  const onIcon = dom.soundBtn.querySelector('.sound-on-icon');
  const offIcon = dom.soundBtn.querySelector('.sound-off-icon');
  onIcon.classList.toggle('hidden', !state.soundEnabled);
  offIcon.classList.toggle('hidden', state.soundEnabled);
  audio.setMuted(!state.soundEnabled);
}

function squareKey(r, c) {
  return `${r},${c}`;
}

function clearSelection() {
  state.selected = null;
  state.hintTargets.clear();
  state.mustContinueCapture = false;
}

function selectSquare(r, c) {
  state.selected = { r, c };
  state.hintTargets.clear();

  const moves = getMovesForSquare(state.board, PLAYER, r, c, state.mustContinueCapture);
  for (const m of moves) {
    const k = squareKey(m.to.r, m.to.c);
    const existing = state.hintTargets.get(k);
    const isCapture = m.captures.length > 0;
    state.hintTargets.set(k, { capture: existing?.capture || isCapture });
  }
}

function findMoveTo(r, c) {
  if (!state.selected) return null;

  const moves = getMovesForSquare(
    state.board,
    PLAYER,
    state.selected.r,
    state.selected.c,
    state.mustContinueCapture
  );
  return moves.find((m) => m.to.r === r && m.to.c === c) || null;
}

function canSelectPiece(r, c) {
  const p = state.board[r][c];
  if (!p || p.color !== PLAYER) return false;
  const moves = getMovesForSquare(state.board, PLAYER, r, c, state.mustContinueCapture);
  return moves.length > 0;
}

function render() {
  setTurnLabel();
  syncCounts();

  dom.board.innerHTML = '';

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const sq = document.createElement('div');
      sq.className = `square ${isDarkSquare(r, c) ? 'dark' : 'light'}`;
      sq.dataset.r = String(r);
      sq.dataset.c = String(c);
      sq.setAttribute('role', 'gridcell');

      if (state.selected && state.selected.r === r && state.selected.c === c) {
        sq.classList.add('selected');
      }

      const hint = state.hintTargets.get(squareKey(r, c));
      if (hint) {
        sq.classList.add('hint');
        if (hint.capture) sq.classList.add('capture');
      }

      const piece = state.board[r][c];
      if (piece) {
        const el = document.createElement('div');
        el.className = `piece ${piece.color} ${piece.king ? 'king' : ''} ${piece.color === PLAYER ? 'draggable' : ''}`;
        el.dataset.r = String(r);
        el.dataset.c = String(c);
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${piece.color === PLAYER ? 'Your' : 'Computer'} ${piece.king ? 'king' : 'piece'}`);
        sq.appendChild(el);
      }

      dom.board.appendChild(sq);
    }
  }
}

function endPlayerTurn() {
  clearSelection();
  state.turn = AI;
  render();
  setStatus('Computer thinking…');
  state.aiThinking = true;
  window.setTimeout(aiTurn, 450 + Math.random() * 450);
}

function checkGameOver() {
  const { red, black } = countPieces(state.board);
  if (red === 0) return { over: true, winner: AI };
  if (black === 0) return { over: true, winner: PLAYER };

  const playerMoves = getAllLegalMoves(state.board, PLAYER);
  const aiMoves = getAllLegalMoves(state.board, AI);

  if (playerMoves.length === 0) return { over: true, winner: AI };
  if (aiMoves.length === 0) return { over: true, winner: PLAYER };

  return { over: false };
}

function afterMoveSounds(move, becameKing) {
  if (move.captures.length > 0) audio.capture();
  else audio.move();
  if (becameKing) audio.king();
}

function handlePlayerMove(move) {
  const { board: nextBoard, becameKing } = applyMove(state.board, move);
  state.board = nextBoard;

  afterMoveSounds(move, becameKing);

  const landed = move.to;
  if (move.captures.length > 0 && anyCaptureFrom(state.board, landed.r, landed.c)) {
    // Must continue capturing with this piece
    state.mustContinueCapture = true;
    selectSquare(landed.r, landed.c);
    setStatus('Keep jumping if you can (multi-jump).');
    render();
    return;
  }

  const over = checkGameOver();
  if (over.over) {
    state.turn = over.winner;
    render();
    if (over.winner === PLAYER) {
      setStatus('You win!');
      audio.win();
    } else {
      setStatus('Computer wins. Try again!');
    }
    return;
  }

  endPlayerTurn();
}

function handleBoardTap(targetSquare) {
  if (state.aiThinking) return;
  if (state.turn !== PLAYER) return;

  const r = Number(targetSquare.dataset.r);
  const c = Number(targetSquare.dataset.c);

  // If we have a selected piece, try to move
  if (state.selected) {
    const mv = findMoveTo(r, c);
    if (mv) {
      handlePlayerMove(mv);
      return;
    }

    // Allow selecting another piece (unless forced continuation)
    if (!state.mustContinueCapture && canSelectPiece(r, c)) {
      selectSquare(r, c);
      audio.click();
      render();
      setStatus('Choose a highlighted square.');
      return;
    }

    // Tap again to deselect (not during forced continuation)
    if (!state.mustContinueCapture) {
      clearSelection();
      render();
      setStatus('Tap a piece to see moves.');
      audio.click();
    } else {
      audio.invalid();
    }

    return;
  }

  // No selection yet: select a piece
  if (canSelectPiece(r, c)) {
    selectSquare(r, c);
    render();
    setStatus('Choose a highlighted square.');
    audio.click();
  } else {
    audio.invalid();
  }
}

function createGhost(pieceEl, color, isKing) {
  const g = document.createElement('div');
  g.className = `drag-ghost ${color} ${isKing ? 'king' : ''}`;
  // Mirror .piece styling
  g.style.background = getComputedStyle(pieceEl).backgroundImage || getComputedStyle(pieceEl).background;
  g.style.borderRadius = '999px';
  g.style.display = 'grid';
  g.style.placeItems = 'center';
  if (isKing) {
    const k = document.createElement('div');
    k.textContent = 'K';
    k.style.width = '34px';
    k.style.height = '34px';
    k.style.borderRadius = '999px';
    k.style.display = 'grid';
    k.style.placeItems = 'center';
    k.style.fontWeight = '800';
    k.style.fontSize = '1.05rem';
    k.style.color = 'rgba(255, 255, 255, 0.95)';
    k.style.background = 'rgba(0, 0, 0, 0.25)';
    k.style.border = '2px solid rgba(255, 255, 255, 0.25)';
    g.appendChild(k);
  }
  document.body.appendChild(g);
  return g;
}

function startDrag(pieceEl, pointerId, clientX, clientY) {
  if (state.aiThinking) return;
  if (state.turn !== PLAYER) return;

  const r = Number(pieceEl.dataset.r);
  const c = Number(pieceEl.dataset.c);
  if (!canSelectPiece(r, c)) return;

  // If continuing a capture chain, only allow dragging the forced piece
  if (state.mustContinueCapture && state.selected) {
    if (state.selected.r !== r || state.selected.c !== c) return;
  }

  const piece = state.board[r][c];

  selectSquare(r, c);
  render();

  pieceEl.classList.add('dragging');
  const ghost = createGhost(pieceEl, piece.color, piece.king);

  state.drag = {
    from: { r, c },
    ghostEl: ghost,
    pointerId,
  };

  moveGhost(clientX, clientY);
}

function moveGhost(x, y) {
  if (!state.drag) return;
  state.drag.ghostEl.style.left = `${x}px`;
  state.drag.ghostEl.style.top = `${y}px`;
}

function stopDrag(x, y) {
  if (!state.drag) return;

  const { from, ghostEl } = state.drag;
  state.drag = null;
  ghostEl.remove();

  // Reveal original piece on next render
  const hiddenPiece = dom.board.querySelector(`.piece.dragging[data-r="${from.r}"][data-c="${from.c}"]`);
  hiddenPiece?.classList.remove('dragging');

  const el = document.elementFromPoint(x, y);
  const square = el?.closest?.('.square');
  if (!square) {
    audio.invalid();
    render();
    return;
  }

  const r = Number(square.dataset.r);
  const c = Number(square.dataset.c);

  // Need selected set to from
  state.selected = { r: from.r, c: from.c };
  const mv = findMoveTo(r, c);
  if (mv) {
    handlePlayerMove(mv);
    return;
  }

  audio.invalid();
  render();
}

// ============================================================================
// AI
// ============================================================================
function scoreMove(board, move) {
  // Higher is better
  let score = 0;
  const captures = move.captures.length;
  score += captures * 120;

  // Prefer longer sequences
  score += Math.max(0, move.path.length - 2) * 25;

  // Prefer kinging
  const piece = board[move.from.r][move.from.c];
  const wouldKing = !piece.king && ((piece.color === AI && move.to.r === SIZE - 1) || (piece.color === PLAYER && move.to.r === 0));
  if (wouldKing) score += 80;

  // Slight preference for center
  const centerDist = Math.abs(move.to.r - 3.5) + Math.abs(move.to.c - 3.5);
  score += (7 - centerDist) * 2;

  // Add noise so it feels human
  score += (Math.random() - 0.5) * 30;
  return score;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function driftAiFocus() {
  // Small random walk; keeps games from feeling identical.
  const delta = (Math.random() - 0.5) * 0.14;
  state.aiFocus = clamp01(state.aiFocus + delta);
  // Keep it in a "friendly" range most of the time.
  state.aiFocus = Math.max(0.35, Math.min(0.85, state.aiFocus));
}

function movedPieceCanBeCaptured(nextBoard, movedTo, movingColor) {
  // One-ply safety check: would the opponent have an immediate capture of the moved piece?
  const opp = opponent(movingColor);
  const captures = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = nextBoard[r][c];
      if (!p || p.color !== opp) continue;
      const seq = generateCaptureSequences(nextBoard, r, c);
      captures.push(...seq);
    }
  }

  return captures.some((m) => m.captures.some((cap) => cap.r === movedTo.r && cap.c === movedTo.c));
}

function chooseAiMove(moves) {
  if (moves.length === 1) return moves[0];

  // "Friendly" AI: fluctuates between more focused and more casual.
  // Higher focus => picks from a tighter top band.
  const focus = state.aiFocus;

  // Slightly prefer captures, but since captures aren't forced, sometimes skip them.
  // This keeps it from feeling relentless.
  const captureMoves = moves.filter((m) => m.captures.length > 0);
  const nonCaptureMoves = moves.filter((m) => m.captures.length === 0);

  const willPreferCapture = captureMoves.length > 0 && (Math.random() < (0.55 + focus * 0.25));
  const candidateMoves = willPreferCapture ? captureMoves : (nonCaptureMoves.length ? nonCaptureMoves : moves);

  const scored = candidateMoves.map((m) => ({ m, s: scoreMove(state.board, m) }));
  scored.sort((a, b) => b.s - a.s);

  const best = scored[0].s;
  const bandWidth = 25 + (1 - focus) * 70; // lower focus => wider variety
  let band = scored.filter((x) => x.s >= best - bandWidth);
  if (!band.length) band = scored;

  // Avoid obvious hanging-piece blunders most of the time.
  // At low focus, it may still happen occasionally (human-like), but not constantly.
  const safetyBias = 0.75 + focus * 0.20; // 0.82..0.95
  if (Math.random() < safetyBias) {
    const safer = band.filter((x) => {
      const simulated = applyMove(state.board, x.m).board;
      return !movedPieceCanBeCaptured(simulated, x.m.to, AI);
    });
    if (safer.length) band = safer;
  }

  return band[Math.floor(Math.random() * band.length)].m;
}

function aiTurn() {
  driftAiFocus();
  const over = checkGameOver();
  if (over.over) {
    state.aiThinking = false;
    render();
    return;
  }

  const moves = getAllLegalMoves(state.board, AI);
  if (moves.length === 0) {
    state.aiThinking = false;
    state.turn = PLAYER;
    render();
    setStatus('You win!');
    audio.win();
    return;
  }

  const chosen = chooseAiMove(moves);
  const { board: nextBoard, becameKing } = applyMove(state.board, chosen);
  state.board = nextBoard;

  afterMoveSounds(chosen, becameKing);

  state.aiThinking = false;

  const over2 = checkGameOver();
  if (over2.over) {
    render();
    if (over2.winner === PLAYER) {
      setStatus('You win!');
      audio.win();
    } else {
      setStatus('Computer wins. Try again!');
    }
    return;
  }

  state.turn = PLAYER;
  render();
  setStatus('Your turn. Tap a piece to see moves.');
}

// ============================================================================
// INIT + EVENTS
// ============================================================================
function newGame() {
  state.board = createInitialBoard();
  state.turn = PLAYER;
  state.aiThinking = false;
  clearSelection();
  render();
  setStatus('Your turn. Tap a piece to see moves.');
}

function init() {
  // Sound
  state.soundEnabled = loadSoundEnabled();
  audio.setMuted(!state.soundEnabled);
  updateSoundUI();

  const unlock = () => {
    audio.ensure();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });

  // Header actions
  dom.soundBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    setSoundEnabled(state.soundEnabled);
    updateSoundUI();
    audio.click();
  });

  dom.helpBtn.addEventListener('click', () => {
    ModalManager?.open?.('rulesModal');
    audio.click();
  });
  dom.closeRulesBtn.addEventListener('click', () => ModalManager?.close?.());
  dom.gotItBtn.addEventListener('click', () => ModalManager?.close?.());

  dom.newGameBtn.addEventListener('click', () => {
    audio.click();
    newGame();
  });

  // Board: tap
  dom.board.addEventListener('click', (e) => {
    const sq = e.target.closest('.square');
    if (!sq) return;
    handleBoardTap(sq);
  });

  // Board: drag via pointer events on pieces
  dom.board.addEventListener('pointerdown', (e) => {
    const pieceEl = e.target.closest('.piece.red');
    if (!pieceEl) return;

    e.preventDefault();
    audio.ensure();

    pieceEl.setPointerCapture?.(e.pointerId);
    startDrag(pieceEl, e.pointerId, e.clientX, e.clientY);
  });

  dom.board.addEventListener('pointermove', (e) => {
    if (!state.drag || state.drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    moveGhost(e.clientX, e.clientY);
  });

  dom.board.addEventListener('pointerup', (e) => {
    if (!state.drag || state.drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    stopDrag(e.clientX, e.clientY);
  });

  dom.board.addEventListener('pointercancel', (e) => {
    if (!state.drag || state.drag.pointerId !== e.pointerId) return;
    stopDrag(e.clientX, e.clientY);
  });

  newGame();
}

init();
