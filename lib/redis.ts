// lib/redis.ts
import Redis from 'ioredis';

// Create Redis client with Upstash configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {
    rejectUnauthorized: false // Required for Upstash
  } : undefined,
  retryStrategy: (times) => {
    // Reconnect after
    const delay = Math.min(times * 50, 2000); // Max 2 seconds
    return delay;
  },
  maxRetriesPerRequest: 3
});

// Error handling
redis.on('error', (err) => {
  console.error('Redis error:', err);
});

// Test connection on startup
const testConnection = async () => {
  try {
    await redis.ping();
    console.log('✅ Successfully connected to Redis');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    // Don't throw here to allow the app to start
  }
};

// Run connection test
testConnection();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing Redis connection...');
  redis.quit();
  process.exit(0);
});

export default redis;