import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient, ServiceType } from '@prisma/client';
import app from '../../src/index';
import { ClientService } from '../../src/services/client.service';
import { TicketService } from '../../src/services/ticket.service';

describe('Webhook Integration Tests', () => {
  let prisma: PrismaClient;
  let clientService: ClientService;
  let ticketService: TicketService;
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
    clientService = new ClientService();
    ticketService = new TicketService();
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
    // Create test client and ticket
    const clientResult = await clientService.registerClient({
      name: 'Test Client Webhook',
      email: 'test-webhook@example.com',
      password: 'testpassword123',
      phone: '+1234567890',
    });

    if (clientResult.success && clientResult.client) {
      testClientId = clientResult.client.id;

      const ticketResult = await ticketService.createTicket({
        clientId: testClientId,
        title: 'Test Webhook Ticket',
        description: 'Testing webhook functionality',
        serviceType: ServiceType.LOGO,
      });

      if (ticketResult.success && ticketResult.ticket) {
        testTicketId = ticketResult.ticket.id;
      }
    }
  });

  describe('Webhook Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/webhooks/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Miro Webhook Handler', () => {
    it('should accept valid Miro webhook payload', async () => {
      const webhookPayload = {
        type: 'item_updated',
        data: {
          item: {
            id: 'test-item-id',
            type: 'shape',
            data: {
              content: '☑ Test task completed'
            }
          },
          board: {
            id: 'test-board-id'
          }
        }
      };

      const response = await request(app)
        .post('/api/webhooks/miro')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('processed successfully');
    });

    it('should reject invalid Miro webhook payload', async () => {
      const invalidPayload = {
        invalid: 'payload'
      };

      const response = await request(app)
        .post('/api/webhooks/miro')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid webhook payload');
    });

    it('should handle Miro task checkbox updates', async () => {
      const taskUpdatePayload = {
        type: 'item_updated',
        data: {
          item: {
            id: 'checkbox-widget-id',
            type: 'shape',
            data: {
              content: '☑ Análise do briefing'
            }
          },
          board: {
            id: 'test-board-id'
          }
        }
      };

      const response = await request(app)
        .post('/api/webhooks/miro')
        .send(taskUpdatePayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle Miro item creation events', async () => {
      const itemCreatedPayload = {
        type: 'item_created',
        data: {
          item: {
            id: 'new-item-id',
            type: 'sticky_note',
            data: {
              content: 'New client feedback'
            }
          },
          board: {
            id: 'test-board-id'
          }
        }
      };

      const response = await request(app)
        .post('/api/webhooks/miro')
        .send(itemCreatedPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Todoist Webhook Handler', () => {
    it('should accept Todoist webhook payload', async () => {
      const todoistPayload = {
        event_name: 'item:completed',
        event_data: {
          id: 'test-task-id',
          content: 'Test task',
          checked: true
        }
      };

      const response = await request(app)
        .post('/api/webhooks/todoist')
        .send(todoistPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('not yet implemented');
    });
  });

  describe('Webhook Events API', () => {
    beforeEach(async () => {
      // Create some test webhook events
      const testPayload = {
        type: 'test_event',
        data: { test: 'data' }
      };

      await request(app)
        .post('/api/webhooks/miro')
        .send(testPayload);
    });

    it('should retrieve webhook events', async () => {
      const response = await request(app)
        .get('/api/webhooks/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toBeDefined();
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.total).toBeDefined();
    });

    it('should filter webhook events by source', async () => {
      const response = await request(app)
        .get('/api/webhooks/events?source=MIRO')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toBeDefined();
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/webhooks/events?limit=10&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in webhook', async () => {
      const response = await request(app)
        .post('/api/webhooks/miro')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing webhook data', async () => {
      const response = await request(app)
        .post('/api/webhooks/miro')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});