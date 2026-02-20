import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import { getDb, initDb } from './database';
import authRoutes from './routes/auth';
import interventionRoutes from './routes/interventions';
import clientPortalRoutes from './routes/client-portal';
import dashboardRoutes from './routes/dashboard';
import { planningEngine } from './services/planning-engine';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 6001);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve frontend (Render single-service deploy)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/client', clientPortalRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback (must be after /api routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start HTTP server
const server = http.createServer(app);
server.listen(PORT, async () => {
  await initDb();
  console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Map<string, WebSocket>();

wss.on('connection', (ws, req) => {
  const base = `http://${req.headers.host || 'localhost'}`;
  const url = new URL(req.url || '', base);
  const userId = url.searchParams.get('userId') || '';
  const token = url.searchParams.get('token') || '';
  
  if (userId) {
    clients.set(userId, ws);
  } else if (token) {
    clients.set(`client_${token}`, ws);
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'gps_update' && msg.userId) {
        // Update technician GPS
        const db = getDb();
        db.prepare(`UPDATE technician_profiles SET current_latitude = ?, current_longitude = ? WHERE user_id = ?`)
          .run(msg.latitude, msg.longitude, msg.userId)
          .catch(() => {});

        // Broadcast to relevant clients
        db.prepare(`
          SELECT client_token FROM interventions 
          WHERE technician_id = ? AND status = 'en_cours'
        `).all(msg.userId).then((activeInterventions: any[]) => {
          for (const int of activeInterventions) {
            const clientWs = clients.get(`client_${int.client_token}`);
            if (clientWs && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'tech_location',
                latitude: msg.latitude,
                longitude: msg.longitude,
                timestamp: new Date().toISOString(),
              }));
            }
          }
        }).catch(() => {});
      }

      if (msg.type === 'status_update') {
        // Broadcast status change to all connected admin/supervisor users
        broadcast({
          type: 'intervention_update',
          intervention_id: msg.intervention_id,
          status: msg.status,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      // ignore invalid messages
    }
  });

  ws.on('close', () => {
    for (const [key, val] of clients.entries()) {
      if (val === ws) clients.delete(key);
    }
  });
});

function broadcast(data: any) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// SLA check interval - every 5 minutes
setInterval(() => {
  planningEngine.checkSLAViolations().then((violations) => {
    if (violations > 0) {
      broadcast({
        type: 'sla_alert',
        count: violations,
        timestamp: new Date().toISOString(),
      });
    }
  }).catch(() => {});
}, 5 * 60 * 1000);

console.log(`WebSocket available at ws(s)://<host>/ws`);
