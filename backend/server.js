import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import cron from 'node-cron';
import connectDB from './config/database.js';
import messageRoutes from './routes/messageRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initializeSocketHandlers } from './socket/socketHandler.js';
import Message from './models/Message.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Normalize CORS origin (remove trailing slash if present)
const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

console.log('🔧 [SERVER] Socket.io initialized with CORS origin:', corsOrigin);

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/messages', messageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Initialize Socket.io handlers
initializeSocketHandlers(io);

// Cron job to clean old messages (backup to MongoDB TTL index)
// Runs every hour
cron.schedule('0 * * * *', async () => {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Message.deleteMany({ createdAt: { $lt: cutoffTime } });
    console.log(`🧹 Cleaned ${result.deletedCount} old messages`);
  } catch (error) {
    console.error('Error in cleanup cron job:', error);
  }
});

// Start server - bind to 0.0.0.0 to accept connections from any network interface
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [SERVER] Server running on port ${PORT}`);
  console.log(`📡 [SERVER] Socket.io server ready`);
  console.log(`🌍 [SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 [SERVER] CORS Origin: ${corsOrigin}`);
  console.log(`🌐 [SERVER] Access from network: http://192.168.1.29:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
