# AlzBetter Games

A collection of fun, relaxing HTML5 games designed for everyone.

## 🎮 Available Games

| Game | Route | Description |
|------|-------|-------------|
| **Vegas Slots** | `/slots` | A soothing slot machine game with beautiful animations |

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

This project is configured for **Vercel** deployment:

1. Connect repo to Vercel
2. Vercel auto-detects Vite config
3. Deploys to your domain

## 📁 Project Structure

```
client-alzbetter-games/
├── client/
│   ├── src/
│   │   ├── pages/           # Game pages
│   │   │   ├── home.tsx     # Landing page with game list
│   │   │   ├── slot-machine.tsx
│   │   │   └── [future-game].tsx
│   │   ├── components/      # Shared UI components
│   │   └── App.tsx          # Router configuration
│   └── index.html
├── vercel.json              # Vercel config for SPA routing
├── package.json
└── vite.config.ts
```

## ➕ Adding New Games

1. Create a new page in `client/src/pages/`:
   ```tsx
   // client/src/pages/memory-game.tsx
   export default function MemoryGame() {
     return <div>Memory Game</div>;
   }
   ```

2. Add the route in `client/src/App.tsx`:
   ```tsx
   import MemoryGame from "@/pages/memory-game";
   
   <Route path="/memory" component={MemoryGame} />
   ```

3. Add the game card to `client/src/pages/home.tsx`:
   ```tsx
   const games: GameCard[] = [
     // ... existing games
     {
       title: "Memory Match",
       description: "Test your memory with this classic card matching game.",
       path: "/memory",
       emoji: "🃏",
       color: "from-emerald-600 to-teal-800",
     },
   ];
   ```

## 📜 License

MIT © AlzBetter LLC
