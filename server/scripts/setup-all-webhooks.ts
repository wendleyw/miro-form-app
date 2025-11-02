#!/usr/bin/env ts-node

/**
 * Script para configurar todos os webhooks (Miro + Todoist)
 * Execute com: npx ts-node scripts/setup-all-webhooks.ts
 */

import { setupMiroWebhook } from './setup-miro-webhook';
import { setupTodoistWebhook } from './setup-todoist-webhook';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupAllWebhooks() {
  console.log('🔗 Configurando Todos os Webhooks\n');
  console.log('='.repeat(50));

  const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:3001';
  const MIRO_TOKEN = process.env.MIRO_ACCESS_TOKEN;
  const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN;

  // Verificar configurações básicas
  console.log('📋 Verificando configurações...');
  console.log(`Webhook Base URL: ${WEBHOOK_URL}`);
  console.log(`Miro Token: ${MIRO_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`Todoist Token: ${TODOIST_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);

  if (WEBHOOK_URL.includes('localhost')) {
    console.log('\n⚠️ AVISO: Você está usando localhost!');
    console.log('Para webhooks funcionarem, você precisa de uma URL pública.');
    console.log('Use ngrok para desenvolvimento:');
    console.log('  1. npm install -g ngrok');
    console.log('  2. ngrok http 3001');
    console.log('  3. Configure WEBHOOK_BASE_URL no .env com a URL HTTPS do ngrok');
    console.log('\nContinuando mesmo assim...\n');
  }

  let miroSuccess = false;
  let todoistSuccess = false;

  // Configurar webhook do Miro
  if (MIRO_TOKEN) {
    try {
      console.log('\n' + '='.repeat(50));
      await setupMiroWebhook();
      miroSuccess = true;
    } catch (error) {
      console.error('❌ Falha na configuração do webhook do Miro');
      miroSuccess = false;
    }
  } else {
    console.log('\n⚠️ Pulando configuração do Miro (token não encontrado)');
  }

  // Configurar webhook do Todoist
  if (TODOIST_TOKEN) {
    try {
      console.log('\n' + '='.repeat(50));
      await setupTodoistWebhook();
      todoistSuccess = true;
    } catch (error) {
      console.error('❌ Falha na configuração do webhook do Todoist');
      todoistSuccess = false;
    }
  } else {
    console.log('\n⚠️ Pulando configuração do Todoist (token não encontrado)');
  }

  // Resumo final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DA CONFIGURAÇÃO');
  console.log('='.repeat(50));
  
  console.log(`🎨 Miro: ${miroSuccess ? '✅ Configurado' : '❌ Falhou'}`);
  console.log(`📝 Todoist: ${todoistSuccess ? '✅ Configurado' : '❌ Falhou'}`);

  if (miroSuccess || todoistSuccess) {
    console.log('\n🎉 Pelo menos um webhook foi configurado com sucesso!');
    
    console.log('\n🧪 PRÓXIMOS PASSOS:');
    console.log('1. Inicie seu servidor:');
    console.log('   npm run dev');
    
    console.log('\n2. Teste os webhooks:');
    if (miroSuccess) {
      console.log('   • Abra um board no Miro e modifique um card');
    }
    if (todoistSuccess) {
      console.log('   • Abra o Todoist e marque uma tarefa como concluída');
    }
    
    console.log('\n3. Monitore os logs do servidor para ver os eventos');
    
    console.log('\n4. Teste a sincronização completa:');
    console.log('   npx ts-node scripts/test-bidirectional-sync.ts');

    console.log('\n🔍 VERIFICAÇÃO:');
    console.log('• Endpoints dos webhooks:');
    console.log(`  - Miro: ${WEBHOOK_URL}/api/webhooks/miro`);
    console.log(`  - Todoist: ${WEBHOOK_URL}/api/webhooks/todoist`);
    
    console.log('\n• Teste manual com curl:');
    console.log(`  curl -X POST ${WEBHOOK_URL}/api/webhooks/miro -H "Content-Type: application/json" -d '{"test": true}'`);
    console.log(`  curl -X POST ${WEBHOOK_URL}/api/webhooks/todoist -H "Content-Type: application/json" -d '{"test": true}'`);

  } else {
    console.log('\n❌ Nenhum webhook foi configurado com sucesso.');
    console.log('\n💡 SOLUÇÕES:');
    console.log('1. Verifique os tokens no arquivo .env');
    console.log('2. Configure uma URL pública (use ngrok para desenvolvimento)');
    console.log('3. Verifique as permissões dos apps');
    console.log('4. Configure manualmente via interface web se necessário');
  }

  console.log('\n📚 DOCUMENTAÇÃO:');
  console.log('• Guia completo: server/CONFIGURACAO_WEBHOOKS.md');
  console.log('• Miro Developer Console: https://developers.miro.com/');
  console.log('• Todoist App Console: https://developer.todoist.com/appconsole.html');
}

// Executar se chamado diretamente
if (require.main === module) {
  setupAllWebhooks()
    .then(() => {
      console.log('\n✅ Configuração de webhooks concluída');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na configuração:', error);
      process.exit(1);
    });
}

export { setupAllWebhooks };