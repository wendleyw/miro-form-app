#!/usr/bin/env ts-node

/**
 * Script para configurar webhook do Todoist automaticamente
 * Execute com: npx ts-node scripts/setup-todoist-webhook.ts
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupTodoistWebhook() {
  console.log('📝 Configurando Webhook do Todoist...\n');

  const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN;
  const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:3001';

  if (!TODOIST_TOKEN) {
    console.error('❌ TODOIST_API_TOKEN não encontrado no .env');
    console.log('\n💡 Para configurar:');
    console.log('1. Acesse https://todoist.com/prefs/integrations');
    console.log('2. Role até "API token" e copie o token');
    console.log('3. Adicione TODOIST_API_TOKEN=seu_token no .env');
    console.log('4. Configure WEBHOOK_BASE_URL=https://sua-url.ngrok.io no .env');
    console.log('\n⚠️ Nota: Webhooks do Todoist requerem conta Premium');
    return;
  }

  try {
    // Listar webhooks existentes
    console.log('📋 Verificando webhooks existentes...');
    
    try {
      const listResponse = await axios.post('https://api.todoist.com/sync/v9/sync', {
        token: TODOIST_TOKEN,
        sync_token: '*',
        resource_types: '["webhooks"]'
      });

      const existingWebhooks = listResponse.data.webhooks || [];
      console.log(`Encontrados ${existingWebhooks.length} webhooks existentes`);

      // Verificar se já existe um webhook para nossa URL
      const ourWebhookUrl = `${WEBHOOK_URL}/api/webhooks/todoist`;
      const existingWebhook = existingWebhooks.find((wh: any) => wh.url === ourWebhookUrl);

      if (existingWebhook) {
        console.log('⚠️ Webhook já existe para esta URL:');
        console.log(`ID: ${existingWebhook.id}`);
        console.log(`URL: ${existingWebhook.url}`);
        console.log(`Eventos: ${existingWebhook.events?.join(', ') || 'Todos'}`);
        console.log('Mantendo webhook existente...');
        return;
      }

    } catch (listError) {
      console.log('⚠️ Não foi possível listar webhooks existentes (continuando...)');
    }

    // Configurar novo webhook
    const webhookData = {
      url: `${WEBHOOK_URL}/api/webhooks/todoist`,
      events: [
        'item:added',
        'item:updated', 
        'item:completed',
        'item:uncompleted',
        'project:added',
        'project:updated'
      ]
    };

    console.log('🔗 Criando webhook...');
    console.log(`URL: ${webhookData.url}`);
    console.log(`Eventos: ${webhookData.events.join(', ')}`);

    // Tentar usar a API Sync v9 (método preferido)
    try {
      const createResponse = await axios.post('https://api.todoist.com/sync/v9/sync', {
        token: TODOIST_TOKEN,
        commands: JSON.stringify([{
          type: 'webhook_add',
          uuid: `webhook-${Date.now()}`,
          args: webhookData
        }])
      });

      if (createResponse.data.sync_status) {
        console.log('\n✅ Webhook do Todoist configurado com sucesso!');
        console.log('Resposta:', JSON.stringify(createResponse.data, null, 2));
      } else {
        throw new Error('Falha na criação do webhook via Sync API');
      }

    } catch (syncError) {
      console.log('⚠️ Sync API falhou, tentando REST API...');
      
      // Fallback para REST API (se disponível)
      try {
        const restResponse = await axios.post('https://api.todoist.com/rest/v2/webhooks', webhookData, {
          headers: {
            'Authorization': `Bearer ${TODOIST_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('\n✅ Webhook do Todoist configurado via REST API!');
        console.log(`ID: ${restResponse.data.id}`);
        console.log(`URL: ${restResponse.data.url}`);

      } catch (restError: any) {
        console.error('\n❌ Ambas as APIs falharam. Configuração manual necessária.');
        console.log('\n📋 Configuração Manual:');
        console.log('1. Acesse https://developer.todoist.com/appconsole.html');
        console.log('2. Crie ou selecione seu app');
        console.log('3. Na seção Webhooks, adicione:');
        console.log(`   URL: ${webhookData.url}`);
        console.log(`   Eventos: ${webhookData.events.join(', ')}`);
        
        throw restError;
      }
    }

    console.log('\n📝 Adicione esta linha ao seu .env (opcional):');
    console.log(`TODOIST_WEBHOOK_URL=${webhookData.url}`);

    console.log('\n🧪 Para testar o webhook:');
    console.log('1. Certifique-se de que seu servidor está rodando (npm run dev)');
    console.log('2. Abra o Todoist');
    console.log('3. Crie, modifique ou complete uma tarefa');
    console.log('4. Observe os logs do seu servidor');

    console.log('\n🔍 Para verificar webhooks existentes:');
    console.log('Acesse https://developer.todoist.com/appconsole.html e veja a seção Webhooks');

  } catch (error: any) {
    console.error('\n❌ Erro ao configurar webhook do Todoist:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Erro: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 401) {
        console.log('\n💡 Dicas para resolver erro 401:');
        console.log('- Verifique se o TODOIST_API_TOKEN está correto');
        console.log('- Certifique-se de que tem uma conta Todoist Premium');
        console.log('- Regenere o token se necessário');
      } else if (error.response.status === 403) {
        console.log('\n💡 Dicas para resolver erro 403:');
        console.log('- Webhooks requerem conta Todoist Premium');
        console.log('- Verifique se sua conta tem as permissões necessárias');
      } else if (error.response.status === 400) {
        console.log('\n💡 Dicas para resolver erro 400:');
        console.log('- Verifique se a URL do webhook está acessível publicamente');
        console.log('- Use ngrok para desenvolvimento: ngrok http 3001');
        console.log('- Configure WEBHOOK_BASE_URL no .env com a URL do ngrok');
      }
    } else {
      console.error(error.message);
    }

    console.log('\n📋 Configuração Manual Alternativa:');
    console.log('1. Acesse https://developer.todoist.com/appconsole.html');
    console.log('2. Crie ou selecione seu app');
    console.log('3. Configure o webhook manualmente na interface');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupTodoistWebhook()
    .then(() => {
      console.log('\n✅ Configuração concluída');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Falha na configuração:', error.message);
      process.exit(1);
    });
}

export { setupTodoistWebhook };