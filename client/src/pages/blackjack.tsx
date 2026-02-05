import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Menu, Maximize2, X } from "lucide-react";

// --- Types ---
type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type GameState = "BETTING" | "DEALING" | "PLAYER_TURN" | "DEALER_TURN" | "RESOLVED";

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  isHidden?: boolean;
  id: string;
}

// --- Constants ---
const INITIAL_CREDITS = 500;
const CHIP_VALUES = [10, 20, 50, 100] as const;
const DECK_COUNT = 4;
const SHUFFLE_THRESHOLD = 0.25;

// --- Audio Manager ---
class AudioManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setMuted(m: boolean) { this.muted = m; }

  private playTone(freq: number, type: OscillatorType, dur: number, vol: number, delay: number = 0) {
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
    this.playTone(1200, "sine", 0.08, 0.15);
    this.playTone(800, "sine", 0.06, 0.1, 0.03);
  }

  playClick() {
    this.playTone(600, "sine", 0.04, 0.1);
  }

  playWin() {
    this.playTone(523.25, "sine", 0.25, 0.12, 0);
    this.playTone(659.25, "sine", 0.25, 0.12, 0.1);
    this.playTone(783.99, "sine", 0.35, 0.12, 0.2);
  }

  playBlackjack() {
    this.playWin();
    this.playTone(1046.50, "sine", 0.4, 0.15, 0.3);
  }

  playLoss() {
    this.playTone(200, "triangle", 0.25, 0.1);
    this.playTone(150, "triangle", 0.3, 0.08, 0.1);
  }
}

const audio = new AudioManager();

// --- Helpers ---
function getRankValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return parseInt(rank);
}

function createDeck(count: number): Card[] {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck: Card[] = [];
  for (let i = 0; i < count; i++) {
    for (const suit of suits) {
      for (const rank of ranks) {
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

function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  const array = new Uint32Array(newDeck.length);
  window.crypto.getRandomValues(array);
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

function calculateHand(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.isHidden) continue;
    total += c.value;
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

// --- SVG Components ---

// Card Back with diamond pattern
function CardBack({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 140" className={className}>
      <defs>
        <pattern id="diamondPattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#3b5998"/>
          <path d="M8 0 L16 8 L8 16 L0 8 Z" fill="#4a69bd" opacity="0.6"/>
          <path d="M8 4 L12 8 L8 12 L4 8 Z" fill="#6a89cc" opacity="0.4"/>
        </pattern>
        <linearGradient id="cardEdge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8e8e8"/>
          <stop offset="50%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#d8d8d8"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="140" rx="8" fill="url(#cardEdge)"/>
      <rect x="4" y="4" width="92" height="132" rx="6" fill="url(#diamondPattern)"/>
      <rect x="4" y="4" width="92" height="132" rx="6" fill="none" stroke="#2c3e50" strokeWidth="1" opacity="0.3"/>
    </svg>
  );
}

// Stacked deck visual
function DeckStack({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className="absolute" 
          style={{ 
            top: `${i * -2}px`, 
            left: `${i * 1}px`,
            zIndex: 5 - i 
          }}
        >
          <CardBack className="w-20 sm:w-24 md:w-28 drop-shadow-md" />
        </div>
      ))}
    </div>
  );
}

// Playing Card Face
function PlayingCard({ card, className = "", style = {} }: { card: Card; className?: string; style?: React.CSSProperties }) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const color = isRed ? "#dc2626" : "#1e293b";
  
  if (card.isHidden) {
    return <CardBack className={className} />;
  }

  const suitSymbol = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠"
  }[card.suit];

  // Face card artwork (simplified but recognizable)
  const renderFaceCard = () => {
    if (!["J", "Q", "K"].includes(card.rank)) return null;
    
    const faceColors = {
      J: { primary: "#4a5568", secondary: "#718096", accent: "#ecc94b" },
      Q: { primary: "#9f7aea", secondary: "#b794f4", accent: "#faf089" },
      K: { primary: "#e53e3e", secondary: "#fc8181", accent: "#faf089" }
    }[card.rank]!;

    return (
      <g transform="translate(25, 35)">
        {/* Crown/Hat for K/Q, Cap for J */}
        {card.rank === "K" && (
          <path d="M25 5 L30 15 L35 5 L40 15 L45 5 L45 20 L5 20 L5 5 L10 15 L15 5 L20 15 Z" 
                fill={faceColors.accent} stroke="#b7791f" strokeWidth="1"/>
        )}
        {card.rank === "Q" && (
          <ellipse cx="25" cy="12" rx="18" ry="10" fill={faceColors.accent} stroke="#b7791f" strokeWidth="1"/>
        )}
        {card.rank === "J" && (
          <path d="M10 15 L40 15 L38 5 L12 5 Z" fill={faceColors.primary} stroke="#2d3748" strokeWidth="1"/>
        )}
        {/* Face */}
        <ellipse cx="25" cy="35" rx="15" ry="18" fill="#fbd38d" stroke="#d69e2e" strokeWidth="1"/>
        {/* Eyes */}
        <circle cx="20" cy="32" r="2" fill="#2d3748"/>
        <circle cx="30" cy="32" r="2" fill="#2d3748"/>
        {/* Mouth */}
        <path d="M20 40 Q25 44 30 40" fill="none" stroke="#c53030" strokeWidth="1.5"/>
        {/* Body/Robe */}
        <path d="M10 55 L15 50 L25 55 L35 50 L40 55 L40 70 L10 70 Z" 
              fill={faceColors.primary} stroke={faceColors.secondary} strokeWidth="1"/>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 100 140" className={className} style={style}>
      <defs>
        <linearGradient id="cardFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#f7f7f7"/>
        </linearGradient>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Card base */}
      <rect x="0" y="0" width="100" height="140" rx="8" fill="url(#cardFace)" filter="url(#cardShadow)"/>
      <rect x="0" y="0" width="100" height="140" rx="8" fill="none" stroke="#d1d5db" strokeWidth="1"/>
      
      {/* Top left corner */}
      <text x="8" y="22" fontSize="18" fontWeight="bold" fill={color} fontFamily="Georgia, serif">{card.rank}</text>
      <text x="10" y="38" fontSize="16" fill={color}>{suitSymbol}</text>
      
      {/* Bottom right corner (rotated) */}
      <g transform="rotate(180, 50, 70)">
        <text x="8" y="22" fontSize="18" fontWeight="bold" fill={color} fontFamily="Georgia, serif">{card.rank}</text>
        <text x="10" y="38" fontSize="16" fill={color}>{suitSymbol}</text>
      </g>
      
      {/* Center content */}
      {["J", "Q", "K"].includes(card.rank) ? (
        renderFaceCard()
      ) : (
        <text x="50" y="80" fontSize="36" fill={color} textAnchor="middle" dominantBaseline="middle">
          {suitSymbol}
        </text>
      )}
    </svg>
  );
}

