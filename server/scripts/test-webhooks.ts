#!/usr/bin/env ts-node

/**
 * Script para testar se os webhooks estão funcionando
 * Execute com: npx ts-node scripts/test-webhooks.ts
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testWebhooks() {
  console.log('🧪 Testando Webhooks\n');

  const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:3001';
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

  console.log(`Webhook Base URL: ${WEBHOOK_URL}`);
  console.log(`Server URL: ${SERVER_URL}`);

  // Verificar se o servidor está rodando
  console.log('\n📋 1. Verificando se o servidor está rodando...');
  try {
    const healthResponse = await axios.get(`${SERVER_URL}/api/projects/health`);
    console.log('✅ Servidor está rodando');
    console.log(`Status: ${(healthResponse.data as any).health?.status || 'unknown'}`);
  } catch (error) {
    console.error('❌ Servidor não está rodando ou não está acessível');
    console.log('Inicie o servidor com: npm run dev');
    return;
  }

  // Testar endpoint do webhook do Miro
  console.log('\n📋 2. Testando endpoint do webhook do Miro...');
  try {
    const miroTestData = {
      type: 'app_card.updated',
      data: {
        boardId: 'test-board-123',
        widgetId: 'test-widget-456',
        completed: true,
        taskName: 'Teste do webhook',
        timestamp: new Date().toISOString()
      }
    };

    const miroResponse = await axios.post(`${SERVER_URL}/api/webhooks/miro`, miroTestData, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Webhook do Miro está funcionando');
    console.log(`Resposta: ${JSON.stringify(miroResponse.data)}`);
  } catch (error: any) {
    console.error('❌ Webhook do Miro falhou');
    console.error(`Erro: ${error.response?.data || error.message}`);
  }

  // Testar endpoint do webhook do Todoist
  console.log('\n📋 3. Testando endpoint do webhook do Todoist...');
  try {
    const todoistTestData = {
      event_name: 'item:completed',
      event_data: {
        id: 'test-task-789',
        project_id: 'test-project-123',
        content: 'Teste do webhook Todoist',
        checked: 1,
        date_completed: new Date().toISOString()
      }
    };

    const todoistResponse = await axios.post(`${SERVER_URL}/api/webhooks/todoist`, todoistTestData, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Webhook do Todoist está funcionando');
    console.log(`Resposta: ${JSON.stringify(todoistResponse.data)}`);
  } catch (error: any) {
    console.error('❌ Webhook do Todoist falhou');
    console.error(`Erro: ${error.response?.data || error.message}`);
  }

  // Testar saúde dos webhooks
  console.log('\n📋 4. Verificando saúde dos webhooks...');
  try {
    const webhookHealthResponse = await axios.get(`${SERVER_URL}/api/webhooks/health`);
    console.log('✅ Sistema de webhooks está saudável');
    console.log(`Status: ${JSON.stringify(webhookHealthResponse.data, null, 2)}`);
  } catch (error: any) {
    console.error('❌ Verificação de saúde dos webhooks falhou');
    console.error(`Erro: ${error.response?.data || error.message}`);
  }

  // Verificar webhooks configurados no Miro
  console.log('\n📋 5. Verificando webhooks configurados no Miro...');
  const MIRO_TOKEN = process.env.MIRO_ACCESS_TOKEN;
  
  if (MIRO_TOKEN) {
    try {
      const miroWebhooksResponse = await axios.get('https://api.miro.com/v2/webhooks', {
        headers: {
          'Authorization': `Bearer ${MIRO_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const webhooks = (miroWebhooksResponse.data as any).data || [];
      console.log(`✅ Encontrados ${webhooks.length} webhooks no Miro`);
      
      webhooks.forEach((webhook: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${webhook.id}`);
        console.log(`     URL: ${webhook.callbackUrl}`);
        console.log(`     Status: ${webhook.status}`);
        console.log(`     Eventos: ${webhook.events.join(', ')}`);
      });

      // Verificar se nosso webhook está configurado
      const ourWebhookUrl = `${WEBHOOK_URL}/api/webhooks/miro`;
      const ourWebhook = webhooks.find((wh: any) => wh.callbackUrl === ourWebhookUrl);
      
      if (ourWebhook) {
        console.log(`✅ Nosso webhook está configurado (ID: ${ourWebhook.id})`);
      } else {
        console.log('⚠️ Nosso webhook não foi encontrado no Miro');
        console.log(`Esperado: ${ourWebhookUrl}`);
      }

    } catch (error: any) {
      console.error('❌ Erro ao verificar webhooks do Miro');
      console.error(`Erro: ${error.response?.data || error.message}`);
    }
  } else {
    console.log('⚠️ MIRO_ACCESS_TOKEN não configurado, pulando verificação');
  }

  // Verificar webhooks configurados no Todoist
  console.log('\n📋 6. Verificando webhooks configurados no Todoist...');
  const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN;
  
  if (TODOIST_TOKEN) {
    try {
      // Tentar listar webhooks via Sync API
      const todoistWebhooksResponse = await axios.post('https://api.todoist.com/sync/v9/sync', {
        token: TODOIST_TOKEN,
        sync_token: '*',
        resource_types: '["webhooks"]'
      });

      const webhooks = (todoistWebhooksResponse.data as any).webhooks || [];
      console.log(`✅ Encontrados ${webhooks.length} webhooks no Todoist`);
      
      webhooks.forEach((webhook: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${webhook.id}`);
        console.log(`     URL: ${webhook.url}`);
        console.log(`     Eventos: ${webhook.events?.join(', ') || 'Todos'}`);
      });

      // Verificar se nosso webhook está configurado
      const ourWebhookUrl = `${WEBHOOK_URL}/api/webhooks/todoist`;
      const ourWebhook = webhooks.find((wh: any) => wh.url === ourWebhookUrl);
      
      if (ourWebhook) {
        console.log(`✅ Nosso webhook está configurado (ID: ${ourWebhook.id})`);
      } else {
        console.log('⚠️ Nosso webhook não foi encontrado no Todoist');
        console.log(`Esperado: ${ourWebhookUrl}`);
      }

    } catch (error: any) {
      console.error('❌ Erro ao verificar webhooks do Todoist');
      console.error(`Erro: ${error.response?.data || error.message}`);
      console.log('💡 Configure webhooks manualmente em: https://developer.todoist.com/appconsole.html');
    }
  } else {
    console.log('⚠️ TODOIST_API_TOKEN não configurado, pulando verificação');
  }

  // Resumo e próximos passos
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DO TESTE');
  console.log('='.repeat(50));
  
  console.log('\n🔍 URLs dos Webhooks:');
  console.log(`• Miro: ${WEBHOOK_URL}/api/webhooks/miro`);
  console.log(`• Todoist: ${WEBHOOK_URL}/api/webhooks/todoist`);

  console.log('\n🧪 Para testar manualmente:');
  console.log('1. Miro:');
  console.log('   • Abra um board no Miro');
  console.log('   • Adicione ou modifique um card');
  console.log('   • Observe os logs do servidor');
  
  console.log('\n2. Todoist:');
  console.log('   • Abra o Todoist');
  console.log('   • Marque uma tarefa como concluída');
  console.log('   • Observe os logs do servidor');

  console.log('\n🔧 Se os webhooks não estão funcionando:');
  console.log('1. Verifique se a URL está acessível publicamente');
  console.log('2. Use ngrok para desenvolvimento: ngrok http 3001');
  console.log('3. Configure WEBHOOK_BASE_URL no .env');
  console.log('4. Execute: npx ts-node scripts/setup-all-webhooks.ts');

  console.log('\n📚 Documentação:');
  console.log('• Guia completo: server/CONFIGURACAO_WEBHOOKS.md');
  console.log('• Teste de sincronização: npx ts-node scripts/test-bidirectional-sync.ts');
}

// Executar se chamado diretamente
if (require.main === module) {
  testWebhooks()
    .then(() => {
      console.log('\n✅ Teste de webhooks concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro no teste:', error);
      process.exit(1);
    });
}

export { testWebhooks };