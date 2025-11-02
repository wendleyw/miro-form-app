#!/bin/bash

# Script para testar a sincronização Todoist ↔ Miro usando curl
# Execute com: chmod +x scripts/test-curl-commands.sh && ./scripts/test-curl-commands.sh

API_BASE="http://localhost:3001/api"

echo "🔄 Testando Sincronização Todoist ↔ Miro com curl"
echo "=================================================="

# Verificar se o servidor está rodando
echo ""
echo "📋 1. Verificando se o servidor está rodando..."
curl -s "$API_BASE/projects/health" | jq '.' || {
    echo "❌ Servidor não está rodando. Execute: npm run dev"
    exit 1
}

# Criar projeto
echo ""
echo "📋 2. Criando projeto integrado..."
PROJECT_RESPONSE=$(curl -s -X POST "$API_BASE/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Curl - Logo Startup",
    "description": "Projeto criado via curl para testar sincronização",
    "clientId": "curl-client-123",
    "designerId": "curl-designer-456",
    "serviceType": "LOGO",
    "budget": 3000,
    "brandInfo": {
      "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
      "fonts": ["Montserrat", "Open Sans"],
      "styleKeywords": ["moderno", "limpo", "profissional"]
    }
  }')

echo "Resposta do servidor:"
echo "$PROJECT_RESPONSE" | jq '.'

# Extrair ID do projeto
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id // .projectId // "unknown"')
echo ""
echo "✅ Projeto criado com ID: $PROJECT_ID"

if [ "$PROJECT_ID" = "unknown" ] || [ "$PROJECT_ID" = "null" ]; then
    echo "❌ Não foi possível obter o ID do projeto"
    exit 1
fi

# Verificar status do projeto
echo ""
echo "📋 3. Verificando status do projeto..."
curl -s "$API_BASE/projects/$PROJECT_ID/status" | jq '.'

# Simular webhook do Miro (tarefa concluída)
echo ""
echo "📋 4. Simulando webhook do Miro (tarefa concluída)..."
curl -s -X POST "$API_BASE/webhooks/miro" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "app_card.updated",
    "data": {
      "boardId": "test-board-123",
      "widgetId": "test-widget-456",
      "completed": true,
      "taskName": "Análise do briefing",
      "projectId": "'$PROJECT_ID'"
    }
  }' | jq '.'

# Simular webhook do Todoist (tarefa concluída)
echo ""
echo "📋 5. Simulando webhook do Todoist (tarefa concluída)..."
curl -s -X POST "$API_BASE/webhooks/todoist" \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "item:completed",
    "event_data": {
      "id": "test-task-789",
      "project_id": "'$PROJECT_ID'",
      "content": "Criação de conceitos",
      "checked": 1
    }
  }' | jq '.'

# Sincronizar tarefa manualmente (Miro → Todoist)
echo ""
echo "📋 6. Sincronizando tarefa manualmente (Miro → Todoist)..."
curl -s -X PATCH "$API_BASE/projects/$PROJECT_ID/tasks/manual-task-1/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "source": "miro",
    "taskName": "Refinamento do design"
  }' | jq '.'

# Sincronizar tarefa manualmente (Todoist → Miro)
echo ""
echo "📋 7. Sincronizando tarefa manualmente (Todoist → Miro)..."
curl -s -X PATCH "$API_BASE/projects/$PROJECT_ID/tasks/manual-task-2/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "source": "todoist",
    "taskName": "Entrega final"
  }' | jq '.'

# Verificar saúde dos webhooks
echo ""
echo "📋 8. Verificando saúde dos webhooks..."
curl -s "$API_BASE/webhooks/health" | jq '.'

# Criar projeto de teste
echo ""
echo "📋 9. Criando projeto de teste rápido..."
curl -s -X POST "$API_BASE/projects/test" | jq '.'

echo ""
echo "🎉 Teste com curl concluído!"
echo ""
echo "📝 Comandos úteis para testar manualmente:"
echo ""
echo "# Verificar saúde do sistema:"
echo "curl -s $API_BASE/projects/health | jq '.'"
echo ""
echo "# Criar projeto:"
echo "curl -X POST $API_BASE/projects -H 'Content-Type: application/json' -d '{\"name\":\"Meu Projeto\",\"serviceType\":\"LOGO\",\"clientId\":\"client-123\",\"designerId\":\"designer-456\"}' | jq '.'"
echo ""
echo "# Webhook Miro:"
echo "curl -X POST $API_BASE/webhooks/miro -H 'Content-Type: application/json' -d '{\"type\":\"app_card.updated\",\"data\":{\"boardId\":\"board-123\",\"widgetId\":\"widget-456\",\"completed\":true}}' | jq '.'"
echo ""
echo "# Webhook Todoist:"
echo "curl -X POST $API_BASE/webhooks/todoist -H 'Content-Type: application/json' -d '{\"event_name\":\"item:completed\",\"event_data\":{\"id\":\"task-789\",\"project_id\":\"project-123\",\"content\":\"Minha tarefa\",\"checked\":1}}' | jq '.'"
echo ""
echo "🚀 Para monitorar em tempo real, abra outro terminal e execute:"
echo "tail -f server/logs/app.log  # (se houver logs)"
echo "ou observe os logs do servidor no terminal onde está rodando 'npm run dev'"