import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GameCard {
  title: string;
  description: string;
  path: string;
  emoji: string;
  color: string;
}

const games: GameCard[] = [
  {
    title: "Slots",
    description: "A relaxing slot machine game with smooth animations.",
    path: "/slots",
    emoji: "🎰",
    color: "from-purple-600 to-indigo-800",
  },
  {
    title: "Blackjack",
    description: "Friendly casino classic. Beat the dealer to 21!",
    path: "/blackjack",
    emoji: "♠️",
    color: "from-emerald-700 to-teal-900",
  },
  // Add more games here as they're developed
  // {
  //   title: "Memory Match",
  //   description: "Test your memory with this classic card matching game.",
  //   path: "/memory",
  //   emoji: "🃏",
  //   color: "from-emerald-600 to-teal-800",
  // },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎮 AlzBetter Games
          </h1>
          <p className="text-xl text-purple-200">
            Fun, relaxing games designed for seniors
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => (
            <Link key={game.path} href={game.path}>
              <Card className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br ${game.color} border-0 text-white`}>
                <CardHeader>
                  <div className="text-6xl mb-2">{game.emoji}</div>
                  <CardTitle className="text-2xl">{game.title}</CardTitle>
                  <CardDescription className="text-purple-100">
                    {game.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                    Play Now →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <footer className="text-center mt-16 text-purple-300 text-sm">
          <p>© {new Date().getFullYear()} AlzBetter LLC. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
