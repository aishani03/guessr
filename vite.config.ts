import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// In-memory room store for seamless cross-device local Wi-Fi multiplayer
const rooms = new Map<string, any>();

function localMultiplayerRelay(): Plugin {
  return {
    name: 'local-multiplayer-relay',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/rooms/')) {
          const roomCode = req.url.split('/api/rooms/')[1]?.split('?')[0]?.toUpperCase();
          if (!roomCode) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing room code' }));
            return;
          }

          if (req.method === 'GET') {
            const data = rooms.get(roomCode);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data || null));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                rooms.set(roomCode, data);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localMultiplayerRelay()],
  server: {
    host: true, // Allow connections from phones/other devices on the same Wi-Fi
    port: 5173
  }
})
