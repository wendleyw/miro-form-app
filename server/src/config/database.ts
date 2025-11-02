import { PrismaClient } from '@prisma/client';
import { config } from './env';

// Create Prisma client instance
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
  log: config.server.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Database connection test
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

// Handle process termination
process.on('SIGINT', disconnectDatabase);
process.on('SIGTERM', disconnectDatabase);

export default prisma;