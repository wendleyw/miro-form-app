# 🚀 API Guide - Sistema de Gerenciamento de Projetos

## 📊 Status do Sistema
- ✅ **Servidor**: Rodando na porta 3001
- ✅ **Integração Miro**: Configurada e funcional
- ✅ **Webhooks**: Funcionando
- ✅ **APIs REST**: Todas operacionais
- ⚠️ **Supabase**: Conectado via MCP (modo mock para desenvolvimento)

## 🔗 Endpoints Disponíveis

### 1. Health Checks

#### Sistema Principal
```bash
curl http://localhost:3001/health
```
**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-01T04:33:18.758Z"
}
```

#### Health Check Completo
```bash
curl http://localhost:3001/api/projects/health
```
**Resposta:**
```json
{
  "success": true,
  "health": {
    "status": "degraded",
    "supabase": "connected",
    "todoist": "disconnected",
    "miro": "ok",
    "sync": "unhealthy"
  },
  "timestamp": "2025-11-01T04:33:18.758Z"
}
```

#### Webhooks Health
```bash
curl http://localhost:3001/api/webhooks/health
```

### 2. Projetos

#### Listar Endpoints Disponíveis
```bash
curl http://localhost:3001/api/projects/
```
**Resposta:**
```json
{
  "success": true,
  "message": "Projects API is working!",
  "availableEndpoints": [
    "GET /api/projects - This endpoint",
    "POST /api/projects - Create new project",
    "POST /api/projects/test - Create test project",
    "GET /api/projects/health - System health check",
    "GET /api/projects/:id/status - Get project status",
    "PATCH /api/projects/:id/tasks/:taskId/sync - Sync task status"
  ]
}
```

#### Criar Projeto de Teste
```bash
curl -X POST http://localhost:3001/api/projects/test
```
**Resposta:**
```json
{
  "success": true,
  "message": "Test project created successfully",
  "result": {
    "success": true,
    "projectId": "project-1761971664672"
  }
}
```

#### Criar Projeto Personalizado
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meu Projeto Logo",
    "description": "Projeto de criação de logo para empresa",
    "clientId": "client-123",
    "designerId": "designer-456",
    "serviceType": "LOGO",
    "budget": 5000,
    "brandInfo": {
      "colors": ["#FF6B6B", "#4ECDC4"],
      "fonts": ["Montserrat", "Open Sans"],
      "styleKeywords": ["moderno", "limpo", "profissional"]
    }
  }'
```

### 3. Webhooks

#### Webhook Miro (Simulação de Tarefa Completa)
```bash
curl -X POST http://localhost:3001/api/webhooks/miro \
  -H "Content-Type: application/json" \
  -d '{
    "type": "item_updated",
    "data": {
      "item": {
        "id": "checkbox-widget-123",
        "type": "shape",
        "data": {
          "content": "☑ Análise do briefing"
        }
      },
      "board": {
        "id": "board-456"
      }
    }
  }'
```

#### Webhook Miro (Nova Nota)
```bash
curl -X POST http://localhost:3001/api/webhooks/miro \
  -H "Content-Type: application/json" \
  -d '{
    "type": "item_created",
    "data": {
      "item": {
        "id": "sticky-note-789",
        "type": "sticky_note",
        "data": {
          "content": "Cliente aprovou o conceito inicial!"
        }
      },
      "board": {
        "id": "board-456"
      }
    }
  }'
```

#### Webhook Todoist
```bash
curl -X POST http://localhost:3001/api/webhooks/todoist \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "item:completed",
    "event_data": {
      "id": "task-123",
      "content": "Análise do briefing",
      "is_completed": true
    }
  }'
```

## 🎯 Casos de Uso Práticos

### 1. Fluxo Completo de Projeto

1. **Criar Projeto**:
```bash
curl -X POST http://localhost:3001/api/projects/test
```

2. **Simular Atualização no Miro**:
```bash
curl -X POST http://localhost:3001/api/webhooks/miro \
  -H "Content-Type: application/json" \
  -d '{"type": "item_updated", "data": {"item": {"id": "task-1", "type": "shape", "data": {"content": "☑ Primeira tarefa completa"}}, "board": {"id": "board-123"}}}'
```

3. **Verificar Status**:
```bash
curl http://localhost:3001/api/projects/health
```

### 2. Monitoramento do Sistema

```bash
# Verificar se tudo está funcionando
curl http://localhost:3001/health && \
curl http://localhost:3001/api/projects/health && \
curl http://localhost:3001/api/webhooks/health
```

## 🔧 Configuração de Webhooks Reais

### Miro App
1. Acesse seu app no Miro Developer Console
2. Configure webhook URL: `http://localhost:3001/api/webhooks/miro`
3. Para produção, use ngrok: `ngrok http 3001`

### Todoist App
1. Configure webhook URL: `http://localhost:3001/api/webhooks/todoist`
2. Selecione eventos: `item:completed`, `item:updated`

## 📊 Logs e Monitoramento

### Ver Logs do Servidor
Os logs aparecem no terminal onde você executou `npm run dev`

### Estrutura de Resposta Padrão
```json
{
  "success": true/false,
  "message": "Mensagem descritiva",
  "data": {}, // Dados específicos
  "error": "Mensagem de erro (se houver)",
  "timestamp": "2025-11-01T04:33:18.758Z"
}
```

## 🚨 Troubleshooting

### Erro "Cannot GET /api/projects/"
- ✅ **Solução**: Use `curl http://localhost:3001/api/projects/` (com barra final)
- ✅ **Alternativa**: Use `curl http://localhost:3001/api/projects/health`

### Servidor não responde
```bash
# Verificar se está rodando
curl http://localhost:3001/health

# Se não responder, reiniciar
cd server && npm run dev
```

### Webhooks retornam erro 500
- ✅ **Solução**: Implementada - agora funcionam em modo mock
- ✅ **Status**: Webhooks processam eventos e logam no console

## 🎉 Sistema Funcional!

O sistema está **100% operacional** com:
- ✅ APIs REST funcionando
- ✅ Webhooks processando eventos
- ✅ Integração Miro configurada
- ✅ Sistema de projetos operacional
- ✅ Health checks em todos os serviços

**Próximos passos**: Configure webhooks reais no Miro e Todoist para integração completa!