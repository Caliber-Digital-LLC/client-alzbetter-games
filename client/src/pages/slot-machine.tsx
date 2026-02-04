import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Volume2, VolumeX, Play, Square, RotateCcw } from "lucide-react";

type SymbolType = "star" | "heart" | "horseshoe" | "bell" | "seven";

const SYMBOLS: SymbolType[] = ["star", "heart", "horseshoe", "bell", "seven"];
const REEL_STRIP: SymbolType[] = [
  "star", "heart", "horseshoe", "bell", "seven",
  "star", "heart", "horseshoe", "bell", "star",
  "heart", "horseshoe", "bell", "star", "seven",
  "heart", "horseshoe", "star", "bell", "heart",
];

const SPIN_DURATIONS = [900, 1200, 1500];
const INITIAL_CREDITS = 100;

interface ReelState {
  symbols: SymbolType[];
  spinning: boolean;
  finalPosition: number;
}

interface WinResult {
  type: "none" | "two" | "three" | "jackpot";
  amount: number;
}

function getRandomInt(max: number): number {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
}

function SymbolSVG({ type, size = 80 }: { type: SymbolType; size?: number }) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  switch (type) {
    case "star":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Star symbol">
          <defs>
            <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFA500" />
            </linearGradient>
            <filter id="starGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M50 10 L61 39 L92 39 L67 58 L78 90 L50 71 L22 90 L33 58 L8 39 L39 39 Z"
            fill="url(#starGrad)"
            stroke="#DAA520"
            strokeWidth="2"
            filter={prefersReducedMotion ? undefined : "url(#starGlow)"}
          />
        </svg>
      );
    case "heart":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Heart symbol">
          <defs>
            <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B8A" />
              <stop offset="100%" stopColor="#E91E63" />
            </linearGradient>
            <filter id="heartGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M50 88 C20 60, 10 40, 25 25 C35 15, 50 20, 50 35 C50 20, 65 15, 75 25 C90 40, 80 60, 50 88 Z"
            fill="url(#heartGrad)"
            stroke="#C2185B"
            strokeWidth="2"
            filter={prefersReducedMotion ? undefined : "url(#heartGlow)"}
          />
        </svg>
      );
    case "horseshoe":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Horseshoe symbol">
          <defs>
            <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B7355" />
              <stop offset="50%" stopColor="#DAA520" />
              <stop offset="100%" stopColor="#8B7355" />
            </linearGradient>
            <filter id="shoeGlow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M20 85 L20 40 C20 20, 35 10, 50 10 C65 10, 80 20, 80 40 L80 85 L68 85 L68 42 C68 28, 60 22, 50 22 C40 22, 32 28, 32 42 L32 85 Z"
            fill="url(#shoeGrad)"
            stroke="#8B4513"
            strokeWidth="2"
            filter={prefersReducedMotion ? undefined : "url(#shoeGlow)"}
          />
          <circle cx="26" cy="50" r="4" fill="#FFD700" />
          <circle cx="74" cy="50" r="4" fill="#FFD700" />
          <circle cx="26" cy="65" r="4" fill="#FFD700" />
          <circle cx="74" cy="65" r="4" fill="#FFD700" />
        </svg>
      );
    case "bell":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Bell symbol">
          <defs>
            <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFC107" />
              <stop offset="100%" stopColor="#FF9800" />
            </linearGradient>
            <filter id="bellGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M50 10 C50 10, 55 10, 55 18 C70 22, 80 35, 80 55 L80 70 L85 75 L85 80 L15 80 L15 75 L20 70 L20 55 C20 35, 30 22, 45 18 C45 10, 50 10, 50 10 Z"
            fill="url(#bellGrad)"
            stroke="#E65100"
            strokeWidth="2"
            filter={prefersReducedMotion ? undefined : "url(#bellGlow)"}
          />
          <ellipse cx="50" cy="88" rx="10" ry="6" fill="#FFD700" stroke="#E65100" strokeWidth="1.5" />
        </svg>
      );
    case "seven":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Lucky Seven symbol">
          <defs>
            <linearGradient id="sevenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7B68EE" />
              <stop offset="50%" stopColor="#9370DB" />
              <stop offset="100%" stopColor="#6A5ACD" />
            </linearGradient>
            <filter id="sevenGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <text
            x="50"
            y="75"
            textAnchor="middle"
            fontSize="70"
            fontWeight="bold"
            fontFamily="Georgia, serif"
            fill="url(#sevenGrad)"
            stroke="#4B0082"
            strokeWidth="2"
            filter={prefersReducedMotion ? undefined : "url(#sevenGlow)"}
          >
            7
          </text>
        </svg>
      );
  }
}

