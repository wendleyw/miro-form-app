import { CommunicationLog, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type CommunicationLogCreateInput = Prisma.CommunicationLogCreateInput;
export type CommunicationLogUpdateInput = Prisma.CommunicationLogUpdateInput;
export type CommunicationLogWhereInput = Prisma.CommunicationLogWhereInput;

/**
 * Repository for CommunicationLog entity operations
 */
export class CommunicationLogRepository extends BaseRepository<
  CommunicationLog,
  CommunicationLogCreateInput,
  CommunicationLogUpdateInput,
  CommunicationLogWhereInput
> {
  async create(data: CommunicationLogCreateInput): Promise<CommunicationLog> {
    try {
      return await this.prisma.communicationLog.create({
        data,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.create');
    }
  }

  async findById(id: string): Promise<CommunicationLog | null> {
    try {
      return await this.prisma.communicationLog.findUnique({
        where: { id },
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.findById');
    }
  }

  async findMany(where?: CommunicationLogWhereInput): Promise<CommunicationLog[]> {
    try {
      return await this.prisma.communicationLog.findMany({
        where,
        include: {
          ticket: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.findMany');
    }
  }

  async findByTicketId(ticketId: string): Promise<CommunicationLog[]> {
    try {
      return await this.prisma.communicationLog.findMany({
        where: { ticketId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.findByTicketId');
    }
  }

  async update(id: string, data: CommunicationLogUpdateInput): Promise<CommunicationLog> {
    try {
      return await this.prisma.communicationLog.update({
        where: { id },
        data,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.update');
    }
  }

  async delete(id: string): Promise<CommunicationLog> {
    try {
      return await this.prisma.communicationLog.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.delete');
    }
  }

  async count(where?: CommunicationLogWhereInput): Promise<number> {
    try {
      return await this.prisma.communicationLog.count({ where });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.count');
    }
  }

  /**
   * Add a client comment to the communication log
   */
  async addClientComment(ticketId: string, clientName: string, message: string): Promise<CommunicationLog> {
    try {
      return await this.create({
        ticket: { connect: { id: ticketId } },
        authorType: 'CLIENT',
        authorName: clientName,
        message,
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.addClientComment');
    }
  }

  /**
   * Add a designer comment to the communication log
   */
  async addDesignerComment(ticketId: string, designerName: string, message: string): Promise<CommunicationLog> {
    try {
      return await this.create({
        ticket: { connect: { id: ticketId } },
        authorType: 'DESIGNER',
        authorName: designerName,
        message,
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.addDesignerComment');
    }
  }

  /**
   * Add a system message to the communication log
   */
  async addSystemMessage(ticketId: string, message: string): Promise<CommunicationLog> {
    try {
      return await this.create({
        ticket: { connect: { id: ticketId } },
        authorType: 'SYSTEM',
        authorName: 'System',
        message,
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.addSystemMessage');
    }
  }

  /**
   * Get recent communications for a ticket
   */
  async getRecentByTicketId(ticketId: string, limit: number = 10): Promise<CommunicationLog[]> {
    try {
      return await this.prisma.communicationLog.findMany({
        where: { ticketId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.getRecentByTicketId');
    }
  }

  /**
   * Delete all communications for a ticket
   */
  async deleteByTicketId(ticketId: string): Promise<Prisma.BatchPayload> {
    try {
      return await this.prisma.communicationLog.deleteMany({
        where: { ticketId },
      });
    } catch (error) {
      this.handleError(error, 'CommunicationLogRepository.deleteByTicketId');
    }
  }
}