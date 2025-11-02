#!/usr/bin/env ts-node

/**
 * Script de teste para sincronização bidirecional entre Todoist e Miro
 * Testa criação de tarefas em uma plataforma e replicação na outra
 * Execute com: npx ts-node scripts/test-bidirectional-sync.ts
 */

import { miroService } from '../src/services/miro.service';
import { syncService } from '../src/services/sync.service';
import { supabaseIntegrationService } from '../src/services/supabase-integration.service';

interface TestProject {
  id: string;
  name: string;
  miroBoardId?: string;
  todoistProjectId?: string;
}

interface TestTask {
  id: string;
  name: string;
  completed: boolean;
  miroWidgetId?: string;
  todoistTaskId?: string;
}

async function testBidirectionalSync() {
  console.log('🔄 Testando Sincronização Bidirecional Todoist ↔ Miro\n');

  try {
    // Passo 1: Verificar status dos serviços
    console.log('📋 Passo 1: Verificando Status dos Serviços');
    const health = await supabaseIntegrationService.healthCheck();
    console.log(`Sistema geral: ${health.status}`);
    console.log(`- Miro: ${health.miro}`);
    console.log(`- Todoist: ${health.todoist}`);
    console.log(`- Sync: ${health.sync}`);

    if (health.status === 'unhealthy') {
      console.log('❌ Sistema não está saudável. Abortando teste.');
      return;
    }

    // Passo 2: Criar projeto de teste
    console.log('\n📋 Passo 2: Criando Projeto de Teste');
    const testProject = await createTestProject();
    
    if (!testProject) {
      console.log('❌ Falha ao criar projeto de teste');
      return;
    }

    console.log(`✅ Projeto criado: ${testProject.name}`);
    console.log(`- ID: ${testProject.id}`);
    console.log(`- Miro Board: ${testProject.miroBoardId || 'Não criado'}`);
    console.log(`- Todoist Project: ${testProject.todoistProjectId || 'Não criado'}`);

    // Passo 3: Criar tarefas de teste
    console.log('\n📋 Passo 3: Criando Tarefas de Teste');
    const testTasks = await createTestTasks(testProject);
    
    console.log(`✅ ${testTasks.length} tarefas criadas para teste`);
    testTasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.name} (${task.completed ? 'Concluída' : 'Pendente'})`);
    });

    // Passo 4: Teste Miro → Todoist
    console.log('\n📋 Passo 4: Testando Sincronização Miro → Todoist');
    await testMiroToTodoistSync(testProject, testTasks);

    // Passo 5: Teste Todoist → Miro
    console.log('\n📋 Passo 5: Testando Sincronização Todoist → Miro');
    await testTodoistToMiroSync(testProject, testTasks);

    // Passo 6: Teste de conflitos
    console.log('\n📋 Passo 6: Testando Resolução de Conflitos');
    await testConflictResolution(testProject, testTasks);

    // Passo 7: Verificar estatísticas finais
    console.log('\n📋 Passo 7: Estatísticas Finais de Sincronização');
    await showSyncStatistics(testProject);

    console.log('\n🎉 Teste de Sincronização Bidirecional Concluído!');

  } catch (error: any) {
    console.error('\n❌ Erro no teste de sincronização:', error);
    
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message);
    }
  }
}

/**
 * Criar projeto de teste
 */
async function createTestProject(): Promise<TestProject | null> {
  try {
    const projectData = {
      name: `Teste Sync Bidirecional - ${new Date().toLocaleString('pt-BR')}`,
      description: 'Projeto para testar sincronização entre Todoist e Miro',
      clientId: 'test-client-sync',
      designerId: 'test-designer-sync',
      serviceType: 'LOGO' as const,
      budget: 3000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      brandInfo: {
        colors: ['#FF6B6B', '#4ECDC4'],
        fonts: ['Montserrat', 'Open Sans'],
        styleKeywords: ['moderno', 'limpo', 'profissional']
      }
    };

    const result = await supabaseIntegrationService.createIntegratedProject(projectData);
    
    if (result.success && result.projectId) {
      return {
        id: result.projectId,
        name: projectData.name,
        miroBoardId: result.miroBoardId,
        todoistProjectId: result.todoistProjectId
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao criar projeto de teste:', error);
    return null;
  }
}

/**
 * Criar tarefas de teste
 */
async function createTestTasks(project: TestProject): Promise<TestTask[]> {
  const taskTemplates = [
    { name: 'Análise do briefing', completed: false },
    { name: 'Pesquisa de referências', completed: false },
    { name: 'Criação de conceitos', completed: false },
    { name: 'Primeira revisão', completed: false },
    { name: 'Refinamento do design', completed: false }
  ];

  const testTasks: TestTask[] = [];

  for (let i = 0; i < taskTemplates.length; i++) {
    const template = taskTemplates[i];
    const taskId = `test-task-${project.id}-${i + 1}`;
    
    testTasks.push({
      id: taskId,
      name: template.name,
      completed: template.completed,
      miroWidgetId: project.miroBoardId ? `miro-widget-${i + 1}` : undefined,
      todoistTaskId: project.todoistProjectId ? `todoist-task-${i + 1}` : undefined
    });
  }

  return testTasks;
}

/**
 * Testar sincronização Miro → Todoist
 */
async function testMiroToTodoistSync(project: TestProject, tasks: TestTask[]): Promise<void> {
  console.log('  🔄 Simulando mudanças no Miro...');

  for (let i = 0; i < Math.min(3, tasks.length); i++) {
    const task = tasks[i];
    const newStatus = i % 2 === 0; // Alterna entre concluído/pendente
    
    console.log(`    • Marcando "${task.name}" como ${newStatus ? 'concluída' : 'pendente'} no Miro`);
    
    // Simular sincronização via sync service
    const syncResult = await syncService.syncTaskCompletion({
      taskMappingId: task.id,
      completed: newStatus,
      taskName: task.name,
      source: 'miro'
    });

    if (syncResult.success) {
      console.log(`      ✅ Sincronizado para Todoist`);
      task.completed = newStatus;
    } else {
      console.log(`      ❌ Falha na sincronização: ${syncResult.error}`);
    }

    // Pequena pausa entre sincronizações
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Testar sincronização Todoist → Miro
 */
async function testTodoistToMiroSync(project: TestProject, tasks: TestTask[]): Promise<void> {
  console.log('  🔄 Simulando mudanças no Todoist...');

  for (let i = 3; i < tasks.length; i++) {
    const task = tasks[i];
    const newStatus = i % 2 === 1; // Alterna entre concluído/pendente
    
    console.log(`    • Marcando "${task.name}" como ${newStatus ? 'concluída' : 'pendente'} no Todoist`);
    
    // Simular sincronização via sync service
    const syncResult = await syncService.syncTaskCompletion({
      taskMappingId: task.id,
      completed: newStatus,
      taskName: task.name,
      source: 'todoist'
    });

    if (syncResult.success) {
      console.log(`      ✅ Sincronizado para Miro`);
      task.completed = newStatus;
    } else {
      console.log(`      ❌ Falha na sincronização: ${syncResult.error}`);
    }

    // Pequena pausa entre sincronizações
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Testar resolução de conflitos
 */
async function testConflictResolution(project: TestProject, tasks: TestTask[]): Promise<void> {
  if (tasks.length === 0) return;

  console.log('  ⚡ Simulando conflito de sincronização...');
  
  const conflictTask = tasks[0];
  const now = new Date();
  const miroUpdate = { completed: true, timestamp: new Date(now.getTime() + 1000) }; // 1 segundo depois
  const todoistUpdate = { completed: false, timestamp: now };

  console.log(`    • Conflito na tarefa "${conflictTask.name}"`);
  console.log(`      - Miro: ${miroUpdate.completed} (${miroUpdate.timestamp.toLocaleTimeString()})`);
  console.log(`      - Todoist: ${todoistUpdate.completed} (${todoistUpdate.timestamp.toLocaleTimeString()})`);

  const resolution = await syncService.resolveConflict(
    conflictTask.id,
    miroUpdate,
    todoistUpdate
  );

  if (resolution.success) {
    console.log(`      ✅ Conflito resolvido: ${resolution.resolution}`);
    
    if (resolution.resolution === 'miro_wins') {
      console.log(`      → Miro venceu (mais recente)`);
      conflictTask.completed = miroUpdate.completed;
    } else if (resolution.resolution === 'todoist_wins') {
      console.log(`      → Todoist venceu (mais recente)`);
      conflictTask.completed = todoistUpdate.completed;
    } else {
      console.log(`      → Sem conflito real`);
    }
  } else {
    console.log(`      ❌ Falha na resolução: ${resolution.error}`);
  }
}

/**
 * Mostrar estatísticas de sincronização
 */
async function showSyncStatistics(project: TestProject): Promise<void> {
  try {
    const stats = await syncService.getSyncStatistics(project.id);
    
    console.log('  📊 Estatísticas de Sincronização:');
    console.log(`    • Total de tarefas: ${stats.totalTasks}`);
    console.log(`    • Tarefas concluídas: ${stats.completedTasks}`);
    console.log(`    • Progresso: ${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`);
    console.log(`    • Última sincronização: ${stats.lastSyncTime ? stats.lastSyncTime.toLocaleString('pt-BR') : 'Nunca'}`);
    console.log(`    • Erros de sincronização: ${stats.syncErrors}`);

    // Health check do sync service
    const health = await syncService.healthCheck();
    console.log(`    • Status do serviço: ${health.status}`);
    console.log(`    • Status Miro: ${health.miroStatus}`);
    console.log(`    • Status Todoist: ${health.todoistStatus}`);

  } catch (error) {
    console.log('  ❌ Erro ao obter estatísticas:', error);
  }
}

/**
 * Demonstração de uso da API
 */
async function demonstrateAPIUsage(): Promise<void> {
  console.log('\n📋 Demonstração de Uso da API:');
  
  console.log('\n1. Criar projeto integrado:');
  console.log('POST /api/projects');
  console.log(JSON.stringify({
    name: "Meu Projeto",
    serviceType: "LOGO",
    clientId: "client-123",
    designerId: "designer-456"
  }, null, 2));

  console.log('\n2. Sincronizar status de tarefa:');
  console.log('PATCH /api/projects/:projectId/tasks/:taskId/sync');
  console.log(JSON.stringify({
    completed: true,
    source: "miro"
  }, null, 2));

  console.log('\n3. Webhook do Miro:');
  console.log('POST /api/webhooks/miro');
  console.log(JSON.stringify({
    type: "app_card.updated",
    data: {
      boardId: "board-123",
      widgetId: "widget-456",
      completed: true
    }
  }, null, 2));

  console.log('\n4. Webhook do Todoist:');
  console.log('POST /api/webhooks/todoist');
  console.log(JSON.stringify({
    event_name: "item:completed",
    event_data: {
      id: "task-789",
      project_id: "project-123",
      content: "Minha tarefa"
    }
  }, null, 2));
}

// Executar o teste se este script for executado diretamente
if (require.main === module) {
  testBidirectionalSync()
    .then(async () => {
      await demonstrateAPIUsage();
      console.log('\n✅ Teste de sincronização bidirecional concluído');
      console.log('\n🚀 Para testar na prática:');
      console.log('1. Inicie o servidor: npm run dev');
      console.log('2. Use os endpoints da API mostrados acima');
      console.log('3. Configure webhooks no Miro e Todoist');
      console.log('4. Teste mudanças em tempo real');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Teste falhou:', error);
      process.exit(1);
    });
}

export { testBidirectionalSync };