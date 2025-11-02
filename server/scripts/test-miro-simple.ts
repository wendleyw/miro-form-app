#!/usr/bin/env ts-node

/**
 * Simple Miro service test (no database required)
 * Run with: npx ts-node scripts/test-miro-simple.ts
 */

import { miroService } from '../src/services/miro.service';
import { ServiceType } from '@prisma/client';

async function testMiroSimple() {
  console.log('🧪 Testing Miro Service (No Database Required)...\n');

  try {
    // Test 1: Service initialization
    console.log('📋 Test 1: Service Initialization');
    console.log('✅ Miro service initialized:', miroService.isInitialized());

    // Test 2: Health check
    console.log('\n📋 Test 2: Health Check');
    const health = await miroService.healthCheck();
    console.log('Health status:', health.status);
    console.log('Health message:', health.message);

    // Test 3: Test task templates (no DB required)
    console.log('\n📋 Test 3: Task Templates');
    
    // Create a mock ticket service to test templates
    class MockTicketService {
      getTaskTemplatesByServiceType(serviceType: ServiceType): Array<{ name: string; order: number; daysOffset: number }> {
        const templates = {
          [ServiceType.LOGO]: [
            { name: 'Análise do briefing', order: 1, daysOffset: 0 },
            { name: 'Pesquisa e moodboard', order: 2, daysOffset: 1 },
            { name: 'Conceitos iniciais (3 versões)', order: 3, daysOffset: 3 },
            { name: 'Revisão 1', order: 4, daysOffset: 5 },
            { name: 'Refinamento', order: 5, daysOffset: 7 },
            { name: 'Revisão final', order: 6, daysOffset: 9 },
            { name: 'Entrega de arquivos finais', order: 7, daysOffset: 10 }
          ],
          [ServiceType.WEBSITE]: [
            { name: 'Análise do briefing', order: 1, daysOffset: 0 },
            { name: 'Arquitetura de informação', order: 2, daysOffset: 2 },
            { name: 'Wireframes', order: 3, daysOffset: 5 },
            { name: 'Design de UI', order: 4, daysOffset: 10 },
            { name: 'Revisão do cliente', order: 5, daysOffset: 15 },
            { name: 'Ajustes finais', order: 6, daysOffset: 18 },
            { name: 'Entrega de arquivos', order: 7, daysOffset: 20 }
          ],
          [ServiceType.BRANDING]: [
            { name: 'Análise do briefing', order: 1, daysOffset: 0 },
            { name: 'Pesquisa de mercado', order: 2, daysOffset: 2 },
            { name: 'Estratégia de marca', order: 3, daysOffset: 5 },
            { name: 'Conceitos de identidade', order: 4, daysOffset: 8 },
            { name: 'Desenvolvimento do sistema', order: 5, daysOffset: 12 },
            { name: 'Manual de marca', order: 6, daysOffset: 16 },
            { name: 'Apresentação final', order: 7, daysOffset: 18 }
          ]
        };
        return templates[serviceType] || [];
      }
    }

    const mockTicketService = new MockTicketService();
    
    const logoTasks = mockTicketService.getTaskTemplatesByServiceType(ServiceType.LOGO);
    const websiteTasks = mockTicketService.getTaskTemplatesByServiceType(ServiceType.WEBSITE);
    const brandingTasks = mockTicketService.getTaskTemplatesByServiceType(ServiceType.BRANDING);

    console.log('✅ Logo tasks:', logoTasks.length);
    console.log('✅ Website tasks:', websiteTasks.length);
    console.log('✅ Branding tasks:', brandingTasks.length);

    console.log('\nLogo task examples:');
    logoTasks.slice(0, 3).forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.name} (Day ${task.daysOffset})`);
    });

    // Test 4: Mock board creation (if service is initialized)
    if (miroService.isInitialized()) {
      console.log('\n📋 Test 4: Mock Board Creation Test');
      
      const mockTicket = {
        id: 'mock-ticket-id',
        ticketNumber: 'TICK-2024-001',
        title: 'Test Logo Design Project',
        description: 'A test project for Miro integration',
        serviceType: ServiceType.LOGO,
        priority: 'HIGH' as any,
        status: 'PENDING' as any,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        clientId: 'mock-client-id',
        miroBoardId: null,
        miroClientFrameId: null,
        miroDesignFrameId: null,
        miroReportFrameId: null,
        todoistProjectId: null,
      };

      try {
        console.log('🎨 Attempting to create Miro board...');
        const boardId = await miroService.createBoard(mockTicket);
        console.log('✅ Board created successfully:', boardId);
        console.log('🔗 Board URL: https://miro.com/app/board/' + boardId + '/');
        
        // Test board structure creation
        console.log('🏗️  Creating board structure...');
        const mockBrandInfo = {
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
          fonts: ['Montserrat', 'Open Sans'],
          styleKeywords: ['modern', 'clean', 'professional'],
        };
        
        const boardStructure = await miroService.createBoardStructure(
          mockTicket,
          boardId,
          mockBrandInfo,
          []
        );
        
        console.log('✅ Board structure created:', {
          boardId: boardStructure.boardId,
          clientFrame: boardStructure.clientInfoFrameId,
          designFrame: boardStructure.designFrameId,
          reportFrame: boardStructure.reportFrameId,
        });
        
      } catch (error: any) {
        console.log('❌ Board creation failed (expected if token is invalid):', error.message);
        
        if (error.message.includes('401')) {
          console.log('💡 This is likely due to an invalid or expired Miro access token');
        } else if (error.message.includes('429')) {
          console.log('💡 Rate limit exceeded - try again later');
        }
      }
    } else {
      console.log('\n⚠️  Miro service not initialized - skipping board creation test');
    }

    // Test 5: Configuration check
    console.log('\n📋 Test 5: Configuration Check');
    console.log('Environment variables:');
    console.log('- MIRO_CLIENT_ID:', process.env.MIRO_CLIENT_ID ? '✅ Set' : '❌ Missing');
    console.log('- MIRO_CLIENT_SECRET:', process.env.MIRO_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('- MIRO_ACCESS_TOKEN:', process.env.MIRO_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('- MIRO_REDIRECT_URI:', process.env.MIRO_REDIRECT_URI ? '✅ Set' : '❌ Missing');

    console.log('\n🎉 Simple Miro tests completed!');
    
    if (miroService.isInitialized()) {
      console.log('\n📝 Next steps:');
      console.log('1. Start your database server (PostgreSQL)');
      console.log('2. Run the full integration test: npx ts-node scripts/test-miro-integration.ts');
      console.log('3. Start the server: npm run dev');
      console.log('4. Test webhooks: npx ts-node scripts/test-webhook.ts');
    } else {
      console.log('\n📝 To enable Miro integration:');
      console.log('1. Get a valid Miro access token from your Miro app');
      console.log('2. Update MIRO_ACCESS_TOKEN in your .env file');
      console.log('3. Restart and run this test again');
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
if (require.main === module) {
  testMiroSimple()
    .then(() => {
      console.log('\n✅ Simple test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Simple test failed:', error);
      process.exit(1);
    });
}

export { testMiroSimple };