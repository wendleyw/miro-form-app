import { AuthorType, WebhookSource } from '@prisma/client';
import { AttachmentRepository } from '../../src/services/attachment.repository';
import { CommunicationLogRepository } from '../../src/services/communication-log.repository';
import { WebhookEventRepository } from '../../src/services/webhook-event.repository';

describe('Additional Repository Integration Tests', () => {
  let mockPrisma: any;
  let attachmentRepo: AttachmentRepository;
  let communicationLogRepo: CommunicationLogRepository;
  let webhookEventRepo: WebhookEventRepository;

  beforeEach(() => {
    // Create a comprehensive mock Prisma client
    mockPrisma = {
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

    // Initialize repositories with mock
    attachmentRepo = new AttachmentRepository(mockPrisma);
    communicationLogRepo = new CommunicationLogRepository(mockPrisma);
    webhookEventRepo = new WebhookEventRepository(mockPrisma);
  });

  describe('Attachment Repository Operations', () => {
    test('should create attachment with ticket relationship', async () => {
      const attachmentData = {
        fileName: 'reference.jpg',
        fileUrl: 'https://example.com/reference.jpg',
        fileType: 'image/jpeg',
        ticket: { connect: { id: 'ticket-123' } }
      };

      const mockAttachment = {
        id: 'attachment-123',
        ticketId: 'ticket-123',
        fileName: 'reference.jpg',
        fileUrl: 'https://example.com/reference.jpg',
        fileType: 'image/jpeg',
        uploadedAt: new Date(),
        ticket: {
          id: 'ticket-123',
          title: 'Test Project',
        },
      };

      mockPrisma.attachment.create.mockResolvedValue(mockAttachment);

      const result = await attachmentRepo.create(attachmentData);

      expect(mockPrisma.attachment.create).toHaveBeenCalledWith({
        data: attachmentData,
        include: { ticket: true },
      });
      expect(result).toEqual(mockAttachment);
    });

    test('should find attachments by ticket ID', async () => {
      const ticketId = 'ticket-123';
      const mockAttachments = [
        {
          id: 'attachment-1',
          ticketId,
          fileName: 'file1.jpg',
          fileType: 'image/jpeg',
          uploadedAt: new Date(),
        },
        {
          id: 'attachment-2',
          ticketId,
          fileName: 'file2.png',
          fileType: 'image/png',
          uploadedAt: new Date(),
        },
      ];

      mockPrisma.attachment.findMany.mockResolvedValue(mockAttachments);

      const result = await attachmentRepo.findByTicketId(ticketId);

      expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith({
        where: { ticketId },
        orderBy: { uploadedAt: 'desc' },
      });
      expect(result).toEqual(mockAttachments);
    });

    test('should find attachments by file type', async () => {
      const ticketId = 'ticket-123';
      const fileType = 'image';
      const mockAttachments = [
        {
          id: 'attachment-1',
          ticketId,
          fileName: 'image1.jpg',
          fileType: 'image/jpeg',
        },
      ];

      mockPrisma.attachment.findMany.mockResolvedValue(mockAttachments);

      const result = await attachmentRepo.findByFileType(ticketId, fileType);

      expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith({
        where: {
          ticketId,
          fileType: {
            startsWith: fileType,
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });
      expect(result).toEqual(mockAttachments);
    });

    test('should delete attachments by ticket ID', async () => {
      const ticketId = 'ticket-123';
      const mockBatchResult = { count: 3 };

      mockPrisma.attachment.deleteMany.mockResolvedValue(mockBatchResult);

      const result = await attachmentRepo.deleteByTicketId(ticketId);

      expect(mockPrisma.attachment.deleteMany).toHaveBeenCalledWith({
        where: { ticketId },
      });
      expect(result).toEqual(mockBatchResult);
    });

    test('should get total size by ticket (placeholder implementation)', async () => {
      const ticketId = 'ticket-123';
      const mockAttachments = [
        { fileUrl: 'url1' },
        { fileUrl: 'url2' },
        { fileUrl: 'url3' },
      ];

      mockPrisma.attachment.findMany.mockResolvedValue(mockAttachments);

      const result = await attachmentRepo.getTotalSizeByTicket(ticketId);

      expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith({
        where: { ticketId },
        select: { fileUrl: true },
      });
      expect(result).toBe(3); // Returns count as placeholder
    });
  });

  describe('Communication Log Repository Operations', () => {
    test('should create communication log with ticket relationship', async () => {
      const logData = {
        authorType: AuthorType.CLIENT,
        authorName: 'Test Client',
        message: 'Initial project briefing',
        ticket: { connect: { id: 'ticket-123' } }
      };

      const mockLog = {
        id: 'log-123',
        ticketId: 'ticket-123',
        authorType: AuthorType.CLIENT,
        authorName: 'Test Client',
        message: 'Initial project briefing',
        createdAt: new Date(),
        ticket: {
          id: 'ticket-123',
          title: 'Test Project',
        },
      };

      mockPrisma.communicationLog.create.mockResolvedValue(mockLog);

      const result = await communicationLogRepo.create(logData);

      expect(mockPrisma.communicationLog.create).toHaveBeenCalledWith({
        data: logData,
        include: { ticket: true },
      });
      expect(result).toEqual(mockLog);
    });

    test('should add client comment', async () => {
      const ticketId = 'ticket-123';
      const clientName = 'John Doe';
      const message = 'I love the design!';

      const mockLog = {
        id: 'log-123',
        ticketId,
        authorType: AuthorType.CLIENT,
        authorName: clientName,
        message,
        createdAt: new Date(),
      };

      mockPrisma.communicationLog.create.mockResolvedValue(mockLog);

      const result = await communicationLogRepo.addClientComment(ticketId, clientName, message);

      expect(mockPrisma.communicationLog.create).toHaveBeenCalledWith({
        data: {
          ticket: { connect: { id: ticketId } },
          authorType: 'CLIENT',
          authorName: clientName,
          message,
        },
        include: { ticket: true },
      });
      expect(result).toEqual(mockLog);
    });

    test('should add designer comment', async () => {
      const ticketId = 'ticket-123';
      const designerName = 'Jane Designer';
      const message = 'Working on revisions';

      const mockLog = {
        id: 'log-123',
        ticketId,
        authorType: AuthorType.DESIGNER,
        authorName: designerName,
        message,
        createdAt: new Date(),
      };

      mockPrisma.communicationLog.create.mockResolvedValue(mockLog);

      const result = await communicationLogRepo.addDesignerComment(ticketId, designerName, message);

      expect(mockPrisma.communicationLog.create).toHaveBeenCalledWith({
        data: {
          ticket: { connect: { id: ticketId } },
          authorType: 'DESIGNER',
          authorName: designerName,
          message,
        },
        include: { ticket: true },
      });
      expect(result).toEqual(mockLog);
    });

    test('should add system message', async () => {
      const ticketId = 'ticket-123';
      const message = 'Ticket status changed';

      const mockLog = {
        id: 'log-123',
        ticketId,
        authorType: AuthorType.SYSTEM,
        authorName: 'System',
        message,
        createdAt: new Date(),
      };

      mockPrisma.communicationLog.create.mockResolvedValue(mockLog);

      const result = await communicationLogRepo.addSystemMessage(ticketId, message);

      expect(mockPrisma.communicationLog.create).toHaveBeenCalledWith({
        data: {
          ticket: { connect: { id: ticketId } },
          authorType: 'SYSTEM',
          authorName: 'System',
          message,
        },
        include: { ticket: true },
      });
      expect(result).toEqual(mockLog);
    });

    test('should get recent communications with limit', async () => {
      const ticketId = 'ticket-123';
      const limit = 5;
      const mockLogs = [
        {
          id: 'log-1',
          ticketId,
          message: 'Recent message 1',
          createdAt: new Date(),
        },
        {
          id: 'log-2',
          ticketId,
          message: 'Recent message 2',
          createdAt: new Date(),
        },
      ];

      mockPrisma.communicationLog.findMany.mockResolvedValue(mockLogs);

      const result = await communicationLogRepo.getRecentByTicketId(ticketId, limit);

      expect(mockPrisma.communicationLog.findMany).toHaveBeenCalledWith({
        where: { ticketId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      expect(result).toEqual(mockLogs);
    });

    test('should delete communications by ticket ID', async () => {
      const ticketId = 'ticket-123';
      const mockBatchResult = { count: 5 };

      mockPrisma.communicationLog.deleteMany.mockResolvedValue(mockBatchResult);

      const result = await communicationLogRepo.deleteByTicketId(ticketId);

      expect(mockPrisma.communicationLog.deleteMany).toHaveBeenCalledWith({
        where: { ticketId },
      });
      expect(result).toEqual(mockBatchResult);
    });
  });

  describe('Webhook Event Repository Operations', () => {
    test('should create webhook event', async () => {
      const webhookData = {
        source: WebhookSource.MIRO,
        eventType: 'widget.updated',
        payload: {
          widgetId: 'widget_123',
          boardId: 'board_456',
          changes: { completed: true }
        }
      };

      const mockWebhookEvent = {
        id: 'webhook-123',
        source: WebhookSource.MIRO,
        eventType: 'widget.updated',
        payload: webhookData.payload,
        processed: false,
        createdAt: new Date(),
      };

      mockPrisma.webhookEvent.create.mockResolvedValue(mockWebhookEvent);

      const result = await webhookEventRepo.create(webhookData);

      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
        data: webhookData,
      });
      expect(result).toEqual(mockWebhookEvent);
    });

    test('should find unprocessed webhook events', async () => {
      const limit = 10;
      const mockEvents = [
        {
          id: 'webhook-1',
          source: WebhookSource.MIRO,
          processed: false,
          createdAt: new Date(),
        },
        {
          id: 'webhook-2',
          source: WebhookSource.TODOIST,
          processed: false,
          createdAt: new Date(),
        },
      ];

      mockPrisma.webhookEvent.findMany.mockResolvedValue(mockEvents);

      const result = await webhookEventRepo.findUnprocessed(limit);

      expect(mockPrisma.webhookEvent.findMany).toHaveBeenCalledWith({
        where: { processed: false },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
      expect(result).toEqual(mockEvents);
    });

    test('should mark webhook event as processed', async () => {
      const eventId = 'webhook-123';
      const mockProcessedEvent = {
        id: eventId,
        processed: true,
        updatedAt: new Date(),
      };

      mockPrisma.webhookEvent.update.mockResolvedValue(mockProcessedEvent);

      const result = await webhookEventRepo.markAsProcessed(eventId);

      expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { processed: true },
      });
      expect(result).toEqual(mockProcessedEvent);
    });

    test('should find events by source and type', async () => {
      const source = WebhookSource.MIRO;
      const eventType = 'widget.updated';
      const limit = 5;
      const mockEvents = [
        {
          id: 'webhook-1',
          source,
          eventType,
          createdAt: new Date(),
        },
      ];

      mockPrisma.webhookEvent.findMany.mockResolvedValue(mockEvents);

      const result = await webhookEventRepo.findBySourceAndType(source as any, eventType, limit);

      expect(mockPrisma.webhookEvent.findMany).toHaveBeenCalledWith({
        where: {
          source,
          eventType,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      expect(result).toEqual(mockEvents);
    });

    test('should cleanup old processed events', async () => {
      const daysOld = 30;
      const mockBatchResult = { count: 15 };

      mockPrisma.webhookEvent.deleteMany.mockResolvedValue(mockBatchResult);

      const result = await webhookEventRepo.cleanupOldEvents(daysOld);

      expect(mockPrisma.webhookEvent.deleteMany).toHaveBeenCalledWith({
        where: {
          processed: true,
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
      expect(result).toEqual(mockBatchResult);
    });

    test('should get processing statistics', async () => {
      mockPrisma.webhookEvent.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // processed
        .mockResolvedValueOnce(60)  // miro events
        .mockResolvedValueOnce(40); // todoist events

      const result = await webhookEventRepo.getProcessingStats();

      expect(result).toEqual({
        total: 100,
        processed: 80,
        pending: 20,
        bySource: {
          MIRO: 60,
          TODOIST: 40,
        },
      });

      expect(mockPrisma.webhookEvent.count).toHaveBeenCalledTimes(4);
    });
  });

  describe('Repository Error Handling Edge Cases', () => {
    test('should handle network timeout errors', async () => {
      const networkError = {
        code: 'ECONNRESET',
        message: 'Connection was reset',
      };

      mockPrisma.attachment.create.mockRejectedValue(networkError);

      await expect(attachmentRepo.create({
        fileName: 'test.jpg',
        fileUrl: 'https://example.com/test.jpg',
        fileType: 'image/jpeg',
        ticket: { connect: { id: 'ticket-123' } }
      })).rejects.toThrow('Database operation failed: Connection was reset');
    });

    test('should handle constraint violations with detailed messages', async () => {
      const constraintError = {
        code: 'P2002',
        meta: { 
          target: ['ticketId', 'fileName'],
          constraint: 'unique_ticket_filename'
        },
        message: 'Unique constraint failed on the constraint: `unique_ticket_filename`',
      };

      mockPrisma.attachment.create.mockRejectedValue(constraintError);

      await expect(attachmentRepo.create({
        fileName: 'duplicate.jpg',
        fileUrl: 'https://example.com/duplicate.jpg',
        fileType: 'image/jpeg',
        ticket: { connect: { id: 'ticket-123' } }
      })).rejects.toThrow('Unique constraint violation: ticketId,fileName');
    });

    test('should handle database connection errors gracefully', async () => {
      const connectionError = {
        code: 'P1001',
        message: 'Can\'t reach database server',
      };

      mockPrisma.communicationLog.findMany.mockRejectedValue(connectionError);

      await expect(communicationLogRepo.findByTicketId('ticket-123'))
        .rejects
        .toThrow('Database operation failed: Can\'t reach database server');
    });
  });

  describe('Complex Query Scenarios', () => {
    test('should handle empty result sets gracefully', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([]);

      const result = await attachmentRepo.findByTicketId('non-existent-ticket');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle null results for single record queries', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);

      const result = await webhookEventRepo.findById('non-existent-id');

      expect(result).toBeNull();
    });

    test('should handle large payload data in webhook events', async () => {
      const largePayload = {
        boardId: 'board-123',
        widgets: Array.from({ length: 1000 }, (_, i) => ({
          id: `widget-${i}`,
          type: 'sticky_note',
          content: `Content for widget ${i}`,
        })),
        metadata: {
          timestamp: Date.now(),
          version: '2.0',
          changes: Array.from({ length: 500 }, (_, i) => ({
            widgetId: `widget-${i}`,
            property: 'content',
            oldValue: `Old content ${i}`,
            newValue: `New content ${i}`,
          })),
        },
      };

      const webhookData = {
        source: WebhookSource.MIRO,
        eventType: 'board.bulk_update',
        payload: largePayload,
      };

      const mockWebhookEvent = {
        id: 'webhook-large',
        ...webhookData,
        processed: false,
        createdAt: new Date(),
      };

      mockPrisma.webhookEvent.create.mockResolvedValue(mockWebhookEvent);

      const result = await webhookEventRepo.create(webhookData);

      expect(result.payload).toEqual(largePayload);
      expect((result.payload as any).widgets).toHaveLength(1000);
      expect((result.payload as any).metadata.changes).toHaveLength(500);
    });
  });
});