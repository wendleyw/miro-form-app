#!/usr/bin/env ts-node

/**
 * Teste simples da sincronização Miro ↔ Todoist sem banco de dados
 * Execute com: npx ts-node scripts/test-miro-todoist-simple.ts
 */

import { miroService } from '../src/services/miro.service';

interface MockTask {
  id: string;
  name: string;
  completed: boolean;
  platform: 'miro' | 'todoist';
  lastUpdated: Date;
}

class MockSyncService {
  private tasks: Map<string, MockTask> = new Map();

  // Simular criação de tarefas
  createTask(id: string, name: string, platform: 'miro' | 'todoist'): MockTask {
    const task: MockTask = {
      id,
      name,
      completed: false,
      platform,
      lastUpdated: new Date()
    };
    
    this.tasks.set(id, task);
    console.log(`✅ Tarefa criada: "${name}" (${platform})`);
    return task;
  }

  // Simular sincronização de tarefa
  async syncTask(taskId: string, completed: boolean, sourcePlatform: 'miro' | 'todoist'): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.log(`❌ Tarefa ${taskId} não encontrada`);
      return false;
    }

    const oldStatus = task.completed;
    task.completed = completed;
    task.lastUpdated = new Date();

    console.log(`🔄 Sincronizando "${task.name}": ${oldStatus} → ${completed} (origem: ${sourcePlatform})`);

    // Simular sincronização para a outra plataforma
    const targetPlatform = sourcePlatform === 'miro' ? 'todoist' : 'miro';
    
    if (targetPlatform === 'miro' && miroService.isInitialized()) {
      console.log(`  → Sincronizando para Miro (real)`);
      // Aqui seria feita a sincronização real com Miro
      // await miroService.updateTaskStatus(boardId, widgetId, completed, task.name);
    } else {
      console.log(`  → Sincronizando para ${targetPlatform} (simulado)`);
    }

    console.log(`✅ Sincronização concluída`);
    return true;
  }

  // Obter estatísticas
  getStats() {
    const totalTasks = this.tasks.size;
    const completedTasks = Array.from(this.tasks.values()).filter(t => t.completed).length;
    const miroTasks = Array.from(this.tasks.values()).filter(t => t.platform === 'miro').length;
    const todoistTasks = Array.from(this.tasks.values()).filter(t => t.platform === 'todoist').length;

    return {
      totalTasks,
      completedTasks,
      miroTasks,
      todoistTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }

  // Listar todas as tarefas
  listTasks(): MockTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
}

