#!/usr/bin/env ts-node

/**
 * Manual webhook test script
 * Run with: npx ts-node scripts/test-webhook.ts
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testWebhooks() {
  console.log('🔗 Testing Webhook Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('📋 Test 1: Webhook Health Check');
    const healthResponse = await axios.get(`${BASE_URL}/api/webhooks/health`);
    console.log('✅ Health check response:', healthResponse.data);

    // Test 2: Miro webhook - task completion
    console.log('\n📋 Test 2: Miro Webhook - Task Completion');
    const miroTaskPayload = {
      type: 'item_updated',
      data: {
        item: {
          id: 'test-checkbox-widget-123',
          type: 'shape',
          data: {
            content: '☑ Análise do briefing'
          }
        },
        board: {
          id: 'test-board-456'
        }
      }
    };

    const miroResponse = await axios.post(`${BASE_URL}/api/webhooks/miro`, miroTaskPayload);
    console.log('✅ Miro webhook response:', miroResponse.data);

    // Test 3: Miro webhook - new sticky note
    console.log('\n📋 Test 3: Miro Webhook - New Sticky Note');
    const miroStickyPayload = {
      type: 'item_created',
      data: {
        item: {
          id: 'sticky-note-789',
          type: 'sticky_note',
          data: {
            content: 'Cliente adorou o conceito inicial! Vamos seguir com esta direção.'
          }
        },
        board: {
          id: 'test-board-456'
        }
      }
    };

    const miroStickyResponse = await axios.post(`${BASE_URL}/api/webhooks/miro`, miroStickyPayload);
    console.log('✅ Miro sticky note response:', miroStickyResponse.data);

    // Test 4: Todoist webhook
    console.log('\n📋 Test 4: Todoist Webhook');
    const todoistPayload = {
      event_name: 'item:completed',
      event_data: {
        id: 'todoist-task-123',
        content: 'Análise do briefing',
        checked: true,
        project_id: 'project-456'
      }
    };

    const todoistResponse = await axios.post(`${BASE_URL}/api/webhooks/todoist`, todoistPayload);
    console.log('✅ Todoist webhook response:', todoistResponse.data);

    // Test 5: Get webhook events
    console.log('\n📋 Test 5: Get Webhook Events');
    const eventsResponse = await axios.get(`${BASE_URL}/api/webhooks/events?limit=5`);
    console.log('✅ Webhook events response:', eventsResponse.data);
    
    if (eventsResponse.data.events && eventsResponse.data.events.length > 0) {
      console.log('\nRecent webhook events:');
      eventsResponse.data.events.slice(0, 3).forEach((event: any, index: number) => {
        console.log(`  ${index + 1}. ${event.source} - ${event.eventType} (${event.createdAt})`);
      });
    }

    // Test 6: Filter events by source
    console.log('\n📋 Test 6: Filter Events by Source');
    const miroEventsResponse = await axios.get(`${BASE_URL}/api/webhooks/events?source=MIRO&limit=3`);
    console.log('✅ Miro events count:', miroEventsResponse.data.total);

    // Test 7: Invalid webhook payload
    console.log('\n📋 Test 7: Invalid Webhook Payload');
    try {
      await axios.post(`${BASE_URL}/api/webhooks/miro`, { invalid: 'payload' });
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid payload correctly rejected:', error.response.data);
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All webhook tests completed successfully!');
    
    console.log('\n📝 Webhook URLs for external services:');
    console.log(`Miro webhook URL: ${BASE_URL}/api/webhooks/miro`);
    console.log(`Todoist webhook URL: ${BASE_URL}/api/webhooks/todoist`);
    
    console.log('\n📋 To set up webhooks:');
    console.log('1. In Miro: Go to your app settings and add the webhook URL');
    console.log('2. In Todoist: Set up webhooks in your app configuration');
    console.log('3. Make sure your server is accessible from the internet (use ngrok for local testing)');

  } catch (error: any) {
    console.error('\n❌ Webhook test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure your server is running on port 3001');
      console.error('Run: npm run dev');
    }
  }
}

// Simulate a series of webhook events for testing
async function simulateWebhookSequence() {
  console.log('\n🎬 Simulating Webhook Sequence...\n');

  const events = [
    {
      name: 'Project Started',
      payload: {
        type: 'item_created',
        data: {
          item: {
            id: 'project-start-note',
            type: 'sticky_note',
            data: { content: 'Projeto iniciado! Vamos começar com a análise do briefing.' }
          },
          board: { id: 'project-board-123' }
        }
      }
    },
    {
      name: 'Task 1 Completed',
      payload: {
        type: 'item_updated',
        data: {
          item: {
            id: 'task-1-checkbox',
            type: 'shape',
            data: { content: '☑ Análise do briefing' }
          },
          board: { id: 'project-board-123' }
        }
      }
    },
    {
      name: 'Client Feedback',
      payload: {
        type: 'item_created',
        data: {
          item: {
            id: 'client-feedback-note',
            type: 'sticky_note',
            data: { content: 'Cliente aprovou o briefing. Podemos prosseguir para a pesquisa.' }
          },
          board: { id: 'project-board-123' }
        }
      }
    },
    {
      name: 'Task 2 Started',
      payload: {
        type: 'item_updated',
        data: {
          item: {
            id: 'task-2-checkbox',
            type: 'shape',
            data: { content: '☐ Pesquisa e moodboard' }
          },
          board: { id: 'project-board-123' }
        }
      }
    }
  ];

  for (const event of events) {
    console.log(`📤 Sending: ${event.name}`);
    try {
      const response = await axios.post(`${BASE_URL}/api/webhooks/miro`, event.payload);
      console.log(`✅ ${event.name} processed successfully`);
    } catch (error: any) {
      console.error(`❌ ${event.name} failed:`, error.message);
    }
    
    // Wait a bit between events
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ Webhook sequence simulation completed');
}

// Run tests if this script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--sequence')) {
    simulateWebhookSequence()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Sequence simulation failed:', error);
        process.exit(1);
      });
  } else {
    testWebhooks()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Webhook tests failed:', error);
        process.exit(1);
      });
  }
}

export { testWebhooks, simulateWebhookSequence };