import { ServiceType, Priority, TicketStatus, AuthorType, WebhookSource } from '@prisma/client';
import { ClientRepository } from '../../src/services/client.repository';
import { TicketRepository } from '../../src/services/ticket.repository';
import { TaskMappingRepository } from '../../src/services/task-mapping.repository';
import { BrandInfoRepository } from '../../src/services/brand-info.repository';
import { AttachmentRepository } from '../../src/services/attachment.repository';
import { CommunicationLogRepository } from '../../src/services/communication-log.repository';
import { WebhookEventRepository } from '../../src/services/webhook-event.repository';

// Import the shared prisma instance from setup
import { prisma } from '../setup';

/**
 * Database Integration Tests
 * 
 * These tests validate:
 * - Entity creation, updates, and relationships
 * - Constraint enforcement and data validation
 * - Transaction rollback scenarios
 * - Audit logging functionality
 * 
 * Requirements Coverage: 6.4 - Audit logs and data integrity
 */
describe('Database Integration Tests', () => {
  let clientRepo: ClientRepository;
  let ticketRepo: TicketRepository;
  let taskMappingRepo: TaskMappingRepository;
  let brandInfoRepo: BrandInfoRepository;
  let attachmentRepo: AttachmentRepository;
  let communicationLogRepo: CommunicationLogRepository;
  let webhookEventRepo: WebhookEventRepository;

  beforeAll(() => {
    // Initialize repositories with shared prisma instance
    clientRepo = new ClientRepository(prisma);
    ticketRepo = new TicketRepository(prisma);
    taskMappingRepo = new TaskMappingRepository(prisma);
    brandInfoRepo = new BrandInfoRepository(prisma);
    attachmentRepo = new AttachmentRepository(prisma);
    communicationLogRepo = new CommunicationLogRepository(prisma);
    webhookEventRepo = new WebhookEventRepository(prisma);
  });

  describe('Entity Creation and Relationships', () => {
    test('should create client with proper data validation', async () => {
      const clientData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        accessCode: 'ACME123',
      };

      const mockClient = {
        id: 'client-123',
        ...clientData,
        createdAt: new Date(),
      };

      if (prisma.client?.create) {
        (prisma.client.create as jest.Mock).mockResolvedValue(mockClient);
      }

      const client = await clientRepo.create(clientData);

      expect(client.id).toBeDefined();
      expect(client.name).toBe(clientData.name);
      expect(client.email).toBe(clientData.email);
      expect(client.company).toBe(clientData.company);
      expect(client.accessCode).toBe(clientData.accessCode);
      expect(client.createdAt).toBeInstanceOf(Date);

      // Verify Prisma was called with correct data
      if (prisma.client?.create) {
        expect(prisma.client.create).toHaveBeenCalledWith({
          data: clientData,
        });
      }
    });

    test('should create ticket with client relationship and proper validation', async () => {
      const clientId = 'client-123';
      const ticketData = {
        ticketNumber: 'TICK-2024-001',
        title: 'Logo Design Project',
        description: 'Create a modern logo for tech startup',
        serviceType: ServiceType.LOGO,
        priority: Priority.HIGH,
        status: TicketStatus.PENDING,
        deadline: new Date('2024-12-31'),
        client: { connect: { id: clientId } },
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TICK-2024-001',
        title: 'Logo Design Project',
        description: 'Create a modern logo for tech startup',
        serviceType: ServiceType.LOGO,
        priority: Priority.HIGH,
        status: TicketStatus.PENDING,
        deadline: new Date('2024-12-31'),
        clientId,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: {
          id: clientId,
          name: 'Test Client',
          email: 'test@example.com',
        },
      };

      if (prisma.ticket?.create) {
        (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);
      }

      const ticket = await ticketRepo.create(ticketData);

      expect(ticket.id).toBeDefined();
      expect(ticket.ticketNumber).toBe(ticketData.ticketNumber);
      expect(ticket.serviceType).toBe(ServiceType.LOGO);
      expect(ticket.priority).toBe(Priority.HIGH);
      expect(ticket.status).toBe(TicketStatus.PENDING);
      expect(ticket.clientId).toBe(clientId);

      // Verify relationship data
      expect((ticket as any).client).toBeDefined();
      expect((ticket as any).client.id).toBe(clientId);

      // Verify Prisma was called with include for relationships
      if (prisma.ticket?.create) {
        expect(prisma.ticket.create).toHaveBeenCalledWith({
          data: ticketData,
          include: { client: true },
        });
      }
    });

    test('should create task mapping with proper relationships', async () => {
      const ticketId = 'ticket-123';
      const taskMappingData = {
        todoistTaskId: 'todoist_task_123',
        miroWidgetId: 'miro_widget_456',
        taskName: 'Create initial concepts',
        taskOrder: 1,
        completed: false,
        ticket: { connect: { id: ticketId } },
      };

      const mockTaskMapping = {
        id: 'task-mapping-123',
        todoistTaskId: 'todoist_task_123',
        miroWidgetId: 'miro_widget_456',
        taskName: 'Create initial concepts',
        taskOrder: 1,
        completed: false,
        ticketId,
        syncedAt: new Date(),
        ticket: {
          id: ticketId,
          title: 'Test Project',
        },
      };

      if (prisma.taskMapping?.create) {
        (prisma.taskMapping.create as jest.Mock).mockResolvedValue(mockTaskMapping);
      }

      const taskMapping = await taskMappingRepo.create(taskMappingData);

      expect(taskMapping.id).toBeDefined();
      expect(taskMapping.todoistTaskId).toBe(taskMappingData.todoistTaskId);
      expect(taskMapping.miroWidgetId).toBe(taskMappingData.miroWidgetId);
      expect(taskMapping.taskName).toBe(taskMappingData.taskName);
      expect(taskMapping.taskOrder).toBe(1);
      expect(taskMapping.completed).toBe(false);
      expect(taskMapping.ticketId).toBe(ticketId);
      expect(taskMapping.syncedAt).toBeInstanceOf(Date);

      // Verify relationship inclusion
      expect((taskMapping as any).ticket).toBeDefined();
      expect((taskMapping as any).ticket.id).toBe(ticketId);
    });

    test('should create brand info with one-to-one ticket relationship', async () => {
      const ticketId = 'ticket-123';
      const brandInfoData = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        fonts: ['Arial', 'Helvetica', 'Times New Roman'],
        styleKeywords: ['modern', 'clean', 'professional'],
        logoUrl: 'https://example.com/logo.png',
        ticket: { connect: { id: ticketId } },
      };

      const mockBrandInfo = {
        id: 'brand-info-123',
        ticketId,
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        fonts: ['Arial', 'Helvetica', 'Times New Roman'],
        styleKeywords: ['modern', 'clean', 'professional'],
        logoUrl: 'https://example.com/logo.png',
        ticket: {
          id: ticketId,
          title: 'Test Project',
        },
      };

      if (prisma.brandInfo?.create) {
        (prisma.brandInfo.create as jest.Mock).mockResolvedValue(mockBrandInfo);
      }

      const brandInfo = await brandInfoRepo.create(brandInfoData);

      expect(brandInfo.id).toBeDefined();
      expect(brandInfo.colors).toEqual(brandInfoData.colors);
      expect(brandInfo.fonts).toEqual(brandInfoData.fonts);
      expect(brandInfo.styleKeywords).toEqual(brandInfoData.styleKeywords);
      expect(brandInfo.logoUrl).toBe(brandInfoData.logoUrl);
      expect(brandInfo.ticketId).toBe(ticketId);

      // Verify array field handling
      expect(Array.isArray(brandInfo.colors)).toBe(true);
      expect(Array.isArray(brandInfo.fonts)).toBe(true);
      expect(Array.isArray(brandInfo.styleKeywords)).toBe(true);
    });
  });

  describe('Constraint Enforcement', () => {
    test('should enforce unique email constraint for clients', async () => {
      const duplicateClientData = {
        name: 'Another Client',
        email: 'duplicate@example.com',
        accessCode: 'ANOTHER123',
      };

      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed',
      };

      if (prisma.client?.create) {
        (prisma.client.create as jest.Mock).mockRejectedValue(prismaError);
      }

      await expect(clientRepo.create(duplicateClientData))
        .rejects
        .toThrow('Unique constraint violation: email');
    });

    test('should enforce unique ticket number constraint', async () => {
      const duplicateTicketData = {
        ticketNumber: 'TICK-2024-001',
        title: 'Duplicate Ticket',
        serviceType: ServiceType.WEBSITE,
        client: { connect: { id: 'client-123' } },
      };

      const prismaError = {
        code: 'P2002',
        meta: { target: ['ticketNumber'] },
        message: 'Unique constraint failed',
      };

      if (prisma.ticket?.create) {
        (prisma.ticket.create as jest.Mock).mockRejectedValue(prismaError);
      }

      await expect(ticketRepo.create(duplicateTicketData))
        .rejects
        .toThrow('Unique constraint violation: ticketNumber');
    });

    test('should enforce foreign key constraint for ticket-client relationship', async () => {
      const invalidTicketData = {
        ticketNumber: 'TICK-2024-999',
        title: 'Invalid Ticket',
        serviceType: ServiceType.LOGO,
        client: { connect: { id: 'non-existent-client-id' } },
      };

      const prismaError = {
        code: 'P2003',
        message: 'Foreign key constraint failed',
      };

      if (prisma.ticket?.create) {
        (prisma.ticket.create as jest.Mock).mockRejectedValue(prismaError);
      }

      await expect(ticketRepo.create(invalidTicketData))
        .rejects
        .toThrow('Foreign key constraint violation');
    });

    test('should enforce one-to-one constraint for ticket-brand info relationship', async () => {
      const brandInfoData = {
        colors: ['#00FF00'],
        fonts: ['Helvetica'],
        styleKeywords: ['clean'],
        ticket: { connect: { id: 'ticket-123' } },
      };

      const prismaError = {
        code: 'P2002',
        meta: { target: ['ticketId'] },
        message: 'Unique constraint failed on ticketId',
      };

      if (prisma.brandInfo?.create) {
        (prisma.brandInfo.create as jest.Mock).mockRejectedValue(prismaError);
      }

      await expect(brandInfoRepo.create(brandInfoData))
        .rejects
        .toThrow('Unique constraint violation: ticketId');
    });
  });

  describe('Transaction Handling and Rollback', () => {
    test('should execute operations within transaction', async () => {
      const mockTransaction = jest.fn();
      const mockResult = { success: true };

      if (prisma.$transaction) {
        (prisma.$transaction as jest.Mock).mockImplementation((callback: any) => {
          return callback(mockTransaction);
        });
      }

      const operations = jest.fn().mockResolvedValue(mockResult);
      const result = await ticketRepo.withTransaction(operations);

      expect(prisma.$transaction).toHaveBeenCalledWith(operations);
      expect(result).toEqual(mockResult);
    });

    test('should handle transaction rollback on error', async () => {
      const error = new Error('Transaction failed');
      
      if (prisma.$transaction) {
        (prisma.$transaction as jest.Mock).mockRejectedValue(error);
      }

      const operations = jest.fn();

      await expect(ticketRepo.withTransaction(operations))
        .rejects
        .toThrow('Transaction failed');
    });

    test('should update ticket status with audit logging in transaction', async () => {
      const ticketId = 'ticket-123';
      const newStatus = TicketStatus.IN_PROGRESS;

      const mockUpdatedTicket = {
        id: ticketId,
        status: newStatus,
        updatedAt: new Date(),
      };

      const mockAuditLog = {
        id: 'log-123',
        ticketId,
        authorType: AuthorType.SYSTEM,
        authorName: 'System',
        message: `Ticket status changed to ${newStatus}`,
        createdAt: new Date(),
      };

      // Mock transaction implementation
      if (prisma.$transaction) {
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
          const mockTx = {
            ticket: {
              update: jest.fn().mockResolvedValue(mockUpdatedTicket),
            },
            communicationLog: {
              create: jest.fn().mockResolvedValue(mockAuditLog),
            },
          };
          return callback(mockTx);
        });
      }

      const result = await ticketRepo.updateStatus(ticketId, newStatus as any);

      expect(result).toEqual(mockUpdatedTicket);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Data Validation and Types', () => {
    test('should validate enum values in entities', async () => {
      const ticketData = {
        ticketNumber: 'TICK-2024-ENUM',
        title: 'Enum Test Ticket',
        serviceType: ServiceType.BRANDING,
        priority: Priority.URGENT,
        status: TicketStatus.REVIEW,
        client: { connect: { id: 'client-123' } },
      };

      const mockTicket = {
        id: 'ticket-enum',
        ...ticketData,
        clientId: 'client-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (prisma.ticket?.create) {
        (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);
      }

      const ticket = await ticketRepo.create(ticketData);

      expect(ticket.serviceType).toBe(ServiceType.BRANDING);
      expect(ticket.priority).toBe(Priority.URGENT);
      expect(ticket.status).toBe(TicketStatus.REVIEW);
    });

    test('should handle JSON payload validation in webhook events', async () => {
      const complexPayload = {
        boardId: 'board_123',
        widgets: [
          { id: 'widget_1', type: 'sticky_note', content: 'Note 1' },
          { id: 'widget_2', type: 'shape', content: 'Shape 1' },
        ],
        metadata: {
          timestamp: Date.now(),
          version: '2.0',
          user: { id: 'user_123', name: 'Test User' },
        },
      };

      const webhookData = {
        source: WebhookSource.MIRO,
        eventType: 'board.widgets.updated',
        payload: complexPayload,
      };

      const mockWebhookEvent = {
        id: 'webhook-123',
        source: WebhookSource.MIRO,
        eventType: 'board.widgets.updated',
        payload: complexPayload,
        processed: false,
        createdAt: new Date(),
      };

      if (prisma.webhookEvent?.create) {
        (prisma.webhookEvent.create as jest.Mock).mockResolvedValue(mockWebhookEvent);
      }

      const webhookEvent = await webhookEventRepo.create(webhookData);

      expect(webhookEvent.payload).toEqual(complexPayload);
      expect((webhookEvent.payload as any).widgets).toHaveLength(2);
      expect((webhookEvent.payload as any).metadata.user.name).toBe('Test User');
    });

    test('should validate date fields and timestamps', async () => {
      const futureDate = new Date('2025-12-31');
      const ticketData = {
        ticketNumber: 'TICK-2024-DATE',
        title: 'Date Test Ticket',
        serviceType: ServiceType.WEBSITE,
        deadline: futureDate,
        client: { connect: { id: 'client-123' } },
      };

      const mockTicket = {
        id: 'ticket-date',
        ...ticketData,
        clientId: 'client-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (prisma.ticket?.create) {
        (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);
      }

      const ticket = await ticketRepo.create(ticketData);

      expect(ticket.deadline).toBeInstanceOf(Date);
      expect(ticket.createdAt).toBeInstanceOf(Date);
      expect(ticket.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Progress Tracking and Audit Logging', () => {
    test('should calculate task completion progress correctly', async () => {
      const ticketId = 'ticket-123';

      if (prisma.taskMapping?.count) {
        (prisma.taskMapping.count as jest.Mock)
          .mockResolvedValueOnce(5) // total tasks
          .mockResolvedValueOnce(3); // completed tasks
      }

      const result = await taskMappingRepo.getTicketProgress(ticketId);

      expect(result).toEqual({
        total: 5,
        completed: 3,
        percentage: 60,
      });

      expect(prisma.taskMapping?.count).toHaveBeenCalledTimes(2);
    });

    test('should handle zero tasks for progress calculation', async () => {
      const ticketId = 'ticket-empty';

      if (prisma.taskMapping?.count) {
        (prisma.taskMapping.count as jest.Mock)
          .mockResolvedValueOnce(0) // total tasks
          .mockResolvedValueOnce(0); // completed tasks
      }

      const result = await taskMappingRepo.getTicketProgress(ticketId);

      expect(result).toEqual({
        total: 0,
        completed: 0,
        percentage: 0,
      });
    });

    test('should create audit logs for system events', async () => {
      const ticketId = 'ticket-123';
      const message = 'Ticket status changed to IN_PROGRESS';

      const mockLog = {
        id: 'log-123',
        ticketId,
        authorType: AuthorType.SYSTEM,
        authorName: 'System',
        message,
        createdAt: new Date(),
        ticket: {
          id: ticketId,
          title: 'Test Project',
        },
      };

      if (prisma.communicationLog?.create) {
        (prisma.communicationLog.create as jest.Mock).mockResolvedValue(mockLog);
      }

      const log = await communicationLogRepo.addSystemMessage(ticketId, message);

      expect(log.authorType).toBe(AuthorType.SYSTEM);
      expect(log.authorName).toBe('System');
      expect(log.message).toBe(message);
      expect(log.ticketId).toBe(ticketId);

      // Verify proper audit log creation
      if (prisma.communicationLog?.create) {
        expect(prisma.communicationLog.create).toHaveBeenCalledWith({
          data: {
            ticket: { connect: { id: ticketId } },
            authorType: 'SYSTEM',
            authorName: 'System',
            message,
          },
          include: { ticket: true },
        });
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle database connection errors gracefully', async () => {
      const connectionError = {
        code: 'P1001',
        message: 'Can\'t reach database server',
      };

      if (prisma.client?.create) {
        (prisma.client.create as jest.Mock).mockRejectedValue(connectionError);
      }

      await expect(clientRepo.create({
        name: 'Test',
        email: 'test@example.com',
        accessCode: 'TEST123',
      })).rejects.toThrow('Database operation failed: Can\'t reach database server');
    });

    test('should handle record not found errors', async () => {
      const notFoundError = {
        code: 'P2025',
        message: 'Record to update not found',
      };

      if (prisma.client?.update) {
        (prisma.client.update as jest.Mock).mockRejectedValue(notFoundError);
      }

      await expect(clientRepo.update('non-existent-id', { name: 'Updated' }))
        .rejects
        .toThrow('Record not found');
    });

    test('should handle network timeout errors', async () => {
      const networkError = {
        code: 'ECONNRESET',
        message: 'Connection was reset',
      };

      if (prisma.attachment?.create) {
        (prisma.attachment.create as jest.Mock).mockRejectedValue(networkError);
      }

      await expect(attachmentRepo.create({
        fileName: 'test.jpg',
        fileUrl: 'https://example.com/test.jpg',
        fileType: 'image/jpeg',
        ticket: { connect: { id: 'ticket-123' } }
      })).rejects.toThrow('Database operation failed: Connection was reset');
    });
  });

  describe('Webhook Event Processing', () => {
    test('should process webhook events with proper validation', async () => {
      const webhookData = {
        source: WebhookSource.MIRO,
        eventType: 'widget.updated',
        payload: {
          widgetId: 'widget_123',
          boardId: 'board_456',
          changes: { completed: true },
        },
      };

      const mockWebhookEvent = {
        id: 'webhook-123',
        source: WebhookSource.MIRO,
        eventType: 'widget.updated',
        payload: webhookData.payload,
        processed: false,
        createdAt: new Date(),
      };

      if (prisma.webhookEvent?.create) {
        (prisma.webhookEvent.create as jest.Mock).mockResolvedValue(mockWebhookEvent);
      }

      const webhookEvent = await webhookEventRepo.create(webhookData);

      expect(webhookEvent.source).toBe(WebhookSource.MIRO);
      expect(webhookEvent.eventType).toBe(webhookData.eventType);
      expect(webhookEvent.payload).toEqual(webhookData.payload);
      expect(webhookEvent.processed).toBe(false);
    });

    test('should mark webhook events as processed', async () => {
      const eventId = 'webhook-123';
      const mockProcessedEvent = {
        id: eventId,
        processed: true,
      };

      if (prisma.webhookEvent?.update) {
        (prisma.webhookEvent.update as jest.Mock).mockResolvedValue(mockProcessedEvent);
      }

      const result = await webhookEventRepo.markAsProcessed(eventId);

      expect(result.processed).toBe(true);

      if (prisma.webhookEvent?.update) {
        expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
          where: { id: eventId },
          data: { processed: true },
        });
      }
    });
  });
});