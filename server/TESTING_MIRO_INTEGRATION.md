# 🧪 Guia de Teste - Integração Miro

Este guia te ajudará a testar completamente a integração Miro implementada no sistema de gerenciamento de tickets.

## 📋 Pré-requisitos

1. **Servidor rodando**: `npm run dev`
2. **Banco de dados configurado**: PostgreSQL rodando
3. **Redis configurado**: Para cache e sessões
4. **Token Miro válido**: Configurado no `.env`

## 🚀 Métodos de Teste

### 1. Testes Automatizados

Execute os testes de integração:

```bash
# Todos os testes relacionados ao Miro
npm test -- --testPathPattern=miro

# Testes específicos
npm test tests/integration/miro-integration.test.ts
npm test tests/integration/webhook.test.ts
npm test tests/integration/sync-service.test.ts
```

### 2. Teste Manual Interativo

Execute o script de teste manual:

```bash
# Teste completo da integração
npx ts-node scripts/test-miro-integration.ts

# Teste de webhooks
npx ts-node scripts/test-webhook.ts

# Simulação de sequência de webhooks
npx ts-node scripts/test-webhook.ts --sequence
```

### 3. Teste via API REST

Use um cliente REST (Postman, Insomnia, curl) para testar os endpoints:

#### Criar Cliente e Ticket

```bash
# 1. Criar cliente
curl -X POST http://localhost:3001/api/clients/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cliente Teste Miro",
    "email": "teste-miro@example.com",
    "password": "senha123",
    "phone": "+5511999999999"
  }'

# 2. Criar ticket (substitua CLIENT_ID)
curl -X POST http://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT_ID",
    "title": "Projeto Logo - Teste Miro",
    "description": "Projeto para testar integração Miro",
    "serviceType": "LOGO",
    "priority": "HIGH",
    "brandInfo": {
      "colors": ["#FF6B6B", "#4ECDC4"],
      "fonts": ["Montserrat", "Open Sans"],
      "styleKeywords": ["moderno", "limpo"]
    }
  }'
```

#### Testar Webhooks

```bash
# Webhook Miro - Tarefa completada
curl -X POST http://localhost:3001/api/webhooks/miro \
  -H "Content-Type: application/json" \
  -d '{
    "type": "item_updated",
    "data": {
      "item": {
        "id": "checkbox-123",
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

# Webhook Miro - Nova nota
curl -X POST http://localhost:3001/api/webhooks/miro \
  -H "Content-Type: application/json" \
  -d '{
    "type": "item_created",
    "data": {
      "item": {
        "id": "note-789",
        "type": "sticky_note",
        "data": {
          "content": "Cliente aprovou o conceito!"
        }
      },
      "board": {
        "id": "board-456"
      }
    }
  }'
```

## 🔍 O Que Testar

### ✅ Funcionalidades Principais

1. **Inicialização do Serviço**
   - [ ] Miro service inicializa corretamente
   - [ ] Health check retorna status OK
   - [ ] Credenciais são validadas

2. **Criação de Boards**
   - [ ] Board é criado automaticamente ao criar ticket
   - [ ] Estrutura de frames é criada corretamente
   - [ ] Informações do cliente são adicionadas
   - [ ] Brand guidelines são incluídas
   - [ ] Anexos visuais são adicionados

3. **Templates de Tarefas**
   - [ ] Templates corretos por tipo de serviço
   - [ ] Logo: 7 tarefas (análise → entrega)
   - [ ] Website: 7 tarefas (arquitetura → entrega)
   - [ ] Branding: 7 tarefas (pesquisa → apresentação)

4. **Webhooks**
   - [ ] Endpoint `/api/webhooks/miro` aceita payloads válidos
   - [ ] Rejeita payloads inválidos (400)
   - [ ] Processa atualizações de checkboxes
   - [ ] Processa criação de itens
   - [ ] Armazena eventos para auditoria

5. **Sincronização**
   - [ ] Sync service inicializa
   - [ ] Sincroniza tarefas entre plataformas
   - [ ] Resolve conflitos (last-write-wins)
   - [ ] Adiciona logs de comunicação
   - [ ] Calcula estatísticas de sync

### 🎯 Cenários de Teste

#### Cenário 1: Fluxo Completo de Projeto
1. Criar cliente
2. Criar ticket com brand info
3. Verificar criação do board Miro
4. Simular atualizações de tarefas via webhook
5. Verificar sincronização

#### Cenário 2: Tratamento de Erros
1. Testar com token Miro inválido
2. Testar webhooks malformados
3. Testar IDs inexistentes
4. Verificar fallbacks graceful

#### Cenário 3: Performance
1. Criar múltiplos tickets simultaneamente
2. Enviar múltiplos webhooks em sequência
3. Verificar tempos de resposta
4. Monitorar uso de memória

## 📊 Verificações de Qualidade

### Logs do Sistema
Monitore os logs para:
- ✅ Inicialização bem-sucedida
- ✅ Criação de boards
- ✅ Processamento de webhooks
- ❌ Erros de API
- ❌ Falhas de sincronização

### Base de Dados
Verifique as tabelas:
- `tickets`: miroBoardId preenchido
- `webhook_events`: eventos armazenados
- `task_mappings`: mapeamentos criados
- `communication_logs`: logs de sync

### Miro Board
No board criado, verifique:
- 📋 Frame "CLIENT INFO" com detalhes do ticket
- 🎨 Frame "DESIGN & REVISÕES" para workspace
- 📊 Frame "PROJECT REPORT" com timeline
- ☐ Checkboxes de tarefas funcionais
- 🎨 Brand guidelines visíveis

## 🐛 Troubleshooting

### Problema: Board não é criado
**Possíveis causas:**
- Token Miro inválido/expirado
- Permissões insuficientes
- Rate limiting da API

**Soluções:**
1. Verificar `MIRO_ACCESS_TOKEN` no `.env`
2. Testar token manualmente na API Miro
3. Verificar logs de erro

### Problema: Webhooks não funcionam
**Possíveis causas:**
- Servidor não acessível externamente
- URL webhook incorreta no Miro
- Payload malformado

**Soluções:**
1. Usar ngrok para expor localhost
2. Verificar URL: `http://your-domain/api/webhooks/miro`
3. Testar payload com script manual

### Problema: Sincronização falha
**Possíveis causas:**
- Task mappings não criados
- IDs de widgets incorretos
- Conflitos de timing

**Soluções:**
1. Verificar task_mappings na DB
2. Validar IDs dos widgets Miro
3. Implementar retry logic

## 📈 Métricas de Sucesso

- ✅ 100% dos tickets criam boards Miro
- ✅ Webhooks processados em < 2s
- ✅ 0 erros de sincronização
- ✅ Logs de auditoria completos
- ✅ Fallbacks funcionam sem Miro

## 🔗 URLs Úteis

- **Health Check**: http://localhost:3001/api/webhooks/health
- **Webhook Events**: http://localhost:3001/api/webhooks/events
- **Miro Webhook**: http://localhost:3001/api/webhooks/miro
- **Todoist Webhook**: http://localhost:3001/api/webhooks/todoist

## 📝 Próximos Passos

Após validar a integração Miro:

1. **Configurar webhooks reais** no Miro app
2. **Implementar integração Todoist** (próxima tarefa)
3. **Configurar monitoramento** de produção
4. **Documentar** para equipe de desenvolvimento
5. **Treinar usuários** no novo fluxo

---

💡 **Dica**: Execute primeiro o teste manual interativo para uma visão geral, depois os testes automatizados para validação detalhada.