import { WebhookEvent, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type WebhookEventCreateInput = Prisma.WebhookEventCreateInput;
export type WebhookEventUpdateInput = Prisma.WebhookEventUpdateInput;
export type WebhookEventWhereInput = Prisma.WebhookEventWhereInput;

/**
 * Repository for WebhookEvent entity operations
 */
export class WebhookEventRepository extends BaseRepository<
  WebhookEvent,
  WebhookEventCreateInput,
  WebhookEventUpdateInput,
  WebhookEventWhereInput
> {
  async create(data: WebhookEventCreateInput): Promise<WebhookEvent> {
    try {
      return await this.prisma.webhookEvent.create({
        data,
      });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.create');
    }
  }

  async findById(id: string): Promise<WebhookEvent | null> {
    try {
      return await this.prisma.webhookEvent.findUnique({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.findById');
    }
  }

  async findMany(where?: WebhookEventWhereInput): Promise<WebhookEvent[]> {
    try {
      return await this.prisma.webhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.findMany');
    }
  }

  async update(id: string, data: WebhookEventUpdateInput): Promise<WebhookEvent> {
    try {
      return await this.prisma.webhookEvent.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.update');
    }
  }

  async delete(id: string): Promise<WebhookEvent> {
    try {
      return await this.prisma.webhookEvent.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.delete');
    }
  }

  async count(where?: WebhookEventWhereInput): Promise<number> {
    try {
      return await this.prisma.webhookEvent.count({ where });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.count');
    }
  }

  /**
   * Find unprocessed webhook events
   */
  async findUnprocessed(limit?: number): Promise<WebhookEvent[]> {
    try {
      return await this.prisma.webhookEvent.findMany({
        where: { processed: false },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.findUnprocessed');
    }
  }

  /**
   * Mark webhook event as processed
   */
  async markAsProcessed(id: string): Promise<WebhookEvent> {
    try {
      return await this.prisma.webhookEvent.update({
        where: { id },
        data: { processed: true },
      });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.markAsProcessed');
    }
  }

  /**
   * Find events by source and type
   */
  async findBySourceAndType(
    source: Prisma.EnumWebhookSourceFilter,
    eventType: string,
    limit?: number
  ): Promise<WebhookEvent[]> {
    try {
      return await this.prisma.webhookEvent.findMany({
        where: {
          source: source as any,
          eventType,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.findBySourceAndType');
    }
  }

  /**
   * Clean up old processed events
   */
  async cleanupOldEvents(daysOld: number = 30): Promise<Prisma.BatchPayload> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      return await this.prisma.webhookEvent.deleteMany({
        where: {
          processed: true,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.cleanupOldEvents');
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<{
    total: number;
    processed: number;
    pending: number;
    bySource: Record<string, number>;
  }> {
    try {
      const [total, processed, miroEvents, todoistEvents] = await Promise.all([
        this.prisma.webhookEvent.count(),
        this.prisma.webhookEvent.count({ where: { processed: true } }),
        this.prisma.webhookEvent.count({ where: { source: 'MIRO' } }),
        this.prisma.webhookEvent.count({ where: { source: 'TODOIST' } }),
      ]);

      return {
        total,
        processed,
        pending: total - processed,
        bySource: {
          MIRO: miroEvents,
          TODOIST: todoistEvents,
        },
      };
    } catch (error) {
      this.handleError(error, 'WebhookEventRepository.getProcessingStats');
    }
  }
}