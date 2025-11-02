import { BrandInfo, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type BrandInfoCreateInput = Prisma.BrandInfoCreateInput;
export type BrandInfoUpdateInput = Prisma.BrandInfoUpdateInput;
export type BrandInfoWhereInput = Prisma.BrandInfoWhereInput;

/**
 * Repository for BrandInfo entity operations
 */
export class BrandInfoRepository extends BaseRepository<
  BrandInfo,
  BrandInfoCreateInput,
  BrandInfoUpdateInput,
  BrandInfoWhereInput
> {
  async create(data: BrandInfoCreateInput): Promise<BrandInfo> {
    try {
      return await this.prisma.brandInfo.create({
        data,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.create');
    }
  }

  async findById(id: string): Promise<BrandInfo | null> {
    try {
      return await this.prisma.brandInfo.findUnique({
        where: { id },
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.findById');
    }
  }

  async findByTicketId(ticketId: string): Promise<BrandInfo | null> {
    try {
      return await this.prisma.brandInfo.findUnique({
        where: { ticketId },
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.findByTicketId');
    }
  }

  async findMany(where?: BrandInfoWhereInput): Promise<BrandInfo[]> {
    try {
      return await this.prisma.brandInfo.findMany({
        where,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.findMany');
    }
  }

  async update(id: string, data: BrandInfoUpdateInput): Promise<BrandInfo> {
    try {
      return await this.prisma.brandInfo.update({
        where: { id },
        data,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.update');
    }
  }

  async updateByTicketId(ticketId: string, data: BrandInfoUpdateInput): Promise<BrandInfo> {
    try {
      return await this.prisma.brandInfo.update({
        where: { ticketId },
        data,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.updateByTicketId');
    }
  }

  async delete(id: string): Promise<BrandInfo> {
    try {
      return await this.prisma.brandInfo.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.delete');
    }
  }

  async deleteByTicketId(ticketId: string): Promise<BrandInfo> {
    try {
      return await this.prisma.brandInfo.delete({
        where: { ticketId },
      });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.deleteByTicketId');
    }
  }

  async count(where?: BrandInfoWhereInput): Promise<number> {
    try {
      return await this.prisma.brandInfo.count({ where });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.count');
    }
  }

  /**
   * Create or update brand info for a ticket
   */
  async upsert(ticketId: string, data: Omit<BrandInfoCreateInput, 'ticket'>): Promise<BrandInfo> {
    try {
      return await this.prisma.brandInfo.upsert({
        where: { ticketId },
        create: {
          ...data,
          ticket: { connect: { id: ticketId } },
        },
        update: data,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'BrandInfoRepository.upsert');
    }
  }
}