/**
 * GameIcon - SVG icons for each game type
 * Pure CSS/SVG approach - no external dependencies
 */

interface GameIconProps {
  icon: string;
  className?: string;
}

export function GameIcon({ icon, className = "" }: GameIconProps) {
  const iconClass = `w-16 h-16 ${className}`;
  
  switch (icon) {
    case "cards":
    case "blackjack":
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Playing cards with spade */}
          <rect x="8" y="12" width="28" height="40" rx="3" fill="white" stroke="currentColor" strokeWidth="2"/>
          <rect x="28" y="8" width="28" height="40" rx="3" fill="white" stroke="currentColor" strokeWidth="2"/>
          <path d="M42 28c0-4-3-7-3-7s-3 3-3 7c0 2.5 1.5 4.5 3 5.5 1.5-1 3-3 3-5.5z" fill="currentColor"/>
          <path d="M37 33c-1.5 0-2 1-2 1h10s-.5-1-2-1c0 0-1 3-3 3s-3-3-3-3z" fill="currentColor"/>
        </svg>
      );
    
    case "slot-machine":
    case "slots":
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Slot machine */}
          <rect x="8" y="12" width="48" height="40" rx="4" fill="white" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="20" width="10" height="16" rx="2" fill="currentColor" opacity="0.2"/>
          <rect x="27" y="20" width="10" height="16" rx="2" fill="currentColor" opacity="0.2"/>
          <rect x="40" y="20" width="10" height="16" rx="2" fill="currentColor" opacity="0.2"/>
          <text x="19" y="33" fontSize="12" fill="currentColor" textAnchor="middle" fontWeight="bold">7</text>
          <text x="32" y="33" fontSize="12" fill="currentColor" textAnchor="middle" fontWeight="bold">7</text>
          <text x="45" y="33" fontSize="12" fill="currentColor" textAnchor="middle" fontWeight="bold">7</text>
          <rect x="24" y="42" width="16" height="6" rx="3" fill="currentColor"/>
        </svg>
      );
    
    case "roulette":
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Roulette wheel */}
          <circle cx="32" cy="32" r="24" fill="white" stroke="currentColor" strokeWidth="2"/>
          <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="32" cy="32" r="6" fill="currentColor"/>
          {/* Segments */}
          <path d="M32 8 L32 14" stroke="currentColor" strokeWidth="2"/>
          <path d="M32 50 L32 56" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 32 L14 32" stroke="currentColor" strokeWidth="2"/>
          <path d="M50 32 L56 32" stroke="currentColor" strokeWidth="2"/>
          <path d="M15 15 L19 19" stroke="currentColor" strokeWidth="2"/>
          <path d="M45 45 L49 49" stroke="currentColor" strokeWidth="2"/>
          <path d="M49 15 L45 19" stroke="currentColor" strokeWidth="2"/>
          <path d="M19 45 L15 49" stroke="currentColor" strokeWidth="2"/>
          {/* Ball */}
          <circle cx="44" cy="20" r="3" fill="white" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    
    case "poker":
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Poker hand fan */}
          <rect x="6" y="16" width="20" height="32" rx="2" fill="white" stroke="currentColor" strokeWidth="2" transform="rotate(-15 16 32)"/>
          <rect x="18" y="12" width="20" height="32" rx="2" fill="white" stroke="currentColor" strokeWidth="2" transform="rotate(-5 28 28)"/>
          <rect x="30" y="10" width="20" height="32" rx="2" fill="white" stroke="currentColor" strokeWidth="2"/>
          <rect x="38" y="12" width="20" height="32" rx="2" fill="white" stroke="currentColor" strokeWidth="2" transform="rotate(10 48 28)"/>
          {/* Chip */}
          <circle cx="50" cy="48" r="10" fill="currentColor" stroke="white" strokeWidth="2"/>
          <circle cx="50" cy="48" r="6" fill="none" stroke="white" strokeWidth="1" strokeDasharray="2 2"/>
        </svg>
      );
    
    case "dice":
    case "craps":
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Two dice */}
          <rect x="6" y="22" width="24" height="24" rx="4" fill="white" stroke="currentColor" strokeWidth="2" transform="rotate(-10 18 34)"/>
          <circle cx="12" cy="28" r="2" fill="currentColor"/>
          <circle cx="24" cy="28" r="2" fill="currentColor"/>
          <circle cx="18" cy="34" r="2" fill="currentColor"/>
          <circle cx="12" cy="40" r="2" fill="currentColor"/>
          <circle cx="24" cy="40" r="2" fill="currentColor"/>
          
          <rect x="32" y="18" width="24" height="24" rx="4" fill="white" stroke="currentColor" strokeWidth="2" transform="rotate(8 44 30)"/>
          <circle cx="38" cy="24" r="2" fill="currentColor"/>
          <circle cx="50" cy="24" r="2" fill="currentColor"/>
          <circle cx="38" cy="36" r="2" fill="currentColor"/>
          <circle cx="50" cy="36" r="2" fill="currentColor"/>
          <circle cx="44" cy="30" r="2" fill="currentColor"/>
          <circle cx="44" cy="24" r="2" fill="currentColor"/>
        </svg>
      );
    
    case "letters":
    case "word-game":
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Letter tiles */}
          <rect x="8" y="20" width="20" height="24" rx="3" fill="white" stroke="currentColor" strokeWidth="2"/>
          <text x="18" y="38" fontSize="16" fill="currentColor" textAnchor="middle" fontWeight="bold">A</text>
          <rect x="32" y="16" width="20" height="24" rx="3" fill="white" stroke="currentColor" strokeWidth="2"/>
          <text x="42" y="34" fontSize="16" fill="currentColor" textAnchor="middle" fontWeight="bold">B</text>
          <rect x="20" y="36" width="20" height="24" rx="3" fill="white" stroke="currentColor" strokeWidth="2"/>
          <text x="30" y="54" fontSize="16" fill="currentColor" textAnchor="middle" fontWeight="bold">C</text>
        </svg>
      );
    
    case "calculator":
    case "math-game":
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Calculator */}
          <rect x="12" y="6" width="40" height="52" rx="4" fill="white" stroke="currentColor" strokeWidth="2"/>
          <rect x="18" y="12" width="28" height="12" rx="2" fill="currentColor" opacity="0.2"/>
          <text x="32" y="22" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">123</text>
          {/* Buttons */}
          <rect x="18" y="30" width="8" height="8" rx="2" fill="currentColor" opacity="0.8"/>
          <rect x="28" y="30" width="8" height="8" rx="2" fill="currentColor" opacity="0.8"/>
          <rect x="38" y="30" width="8" height="8" rx="2" fill="currentColor" opacity="0.8"/>
          <rect x="18" y="42" width="8" height="8" rx="2" fill="currentColor" opacity="0.8"/>
          <rect x="28" y="42" width="8" height="8" rx="2" fill="currentColor" opacity="0.8"/>
          <rect x="38" y="42" width="8" height="8" rx="2" fill="currentColor" opacity="0.8"/>
        </svg>
      );
    
    case "grid":
    case "sudoku":
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sudoku grid */}
          <rect x="8" y="8" width="48" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="2"/>
          {/* Major grid lines */}
          <path d="M24 8 L24 56" stroke="currentColor" strokeWidth="2"/>
          <path d="M40 8 L40 56" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 24 L56 24" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 40 L56 40" stroke="currentColor" strokeWidth="2"/>
          {/* Numbers */}
          <text x="16" y="20" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">5</text>
          <text x="32" y="20" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">3</text>
          <text x="48" y="36" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">7</text>
          <text x="16" y="52" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">9</text>
        </svg>
      );
    
    case "solitaire":
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stacked cards */}
          <rect x="8" y="8" width="24" height="32" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
          <rect x="12" y="12" width="24" height="32" rx="2" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="1"/>
          <rect x="16" y="16" width="24" height="32" rx="2" fill="white" stroke="currentColor" strokeWidth="2"/>
          {/* Heart */}
          <path d="M28 26c0-3 2.5-5 5-5s5 2 5 5c0 4-5 8-5 8s-5-4-5-8z" fill="#dc2626"/>
          <text x="22" y="28" fontSize="8" fill="currentColor" fontWeight="bold">A</text>
        </svg>
      );
    
    default:
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Generic game controller */}
          <rect x="8" y="20" width="48" height="28" rx="14" fill="white" stroke="currentColor" strokeWidth="2"/>
          <circle cx="22" cy="34" r="6" fill="currentColor" opacity="0.3"/>
          <rect x="19" y="31" width="6" height="6" fill="currentColor"/>
          <circle cx="42" cy="30" r="3" fill="currentColor"/>
          <circle cx="48" cy="36" r="3" fill="currentColor"/>
          <circle cx="42" cy="36" r="3" fill="currentColor" opacity="0.5"/>
          <circle cx="36" cy="30" r="3" fill="currentColor" opacity="0.5"/>
        </svg>
      );
  }
}

export default GameIcon;
