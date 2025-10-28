// app.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// semplice logger con timestamp
function log(...args) {
  const ts = new Date().toISOString();
  console.log(ts, '-', ...args);
}

// middleware HTTP per logging richieste
app.use((req, res, next) => {
  log('HTTP', req.method, req.originalUrl, 'from', req.ip);
  next();
});

const server = http.createServer(app);

// Inizializza Socket.IO dal modulo esterno
const { init } = require('./socket.io');
const io = init(server);

// ============================================================
// GESTIONE CONNESSIONI SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
  // 1. CONNESSIONE: Logga socket.id e informazioni del client
  const addr = socket.handshake.address || 
                socket.conn?.remoteAddress || 
                socket.request?.connection?.remoteAddress;
  
  console.log('═══════════════════════════════════════');
  console.log('✅ NUOVO CLIENT CONNESSO');
  console.log('Socket ID:', socket.id);
  console.log('IP Address:', addr);
  console.log('User ID:', socket.user?.id || 'non autenticato');
  console.log('Timestamp:', new Date().toISOString());
  console.log('═══════════════════════════════════════');
  
  log('WS connected', 'id=' + socket.id, 'ip=' + addr, 'user=' + (socket.user && socket.user.id));

  // Gestione errori del socket
  socket.on('error', (err) => {
    log('❌ WS error', socket.id, err && err.message ? err.message : err);
  });

  // Join room - quando un client entra in una stanza
  socket.on('joinRoom', (room) => {
    socket.join(room);
    log('🚪 joinRoom', socket.id, 'room=' + room);
    
    // Notifica gli altri utenti nella stanza
    socket.to(room).emit('userJoined', {
      socketId: socket.id,
      userId: socket.user?.id,
      room: room,
      timestamp: Date.now()
    });
  });

  // Leave room - quando un client esce da una stanza
  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    log('🚪 leaveRoom', socket.id, 'room=' + room);
    
    // Notifica gli altri utenti nella stanza
    socket.to(room).emit('userLeft', {
      socketId: socket.id,
      userId: socket.user?.id,
      room: room,
      timestamp: Date.now()
    });
  });

  // Messaggi ricevuti
  socket.on('msg', (data) => {
    const room = data && data.room ? data.room : '(global)';
    const textPreview = typeof data?.text === 'string' ? 
      (data.text.length > 80 ? data.text.slice(0, 77) + '...' : data.text) : 
      '[no-text]';
    
    log('💬 msg', socket.id, 'room=' + room, 'text="' + textPreview + '"');
    
    // Inoltra il messaggio alla stanza appropriata
    if (data.room) {
      io.to(data.room).emit('msg', {
        ...data,
        socketId: socket.id,
        userId: socket.user?.id,
        timestamp: Date.now()
      });
    } else {
      // Broadcast a tutti se non specificata una room
      io.emit('msg', {
        ...data,
        socketId: socket.id,
        userId: socket.user?.id,
        timestamp: Date.now()
      });
    }
  });

  // Announce - messaggio broadcast
  socket.on('announce', (text) => {
    const preview = typeof text === 'string' ? 
      (text.length > 80 ? text.slice(0, 77) + '...' : text) : 
      '[no-text]';
    
    log('📢 announce', socket.id, preview);
    
    // Broadcast a tutti i client connessi
    io.emit('announcement', {
      text: text,
      socketId: socket.id,
      userId: socket.user?.id,
      timestamp: Date.now()
    });
  });

  // 2. DISCONNESSIONE: Gestisci quando un client si disconnette
  socket.on('disconnect', (reason) => {
    console.log('═══════════════════════════════════════');
    console.log('❌ CLIENT DISCONNESSO');
    console.log('Socket ID:', socket.id);
    console.log('User ID:', socket.user?.id || 'non autenticato');
    console.log('Motivo:', reason);
    console.log('Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════');
    
    log('WS disconnected', socket.id, 'reason=' + reason);
    
    // Notifica tutte le room di cui faceva parte il socket
    // (Socket.IO gestisce automaticamente la rimozione dalle room)
    io.emit('userDisconnected', {
      socketId: socket.id,
      userId: socket.user?.id,
      reason: reason,
      timestamp: Date.now()
    });
  });

  // Eventi aggiuntivi utili per debugging
  socket.on('ping', () => {
    log('🏓 ping from', socket.id);
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Richiesta info sul socket corrente
  socket.on('getInfo', () => {
    socket.emit('socketInfo', {
      id: socket.id,
      userId: socket.user?.id,
      rooms: Array.from(socket.rooms),
      connected: socket.connected
    });
  });
});

// ============================================================
// API ENDPOINTS
// ============================================================

// endpoint per generare token (solo DEV)
app.post('/api/token', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'not allowed in production' });
  }
  const { sub, expiresIn } = req.body || {};
  if (!sub) return res.status(400).json({ error: 'missing sub (user id)' });
  const secret = process.env.JWT_SECRET || 'CHANGE_ME';
  try {
    const token = jwt.sign({ sub }, secret, { expiresIn: expiresIn || '1h' });
    log('🔑 Generated token for', sub);
    return res.json({ token, expiresIn: expiresIn || '1h' });
  } catch (err) {
    log('❌ Token generation failed', err);
    return res.status(500).json({ error: 'token_generation_failed' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Endpoint per ottenere statistiche delle connessioni
app.get('/api/stats', (req, res) => {
  const sockets = io.sockets.sockets;
  const stats = {
    totalConnections: sockets.size,
    connections: []
  };
  
  sockets.forEach((socket) => {
    stats.connections.push({
      id: socket.id,
      userId: socket.user?.id,
      rooms: Array.from(socket.rooms).filter(room => room !== socket.id),
      connected: socket.connected
    });
  });
  
  res.json(stats);
});

// ============================================================
// AVVIO SERVER
// ============================================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('════════════════════════════════════════════════');
  console.log('🚀 SERVER AVVIATO');
  console.log(`📡 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('════════════════════════════════════════════════');
  log(`Server listening on http://localhost:${PORT}`);
});