class AudioManager {
  private audioContext: AudioContext | null = null;
  private muted: boolean = false;
  private initialized: boolean = false;

  init() {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.initialized = true;
    } catch {
      console.warn("WebAudio not supported");
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) {
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
    filter.type = "lowpass";
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
    this.playTone(600, 0.08, "sine", 0.15);
  }

  playWin() {
    const notes = [523, 659, 784]; // C5, E5, G5 triad
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, "sine", 0.25), i * 150);
    });
  }

  playBigWin() {
    const notes = [523, 659, 784, 1047, 784, 1047]; // Ascending arpeggio
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.4, "sine", 0.25), i * 180);
    });
  }
}

const audioManager = new AudioManager();

function Confetti({ active }: { active: boolean }) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  if (!active || prefersReducedMotion) return null;
  
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
    color: ["#FFD700", "#FF6B8A", "#7B68EE", "#4ECDC4", "#FFA500"][i % 5],
  }));
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-full animate-confetti"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function ReelSymbol({ symbol, position }: { symbol: SymbolType; position: "top" | "middle" | "bottom" }) {
  const opacity = position === "middle" ? 1 : 0.5;
  const scale = position === "middle" ? 1 : 0.85;
  
  return (
    <div
      className="flex items-center justify-center transition-all duration-200"
      style={{ opacity, transform: `scale(${scale})` }}
    >
      <SymbolSVG type={symbol} size={70} />
    </div>
  );
}

function Reel({ symbols, spinning, reelIndex }: { symbols: SymbolType[]; spinning: boolean; reelIndex: number }) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  return (
    <div 
      className="flex flex-col gap-2 p-3 bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-lg border-2 border-amber-600/50 shadow-inner"
      aria-label={`Reel ${reelIndex + 1}`}
    >
      {symbols.map((symbol, idx) => (
        <div
          key={idx}
          className={`
            transition-transform
            ${spinning && !prefersReducedMotion ? "animate-reel-spin" : ""}
          `}
          style={{
            animationDelay: spinning ? `${idx * 50}ms` : "0ms",
          }}
        >
          <ReelSymbol
            symbol={symbol}
            position={idx === 0 ? "top" : idx === 1 ? "middle" : "bottom"}
          />
        </div>
      ))}
      {/* Middle row highlight */}
      <div className="absolute left-0 right-0 h-[85px] top-1/2 -translate-y-1/2 border-y-2 border-amber-400/60 pointer-events-none" />
    </div>
  );
}

