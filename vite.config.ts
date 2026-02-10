import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Plugin to serve standalone game folders in development
function serveGameFolders() {
  const gameFolders = ['slots', 'blackjack', 'roulette', 'poker', 'holdem', 'craps', 'wordchange', 'solitaire', 'shared'];
  const rootDir = import.meta.dirname;
  
  return {
    name: 'serve-game-folders',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url || '';
        
        // Check if URL matches any game folder
        for (const folder of gameFolders) {
          if (url.startsWith(`/${folder}/`) || url === `/${folder}`) {
            let filePath = url === `/${folder}` ? `/${folder}/index.html` : url;
            const fullPath = path.join(rootDir, filePath);
            
            if (fs.existsSync(fullPath)) {
              const stat = fs.statSync(fullPath);
              if (stat.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
              }
              
              const finalPath = path.join(rootDir, filePath);
              if (fs.existsSync(finalPath)) {
                const ext = path.extname(finalPath);
                const contentTypes: Record<string, string> = {
                  '.html': 'text/html',
                  '.js': 'application/javascript',
                  '.css': 'text/css',
                  '.json': 'application/json',
                  '.svg': 'image/svg+xml',
                  '.png': 'image/png',
                  '.jpg': 'image/jpeg',
                  '.gif': 'image/gif',
                  '.woff': 'font/woff',
                  '.woff2': 'font/woff2',
                  '.ttf': 'font/ttf',
                  '.mp3': 'audio/mpeg',
                  '.wav': 'audio/wav',
                };
                res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
                fs.createReadStream(finalPath).pipe(res);
                return;
              }
            }
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serveGameFolders()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
