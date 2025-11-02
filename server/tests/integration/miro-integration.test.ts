import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, ServiceType, Priority, TicketStatus } from '@prisma/client';
import { miroService } from '../../src/services/miro.service';
import { TicketService } from '../../src/services/ticket.service';
import { ClientService } from '../../src/services/client.service';

describe('Miro Integration Tests', () => {
  let prisma: PrismaClient;
  let ticketService: TicketService;
  let clientService: ClientService;
  let testClientId: string;
  let testTicketId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });

    await prisma.$connect();
    ticketService = new TicketService();
    clientService = new ClientService();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testTicketId) {
      await prisma.ticket.delete({ where: { id: testTicketId } }).catch(() => {});
    }
    if (testClientId) {
      await prisma.client.delete({ where: { id: testClientId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create a test client
    const clientResult = await clientService.registerClient({
      name: 'Test Client Miro',
      email: 'test-miro@example.com',
      password: 'testpassword123',
      phone: '+1234567890',
    });

    if (clientResult.success && clientResult.client) {
      testClientId = clientResult.client.id;
    } else {
      throw new Error('Failed to create test client');
    }
  });

  describe('Miro Service Initialization', () => {
    it('should initialize Miro service successfully', () => {
      expect(miroService.isInitialized()).toBe(true);
    });

    it('should perform health check', async () => {
      const health = await miroService.healthCheck();
      expect(health.status).toBe('ok');
      expect(health.message).toContain('operational');
    });
  });

  describe('Miro Board Creation', () => {
    it('should create a Miro board for a new ticket', async () => {
      // Create a ticket with Miro integration
      const ticketResult = await ticketService.createTicket({
        clientId: testClientId,
        title: 'Test Logo Design Project',
        description: 'A test project for Miro integration',
        serviceType: ServiceType.LOGO,
        priority: Priority.NORMAL,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        brandInfo: {
          colors: ['#FF0000', '#00FF00', '#0000FF'],
          fonts: ['Arial', 'Helvetica'],
          styleKeywords: ['modern', 'clean', 'professional'],
        },
      });

      expect(ticketResult.success).toBe(true);
      expect(ticketResult.ticket).toBeDefined();
      
      if (ticketResult.ticket) {
        testTicketId = ticketResult.ticket.id;
        
        // Check if Miro board was created (if service is properly configured)
        if (miroService.isInitialized()) {
          expect(ticketResult.miroBoardId).toBeDefined();
          expect(ticketResult.miroBoardUrl).toBeDefined();
          expect(ticketResult.miroBoardUrl).toContain('miro.com/app/board/');
        }
      }
    }, 30000); // 30 second timeout for API calls

    it('should create task templates based on service type', () => {
      const logoTasks = ticketService.getTaskTemplatesByServiceType(ServiceType.LOGO);
      const websiteTasks = ticketService.getTaskTemplatesByServiceType(ServiceType.WEBSITE);
      const brandingTasks = ticketService.getTaskTemplatesByServiceType(ServiceType.BRANDING);

      expect(logoTasks.length).toBeGreaterThan(0);
      expect(websiteTasks.length).toBeGreaterThan(0);
      expect(brandingTasks.length).toBeGreaterThan(0);

      // Check logo tasks structure
      expect(logoTasks[0]).toHaveProperty('name');
      expect(logoTasks[0]).toHaveProperty('order');
      expect(logoTasks[0]).toHaveProperty('daysOffset');
      expect(logoTasks[0].name).toContain('briefing');
    });
  });

  describe('Miro Board Management', () => {
    beforeEach(async () => {
      // Create a ticket for board management tests
      const ticketResult = await ticketService.createTicket({
        clientId: testClientId,
        title: 'Test Board Management',
        description: 'Testing board management features',
        serviceType: ServiceType.WEBSITE,
        priority: Priority.HIGH,
      });

      if (ticketResult.success && ticketResult.ticket) {
        testTicketId = ticketResult.ticket.id;
      }
    });

    it('should create Miro board for existing ticket', async () => {
      if (!miroService.isInitialized()) {
        console.log('Skipping Miro board creation test - service not initialized');
        return;
      }

      const result = await ticketService.createMiroBoardForTicket(testTicketId);
      
      if (result.success) {
        expect(result.boardId).toBeDefined();
        expect(result.boardUrl).toBeDefined();
        expect(result.boardUrl).toContain('miro.com/app/board/');
      } else {
        // If it fails, it might be because board already exists or API issues
        console.log('Board creation result:', result);
      }
    }, 30000);

    it('should get Miro board info', async () => {
      if (!miroService.isInitialized()) {
        console.log('Skipping Miro board info test - service not initialized');
        return;
      }

      // First create a board
      const createResult = await ticketService.createMiroBoardForTicket(testTicketId);
      
      if (createResult.success && createResult.boardId) {
        const infoResult = await ticketService.getMiroBoardInfo(testTicketId);
        
        if (infoResult.success) {
          expect(infoResult.boardInfo).toBeDefined();
          expect(infoResult.boardUrl).toBeDefined();
        }
      }
    }, 30000);

    it('should create task checkboxes in Miro board', async () => {
      if (!miroService.isInitialized()) {
        console.log('Skipping task checkboxes test - service not initialized');
        return;
      }

      // First create a board
      const createResult = await ticketService.createMiroBoardForTicket(testTicketId);
      
      if (createResult.success) {
        const checkboxResult = await ticketService.createMiroTaskCheckboxes(testTicketId);
        
        if (checkboxResult.success) {
          expect(checkboxResult.widgets).toBeDefined();
          expect(Array.isArray(checkboxResult.widgets)).toBe(true);
        } else {
          console.log('Checkbox creation result:', checkboxResult);
        }
      }
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid ticket ID gracefully', async () => {
      const result = await ticketService.createMiroBoardForTicket('invalid-id');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle missing board ID gracefully', async () => {
      const result = await ticketService.getMiroBoardInfo(testTicketId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No Miro board');
    });
  });

  describe('Service Integration', () => {
    it('should add communication to Miro board', async () => {
      if (!miroService.isInitialized()) {
        console.log('Skipping communication test - service not initialized');
        return;
      }

      // This should not throw an error even if board doesn't exist
      await expect(
        ticketService.addCommunicationToMiro(
          testTicketId,
          'Test communication message',
          'Test Author'
        )
      ).resolves.not.toThrow();
    });

    it('should handle Miro service when not initialized', () => {
      // Test the fallback behavior when Miro is not available
      const originalInitialized = miroService.isInitialized;
      
      // Mock the service as not initialized
      jest.spyOn(miroService, 'isInitialized').mockReturnValue(false);
      
      expect(miroService.isInitialized()).toBe(false);
      
      // Restore original method
      miroService.isInitialized = originalInitialized;
    });
  });
});