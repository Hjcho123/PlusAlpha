import mongoose from 'mongoose';
import { createClient } from 'redis';

// MongoDB Configuration
export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plusalpha';
    
    await mongoose.connect(mongoUri, {
      // Remove deprecated options for newer MongoDB driver
    });

    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Redis Configuration (Optional)
export const connectRedis = async () => {
  // Skip Redis if not configured or if explicitly disabled
  if (!process.env.REDIS_URL || process.env.REDIS_URL === 'redis://localhost:6379') {
    console.log('⚠️ Redis not configured, using memory cache');
    return null;
  }

  try {
    const redisUrl = process.env.REDIS_URL;
    const client = createClient({ url: redisUrl });

    client.on('error', (err) => {
      console.warn('⚠️ Redis Client Error (optional):', err.message);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.warn('⚠️ Redis connection failed (optional):', error.message);
    return null;
  }
};

// Graceful shutdown
export const gracefulShutdown = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<{ mongodb: boolean; redis: boolean }> => {
  const health = {
    mongodb: mongoose.connection.readyState === 1,
    redis: false
  };

  // Only check Redis if it's configured
  if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
    try {
      const redisClient = await connectRedis();
      if (redisClient) {
        await redisClient.ping();
        health.redis = true;
        await redisClient.quit();
      }
    } catch (error) {
      console.warn('Redis health check failed (optional):', error.message);
    }
  }

  return health;
};
