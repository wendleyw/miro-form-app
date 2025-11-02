import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * Base repository class providing common database operations
 * and transaction support for all entity repositories
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  protected prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Execute operations within a database transaction
   */
  async withTransaction<R>(
    operations: (tx: Prisma.TransactionClient) => Promise<R>
  ): Promise<R> {
    return this.prisma.$transaction(operations);
  }

  /**
   * Abstract methods to be implemented by concrete repositories
   */
  abstract create(data: CreateInput): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findMany(where?: WhereInput): Promise<T[]>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract delete(id: string): Promise<T>;
  abstract count(where?: WhereInput): Promise<number>;

  /**
   * Generic error handler for database operations
   */
  protected handleError(error: any, operation: string): never {
    console.error(`Database error in ${operation}:`, error);
    
    if (error.code === 'P2002') {
      throw new Error(`Unique constraint violation: ${error.meta?.target}`);
    }
    
    if (error.code === 'P2025') {
      throw new Error('Record not found');
    }
    
    if (error.code === 'P2003') {
      throw new Error('Foreign key constraint violation');
    }
    
    throw new Error(`Database operation failed: ${error.message}`);
  }
}