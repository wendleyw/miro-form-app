import { PrismaClient } from '@prisma/client';

// Mock Prisma client for testing without database
const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
  client: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  ticket: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  taskMapping: {
    create: jest.fn(),
    createMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  brandInfo: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  attachment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  communicationLog: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  webhookEvent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
};

// Create a real Prisma client only if database is available
let prisma: PrismaClient | any;

beforeAll(async () => {
  // Try to connect to database, fall back to mock if not available
  try {
    if (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL) {
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
          },
        },
      });
      await prisma.$connect();
    } else {
      throw new Error('No database URL provided');
    }
  } catch (error) {
    console.log('Using mock Prisma client for testing');
    prisma = mockPrismaClient;
  }
});

beforeEach(async () => {
  // Reset mocks before each test
  if (prisma === mockPrismaClient) {
    jest.clearAllMocks();
  } else {
    // Clean up database before each test if using real database
    await cleanDatabase();
  }
});

afterAll(async () => {
  // Clean up and disconnect after all tests
  if (prisma !== mockPrismaClient) {
    await cleanDatabase();
    await prisma.$disconnect();
  }
});

async function cleanDatabase() {
  if (prisma === mockPrismaClient) return;
  
  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    await prisma.communicationLog.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.brandInfo.deleteMany();
    await prisma.taskMapping.deleteMany();
    await prisma.webhookEvent.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.client.deleteMany();
  } catch (error) {
    console.log('Error cleaning database:', error);
  }
}

export { prisma };