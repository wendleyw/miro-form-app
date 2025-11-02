#!/usr/bin/env ts-node

/**
 * Teste da API REST para sincronização Todoist ↔ Miro
 * Execute com: npx ts-node scripts/test-api-sync.ts
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

async function testApiSync() {
  console.log('🌐 Testando API REST para Sincronização\n');

  try {
    // Verificar se o servidor está rodando
    console.log('📋 Verificando servidor...');
    
    try {
      const healthResponse = await axios.get(`${API_BASE}/projects/health`);
      console.log('✅ Servidor está rodando');
      console.log('Status dos serviços:', healthResponse.data);
    } catch (error) {
      console.log('❌ Servidor não está rodando. Execute: npm run dev');
      console.log('Continuando com demonstração dos endpoints...\n');
    }

    // Teste 1: Criar projeto integrado
    console.log('📋 Teste 1: Criar Projeto Integrado');
    const projectData = {
      name: `Projeto API Test - ${new Date().toLocaleString('pt-BR')}`,
      description: 'Teste de criação via API REST',
      clientId: 'api-test-client',
      designerId: 'api-test-designer',
      serviceType: 'LOGO',
      budget: 2500,
      brandInfo: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        fonts: ['Montserrat', 'Open Sans'],
        styleKeywords: ['moderno', 'minimalista', 'profissional']
      }
    };

    console.log('Enviando POST /api/projects');
    console.log('Dados:', JSON.stringify(projectData, null, 2));

    try {
      const createResponse = await axios.post(`${API_BASE}/projects`, projectData);
      const project = createResponse.data as any;
      
      console.log('✅ Projeto criado com sucesso!');
      console.log(`ID: ${project.projectId || project.project?.id}`);
      console.log(`Miro Board: ${project.miroBoardId || project.project?.miroBoardId || 'Não criado'}`);
      console.log(`Todoist Project: ${project.todoistProjectId || project.project?.todoistProjectId || 'Não criado'}`);

      const projectId = project.projectId || project.project?.id;
      if (projectId) {
        await testProjectOperations(projectId);
      }

    } catch (error: any) {
      console.log('❌ Erro ao criar projeto:', error.response?.data || error.message);
      console.log('Continuando com projeto mock...');
      await testProjectOperations('mock-project-id');
    }

    // Teste de webhooks
    await testWebhooks();

    console.log('\n🎉 Teste da API concluído!');

  } catch (error: any) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

async function testProjectOperations(projectId: string) {
  console.log(`\n📋 Teste 2: Operações do Projeto ${projectId}`);

  // Verificar status do projeto
  console.log('Verificando status do projeto...');
  try {
    const statusResponse = await axios.get(`${API_BASE}/projects/${projectId}/status`);
    console.log('✅ Status obtido:', statusResponse.data);
  } catch (error: any) {
    console.log('❌ Erro ao obter status:', error.response?.data || error.message);
  }

  // Sincronizar tarefa
  console.log('\nSincronizando tarefa...');
  const taskSyncData = {
    completed: true,
    source: 'miro',
    taskName: 'Análise do briefing'
  };

  try {
    const syncResponse = await axios.patch(
      `${API_BASE}/projects/${projectId}/tasks/task-1/sync`,
      taskSyncData
    );
    console.log('✅ Tarefa sincronizada:', syncResponse.data);
  } catch (error: any) {
    console.log('❌ Erro na sincronização:', error.response?.data || error.message);
  }

  // Obter estatísticas do Todoist
  console.log('\nObtendo estatísticas do Todoist...');
  try {
    const todoistStatsResponse = await axios.get(`${API_BASE}/projects/${projectId}/todoist/stats`);
    console.log('✅ Estatísticas Todoist:', todoistStatsResponse.data);
  } catch (error: any) {
    console.log('❌ Erro ao obter estatísticas Todoist:', error.response?.data || error.message);
  }

  // Obter informações do Miro
  console.log('\nObtendo informações do Miro...');
  try {
    const miroInfoResponse = await axios.get(`${API_BASE}/projects/${projectId}/miro/info`);
    console.log('✅ Informações Miro:', miroInfoResponse.data);
  } catch (error: any) {
    console.log('❌ Erro ao obter informações Miro:', error.response?.data || error.message);
  }
}

async function testWebhooks() {
  console.log('\n📋 Teste 3: Webhooks');

  // Teste webhook do Miro
  console.log('Testando webhook do Miro...');
  const miroWebhookData = {
    type: 'app_card.updated',
    data: {
      boardId: 'test-board-123',
      widgetId: 'test-widget-456',
      completed: true,
      taskName: 'Tarefa teste do Miro'
    }
  };

  try {
    const miroWebhookResponse = await axios.post(`${API_BASE}/webhooks/miro`, miroWebhookData);
    console.log('✅ Webhook Miro processado:', miroWebhookResponse.data);
  } catch (error: any) {
    console.log('❌ Erro no webhook Miro:', error.response?.data || error.message);
  }

  // Teste webhook do Todoist
  console.log('\nTestando webhook do Todoist...');
  const todoistWebhookData = {
    event_name: 'item:completed',
    event_data: {
      id: 'test-task-789',
      project_id: 'test-project-123',
      content: 'Tarefa teste do Todoist',
      checked: 1
    }
  };

  try {
    const todoistWebhookResponse = await axios.post(`${API_BASE}/webhooks/todoist`, todoistWebhookData);
    console.log('✅ Webhook Todoist processado:', todoistWebhookResponse.data);
  } catch (error: any) {
    console.log('❌ Erro no webhook Todoist:', error.response?.data || error.message);
  }

  // Verificar saúde dos webhooks
  console.log('\nVerificando saúde dos webhooks...');
  try {
    const webhookHealthResponse = await axios.get(`${API_BASE}/webhooks/health`);
    console.log('✅ Saúde dos webhooks:', webhookHealthResponse.data);
  } catch (error: any) {
    console.log('❌ Erro na verificação de saúde:', error.response?.data || error.message);
  }
}

function showApiDocumentation() {
  console.log('\n📚 Documentação da API:');
  
  console.log('\n🔧 Endpoints de Projetos:');
  console.log('POST   /api/projects                     - Criar projeto integrado');
  console.log('GET    /api/projects/:id/status          - Status do projeto');
  console.log('PATCH  /api/projects/:id/tasks/:taskId/sync - Sincronizar tarefa');
  console.log('GET    /api/projects/:id/todoist/stats   - Estatísticas Todoist');
  console.log('GET    /api/projects/:id/miro/info       - Informações Miro');
  console.log('GET    /api/projects/health              - Saúde do sistema');
  console.log('POST   /api/projects/test                - Criar projeto de teste');

  console.log('\n🔗 Endpoints de Webhooks:');
  console.log('POST   /api/webhooks/miro                - Webhook do Miro');
  console.log('POST   /api/webhooks/todoist             - Webhook do Todoist');
  console.log('GET    /api/webhooks/health              - Saúde dos webhooks');

  console.log('\n📝 Exemplo de uso com curl:');
  console.log(`
# Criar projeto
curl -X POST ${API_BASE}/projects \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Meu Projeto",
    "serviceType": "LOGO",
    "clientId": "client-123",
    "designerId": "designer-456"
  }'

# Sincronizar tarefa
curl -X PATCH ${API_BASE}/projects/PROJECT_ID/tasks/TASK_ID/sync \\
  -H "Content-Type: application/json" \\
  -d '{
    "completed": true,
    "source": "miro"
  }'

# Webhook Miro
curl -X POST ${API_BASE}/webhooks/miro \\
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

// Executar se chamado diretamente
if (require.main === module) {
  testApiSync()
    .then(() => {
      showApiDocumentation();
      console.log('\n✅ Teste da API finalizado');
      console.log('\n🚀 Para usar:');
      console.log('1. Inicie o servidor: npm run dev');
      console.log('2. Use os endpoints mostrados acima');
      console.log('3. Configure webhooks no Miro/Todoist');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro no teste da API:', error);
      process.exit(1);
    });
}

export { testApiSync };