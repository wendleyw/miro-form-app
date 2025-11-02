#!/usr/bin/env ts-node

/**
 * Teste em tempo real da sincronização Todoist ↔ Miro
 * Execute com: npx ts-node scripts/test-sync-realtime.ts
 */

import { miroService } from '../src/services/miro.service';
import { syncService } from '../src/services/sync.service';

async function testRealTimeSync() {
  console.log('🔄 Teste de Sincronização em Tempo Real\n');

  // Verificar se os serviços estão funcionando
  console.log('📋 Verificando serviços...');
  const miroReady = miroService.isInitialized();
  const syncHealth = await syncService.healthCheck();
  
  console.log(`Miro: ${miroReady ? '✅ Conectado' : '❌ Desconectado'}`);
  console.log(`Sync Service: ${syncHealth.status === 'healthy' ? '✅ Saudável' : '⚠️ ' + syncHealth.status}`);

  if (!miroReady) {
    console.log('\n⚠️ Miro não está conectado. Verifique o token MIRO_ACCESS_TOKEN no .env');
    console.log('Continuando com simulação...\n');
  }

  // Simular criação de projeto e tarefas
  console.log('📋 Criando projeto de teste...');
  const testProjectId = `test-project-${Date.now()}`;
  const testTasks = [
    { id: 'task-1', name: 'Análise do briefing', completed: false },
    { id: 'task-2', name: 'Pesquisa de referências', completed: false },
    { id: 'task-3', name: 'Criação de conceitos', completed: false }
  ];

  console.log(`✅ Projeto criado: ${testProjectId}`);
  console.log(`✅ ${testTasks.length} tarefas criadas\n`);

  // Teste 1: Miro → Todoist
  console.log('🔄 Teste 1: Simulando mudança no Miro...');
  const task1 = testTasks[0];
  
  console.log(`Marcando "${task1.name}" como concluída no Miro`);
  
  const syncResult1 = await syncService.syncTaskCompletion({
    taskMappingId: task1.id,
    completed: true,
    taskName: task1.name,
    source: 'miro'
  });

  if (syncResult1.success) {
    console.log('✅ Sincronização Miro → Todoist bem-sucedida');
  } else {
    console.log(`❌ Falha na sincronização: ${syncResult1.error}`);
  }

  await sleep(2000);

  // Teste 2: Todoist → Miro
  console.log('\n🔄 Teste 2: Simulando mudança no Todoist...');
  const task2 = testTasks[1];
  
  console.log(`Marcando "${task2.name}" como concluída no Todoist`);
  
  const syncResult2 = await syncService.syncTaskCompletion({
    taskMappingId: task2.id,
    completed: true,
    taskName: task2.name,
    source: 'todoist'
  });

  if (syncResult2.success) {
    console.log('✅ Sincronização Todoist → Miro bem-sucedida');
  } else {
    console.log(`❌ Falha na sincronização: ${syncResult2.error}`);
  }

  await sleep(2000);

  // Teste 3: Comunicação
  console.log('\n🔄 Teste 3: Sincronizando comunicação...');
  
  const commResult = await syncService.syncCommunication({
    ticketId: testProjectId,
    message: 'Primeira versão do logo está pronta para revisão!',
    author: 'Designer',
    source: 'miro'
  });

  if (commResult.success) {
    console.log('✅ Sincronização de comunicação bem-sucedida');
  } else {
    console.log(`❌ Falha na sincronização de comunicação: ${commResult.error}`);
  }

  await sleep(2000);

  // Teste 4: Status do ticket
  console.log('\n🔄 Teste 4: Sincronizando status do ticket...');
  
  const statusResult = await syncService.syncTicketStatus(
    testProjectId,
    'IN_REVIEW',
    'miro'
  );

  if (statusResult.success) {
    console.log('✅ Sincronização de status bem-sucedida');
  } else {
    console.log(`❌ Falha na sincronização de status: ${statusResult.error}`);
  }

  await sleep(2000);

  // Estatísticas finais
  console.log('\n📊 Estatísticas finais:');
  const stats = await syncService.getSyncStatistics(testProjectId);
  console.log(`Total de tarefas: ${stats.totalTasks}`);
  console.log(`Tarefas concluídas: ${stats.completedTasks}`);
  console.log(`Última sincronização: ${stats.lastSyncTime?.toLocaleString('pt-BR') || 'Nunca'}`);
  console.log(`Erros: ${stats.syncErrors}`);

  console.log('\n🎉 Teste concluído!');
  
  // Instruções para teste real
  console.log('\n📝 Para testar com dados reais:');
  console.log('1. Configure o MIRO_ACCESS_TOKEN no arquivo .env');
  console.log('2. Crie um board no Miro manualmente');
  console.log('3. Configure webhooks no Miro apontando para seu servidor');
  console.log('4. Use a API para criar projetos reais');
  console.log('5. Faça mudanças no Miro e observe a sincronização');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Executar se chamado diretamente
if (require.main === module) {
  testRealTimeSync()
    .then(() => {
      console.log('\n✅ Teste finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro no teste:', error);
      process.exit(1);
    });
}

export { testRealTimeSync };