#!/usr/bin/env ts-node

/**
 * Script para configurar webhooks do Miro para Make.com
 * Execute com: npx ts-node scripts/setup-make-webhooks.ts
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupMakeWebhooks() {
  console.log('🔄 Configurando Webhooks para Make.com\n');

  const MIRO_TOKEN = process.env.MIRO_ACCESS_TOKEN;

  if (!MIRO_TOKEN) {
    console.error('❌ MIRO_ACCESS_TOKEN não encontrado no .env');
    return;
  }

  console.log('📋 Instruções para Make.com:');
  console.log('1. Acesse https://www.make.com/');
  console.log('2. Crie uma conta gratuita');
  console.log('3. Crie um novo cenário');
  console.log('4. Adicione "Webhooks" → "Custom webhook"');
  console.log('5. Copie a URL gerada pelo Make.com');
  console.log('6. Cole a URL abaixo quando solicitado\n');

  // Solicitar URL do Make.com
  const makeWebhookUrl = await promptForInput('Cole a URL do webhook do Make.com: ');

  if (!makeWebhookUrl || !makeWebhookUrl.includes('hook.') || !makeWebhookUrl.includes('make.com')) {
    console.error('❌ URL inválida. Deve ser algo como: https://hook.eu1.make.com/abc123');
    return;
  }

  try {
    // Configurar webhook no Miro
    console.log('🎨 Configurando webhook no Miro...');
    
    const webhookData = {
      callbackUrl: makeWebhookUrl,
      eventTypes: ['BOARD_CONTENT_UPDATED']
    };

    const response = await axios.post('https://api.miro.com/v2/webhooks', webhookData, {
      headers: {
        'Authorization': `Bearer ${MIRO_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook do Miro configurado com sucesso!');
    console.log(`ID: ${(response.data as any).id}`);
    console.log(`URL: ${(response.data as any).callbackUrl}`);
    console.log(`Status: ${(response.data as any).status}`);

    console.log('\n🎯 Próximos passos no Make.com:');
    console.log('1. Adicione um módulo "Todoist" → "Create a Task"');
    console.log('2. Conecte com seu token Todoist');
    console.log('3. Configure:');
    console.log('   - Project: Escolha um projeto');
    console.log('   - Content: {{data.plainText}} (do webhook)');
    console.log('4. Salve e ative o cenário');

    console.log('\n🧪 Para testar:');
    console.log('1. Abra um board no Miro');
    console.log('2. Crie um sticky note com texto');
    console.log('3. Verifique se apareceu no Todoist');

    console.log('\n📊 Monitoramento:');
    console.log('- Make.com → Scenarios → Seu cenário → Execution history');

  } catch (error: any) {
    console.error('❌ Erro ao configurar webhook:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Possíveis soluções:');
      console.log('- Verifique se a URL do Make.com está correta');
      console.log('- Certifique-se de que o webhook do Make.com está ativo');
      console.log('- Teste a URL manualmente primeiro');
    }
  }
}

// Função para solicitar input do usuário
function promptForInput(question: string): Promise<string> {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  setupMakeWebhooks()
    .then(() => {
      console.log('\n✅ Configuração concluída');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro:', error);
      process.exit(1);
    });
}

export { setupMakeWebhooks };