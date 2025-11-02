import { Attachment, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type AttachmentCreateInput = Prisma.AttachmentCreateInput;
export type AttachmentUpdateInput = Prisma.AttachmentUpdateInput;
export type AttachmentWhereInput = Prisma.AttachmentWhereInput;

/**
 * Repository for Attachment entity operations
 */
export class AttachmentRepository extends BaseRepository<
  Attachment,
  AttachmentCreateInput,
  AttachmentUpdateInput,
  AttachmentWhereInput
> {
  async create(data: AttachmentCreateInput): Promise<Attachment> {
    try {
      return await this.prisma.attachment.create({
        data,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.create');
    }
  }

  async findById(id: string): Promise<Attachment | null> {
    try {
      return await this.prisma.attachment.findUnique({
        where: { id },
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.findById');
    }
  }

  async findMany(where?: AttachmentWhereInput): Promise<Attachment[]> {
    try {
      return await this.prisma.attachment.findMany({
        where,
        include: {
          ticket: true,
        },
        orderBy: { uploadedAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.findMany');
    }
  }

  async findByTicketId(ticketId: string): Promise<Attachment[]> {
    try {
      return await this.prisma.attachment.findMany({
        where: { ticketId },
        orderBy: { uploadedAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.findByTicketId');
    }
  }

  async update(id: string, data: AttachmentUpdateInput): Promise<Attachment> {
    try {
      return await this.prisma.attachment.update({
        where: { id },
        data,
        include: {
          ticket: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.update');
    }
  }

  async delete(id: string): Promise<Attachment> {
    try {
      return await this.prisma.attachment.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.delete');
    }
  }

  async count(where?: AttachmentWhereInput): Promise<number> {
    try {
      return await this.prisma.attachment.count({ where });
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.count');
    }
  }

  /**
   * Delete multiple attachments by ticket ID
   */
  async deleteByTicketId(ticketId: string): Promise<Prisma.BatchPayload> {
    try {
      return await this.prisma.attachment.deleteMany({
        where: { ticketId },
      });
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.deleteByTicketId');
    }
  }

  /**
   * Get attachments by file type
   */
  async findByFileType(ticketId: string, fileType: string): Promise<Attachment[]> {
    try {
      return await this.prisma.attachment.findMany({
        where: {
          ticketId,
          fileType: {
            startsWith: fileType,
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.findByFileType');
    }
  }

  /**
   * Get total file size for a ticket
   */
  async getTotalSizeByTicket(ticketId: string): Promise<number> {
    try {
      const attachments = await this.prisma.attachment.findMany({
        where: { ticketId },
        select: { fileUrl: true },
      });

      // Note: This would need to be implemented with actual file size calculation
      // For now, returning count as placeholder
      return attachments.length;
    } catch (error) {
      this.handleError(error, 'AttachmentRepository.getTotalSizeByTicket');
    }
  }
}