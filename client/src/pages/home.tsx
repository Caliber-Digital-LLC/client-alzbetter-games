import { useEffect, useState } from "react";
import { Link } from "wouter";
import GameIcon from "@/components/GameIcon";

interface Game {
  id: string;
  title: string;
  description: string;
  path: string;
  external: boolean;
  icon: string;
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
        className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group h-32"
        style={{
          background: `linear-gradient(135deg, ${game.gradient[0]} 0%, ${game.gradient[1]} 100%)`
        }}
      >
        {/* Icon on the right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-50 transition-opacity">
          <GameIcon icon={game.icon} className="w-24 h-24" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-5 h-full flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-white mb-1">{game.title}</h3>
          <p className="text-white/80 text-sm">{game.description}</p>
        </div>
        
        {/* Play indicator */}
        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-2xl">›</span>
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
      <div className="min-h-screen bg-gradient-to-br from-[#5c2d91] via-[#7b2d8e] to-[#4a1070] p-6 md:p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5c2d91] via-[#7b2d8e] to-[#4a1070] p-6 md:p-8 flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5c2d91] via-[#7b2d8e] to-[#4a1070] p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/alzbetter-logo-white.png" 
              alt="AlzBetter" 
              className="h-12 md:h-16 w-auto"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Games
            </h1>
          </div>
          <p className="text-lg md:text-xl text-white/80">
            Fun, relaxing games designed for seniors
          </p>
        </header>

        {/* Games List */}
        <div className="flex flex-col gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        <footer className="text-center mt-12 text-white/60 text-sm">
          <p>© {new Date().getFullYear()} AlzBetter LLC. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}