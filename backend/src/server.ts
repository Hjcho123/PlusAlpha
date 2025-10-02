import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectMongoDB, connectRedis, gracefulShutdown } from './config/database';
import { corsOptions, errorHandler, notFound } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import stockRoutes from './routes/stocks';
import aiRoutes from './routes/ai';
import portfolioRoutes from './routes/portfolio';
import newsRoutes from './routes/news';

// Import services
import { WebSocketService } from './services/WebSocketService';

// Load environment variables
dotenv.config();

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
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/news', newsRoutes);

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
