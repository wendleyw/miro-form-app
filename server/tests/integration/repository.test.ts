import { ServiceType, Priority, TicketStatus, AuthorType, WebhookSource } from '@prisma/client';
import { ClientRepository } from '../../src/services/client.repository';
import { TicketRepository } from '../../src/services/ticket.repository';
import { TaskMappingRepository } from '../../src/services/task-mapping.repository';
import { BrandInfoRepository } from '../../src/services/brand-info.repository';

describe('Repository Integration Tests', () => {
  let mockPrisma: any;
  let clientRepo: ClientRepository;
  let ticketRepo: TicketRepository;
  let taskMappingRepo: TaskMappingRepository;
  let brandInfoRepo: BrandInfoRepository;

  beforeEach(() => {
    // Create a comprehensive mock Prisma client
    mockPrisma = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(),
      client: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
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
      communicationLog: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    // Initialize repositories with mock
    clientRepo = new ClientRepository(mockPrisma);
    ticketRepo = new TicketRepository(mockPrisma);
    taskMappingRepo = new TaskMappingRepository(mockPrisma);
    brandInfoRepo = new BrandInfoRepository(mockPrisma);
  });

  describe('Client Repository Operations', () => {
    test('should create client with proper data structure', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        company: 'Test Company',
        accessCode: 'TEST123',
      };

      const mockClient = {
        id: 'client-123',
        ...clientData,
        createdAt: new Date(),
      };

      mockPrisma.client.create.mockResolvedValue(mockClient);

      const result = await clientRepo.create(clientData);

      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: clientData,
      });
      expect(result).toEqual(mockClient);
    });

    test('should handle unique constraint violation on email', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'duplicate@example.com',
        accessCode: 'TEST123',
      };

      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed',
      };

      mockPrisma.client.create.mockRejectedValue(prismaError);

      await expect(clientRepo.create(clientData)).rejects.toThrow(
        'Unique constraint violation: email'
      );
    });

    test('should authenticate client with valid credentials', async () => {
      const mockClient = {
        id: 'client-123',
        name: 'Test Client',
        email: 'test@example.com',
        accessCode: 'VALID123',
        createdAt: new Date(),
      };

      mockPrisma.client.findFirst.mockResolvedValue(mockClient);

      const result = await clientRepo.authenticate('test@example.com', 'VALID123');

      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          accessCode: 'VALID123',
        },
      });
      expect(result).toEqual(mockClient);
    });

    test('should return null for invalid credentials', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      const result = await clientRepo.authenticate('test@example.com', 'INVALID');

      expect(result).toBeNull();
    });
  });

  describe('Ticket Repository Operations', () => {
    test('should create ticket with client relationship', async () => {
      const ticketData = {
        ticketNumber: 'TICK-2024-001',
        title: 'Test Logo Design',
        description: 'A test logo design project',
        serviceType: ServiceType.LOGO,
        priority: Priority.HIGH,
        status: TicketStatus.PENDING,
        client: { connect: { id: 'client-123' } }
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TICK-2024-001',
        title: 'Test Logo Design',
        description: 'A test logo design project',
        serviceType: ServiceType.LOGO,
        priority: Priority.HIGH,
        status: TicketStatus.PENDING,
        clientId: 'client-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        client: {
          id: 'client-123',
          name: 'Test Client',
          email: 'test@example.com',
        },
      };

      mockPrisma.ticket.create.mockResolvedValue(mockTicket);

      const result = await ticketRepo.create(ticketData);

      expect(mockPrisma.ticket.create).toHaveBeenCalledWith({
        data: ticketData,
        include: { client: true },
      });
      expect(result).toEqual(mockTicket);
    });

    test('should generate unique ticket numbers', async () => {
      const currentYear = new Date().getFullYear();
      
      // Mock no existing tickets
      mockPrisma.ticket.findFirst.mockResolvedValue(null);

      const result = await ticketRepo.generateTicketNumber();

      expect(result).toBe(`TICK-${currentYear}-001`);
      expect(mockPrisma.ticket.findFirst).toHaveBeenCalledWith({
        where: {
          ticketNumber: {
            startsWith: `TICK-${currentYear}-`,
          },
        },
        orderBy: {
          ticketNumber: 'desc',
        },
      });
    });

    test('should increment ticket numbers correctly', async () => {
      const currentYear = new Date().getFullYear();
      const lastTicket = {
        ticketNumber: `TICK-${currentYear}-005`,
      };

      mockPrisma.ticket.findFirst.mockResolvedValue(lastTicket);

      const result = await ticketRepo.generateTicketNumber();

      expect(result).toBe(`TICK-${currentYear}-006`);
    });

    test('should handle foreign key constraint violation', async () => {
      const ticketData = {
        ticketNumber: 'TICK-2024-001',
        title: 'Test Ticket',
        serviceType: ServiceType.LOGO,
        client: { connect: { id: 'non-existent-client' } }
      };

      const prismaError = {
        code: 'P2003',
        message: 'Foreign key constraint failed',
      };

      mockPrisma.ticket.create.mockRejectedValue(prismaError);

      await expect(ticketRepo.create(ticketData)).rejects.toThrow(
        'Foreign key constraint violation'
      );
    });
  });

  describe('Transaction Handling', () => {
    test('should execute operations within transaction', async () => {
      const mockTransaction = jest.fn();
      const mockResult = { success: true };

      mockPrisma.$transaction.mockImplementation((callback: any) => {
        return callback(mockTransaction);
      });

      const operations = jest.fn().mockResolvedValue(mockResult);

      const result = await ticketRepo.withTransaction(operations);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(operations);
      expect(result).toEqual(mockResult);
    });

    test('should handle transaction rollback on error', async () => {
      const error = new Error('Transaction failed');
      
      mockPrisma.$transaction.mockRejectedValue(error);

      const operations = jest.fn();

      await expect(ticketRepo.withTransaction(operations)).rejects.toThrow(
        'Transaction failed'
      );
    });

    test('should update ticket status with audit logging', async () => {
      const ticketId = 'ticket-123';
      const newStatus = TicketStatus.IN_PROGRESS;

      const mockUpdatedTicket = {
        id: ticketId,
        status: newStatus,
        updatedAt: new Date(),
      };

      // Mock transaction implementation
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          ticket: {
            update: jest.fn().mockResolvedValue(mockUpdatedTicket),
          },
          communicationLog: {
            create: jest.fn().mockResolvedValue({
              id: 'log-123',
              ticketId,
              authorType: AuthorType.SYSTEM,
              authorName: 'System',
              message: `Ticket status changed to ${newStatus}`,
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await ticketRepo.updateStatus(ticketId, newStatus as any);

      expect(result).toEqual(mockUpdatedTicket);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Task Mapping Operations', () => {
    test('should create task mapping with proper relationships', async () => {
      const taskMappingData = {
        todoistTaskId: 'todoist_123',
        miroWidgetId: 'miro_widget_456',
        taskName: 'Design Homepage',
        taskOrder: 1,
        completed: false,
        ticket: { connect: { id: 'ticket-123' } }
      };

      const mockTaskMapping = {
        id: 'task-mapping-123',
        todoistTaskId: 'todoist_123',
        miroWidgetId: 'miro_widget_456',
        taskName: 'Design Homepage',
        taskOrder: 1,
        completed: false,
        ticketId: 'ticket-123',
        syncedAt: new Date(),
        ticket: {
          id: 'ticket-123',
          title: 'Test Project',
        },
      };

      mockPrisma.taskMapping.create.mockResolvedValue(mockTaskMapping);

      const result = await taskMappingRepo.create(taskMappingData);

      expect(mockPrisma.taskMapping.create).toHaveBeenCalledWith({
        data: taskMappingData,
        include: { ticket: true },
      });
      expect(result).toEqual(mockTaskMapping);
    });

    test('should update task completion status', async () => {
      const taskId = 'task-123';
      const completed = true;

      const mockUpdatedTask = {
        id: taskId,
        completed,
        syncedAt: new Date(),
      };

      mockPrisma.taskMapping.update.mockResolvedValue(mockUpdatedTask);

      const result = await taskMappingRepo.updateCompletion(taskId, completed);

      expect(mockPrisma.taskMapping.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: {
          completed,
          syncedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockUpdatedTask);
    });

    test('should calculate ticket progress correctly', async () => {
      const ticketId = 'ticket-123';

      mockPrisma.taskMapping.count
        .mockResolvedValueOnce(5) // total tasks
        .mockResolvedValueOnce(3); // completed tasks

      const result = await taskMappingRepo.getTicketProgress(ticketId);

      expect(result).toEqual({
        total: 5,
        completed: 3,
        percentage: 60,
      });

      expect(mockPrisma.taskMapping.count).toHaveBeenCalledTimes(2);
      expect(mockPrisma.taskMapping.count).toHaveBeenNthCalledWith(1, {
        where: { ticketId },
      });
      expect(mockPrisma.taskMapping.count).toHaveBeenNthCalledWith(2, {
        where: { ticketId, completed: true },
      });
    });

    test('should handle zero tasks for progress calculation', async () => {
      const ticketId = 'ticket-123';

      mockPrisma.taskMapping.count
        .mockResolvedValueOnce(0) // total tasks
        .mockResolvedValueOnce(0); // completed tasks

      const result = await taskMappingRepo.getTicketProgress(ticketId);

      expect(result).toEqual({
        total: 0,
        completed: 0,
        percentage: 0,
      });
    });
  });

  describe('Brand Info Operations', () => {
    test('should create brand info with ticket relationship', async () => {
      const brandInfoData = {
        colors: ['#FF0000', '#00FF00'],
        fonts: ['Arial', 'Helvetica'],
        styleKeywords: ['modern', 'clean'],
        logoUrl: 'https://example.com/logo.png',
        ticket: { connect: { id: 'ticket-123' } }
      };

      const mockBrandInfo = {
        id: 'brand-info-123',
        ticketId: 'ticket-123',
        colors: ['#FF0000', '#00FF00'],
        fonts: ['Arial', 'Helvetica'],
        styleKeywords: ['modern', 'clean'],
        logoUrl: 'https://example.com/logo.png',
        ticket: {
          id: 'ticket-123',
          title: 'Test Project',
        },
      };

      mockPrisma.brandInfo.create.mockResolvedValue(mockBrandInfo);

      const result = await brandInfoRepo.create(brandInfoData);

      expect(mockPrisma.brandInfo.create).toHaveBeenCalledWith({
        data: brandInfoData,
        include: { ticket: true },
      });
      expect(result).toEqual(mockBrandInfo);
    });

    test('should upsert brand info correctly', async () => {
      const ticketId = 'ticket-123';
      const brandData = {
        colors: ['#FF0000'],
        fonts: ['Arial'],
        styleKeywords: ['modern'],
      };

      const mockBrandInfo = {
        id: 'brand-info-123',
        ticketId,
        ...brandData,
        ticket: {
          id: ticketId,
          title: 'Test Project',
        },
      };

      mockPrisma.brandInfo.upsert.mockResolvedValue(mockBrandInfo);

      const result = await brandInfoRepo.upsert(ticketId, brandData);

      expect(mockPrisma.brandInfo.upsert).toHaveBeenCalledWith({
        where: { ticketId },
        create: {
          ...brandData,
          ticket: { connect: { id: ticketId } },
        },
        update: brandData,
        include: { ticket: true },
      });
      expect(result).toEqual(mockBrandInfo);
    });

    test('should enforce one-to-one relationship constraint', async () => {
      const brandInfoData = {
        colors: ['#FF0000'],
        fonts: ['Arial'],
        styleKeywords: ['modern'],
        ticket: { connect: { id: 'ticket-123' } }
      };

      const prismaError = {
        code: 'P2002',
        meta: { target: ['ticketId'] },
        message: 'Unique constraint failed on ticketId',
      };

      mockPrisma.brandInfo.create.mockRejectedValue(prismaError);

      await expect(brandInfoRepo.create(brandInfoData)).rejects.toThrow(
        'Unique constraint violation: ticketId'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle record not found error', async () => {
      const prismaError = {
        code: 'P2025',
        message: 'Record to update not found',
      };

      mockPrisma.client.update.mockRejectedValue(prismaError);

      await expect(clientRepo.update('non-existent-id', { name: 'Updated' }))
        .rejects
        .toThrow('Record not found');
    });

    test('should handle generic database errors', async () => {
      const genericError = new Error('Connection timeout');

      mockPrisma.client.create.mockRejectedValue(genericError);

      await expect(clientRepo.create({
        name: 'Test',
        email: 'test@example.com',
        accessCode: 'TEST123',
      })).rejects.toThrow('Database operation failed: Connection timeout');
    });
  });

  describe('Data Validation', () => {
    test('should validate enum values in ticket creation', async () => {
      const ticketData = {
        ticketNumber: 'TICK-2024-001',
        title: 'Test Ticket',
        serviceType: ServiceType.LOGO,
        priority: Priority.HIGH,
        status: TicketStatus.PENDING,
        client: { connect: { id: 'client-123' } }
      };

      const mockTicket = {
        id: 'ticket-123',
        ...ticketData,
        clientId: 'client-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.ticket.create.mockResolvedValue(mockTicket);

      const result = await ticketRepo.create(ticketData);

      expect(result.serviceType).toBe(ServiceType.LOGO);
      expect(result.priority).toBe(Priority.HIGH);
      expect(result.status).toBe(TicketStatus.PENDING);
    });
  });
});