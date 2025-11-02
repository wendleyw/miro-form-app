import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, ServiceType } from '@prisma/client';
import { syncService } from '../../src/services/sync.service';
import { ClientService } from '../../src/services/client.service';
import { TicketService } from '../../src/services/ticket.service';
import { TaskMappingRepository } from '../../src/services/task-mapping.repository';

describe('Sync Service Tests', () => {
  let prisma: PrismaClient;
  let clientService: ClientService;
  let ticketService: TicketService;
  let taskMappingRepository: TaskMappingRepository;
  let testClientId: string;
  let testTicketId: string;
  let testTaskMappingId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });

    await prisma.$connect();
    clientService = new ClientService();
    ticketService = new TicketService();
    taskMappingRepository = new TaskMappingRepository();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testTaskMappingId) {
      await prisma.taskMapping.delete({ where: { id: testTaskMappingId } }).catch(() => {});
    }
    if (testTicketId) {
      await prisma.ticket.delete({ where: { id: testTicketId } }).catch(() => {});
    }
    if (testClientId) {
      await prisma.client.delete({ where: { id: testClientId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test client and ticket
    const clientResult = await clientService.registerClient({
      name: 'Test Client Sync',
      email: 'test-sync@example.com',
      password: 'testpassword123',
      phone: '+1234567890',
    });

    if (clientResult.success && clientResult.client) {
      testClientId = clientResult.client.id;

      const ticketResult = await ticketService.createTicket({
        clientId: testClientId,
        title: 'Test Sync Ticket',
        description: 'Testing sync functionality',
        serviceType: ServiceType.LOGO,
      });

      if (ticketResult.success && ticketResult.ticket) {
        testTicketId = ticketResult.ticket.id;

        // Create a test task mapping
        const taskMapping = await taskMappingRepository.create({
          ticket: { connect: { id: testTicketId } },
          taskName: 'Test Task',
          taskOrder: 1,
          completed: false,
          miroWidgetId: 'test-miro-widget-id',
          todoistTaskId: 'test-todoist-task-id',
        });

        testTaskMappingId = taskMapping.id;
      }
    }
  });

  describe('Task Synchronization', () => {
    it('should sync task completion from Miro to Todoist', async () => {
      const syncData = {
        taskMappingId: testTaskMappingId,
        completed: true,
        taskName: 'Test Task',
        source: 'miro' as const,
      };

      const result = await syncService.syncTaskCompletion(syncData);
      expect(result.success).toBe(true);

      // Verify task mapping was updated
      const updatedMapping = await taskMappingRepository.findById(testTaskMappingId);
      expect(updatedMapping?.completed).toBe(true);
      expect(updatedMapping?.syncedAt).toBeDefined();
    });

    it('should sync task completion from Todoist to Miro', async () => {
      const syncData = {
        taskMappingId: testTaskMappingId,
        completed: true,
        taskName: 'Test Task',
        source: 'todoist' as const,
      };

      const result = await syncService.syncTaskCompletion(syncData);
      expect(result.success).toBe(true);

      // Verify task mapping was updated
      const updatedMapping = await taskMappingRepository.findById(testTaskMappingId);
      expect(updatedMapping?.completed).toBe(true);
    });

    it('should handle invalid task mapping ID', async () => {
      const syncData = {
        taskMappingId: 'invalid-id',
        completed: true,
        taskName: 'Test Task',
        source: 'miro' as const,
      };

      const result = await syncService.syncTaskCompletion(syncData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Communication Synchronization', () => {
    it('should sync communication between platforms', async () => {
      const commData = {
        ticketId: testTicketId,
        message: 'Test communication message',
        author: 'Test Author',
        source: 'miro' as const,
      };

      const result = await syncService.syncCommunication(commData);
      expect(result.success).toBe(true);
    });

    it('should handle invalid ticket ID for communication', async () => {
      const commData = {
        ticketId: 'invalid-id',
        message: 'Test message',
        author: 'Test Author',
        source: 'miro' as const,
      };

      const result = await syncService.syncCommunication(commData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Ticket Status Synchronization', () => {
    it('should sync ticket status changes', async () => {
      const result = await syncService.syncTicketStatus(
        testTicketId,
        'IN_PROGRESS',
        'system'
      );

      expect(result.success).toBe(true);
    });

    it('should handle invalid ticket ID for status sync', async () => {
      const result = await syncService.syncTicketStatus(
        'invalid-id',
        'IN_PROGRESS',
        'system'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts using last-write-wins strategy', async () => {
      const miroUpdate = {
        completed: true,
        timestamp: new Date('2024-01-01T12:00:00Z'),
      };

      const todoistUpdate = {
        completed: false,
        timestamp: new Date('2024-01-01T11:00:00Z'),
      };

      const result = await syncService.resolveConflict(
        testTaskMappingId,
        miroUpdate,
        todoistUpdate
      );

      expect(result.success).toBe(true);
      expect(result.resolution).toBe('miro_wins');
    });

    it('should detect no conflict when updates are the same', async () => {
      const miroUpdate = {
        completed: true,
        timestamp: new Date('2024-01-01T12:00:00Z'),
      };

      const todoistUpdate = {
        completed: true,
        timestamp: new Date('2024-01-01T11:00:00Z'),
      };

      const result = await syncService.resolveConflict(
        testTaskMappingId,
        miroUpdate,
        todoistUpdate
      );

      expect(result.success).toBe(true);
      expect(result.resolution).toBe('no_conflict');
    });
  });

  describe('Sync Statistics', () => {
    it('should get sync statistics for a ticket', async () => {
      const stats = await syncService.getSyncStatistics(testTicketId);

      expect(stats.totalTasks).toBeGreaterThanOrEqual(1);
      expect(stats.completedTasks).toBeGreaterThanOrEqual(0);
      expect(stats.syncErrors).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid ticket ID for statistics', async () => {
      const stats = await syncService.getSyncStatistics('invalid-id');

      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.lastSyncTime).toBeNull();
    });
  });

  describe('Health Check', () => {
    it('should perform sync service health check', async () => {
      const health = await syncService.healthCheck();

      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.miroStatus).toBeDefined();
      expect(health.todoistStatus).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error by using an invalid connection
      const invalidSyncData = {
        taskMappingId: 'will-cause-error',
        completed: true,
        taskName: 'Test Task',
        source: 'miro' as const,
      };

      const result = await syncService.syncTaskCompletion(invalidSyncData);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});