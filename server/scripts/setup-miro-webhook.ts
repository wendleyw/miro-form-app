#!/usr/bin/env ts-node

/**
 * Script para configurar webhook do Miro automaticamente
 * Execute com: npx ts-node scripts/setup-miro-webhook.ts
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupMiroWebhook() {
  console.log('🎨 Configurando Webhook do Miro...\n');

  const MIRO_TOKEN = process.env.MIRO_ACCESS_TOKEN;
  const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:3001';
  const BOARD_ID = process.env.MIRO_BOARD_ID; // Opcional: ID de um board específico

  if (!MIRO_TOKEN) {
    console.error('❌ MIRO_ACCESS_TOKEN não encontrado no .env');
    console.log('\n💡 Para configurar:');
    console.log('1. Acesse https://developers.miro.com/');
    console.log('2. Crie um app e obtenha o Access Token');
    console.log('3. Adicione MIRO_ACCESS_TOKEN=seu_token no .env');
    console.log('4. Configure WEBHOOK_BASE_URL=https://sua-url.ngrok.io no .env');
    return;
  }

  try {
    // Listar webhooks existentes
    console.log('📋 Verificando webhooks existentes...');
    const listResponse = await axios.get('https://api.miro.com/v2/webhooks', {
      headers: {
        'Authorization': `Bearer ${MIRO_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const existingWebhooks = (listResponse.data as any).data || [];
    console.log(`Encontrados ${existingWebhooks.length} webhooks existentes`);

    // Verificar se já existe um webhook para nossa URL
    const ourWebhookUrl = `${WEBHOOK_URL}/api/webhooks/miro`;
    const existingWebhook = existingWebhooks.find((wh: any) => wh.callbackUrl === ourWebhookUrl);

    if (existingWebhook) {
      console.log('⚠️ Webhook já existe para esta URL:');
      console.log(`ID: ${existingWebhook.id}`);
      console.log(`Status: ${existingWebhook.status}`);
      console.log(`Eventos: ${existingWebhook.eventTypes?.join(', ') || 'N/A'}`);
      
      console.log('\n🤔 Deseja recriar o webhook? (y/N)');
      // Para automação, vamos pular a confirmação
      console.log('Mantendo webhook existente...');
      return;
    }

    // Configurar novo webhook
    const webhookData = {
      callbackUrl: ourWebhookUrl,
      eventTypes: [
        'BOARD_CONTENT_UPDATED'
      ]
    };

    // Adicionar boardId se especificado
    if (BOARD_ID) {
      (webhookData as any).boardId = BOARD_ID;
      console.log(`🎯 Configurando para board específico: ${BOARD_ID}`);
    } else {
      console.log('🌐 Configurando para todos os boards');
    }

    console.log('🔗 Criando webhook...');
    console.log(`URL: ${webhookData.callbackUrl}`);
    console.log(`Eventos: ${webhookData.eventTypes.join(', ')}`);

    const createResponse = await axios.post('https://api.miro.com/v2/webhooks', webhookData, {
      headers: {
        'Authorization': `Bearer ${MIRO_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Webhook do Miro configurado com sucesso!');
    console.log(`ID do Webhook: ${(createResponse.data as any).id}`);
    console.log(`Status: ${(createResponse.data as any).status}`);
    console.log(`URL: ${(createResponse.data as any).callbackUrl}`);
    
    // Salvar ID do webhook no .env (opcional)
    console.log('\n📝 Adicione esta linha ao seu .env (opcional):');
    console.log(`MIRO_WEBHOOK_ID=${(createResponse.data as any).id}`);

    console.log('\n🧪 Para testar o webhook:');
    console.log('1. Certifique-se de que seu servidor está rodando (npm run dev)');
    console.log('2. Abra um board no Miro');
    console.log('3. Adicione ou modifique um card/widget');
    console.log('4. Observe os logs do seu servidor');

    console.log('\n🔍 Para verificar webhooks existentes:');
    console.log(`curl -H "Authorization: Bearer ${MIRO_TOKEN}" https://api.miro.com/v2/webhooks`);

  } catch (error: any) {
    console.error('\n❌ Erro ao configurar webhook do Miro:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Erro: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 401) {
        console.log('\n💡 Dicas para resolver erro 401:');
        console.log('- Verifique se o MIRO_ACCESS_TOKEN está correto');
        console.log('- Certifique-se de que o app tem as permissões necessárias:');
        console.log('  • boards:read');
        console.log('  • boards:write');
        console.log('  • webhooks:read');
        console.log('  • webhooks:write');
        console.log('- Reinstale o app no seu workspace se necessário');
      } else if (error.response.status === 400) {
        console.log('\n💡 Dicas para resolver erro 400:');
        console.log('- Verifique se a URL do webhook está acessível publicamente');
        console.log('- Use ngrok para desenvolvimento: ngrok http 3001');
        console.log('- Configure WEBHOOK_BASE_URL no .env com a URL do ngrok');
      }
    } else {
      console.error(error.message);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupMiroWebhook()
    .then(() => {
      console.log('\n✅ Configuração concluída');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Falha na configuração:', error);
      process.exit(1);
    });
}

export { setupMiroWebhook };