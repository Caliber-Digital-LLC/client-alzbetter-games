import { useEffect, useState } from "react";
import { Link } from "wouter";

interface Game {
  id: string;
  title: string;
  description: string;
  path: string;
  external: boolean;
  iconSvg?: string;
  gradient: [string, string];
  order: number;
}

interface GamesFeed {
  version: string;
  lastUpdated: string;
  games: Game[];
}

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        const response = await fetch("/games.json");
        if (!response.ok) throw new Error("Failed to load games");
        const feed: GamesFeed = await response.json();
        // Sort by order
        const sortedGames = feed.games.sort((a, b) => a.order - b.order);
        setGames(sortedGames);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load games");
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, []);

  const GameCard = ({ game }: { game: Game }) => {
    const content = (
      <div 
        className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group aspect-square flex flex-col"
        style={{
          background: `linear-gradient(135deg, ${game.gradient[0]} 0%, ${game.gradient[1]} 100%)`
        }}
      >
        {/* SVG Icon - centered at top */}
        {game.iconSvg && (
          <div className="flex justify-center pt-4 md:pt-6">
            <img 
              src={game.iconSvg} 
              alt="" 
              aria-hidden="true"
              className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 drop-shadow-lg"
            />
          </div>
        )}
        
        {/* Content - centered */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-3 pb-3">
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-1">{game.title}</h3>
          <p className="text-white/80 text-xs md:text-sm line-clamp-2 hidden sm:block">{game.description}</p>
        </div>
        
        {/* Play button at bottom */}
        <div className="px-3 pb-3 md:pb-4">
          <span className="block w-full py-2 md:py-3 bg-white/20 border-2 border-white/50 rounded-lg text-white font-semibold text-sm md:text-base text-center hover:bg-white/30 transition-colors">
            Play
          </span>
        </div>
      </div>
    );

    if (game.external || game.path.startsWith("http")) {
      return <a href={game.path} className="block">{content}</a>;
    }
    return <Link href={game.path}>{content}</Link>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5c2d91] via-[#7b2d8e] to-[#4a1070] p-4 md:p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5c2d91] via-[#7b2d8e] to-[#4a1070] p-4 md:p-6 flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5c2d91] via-[#7b2d8e] to-[#4a1070] p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-2 md:mb-4">
            <img 
              src="/alzbetter-logo-white.png" 
              alt="AlzBetter" 
              className="h-10 md:h-12 lg:h-16 w-auto"
            />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Games
            </h1>
          </div>
          <p className="text-base md:text-lg lg:text-xl text-white/80">
            Fun, relaxing games designed for everyone
          </p>
        </header>

        {/* Games Grid - 3 columns on tablet/desktop, 2 on phone */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        <footer className="text-center mt-8 md:mt-12 text-white/60 text-sm">
          <p>© {new Date().getFullYear()} AlzBetter LLC. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}