// Casino Chip
function Chip({ value, selected = false, onClick, disabled = false, size = "md" }: { 
  value: number; 
  selected?: boolean; 
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const colors: Record<number, { bg: string; ring: string; text: string }> = {
    10: { bg: "#3b82f6", ring: "#60a5fa", text: "#ffffff" },
    20: { bg: "#ec4899", ring: "#f472b6", text: "#ffffff" },
    50: { bg: "#22c55e", ring: "#4ade80", text: "#ffffff" },
    100: { bg: "#ef4444", ring: "#f87171", text: "#ffffff" },
  };
  
  const c = colors[value] || colors[10];
  const sizes = {
    sm: "w-10 h-10",
    md: "w-14 h-14 sm:w-16 sm:h-16",
    lg: "w-16 h-16 sm:w-20 sm:h-20"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizes[size]} relative transition-all duration-200 ${
        selected ? "scale-110 -translate-y-2" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"}`}
      aria-label={`${value} chip`}
    >
      <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-lg">
        {/* Outer ring */}
        <circle cx="30" cy="30" r="28" fill={c.bg} stroke={c.ring} strokeWidth="3"/>
        {/* Dashed edge pattern */}
        <circle cx="30" cy="30" r="24" fill="none" stroke="#ffffff" strokeWidth="2" 
                strokeDasharray="6 4" opacity="0.5"/>
        {/* Inner circle */}
        <circle cx="30" cy="30" r="18" fill={c.bg} stroke={c.ring} strokeWidth="1"/>
        {/* Value text */}
        <text x="30" y="32" textAnchor="middle" dominantBaseline="middle" 
              fontSize={value >= 100 ? "12" : "14"} fontWeight="bold" fill={c.text}
              fontFamily="Arial, sans-serif">
          {value}
        </text>
      </svg>
    </button>
  );
}

// Credits display with coin icon
function CreditsDisplay({ credits }: { credits: number }) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg">
      <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7">
        <circle cx="12" cy="12" r="10" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5"/>
        <text x="12" y="13" textAnchor="middle" dominantBaseline="middle" 
              fontSize="10" fontWeight="bold" fill="#92400e" fontFamily="Arial">$</text>
      </svg>
      <span className="text-lg sm:text-xl font-bold text-white">{credits}</span>
    </div>
  );
}

