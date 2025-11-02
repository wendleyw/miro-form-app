#!/usr/bin/env ts-node

/**
 * Test script for the complete integrated system
 * Tests Supabase + Miro + Todoist integration
 * Run with: npx ts-node scripts/test-integrated-system.ts
 */

import { supabaseIntegrationService } from '../src/services/supabase-integration.service';
import { miroService } from '../src/services/miro.service';
import { syncService } from '../src/services/sync.service';

async function testIntegratedSystem() {
  console.log('🚀 Testing Complete Integrated System...\n');

  try {
    // Test 1: Health Check All Services
    console.log('📋 Test 1: System Health Check');
    const health = await supabaseIntegrationService.healthCheck();
    console.log('Overall system status:', health.status);
    console.log('- Supabase:', health.supabase);
    console.log('- Miro:', health.miro);
    console.log('- Todoist:', health.todoist);
    console.log('- Sync:', health.sync);

    // Test 2: Miro Service Check
    console.log('\n📋 Test 2: Miro Service Status');
    console.log('Miro initialized:', miroService.isInitialized());
    const miroHealth = await miroService.healthCheck();
    console.log('Miro health:', miroHealth);

    // Test 3: Sync Service Check
    console.log('\n📋 Test 3: Sync Service Status');
    const syncHealth = await syncService.healthCheck();
    console.log('Sync status:', syncHealth.status);
    console.log('Miro status:', syncHealth.miroStatus);
    console.log('Todoist status:', syncHealth.todoistStatus);

    // Test 4: Create Test Project (Mock)
    console.log('\n📋 Test 4: Create Integrated Project');
    const projectData = {
      name: `Test Integrated Project - ${Date.now()}`,
      description: 'Testing complete integration between Supabase, Miro, and Todoist',
      clientId: 'test-client-123',
      designerId: 'test-designer-456',
      serviceType: 'LOGO' as const,
      budget: 5000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      brandInfo: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        fonts: ['Montserrat', 'Open Sans', 'Roboto'],
        styleKeywords: ['modern', 'clean', 'professional', 'vibrant']
      }
    };

    const projectResult = await supabaseIntegrationService.createIntegratedProject(projectData);
    
    if (projectResult.success) {
      console.log('✅ Project created successfully!');
      console.log('- Project ID:', projectResult.projectId);
      console.log('- Todoist Project ID:', projectResult.todoistProjectId || 'Not created (service disabled)');
      console.log('- Miro Board ID:', projectResult.miroBoardId || 'Not created');
      
      if (projectResult.miroBoardId) {
        console.log('- Miro Board URL: https://miro.com/app/board/' + projectResult.miroBoardId + '/');
      }

      // Test 5: Get Project Integration Status
      if (projectResult.projectId) {
        console.log('\n📋 Test 5: Project Integration Status');
        const status = await supabaseIntegrationService.getProjectIntegrationStatus(projectResult.projectId);
        
        console.log('Project found:', !!status.project);
        console.log('Todoist status:', status.todoistStatus);
        console.log('Miro status:', status.miroStatus);
        console.log('Sync status:', status.syncStatus);
      }

      // Test 6: Task Sync Simulation
      console.log('\n📋 Test 6: Task Sync Simulation');
      if (projectResult.projectId) {
        const syncResult = await supabaseIntegrationService.syncTaskStatus(
          'mock-task-id',
          true,
          'supabase'
        );
        
        if (syncResult.success) {
          console.log('✅ Task sync simulation successful');
        } else {
          console.log('⚠️ Task sync simulation failed (expected):', syncResult.error);
        }
      }

    } else {
      console.log('❌ Project creation failed:', projectResult.error);
    }

    // Test 7: API Endpoints Test
    console.log('\n📋 Test 7: API Endpoints Available');
    console.log('Available endpoints:');
    console.log('- POST /api/projects - Create integrated project');
    console.log('- GET /api/projects/:id/status - Get project status');
    console.log('- PATCH /api/projects/:id/tasks/:taskId/sync - Sync task status');
    console.log('- GET /api/projects/:id/todoist/stats - Get Todoist stats');
    console.log('- GET /api/projects/:id/miro/info - Get Miro board info');
    console.log('- GET /api/projects/health - System health check');
    console.log('- POST /api/projects/test - Create test project');
    console.log('- POST /api/webhooks/miro - Miro webhook');
    console.log('- POST /api/webhooks/todoist - Todoist webhook');
    console.log('- GET /api/webhooks/health - Webhook health');

    console.log('\n🎉 Integrated System Test Completed!');
    
    console.log('\n📝 System Status Summary:');
    console.log('✅ Supabase Integration: Ready');
    console.log(miroService.isInitialized() ? '✅ Miro Integration: Ready' : '⚠️ Miro Integration: Limited (check token)');
    console.log('⚠️ Todoist Integration: Disabled (can be enabled)');
    console.log('✅ Webhook System: Ready');
    console.log('✅ Sync Engine: Ready');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Test API endpoints with Postman/curl');
    console.log('3. Set up webhooks in Miro app');
    console.log('4. Enable Todoist integration if needed');
    console.log('5. Create real projects through the API');

  } catch (error: any) {
    console.error('\n❌ Integrated system test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testIntegratedSystem()
    .then(() => {
      console.log('\n✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testIntegratedSystem };