export default function SlotMachine() {
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [bet] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reels, setReels] = useState<ReelState[]>(() =>
    Array.from({ length: 3 }, () => ({
      symbols: [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
      spinning: false,
      finalPosition: 0,
    }))
  );
  const [winResult, setWinResult] = useState<WinResult | null>(null);
  const [statusMessage, setStatusMessage] = useState("Tap Spin to play");
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [soundInitialized, setSoundInitialized] = useState(false);
  
  const autoPlayRef = useRef(autoPlay);
  const spinningRef = useRef(spinning);
  
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);
  
  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  const initializeSound = useCallback(() => {
    if (!soundInitialized) {
      audioManager.init();
      setSoundInitialized(true);
    }
  }, [soundInitialized]);

  const evaluateWin = useCallback((finalReels: SymbolType[][]): WinResult => {
    const middleRow = finalReels.map((reel) => reel[1]);
    
    // Check for three of a kind
    if (middleRow[0] === middleRow[1] && middleRow[1] === middleRow[2]) {
      if (middleRow[0] === "seven") {
        return { type: "jackpot", amount: 25 };
      }
      return { type: "three", amount: 10 };
    }
    
    // Check for two of a kind (first two or last two)
    if (middleRow[0] === middleRow[1] || middleRow[1] === middleRow[2]) {
      return { type: "two", amount: 2 };
    }
    
    return { type: "none", amount: 0 };
  }, []);

  const spin = useCallback(() => {
    if (spinning || credits < bet) return;
    
    initializeSound();
    
    setCredits((prev) => prev - bet);
    setSpinning(true);
    setWinResult(null);
    setShowCelebration(false);
    setStatusMessage("Spinning...");
    
    if (!muted) {
      audioManager.playSpinStart();
    }
    
    // Generate final positions
    const finalPositions = Array.from({ length: 3 }, () => getRandomInt(REEL_STRIP.length));
    
    // Start spinning all reels
    setReels((prev) =>
      prev.map((reel) => ({
        ...reel,
        spinning: true,
      }))
    );
    
    // Stop reels one by one
    finalPositions.forEach((pos, reelIdx) => {
      setTimeout(() => {
        const symbolIdx = pos;
        const topIdx = (symbolIdx - 1 + REEL_STRIP.length) % REEL_STRIP.length;
        const bottomIdx = (symbolIdx + 1) % REEL_STRIP.length;
        
        setReels((prev) =>
          prev.map((reel, idx) =>
            idx === reelIdx
              ? {
                  symbols: [REEL_STRIP[topIdx], REEL_STRIP[symbolIdx], REEL_STRIP[bottomIdx]],
                  spinning: false,
                  finalPosition: pos,
                }
              : reel
          )
        );
        
        if (!muted) {
          audioManager.playReelStop();
        }
        
        // After last reel stops, evaluate win
        if (reelIdx === 2) {
          setTimeout(() => {
            const finalSymbols = finalPositions.map((p) => {
              const topIdx = (p - 1 + REEL_STRIP.length) % REEL_STRIP.length;
              const bottomIdx = (p + 1) % REEL_STRIP.length;
              return [REEL_STRIP[topIdx], REEL_STRIP[p], REEL_STRIP[bottomIdx]];
            });
            
            const result = evaluateWin(finalSymbols);
            setWinResult(result);
            
            if (result.amount > 0) {
              setCredits((prev) => prev + result.amount);
              setShowCelebration(true);
              
              if (result.type === "jackpot") {
                setStatusMessage("JACKPOT! +25 Credits!");
                if (!muted) audioManager.playBigWin();
              } else if (result.type === "three") {
                setStatusMessage("Big Win! +10 Credits!");
                if (!muted) audioManager.playBigWin();
              } else {
                setStatusMessage("Winner! +2 Credits!");
                if (!muted) audioManager.playWin();
              }
              
              setTimeout(() => setShowCelebration(false), 2500);
            } else {
              setStatusMessage("Try again!");
            }
            
            setSpinning(false);
            
            // Check if game over
            setCredits((prev) => {
              if (prev <= 0) {
                setGameOver(true);
                setAutoPlay(false);
                setStatusMessage("Thanks for playing!");
              }
              return prev;
            });
          }, 200);
        }
      }, SPIN_DURATIONS[reelIdx]);
    });
  }, [spinning, credits, bet, muted, evaluateWin, initializeSound]);

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay || spinning || gameOver || credits < bet) {
      return;
    }
    
    const timer = setTimeout(() => {
      if (autoPlayRef.current && !spinningRef.current && !gameOver) {
        spin();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [autoPlay, spinning, gameOver, credits, bet, spin]);

  const handleMuteToggle = () => {
    initializeSound();
    setMuted((prev) => {
      audioManager.setMuted(!prev);
      return !prev;
    });
  };

  const handleAutoToggle = () => {
    initializeSound();
    setAutoPlay((prev) => !prev);
  };

  const handleReset = () => {
    setCredits(INITIAL_CREDITS);
    setGameOver(false);
    setWinResult(null);
    setStatusMessage("Tap Spin to play");
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900 flex flex-col items-center justify-between p-4 pb-8 overflow-hidden">
      {/* Ambient glow effects */}
      {!prefersReducedMotion && (
        <>
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}
      
      {/* Header */}
      <header className="text-center z-10 relative">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">
          Calm Vegas Slots
        </h1>
        <p 
          className="text-lg sm:text-xl text-amber-100/80 mt-2 min-h-[28px]"
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      </header>

      {/* Slot Cabinet */}
      <Card className="relative bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-600/60 p-4 sm:p-6 rounded-2xl shadow-2xl z-10">
        {/* Cabinet frame glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/5 to-transparent rounded-2xl pointer-events-none" />
        
        {/* Win celebration */}
        <Confetti active={showCelebration} />
        
        {/* Win glow overlay */}
        {showCelebration && !prefersReducedMotion && (
          <div className="absolute inset-0 bg-amber-400/10 rounded-2xl animate-pulse pointer-events-none" />
        )}
        
        {/* Reels Container */}
        <div 
          className="flex gap-3 sm:gap-4 relative"
          role="img"
          aria-label="Slot machine reels"
        >
          {reels.map((reel, idx) => (
            <Reel
              key={idx}
              symbols={reel.symbols}
              spinning={reel.spinning}
              reelIndex={idx}
            />
          ))}
        </div>
        
        {/* Payline indicator */}
        <div className="flex justify-center mt-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
          <span className="text-amber-200/80 text-sm">Middle Row Pays</span>
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
        </div>
      </Card>

      {/* Controls Section */}
      <div className="w-full max-w-md z-10 space-y-4">
        {/* Credits Display */}
        <div className="flex justify-center gap-6 text-center">
          <div className="bg-slate-800/80 border border-amber-600/40 rounded-xl px-6 py-3">
            <div className="text-amber-300/70 text-sm uppercase tracking-wider">Credits</div>
            <div 
              className="text-3xl sm:text-4xl font-bold text-amber-100"
              aria-live="polite"
              data-testid="text-credits"
            >
              {credits}
            </div>
          </div>
          <div className="bg-slate-800/80 border border-amber-600/40 rounded-xl px-6 py-3">
            <div className="text-amber-300/70 text-sm uppercase tracking-wider">Bet</div>
            <div className="text-3xl sm:text-4xl font-bold text-amber-100" data-testid="text-bet">
              {bet}
            </div>
          </div>
        </div>

        {/* Main Spin Button */}
        {!gameOver ? (
          <Button
            onClick={spin}
            disabled={spinning || credits < bet}
            className="w-full h-20 sm:h-24 text-2xl sm:text-3xl font-bold bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 border-2 border-amber-400 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            aria-label={spinning ? "Spinning..." : autoPlay ? "Auto spinning" : "Spin the reels"}
            data-testid="button-spin"
          >
            {spinning ? (
              <span className="flex items-center gap-3">
                <div className={`w-6 h-6 border-4 border-slate-900/30 border-t-slate-900 rounded-full ${!prefersReducedMotion ? "animate-spin" : ""}`} />
                SPINNING...
              </span>
            ) : autoPlay ? (
              <span className="flex items-center gap-3">
                <Play className="w-8 h-8" />
                AUTO SPIN
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Play className="w-8 h-8" />
                SPIN
              </span>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleReset}
            className="w-full h-20 sm:h-24 text-2xl sm:text-3xl font-bold bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 rounded-xl"
            aria-label="Reset credits and play again"
            data-testid="button-reset"
          >
            <span className="flex items-center gap-3">
              <RotateCcw className="w-8 h-8" />
              PLAY AGAIN
            </span>
          </Button>
        )}

        {/* Secondary Controls */}
        <div className="flex gap-3">
          <Button
            onClick={handleAutoToggle}
            variant={autoPlay ? "default" : "outline"}
            disabled={spinning || gameOver}
            className={`flex-1 h-14 text-lg font-semibold rounded-xl ${
              autoPlay
                ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-400"
                : "border-amber-600/60 text-amber-200 hover:bg-amber-900/30"
            }`}
            aria-label={autoPlay ? "Stop auto spin" : "Start auto spin"}
            aria-pressed={autoPlay}
            data-testid="button-auto"
          >
            {autoPlay ? (
              <span className="flex items-center gap-2">
                <Square className="w-5 h-5" />
                STOP
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                AUTO
              </span>
            )}
          </Button>
          
          <Button
            onClick={handleMuteToggle}
            variant="outline"
            className="h-14 px-6 text-lg font-semibold border-amber-600/60 text-amber-200 hover:bg-amber-900/30 rounded-xl"
            aria-label={muted ? "Unmute sounds" : "Mute sounds"}
            aria-pressed={muted}
            data-testid="button-mute"
          >
            {muted ? (
              <VolumeX className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Paytable */}
        <Card className="bg-slate-800/60 border border-amber-600/30 p-4 rounded-xl">
          <h2 className="text-amber-300 text-center font-semibold mb-3 text-lg">Payouts</h2>
          <div className="grid grid-cols-2 gap-2 text-amber-100/80 text-sm sm:text-base">
            <div className="flex justify-between">
              <span>Three 7s</span>
              <span className="text-amber-300 font-bold">+25</span>
            </div>
            <div className="flex justify-between">
              <span>Three of a kind</span>
              <span className="text-amber-300 font-bold">+10</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span>Two of a kind (adjacent)</span>
              <span className="text-amber-300 font-bold">+2</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sound init overlay for mobile */}
      {!soundInitialized && (
        <button
          onClick={initializeSound}
          className="fixed inset-0 bg-transparent z-50 cursor-default"
          aria-label="Tap anywhere to enable sound"
        />
      )}
      
      {/* Custom styles for animations */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes reel-spin {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-8px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(8px);
          }
        }
        
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }
        
        .animate-reel-spin {
          animation: reel-spin 0.15s linear infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-confetti,
          .animate-reel-spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
