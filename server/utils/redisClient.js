import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Connect to Redis
const connectRedisClient = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis!');
  } catch (err) {
    console.error('Redis connection error:', err);
    process.exit(1);
  }
};

// Initialize the connection
connectRedisClient();

// Export the client as default
export { redisClient as default }; 