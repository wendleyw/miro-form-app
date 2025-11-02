import { Ticket, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type TicketCreateInput = Prisma.TicketCreateInput;
export type TicketUpdateInput = Prisma.TicketUpdateInput;
export type TicketWhereInput = Prisma.TicketWhereInput;

export type TicketWithRelations = Prisma.TicketGetPayload<{
  include: {
    client: true;
    taskMappings: true;
    brandInfo: true;
    attachments: true;
    communicationLogs: {
      orderBy: { createdAt: 'desc' };
    };
  };
}>;

/**
 * Repository for Ticket entity operations
 */
export class TicketRepository extends BaseRepository<
  Ticket,
  TicketCreateInput,
  TicketUpdateInput,
  TicketWhereInput
> {
  async create(data: TicketCreateInput): Promise<Ticket> {
    try {
      return await this.prisma.ticket.create({
        data,
        include: {
          client: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'TicketRepository.create');
    }
  }

  async findById(id: string): Promise<TicketWithRelations | null> {
    try {
      return await this.prisma.ticket.findUnique({
        where: { id },
        include: {
          client: true,
          taskMappings: {
            orderBy: { taskOrder: 'asc' },
          },
          brandInfo: true,
          attachments: {
            orderBy: { uploadedAt: 'desc' },
          },
          communicationLogs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'TicketRepository.findById');
    }
  }

  async findByTicketNumber(ticketNumber: string): Promise<TicketWithRelations | null> {
    try {
      return await this.prisma.ticket.findUnique({
        where: { ticketNumber },
        include: {
          client: true,
          taskMappings: {
            orderBy: { taskOrder: 'asc' },
          },
          brandInfo: true,
          attachments: {
            orderBy: { uploadedAt: 'desc' },
          },
          communicationLogs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'TicketRepository.findByTicketNumber');
    }
  }

  async findMany(where?: TicketWhereInput): Promise<Ticket[]> {
    try {
      return await this.prisma.ticket.findMany({
        where,
        include: {
          client: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'TicketRepository.findMany');
    }
  }

  async findByClientId(clientId: string): Promise<Ticket[]> {
    try {
      return await this.prisma.ticket.findMany({
        where: { clientId },
        include: {
          client: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'TicketRepository.findByClientId');
    }
  }

  async update(id: string, data: TicketUpdateInput): Promise<Ticket> {
    try {
      return await this.prisma.ticket.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          client: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'TicketRepository.update');
    }
  }

  async delete(id: string): Promise<Ticket> {
    try {
      return await this.prisma.ticket.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'TicketRepository.delete');
    }
  }

  async count(where?: TicketWhereInput): Promise<number> {
    try {
      return await this.prisma.ticket.count({ where });
    } catch (error) {
      this.handleError(error, 'TicketRepository.count');
    }
  }

  /**
   * Generate next ticket number in format TICK-YYYY-NNN
   */
  async generateTicketNumber(): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const yearPrefix = `TICK-${currentYear}-`;
      
      const lastTicket = await this.prisma.ticket.findFirst({
        where: {
          ticketNumber: {
            startsWith: yearPrefix,
          },
        },
        orderBy: {
          ticketNumber: 'desc',
        },
      });

      let nextNumber = 1;
      if (lastTicket) {
        const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[2]);
        nextNumber = lastNumber + 1;
      }

      return `${yearPrefix}${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      this.handleError(error, 'TicketRepository.generateTicketNumber');
    }
  }

  /**
   * Update ticket status with audit logging
   */
  async updateStatus(id: string, status: Prisma.EnumTicketStatusFilter): Promise<Ticket> {
    try {
      return await this.withTransaction(async (tx) => {
        const ticket = await tx.ticket.update({
          where: { id },
          data: { 
            status: status as any,
            updatedAt: new Date(),
          },
        });

        // Add communication log entry for status change
        await tx.communicationLog.create({
          data: {
            ticketId: id,
            authorType: 'SYSTEM',
            authorName: 'System',
            message: `Ticket status changed to ${status}`,
          },
        });

        return ticket;
      });
    } catch (error) {
      this.handleError(error, 'TicketRepository.updateStatus');
    }
  }
}