// Header icon button
function IconButton({ onClick, children, ariaLabel }: { onClick: () => void; children: React.ReactNode; ariaLabel: string }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center border-2 border-[#52b788] text-[#52b788] 
                 rounded-md hover:bg-[#52b788]/20 transition-colors"
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

// Total badge
function TotalBadge({ total, className = "" }: { total: number; className?: string }) {
  return (
    <div className={`bg-slate-800/90 text-white px-3 py-1 rounded text-lg sm:text-xl font-bold min-w-[3rem] text-center ${className}`}>
      {total}
    </div>
  );
}

// --- Main Component ---
export default function Blackjack() {
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [currentBet, setCurrentBet] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("BETTING");
  const [statusMsg, setStatusMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isDoubled, setIsDoubled] = useState(false);
  
  const deckRef = useRef<Card[]>([]);

  useEffect(() => {
    resetDeck();
  }, []);

  const resetDeck = () => {
    const newDeck = shuffleDeck(createDeck(DECK_COUNT));
    setDeck(newDeck);
    deckRef.current = newDeck;
  };

  const handleMute = () => {
    audio.init();
    setMuted(!muted);
    audio.setMuted(!muted);
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const addChip = (value: number) => {
    if (gameState !== "BETTING") return;
    if (credits >= value) {
      audio.init();
      audio.playChip();
      setCurrentBet(b => b + value);
      setCredits(c => c - value);
    }
  };

  const clearBet = () => {
    if (gameState !== "BETTING") return;
    setCredits(c => c + currentBet);
    setCurrentBet(0);
  };

  const deal = async () => {
    if (gameState !== "BETTING") return;
    
    // Default bet to 20 if none selected
    let betAmount = currentBet;
    if (betAmount === 0) {
      betAmount = 20;
      if (credits >= 20) {
        setCurrentBet(20);
        setCredits(c => c - 20);
      } else {
        // If they can't afford 20, use whatever they have
        betAmount = Math.min(credits, 10);
        setCurrentBet(betAmount);
        setCredits(c => c - betAmount);
      }
    }
    
    audio.init();
    audio.playClick();
    
    setGameState("DEALING");
    setPlayerHand([]);
    setDealerHand([]);
    setStatusMsg("");
    setIsDoubled(false);
    
    let currentDeck = [...deckRef.current];
    
    // Check shuffle
    if (currentDeck.length < (52 * DECK_COUNT * SHUFFLE_THRESHOLD)) {
      setStatusMsg("Shuffling...");
      await sleep(1000);
      currentDeck = shuffleDeck(createDeck(DECK_COUNT));
      setStatusMsg("");
    }
    
    // Deal cards
    const pCard1 = currentDeck.pop()!;
    const dCard1 = currentDeck.pop()!;
    const pCard2 = currentDeck.pop()!;
    const dCard2 = { ...currentDeck.pop()!, isHidden: true };
    
    deckRef.current = currentDeck;
    setDeck(currentDeck);
    
    audio.playDeal();
    setPlayerHand([pCard1]);
    await sleep(300);
    audio.playDeal();
    setDealerHand([dCard1]);
    await sleep(300);
    audio.playDeal();
    setPlayerHand([pCard1, pCard2]);
    await sleep(300);
    audio.playDeal();
    setDealerHand([dCard1, dCard2]);
    await sleep(400);
    
    // Check blackjack
    const pTotal = calculateHand([pCard1, pCard2]);
    if (pTotal === 21) {
      const dTotal = calculateHand([dCard1, { ...dCard2, isHidden: false }]);
      setDealerHand([dCard1, { ...dCard2, isHidden: false }]);
      
      if (dTotal === 21) {
        endRound("push", "Push - Both Blackjack!");
      } else {
        endRound("blackjack", "Blackjack! You win!");
      }
    } else {
      setGameState("PLAYER_TURN");
    }
  };

  const hit = async () => {
    if (gameState !== "PLAYER_TURN") return;
    audio.playDeal();
    
    const card = deckRef.current.pop()!;
    setDeck([...deckRef.current]);
    
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    
    if (calculateHand(newHand) > 21) {
      await sleep(500);
      endRound("loss", "Busted!");
    }
  };

  const stand = async () => {
    if (gameState !== "PLAYER_TURN") return;
    audio.playClick();
    setGameState("DEALER_TURN");
    await playDealer();
  };

  const doubleDown = async () => {
    if (gameState !== "PLAYER_TURN" || playerHand.length !== 2 || credits < currentBet) return;
    
    audio.playChip();
    setCredits(c => c - currentBet);
    setCurrentBet(b => b * 2);
    setIsDoubled(true);
    
    // Deal one card
    audio.playDeal();
    const card = deckRef.current.pop()!;
    setDeck([...deckRef.current]);
    
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    
    await sleep(500);
    
    if (calculateHand(newHand) > 21) {
      endRound("loss", "Busted!");
    } else {
      setGameState("DEALER_TURN");
      await playDealer();
    }
  };

  const playDealer = async () => {
    await sleep(500);
    
    // Reveal hole card
    const revealedHole = { ...dealerHand[1], isHidden: false };
    let currentHand = [dealerHand[0], revealedHole];
    setDealerHand(currentHand);
    audio.playDeal();
    
    await sleep(600);
    
    // Dealer hits until 17
    while (calculateHand(currentHand) < 17) {
      await sleep(800);
      const card = deckRef.current.pop()!;
      setDeck([...deckRef.current]);
      currentHand = [...currentHand, card];
      setDealerHand(currentHand);
      audio.playDeal();
    }
    
    await sleep(500);
    resolveRound(calculateHand(currentHand));
  };

  const resolveRound = (dealerTotal: number) => {
    const playerTotal = calculateHand(playerHand);
    
    if (dealerTotal > 21) {
      endRound("win", "Dealer Busts! You win!");
    } else if (playerTotal > dealerTotal) {
      endRound("win", "You win!");
    } else if (playerTotal < dealerTotal) {
      endRound("loss", "Dealer wins");
    } else {
      endRound("push", "Push");
    }
  };

  const endRound = (result: "win" | "loss" | "push" | "blackjack", message: string) => {
    setGameState("RESOLVED");
    setStatusMsg(message);
    
    if (result === "blackjack") {
      // 3:2 payout
      setCredits(c => c + Math.floor(currentBet * 2.5));
      audio.playBlackjack();
    } else if (result === "win") {
      setCredits(c => c + currentBet * 2);
      audio.playWin();
    } else if (result === "push") {
      setCredits(c => c + currentBet);
      audio.playClick();
    } else {
      audio.playLoss();
    }
  };

  const newHand = () => {
    setCurrentBet(0);
    setPlayerHand([]);
    setDealerHand([]);
    setStatusMsg("");
    setGameState("BETTING");
    
    if (credits <= 0) {
      setCredits(INITIAL_CREDITS);
    }
  };

  const playerTotal = calculateHand(playerHand);
  const dealerTotal = calculateHand(dealerHand);
  const canDouble = gameState === "PLAYER_TURN" && playerHand.length === 2 && credits >= currentBet;

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-[#1b4332] z-20">
        <CreditsDisplay credits={credits} />
        <div className="flex gap-2">
          <IconButton onClick={() => setShowRules(true)} ariaLabel="Rules">
            <Menu className="w-5 h-5" />
          </IconButton>
          <IconButton onClick={handleMute} ariaLabel={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </IconButton>
          <IconButton onClick={() => document.documentElement.requestFullscreen?.()} ariaLabel="Fullscreen">
            <Maximize2 className="w-5 h-5" />
          </IconButton>
        </div>
      </header>

      {/* Main Table Area */}
      <main className="flex-1 relative bg-[#2d6a4f] overflow-hidden">
        {/* Radial gradient for felt */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#40916c_0%,_#2d6a4f_60%,_#1b4332_100%)]" />
        
        {/* Table edge curve */}
        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0 20 Q50 0 100 20 L100 20 L0 20 Z" fill="#5c3d2e"/>
            <path d="M0 20 Q50 2 100 20" fill="none" stroke="#8b5a3c" strokeWidth="0.5"/>
          </svg>
        </div>

        {/* Deck Stack - Left Side */}
        <div className="absolute left-4 sm:left-8 top-8 sm:top-12">
          <DeckStack />
        </div>

        {/* Current Bet Chip - Right Side */}
        {currentBet > 0 && (
          <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            <Chip value={currentBet <= 10 ? 10 : currentBet <= 20 ? 20 : currentBet <= 50 ? 50 : 100} size="lg" disabled />
            <TotalBadge total={currentBet} />
          </div>
        )}

        {/* Dealer Area */}
        <section className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          {dealerHand.length > 0 && (
            <TotalBadge total={dealerTotal} className="mb-2" />
          )}
          <div className="flex -space-x-12 sm:-space-x-16">
            {dealerHand.map((card, i) => (
              <PlayingCard 
                key={card.id} 
                card={card} 
                className="w-24 sm:w-28 md:w-32 lg:w-36 transition-all duration-300"
                style={{ 
                  transform: `rotate(${(i - (dealerHand.length - 1) / 2) * 5}deg)`,
                  zIndex: i
                }}
              />
            ))}
          </div>
        </section>

        {/* Player Area */}
        <section className="absolute bottom-32 sm:bottom-40 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="flex -space-x-12 sm:-space-x-16 mb-2">
            {playerHand.map((card, i) => (
              <PlayingCard 
                key={card.id} 
                card={card} 
                className="w-24 sm:w-28 md:w-32 lg:w-36 transition-all duration-300"
                style={{ 
                  transform: `rotate(${(i - (playerHand.length - 1) / 2) * 5}deg)`,
                  zIndex: i
                }}
              />
            ))}
          </div>
          {playerHand.length > 0 && (
            <TotalBadge total={playerTotal} />
          )}
        </section>

        {/* Status Message */}
        {statusMsg && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          bg-black/70 text-white px-6 py-3 rounded-xl text-xl sm:text-2xl font-bold
                          animate-pulse z-30">
            {statusMsg}
          </div>
        )}
      </main>

      {/* Controls Footer */}
      <footer className="bg-[#3d2314] pt-4 pb-3 sm:pb-4 px-4 relative z-20">
        {/* Wood grain texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#5c3d2e] to-[#3d2314] opacity-50" />
        
        <div className="relative max-w-2xl mx-auto">
          {/* Betting Phase */}
          {gameState === "BETTING" && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-center gap-3 sm:gap-4">
                {CHIP_VALUES.map(val => (
                  <Chip 
                    key={val} 
                    value={val} 
                    onClick={() => addChip(val)}
                    disabled={credits < val}
                  />
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={deal}
                  disabled={credits === 0}
                  className="px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-lg
                           bg-[#22c55e] hover:bg-[#16a34a] text-white
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all active:scale-95 shadow-lg"
                >
                  DEAL
                </button>
                {currentBet > 0 && (
                  <button
                    onClick={clearBet}
                    className="px-4 py-3 text-sm font-bold rounded-lg
                             bg-slate-600 hover:bg-slate-500 text-white
                             transition-all active:scale-95"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Player Turn */}
          {gameState === "PLAYER_TURN" && (
            <div className="flex justify-center gap-3 sm:gap-4">
              <button
                onClick={stand}
                className="flex-1 max-w-[150px] py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-lg
                         bg-gradient-to-b from-[#f97316] to-[#ea580c] text-white
                         hover:from-[#fb923c] hover:to-[#f97316]
                         transition-all active:scale-95 shadow-lg"
              >
                STAND
              </button>
              {canDouble && (
                <button
                  onClick={doubleDown}
                  className="flex-1 max-w-[150px] py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-lg
                           bg-gradient-to-b from-[#3b82f6] to-[#2563eb] text-white
                           hover:from-[#60a5fa] hover:to-[#3b82f6]
                           transition-all active:scale-95 shadow-lg"
                >
                  DOUBLE
                </button>
              )}
              <button
                onClick={hit}
                className="flex-1 max-w-[150px] py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-lg
                         bg-gradient-to-b from-[#06b6d4] to-[#0891b2] text-white
                         hover:from-[#22d3ee] hover:to-[#06b6d4]
                         transition-all active:scale-95 shadow-lg"
              >
                HIT
              </button>
            </div>
          )}

          {/* Dealer Turn / Resolved */}
          {(gameState === "DEALER_TURN" || gameState === "RESOLVED") && (
            <div className="flex justify-center">
              {gameState === "RESOLVED" && (
                <button
                  onClick={newHand}
                  className="px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-lg
                           bg-[#22c55e] hover:bg-[#16a34a] text-white
                           transition-all active:scale-95 shadow-lg"
                >
                  NEW HAND
                </button>
              )}
            </div>
          )}
        </div>
      </footer>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowRules(false)}>
          <div className="bg-slate-900 rounded-xl max-w-md w-full p-6 text-white" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#52b788]">How to Play</h2>
              <button onClick={() => setShowRules(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>• <strong>Goal:</strong> Get closer to 21 than the dealer without going over.</li>
              <li>• <strong>Dealer:</strong> Stands on 17 and above.</li>
              <li>• <strong>Blackjack:</strong> Pays 3:2.</li>
              <li>• <strong>Double:</strong> Double your bet for one more card.</li>
              <li>• Tap chips to place your bet, then tap DEAL.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
