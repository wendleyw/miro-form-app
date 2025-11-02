import { Client, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type ClientCreateInput = Prisma.ClientCreateInput;
export type ClientUpdateInput = Prisma.ClientUpdateInput;
export type ClientWhereInput = Prisma.ClientWhereInput;

/**
 * Repository for Client entity operations
 */
export class ClientRepository extends BaseRepository<
  Client,
  ClientCreateInput,
  ClientUpdateInput,
  ClientWhereInput
> {
  async create(data: ClientCreateInput): Promise<Client> {
    try {
      return await this.prisma.client.create({
        data,
      });
    } catch (error) {
      this.handleError(error, 'ClientRepository.create');
    }
  }

  async findById(id: string): Promise<Client | null> {
    try {
      return await this.prisma.client.findUnique({
        where: { id },
        include: {
          tickets: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'ClientRepository.findById');
    }
  }

  async findByEmail(email: string): Promise<Client | null> {
    try {
      return await this.prisma.client.findUnique({
        where: { email },
      });
    } catch (error) {
      this.handleError(error, 'ClientRepository.findByEmail');
    }
  }

  async findByAccessCode(accessCode: string): Promise<Client | null> {
    try {
      return await this.prisma.client.findUnique({
        where: { accessCode },
      });
    } catch (error) {
      this.handleError(error, 'ClientRepository.findByAccessCode');
    }
  }

  async findMany(where?: ClientWhereInput): Promise<Client[]> {
    try {
      return await this.prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'ClientRepository.findMany');
    }
  }

  async update(id: string, data: ClientUpdateInput): Promise<Client> {
    try {
      return await this.prisma.client.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleError(error, 'ClientRepository.update');
    }
  }

  async delete(id: string): Promise<Client> {
    try {
      return await this.prisma.client.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'ClientRepository.delete');
    }
  }

  async count(where?: ClientWhereInput): Promise<number> {
    try {
      return await this.prisma.client.count({ where });
    } catch (error) {
      this.handleError(error, 'ClientRepository.count');
    }
  }

  /**
   * Authenticate client with email and access code
   */
  async authenticate(email: string, accessCode: string): Promise<Client | null> {
    try {
      return await this.prisma.client.findFirst({
        where: {
          email,
          accessCode,
        },
      });
    } catch (error) {
      this.handleError(error, 'ClientRepository.authenticate');
    }
  }
}