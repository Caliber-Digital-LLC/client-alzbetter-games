import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GameCard {
  title: string;
  description: string;
  path: string;
  emoji: string;
  color: string;
  external?: boolean;
}

const games: GameCard[] = [
  {
    title: "Slots",
    description: "A relaxing slot machine game with smooth animations.",
    path: "/slots",
    emoji: "🎰",
    color: "from-[#7b2d8e] to-[#5c2d91]",
  },
  {
    title: "Blackjack",
    description: "Friendly casino classic. Beat the dealer to 21!",
    path: "/blackjack",
    emoji: "♠️",
    color: "from-emerald-700 to-emerald-900",
  },
  {
    title: "Roulette",
    description: "Spin the wheel and test your luck!",
    path: "/roulette/",
    emoji: "🎡",
    color: "from-rose-700 to-rose-900",
    external: true,
  },
  {
    title: "Video Poker",
    description: "Jacks or Better with Lucky Boost feature.",
    path: "/poker/",
    emoji: "🃏",
    color: "from-[#6b18a0] to-[#4a1070]",
    external: true,
  },
  {
    title: "Craps",
    description: "Roll the dice in this classic casino game.",
    path: "/craps/",
    emoji: "🎲",
    color: "from-amber-600 to-amber-800",
    external: true,
  },
];

export default function Home() {
  const GameCardContent = ({ game }: { game: GameCard }) => (
    <Card className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br ${game.color} border-0 text-white h-full`}>
      <CardHeader>
        <div className="text-6xl mb-2">{game.emoji}</div>
        <CardTitle className="text-2xl">{game.title}</CardTitle>
        <CardDescription className="text-white/80">
          {game.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <span className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-sm font-medium hover:bg-white/30 transition-colors">
          Play Now →
        </span>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5c2d91] via-[#7b2d8e] to-[#4a1070] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {games.map((game) => (
            game.external ? (
              <a key={game.path} href={game.path} className="block">
                <GameCardContent game={game} />
              </a>
            ) : (
              <Link key={game.path} href={game.path}>
                <GameCardContent game={game} />
              </Link>
            )
          ))}
        </div>

        <footer className="text-center mt-12 text-white/60 text-sm">
          <p>© {new Date().getFullYear()} AlzBetter LLC. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
