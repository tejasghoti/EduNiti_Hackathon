import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import apiHandler from '../api/index.js'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-api-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
              res.statusCode = 200;
              res.end();
              return;
            }

            let bodyStr = '';
            req.on('data', chunk => { bodyStr += chunk; });
            req.on('end', () => {
              if (bodyStr) {
                try { req.body = JSON.parse(bodyStr); } catch { req.body = bodyStr; }
              }
              try {
                apiHandler(req, res);
              } catch (err) {
                console.error('Dev API Error:', err);
                if (!res.headersSent) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              }
            });
            return;
          }
          next();
        });
      }
    }
  ]
})
