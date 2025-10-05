import dotenv from 'dotenv';

// Load environment variables FIRST
// In production (Railway), env vars are set directly - skip .env file
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env' });
} else {
  console.log('🔍 Production mode - loading env vars from Railway platform');
}

// Debug: Check if critical environment variables are loaded
console.log('🔍 Server startup - NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 Server startup - MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔍 Server startup - GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import path from 'path';
import { connectMongoDB, connectRedis, gracefulShutdown } from './config/database';
import { corsOptions, errorHandler, notFound } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import stockRoutes from './routes/stocks';
import aiRoutes from './routes/ai';
import portfolioRoutes from './routes/portfolio';
import newsRoutes from './routes/news';
import watchlistRoutes from './routes/watchlist';

import { WebSocketService } from './services/WebSocketService';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Allow TradingView iframe embedding
      frameSrc: ["'self'", "https://www.tradingview-widget.com", "https://s.tradingview.com"],
      // Allow inline styles and TradingView scripts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://s3.tradingview.com", "https://www.tradingview-widget.com", "https://data.tradingview.com"],
      // Allow images from TradingView and data URIs
      imgSrc: ["'self'", "data:", "https:", "https://s3.tradingview.com"],
      // Allow Google Fonts
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      // Allow API calls to TradingView and self
      connectSrc: ["'self'", "https://data.tradingview.com", "https://www.tradingview-widget.com", "https://s3.tradingview.com", "wss://data.tradingview.com"],
    },
  },
}));

// CORS middleware
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes - PUT THESE BEFORE STATIC FILES!
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { checkDatabaseHealth } = await import('./config/database');
    const dbHealth = await checkDatabaseHealth();

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        databases: dbHealth,
        websocket: wsService.getStats()
      },
      message: 'Server is running',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date()
    });
  }
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'PlusAlpha API',
      version: '1.0.0',
      description: 'AI-powered trading platform API',
      endpoints: {
        auth: '/api/auth',
        stocks: '/api/stocks',
        ai: '/api/ai',
        portfolio: '/api/portfolio',
        news: '/api/news',
        watchlist: '/api/watchlist',
        websocket: '/ws'
      },
      documentation: 'https://github.com/your-repo/plusalpha-backend'
    },
    timestamp: new Date()
  });
});

// WebSocket stats endpoint
app.get('/api/ws/stats', (req, res) => {
  res.json({
    success: true,
    data: wsService.getStats(),
    timestamp: new Date()
  });
});

// In production, serve the built React app - AFTER API ROUTES!
if (process.env.NODE_ENV === 'production') {
  console.log('🎨 Serving production React app...');
  app.use(express.static(path.join(process.cwd(), '../dist')));

  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), '../dist/index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdownHandler = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed');
    });

    // Close WebSocket connections
    wsService.shutdown();

    // Close database connections
    await gracefulShutdown();
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdownHandler('SIGTERM'));
process.on('SIGINT', () => gracefulShutdownHandler('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`
🚀 PlusAlpha Backend Server Started!
📍 Server running on port ${PORT}
🌐 HTTP API: http://localhost:${PORT}/api
🔌 WebSocket: ws://localhost:${PORT}/ws
📊 Health Check: http://localhost:${PORT}/health
📚 API Docs: http://localhost:${PORT}/api
      `);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