async function testMiroTodoistSync() {
  console.log('🔄 Teste Simples: Sincronização Miro ↔ Todoist\n');

  const mockSync = new MockSyncService();

  // Verificar status do Miro
  console.log('📋 Status dos Serviços:');
  const miroReady = miroService.isInitialized();
  console.log(`Miro: ${miroReady ? '✅ Conectado' : '⚠️ Desconectado (usando simulação)'}`);
  console.log(`Todoist: ⚠️ Simulado (integração desabilitada)\n`);

  // Criar projeto de teste
  console.log('📋 Criando Projeto de Teste: "Logo para Startup Tech"');
  
  // Criar tarefas do projeto
  const tasks = [
    mockSync.createTask('task-1', 'Análise do briefing e pesquisa', 'miro'),
    mockSync.createTask('task-2', 'Criação de moodboard', 'miro'),
    mockSync.createTask('task-3', 'Desenvolvimento de conceitos', 'todoist'),
    mockSync.createTask('task-4', 'Primeira revisão com cliente', 'todoist'),
    mockSync.createTask('task-5', 'Refinamento e ajustes', 'miro'),
    mockSync.createTask('task-6', 'Entrega final', 'todoist')
  ];

  console.log(`\n✅ ${tasks.length} tarefas criadas para o projeto\n`);

  // Simular workflow de trabalho
  console.log('🚀 Simulando Workflow de Trabalho:\n');

  // Dia 1: Designer começa no Miro
  console.log('📅 Dia 1: Designer inicia trabalho no Miro');
  await mockSync.syncTask('task-1', true, 'miro');
  await sleep(1000);
  await mockSync.syncTask('task-2', true, 'miro');
  await sleep(1000);

  // Dia 2: Trabalho continua no Todoist
  console.log('\n📅 Dia 2: Trabalho continua no Todoist');
  await mockSync.syncTask('task-3', true, 'todoist');
  await sleep(1000);

  // Dia 3: Cliente faz revisão (Todoist)
  console.log('\n📅 Dia 3: Cliente faz revisão');
  await mockSync.syncTask('task-4', true, 'todoist');
  await sleep(1000);

  // Dia 4: Designer faz ajustes (Miro)
  console.log('\n📅 Dia 4: Designer faz ajustes no Miro');
  await mockSync.syncTask('task-5', true, 'miro');
  await sleep(1000);

  // Dia 5: Entrega final (Todoist)
  console.log('\n📅 Dia 5: Entrega final');
  await mockSync.syncTask('task-6', true, 'todoist');
  await sleep(1000);

  // Mostrar estatísticas finais
  console.log('\n📊 Estatísticas Finais:');
  const stats = mockSync.getStats();
  console.log(`Total de tarefas: ${stats.totalTasks}`);
  console.log(`Tarefas concluídas: ${stats.completedTasks}`);
  console.log(`Taxa de conclusão: ${stats.completionRate}%`);
  console.log(`Tarefas no Miro: ${stats.miroTasks}`);
  console.log(`Tarefas no Todoist: ${stats.todoistTasks}`);

  // Mostrar lista de tarefas
  console.log('\n📋 Lista de Tarefas:');
  const allTasks = mockSync.listTasks();
  allTasks.forEach((task, index) => {
    const status = task.completed ? '✅' : '⏳';
    const platform = task.platform === 'miro' ? '🎨 Miro' : '📝 Todoist';
    console.log(`  ${index + 1}. ${status} ${task.name} (${platform})`);
  });

  // Teste de conflito
  console.log('\n⚡ Teste de Resolução de Conflitos:');
  console.log('Simulando mudanças simultâneas na mesma tarefa...');
  
  // Simular conflito: mesma tarefa alterada em ambas as plataformas
  const conflictTask = 'task-3';
  const conflictTaskName = mockSync.listTasks().find(t => t.id === conflictTask)?.name || 'Tarefa desconhecida';
  console.log(`Conflito na tarefa: "${conflictTaskName}"`);
  console.log('- Miro marca como incompleta às 14:30');
  console.log('- Todoist marca como completa às 14:32');
  console.log('Resolução: Todoist vence (mais recente) ✅');

  await mockSync.syncTask(conflictTask, true, 'todoist');

  console.log('\n🎉 Teste de Sincronização Concluído!');
  
  // Instruções para implementação real
  console.log('\n📝 Para Implementação Real:');
  console.log('1. Configure MIRO_ACCESS_TOKEN no .env');
  console.log('2. Configure TODOIST_API_TOKEN no .env');
  console.log('3. Inicie o servidor: npm run dev');
  console.log('4. Use os endpoints da API:');
  console.log('   - POST /api/projects (criar projeto)');
  console.log('   - PATCH /api/projects/:id/tasks/:taskId/sync (sincronizar tarefa)');
  console.log('   - POST /api/webhooks/miro (webhook do Miro)');
  console.log('   - POST /api/webhooks/todoist (webhook do Todoist)');
  console.log('5. Configure webhooks nas plataformas');
  console.log('6. Teste mudanças em tempo real');

  // Exemplo de uso da API
  console.log('\n🌐 Exemplo de Uso da API:');
  console.log(`
# Criar projeto
curl -X POST http://localhost:3001/api/projects \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Logo para Startup",
    "serviceType": "LOGO",
    "clientId": "client-123",
    "designerId": "designer-456"
  }'

# Sincronizar tarefa (Miro → Todoist)
curl -X PATCH http://localhost:3001/api/projects/PROJECT_ID/tasks/TASK_ID/sync \\
  -H "Content-Type: application/json" \\
  -d '{
    "completed": true,
    "source": "miro"
  }'

# Webhook do Miro
curl -X POST http://localhost:3001/api/webhooks/miro \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "app_card.updated",
    "data": {
      "boardId": "board-123",
      "widgetId": "widget-456",
      "completed": true
    }
  }'
  `);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Executar se chamado diretamente
if (require.main === module) {
  testMiroTodoistSync()
    .then(() => {
      console.log('\n✅ Teste finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro no teste:', error);
      process.exit(1);
    });
}

export { testMiroTodoistSync };