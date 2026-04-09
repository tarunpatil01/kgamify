const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Render runs behind a reverse proxy. Trust first proxy so req.ip is client IP.
app.set('trust proxy', 1);

// Minimal internal logger
function devLog(...args) {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
}
function devError(...args) {
  if (process.env.NODE_ENV !== 'production') console.error(...args);
}

const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000','http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true
  }
});

// ------------------ CORS CONFIG ------------------
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://kgamify-job-portal.vercel.app',
  'https://kgamify-job.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      devError(`CORS rejected origin: ${origin}`);
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: [
    'Origin','X-Requested-With','Content-Type','Accept','Authorization',
    'x-auth-token','company-email','company-auth','x-request-id',
    'X-Request-ID','X-Client-Version','X-Client-Platform','x-api-key',
    'Cache-Control','Pragma'
  ],
  exposedHeaders: ['X-Total-Count','X-Page-Count'],
  maxAge: 86400
}));

app.options('*', cors());

// ------------------ WEBHOOK RAW BODY ------------------
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const payments = require('./routes/payments');
    return payments.webhook(req, res);
  } catch (e) {
    return res.status(500).json({ error: 'Webhook internal error' });
  }
});

// ------------------ BODY PARSERS ------------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ------------------ TEST ROUTES ------------------
app.get('/api/cors-test', (req, res) => {
  res.json({ message: 'CORS working', origin: req.headers.origin || null });
});

// ------------------ JWT MIDDLEWARE ------------------
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.user = decoded.user;
    next();
  });
}

// ------------------ ROUTES ------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/company'));
app.use('/api/application', require('./routes/application'));
app.use('/api/job', require('./routes/job'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/support', require('./routes/support'));

// ✅ AI ROUTES (NEW)
app.use('/api/ai', require('./routes/ai'));

// External / Admin
const externalRoutes = require('./routes/external');
app.use('/api/external', externalRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', externalRoutes);
app.use('/api/admin-management', require('./routes/adminManagement'));

// ------------------ PROTECTED TEST ------------------
app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Authorized', user: req.user });
});

// ------------------ DEBUG ------------------
app.get('/api/debug/headers', (req, res) => {
  res.json({ headers: req.headers, origin: req.headers.origin });
});

// ------------------ HEALTH ------------------
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server running' });
});

// ------------------ DB ------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => devLog('MongoDB connected'))
  .catch(err => devError('MongoDB error:', err));

// ------------------ SOCKET.IO ------------------
io.on('connection', (socket) => {
  socket.on('join', room => socket.join(room));
  socket.on('leave', room => socket.leave(room));
  socket.on('ticket:typing', ({ ticketId, by, isTyping }) => {
    if (!ticketId) return;
    socket.to(`ticket:${ticketId}`).emit('ticket:typing', {
      ticketId,
      by: by || 'unknown',
      isTyping: Boolean(isTyping)
    });
  });
});

app.set('io', io);

// ------------------ START ------------------
server.listen(port, () => {
  devLog(`Server running on http://localhost:${port}`);
});

// ------------------ ERROR HANDLER ------------------
app.use((err, req, res, next) => {
  (void next);
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// ------------------ UNHANDLED PROMISES ------------------
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', promise, reason);
});
