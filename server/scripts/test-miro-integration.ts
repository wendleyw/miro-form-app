#!/usr/bin/env ts-node

/**
 * Manual test script for Miro integration
 * Run with: npx ts-node scripts/test-miro-integration.ts
 */

import { PrismaClient, ServiceType, Priority } from '@prisma/client';
import { miroService } from '../src/services/miro.service';
import { TicketService } from '../src/services/ticket.service';
import { ClientService } from '../src/services/client.service';
import { syncService } from '../src/services/sync.service';

const prisma = new PrismaClient();

async function testMiroIntegration() {
  console.log('🧪 Starting Miro Integration Tests...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected');

    // Initialize services
    const clientService = new ClientService();
    const ticketService = new TicketService();

    // Test 1: Check Miro service initialization
    console.log('\n📋 Test 1: Miro Service Initialization');
    console.log('Miro service initialized:', miroService.isInitialized());
    
    const health = await miroService.healthCheck();
    console.log('Miro health check:', health);

    if (!miroService.isInitialized()) {
      console.log('⚠️  Miro service not initialized. Check your MIRO_ACCESS_TOKEN in .env');
      console.log('You can still test other functionality, but board creation will be skipped.');
    }

    // Test 2: Create a test client
    console.log('\n📋 Test 2: Creating Test Client');
    const clientResult = await clientService.registerClient({
      name: 'Test Client Miro Integration',
      email: `test-miro-${Date.now()}@example.com`,
      company: 'Test Company',
    });

    const client = clientResult.client;
    console.log('✅ Test client created:', client.id);

    // Test 3: Create a ticket with Miro integration
    console.log('\n📋 Test 3: Creating Ticket with Miro Integration');
    const ticketResult = await ticketService.createTicket({
      clientId: client.id,
      title: 'Test Logo Design Project - Miro Integration',
      description: 'This is a test project to validate Miro integration functionality. It includes brand guidelines and visual references.',
      serviceType: ServiceType.LOGO,
      priority: Priority.HIGH,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      brandInfo: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        fonts: ['Montserrat', 'Open Sans', 'Roboto'],
        styleKeywords: ['modern', 'clean', 'professional', 'minimalist', 'vibrant'],
        logoUrl: 'https://example.com/logo.png',
      },
    });

    if (!ticketResult.success) {
      throw new Error(`Failed to create ticket: ${ticketResult.errors?.[0]?.message || 'Unknown error'}`);
    }

    const ticket = ticketResult.ticket!;
    console.log('✅ Ticket created:', ticket.ticketNumber);
    console.log('📊 Ticket ID:', ticket.id);

    if (ticketResult.miroBoardId) {
      console.log('🎨 Miro board created:', ticketResult.miroBoardId);
      console.log('🔗 Miro board URL:', ticketResult.miroBoardUrl);
    } else {
      console.log('⚠️  No Miro board created (service may not be initialized)');
    }

    // Test 4: Get task templates
    console.log('\n📋 Test 4: Task Templates');
    const logoTasks = ticketService.getTaskTemplatesByServiceType(ServiceType.LOGO);
    const websiteTasks = ticketService.getTaskTemplatesByServiceType(ServiceType.WEBSITE);
    const brandingTasks = ticketService.getTaskTemplatesByServiceType(ServiceType.BRANDING);

    console.log('Logo tasks:', logoTasks.length);
    console.log('Website tasks:', websiteTasks.length);
    console.log('Branding tasks:', brandingTasks.length);

    console.log('\nLogo task examples:');
    logoTasks.slice(0, 3).forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.name} (Day ${task.daysOffset})`);
    });

    // Test 5: Manual Miro board creation (if not created automatically)
    if (miroService.isInitialized() && !ticketResult.miroBoardId) {
      console.log('\n📋 Test 5: Manual Miro Board Creation');
      const boardResult = await ticketService.createMiroBoardForTicket(ticket.id);
      
      if (boardResult.success) {
        console.log('✅ Manual board creation successful');
        console.log('🎨 Board ID:', boardResult.boardId);
        console.log('🔗 Board URL:', boardResult.boardUrl);
      } else {
        console.log('❌ Manual board creation failed:', boardResult.error);
      }
    }

    // Test 6: Get Miro board info
    if (miroService.isInitialized()) {
      console.log('\n📋 Test 6: Get Miro Board Info');
      const boardInfoResult = await ticketService.getMiroBoardInfo(ticket.id);
      
      if (boardInfoResult.success) {
        console.log('✅ Board info retrieved successfully');
        console.log('📊 Board info:', JSON.stringify(boardInfoResult.boardInfo, null, 2));
      } else {
        console.log('❌ Failed to get board info:', boardInfoResult.error);
      }
    }

    // Test 7: Create task checkboxes
    if (miroService.isInitialized()) {
      console.log('\n📋 Test 7: Create Task Checkboxes');
      const checkboxResult = await ticketService.createMiroTaskCheckboxes(ticket.id);
      
      if (checkboxResult.success) {
        console.log('✅ Task checkboxes created successfully');
        console.log('📊 Number of widgets:', checkboxResult.widgets?.length || 0);
        
        if (checkboxResult.widgets && checkboxResult.widgets.length > 0) {
          console.log('First few tasks:');
          checkboxResult.widgets.slice(0, 3).forEach((widget, index) => {
            console.log(`  ${index + 1}. ${widget.taskName} (${widget.id})`);
          });
        }
      } else {
        console.log('❌ Failed to create task checkboxes:', checkboxResult.error);
      }
    }

    // Test 8: Test communication sync
    console.log('\n📋 Test 8: Communication Sync');
    await ticketService.addCommunicationToMiro(
      ticket.id,
      'This is a test communication message from the integration test script.',
      'Test Script'
    );
    console.log('✅ Communication sync test completed');

    // Test 9: Sync service health check
    console.log('\n📋 Test 9: Sync Service Health Check');
    const syncHealth = await syncService.healthCheck();
    console.log('Sync service status:', syncHealth.status);
    console.log('Miro status:', syncHealth.miroStatus);
    console.log('Todoist status:', syncHealth.todoistStatus);
    console.log('Last sync time:', syncHealth.lastSyncTime);

    // Test 10: Get sync statistics
    console.log('\n📋 Test 10: Sync Statistics');
    const syncStats = await syncService.getSyncStatistics(ticket.id);
    console.log('Total tasks:', syncStats.totalTasks);
    console.log('Completed tasks:', syncStats.completedTasks);
    console.log('Last sync time:', syncStats.lastSyncTime);
    console.log('Sync errors:', syncStats.syncErrors);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.ticket.delete({ where: { id: ticket.id } });
    await prisma.client.delete({ where: { id: client.id } });
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All tests completed successfully!');
    
    if (miroService.isInitialized()) {
      console.log('\n📝 Next steps:');
      console.log('1. Check your Miro board at the URL provided above');
      console.log('2. Try updating task checkboxes in Miro to test webhook sync');
      console.log('3. Set up webhook URL in Miro: http://localhost:3001/api/webhooks/miro');
    } else {
      console.log('\n📝 To enable full Miro integration:');
      console.log('1. Get a valid Miro access token from your Miro app');
      console.log('2. Update MIRO_ACCESS_TOKEN in your .env file');
      console.log('3. Restart the server and run this test again');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n📊 Database disconnected');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testMiroIntegration()
    .then(() => {
      console.log('\n✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testMiroIntegration };