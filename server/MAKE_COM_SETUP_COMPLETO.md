# 🔄 Sincronização Miro ↔ Todoist com Make.com

## ⚡ Configuração Rápida (10 minutos)

### **Por que Make.com?**
- ✅ **Sem código** - Interface visual
- ✅ **Webhooks integrados** - URLs automáticas
- ✅ **Conectores nativos** - Miro e Todoist prontos
- ✅ **Gratuito** - 1000 operações/mês
- ✅ **Confiável** - 99.9% uptime

## 🚀 Passo a Passo

### **1. Criar Conta no Make.com**
1. Acesse https://www.make.com/
2. Clique em "Sign up for free"
3. Crie sua conta gratuita

### **2. Configurar Cenário Miro → Todoist**

#### **2.1 Criar Novo Cenário**
1. No dashboard, clique em **"Create a new scenario"**
2. Pesquise por **"Miro"** e selecione
3. Escolha **"Watch Board Items"** ou **"Custom Webhook"**

#### **2.2 Configurar Webhook do Miro**
1. Adicione módulo **"Webhooks" → "Custom webhook"**
2. Clique em **"Add"** para criar novo webhook
3. **Copie a URL gerada** (ex: `https://hook.eu1.make.com/abc123`)
4. Configure no Miro:

```bash
# Configurar webhook no Miro via API
curl -X POST https://api.miro.com/v2/webhooks \
  -H "Authorization: Bearer eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K66MkyC3_3M_UMAOuvmYAfA3nZo" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackUrl": "SUA_URL_DO_MAKE_AQUI",
    "eventTypes": ["BOARD_CONTENT_UPDATED"]
  }'
```

#### **2.3 Adicionar Filtro**
1. Adicione **"Filter"** após o webhook
2. Configure condição: `event_type = "item_updated"`
3. E: `item_type = "card"` ou `item_type = "sticky_note"`

#### **2.4 Conectar Todoist**
1. Adicione módulo **"Todoist" → "Create a Task"**
2. Conecte sua conta Todoist (token: `63dd8d664d3e8a0570a2bd7c4981be8421c70975`)
3. Configure:
   - **Project**: Selecione projeto ou crie novo
   - **Content**: `{{webhook.data.title}}` ou texto do Miro
   - **Description**: `Sincronizado do Miro: {{webhook.data.id}}`

### **3. Configurar Cenário Todoist → Miro**

#### **3.1 Criar Segundo Cenário**
1. Crie novo cenário
2. Adicione **"Webhooks" → "Custom webhook"**
3. **Copie a nova URL** para o Todoist

#### **3.2 Configurar Webhook do Todoist**
1. Acesse https://developer.todoist.com/appconsole.html
2. Crie ou selecione seu app
3. Em **Webhooks**, adicione:
   - **URL**: URL do Make.com copiada
   - **Events**: `item:completed`, `item:updated`, `item:added`

#### **3.3 Conectar Miro**
1. Adicione módulo **"Miro" → "Create Item"**
2. Conecte sua conta Miro
3. Configure:
   - **Board**: Selecione board específico
   - **Type**: "sticky_note" ou "card"
   - **Content**: `{{webhook.event_data.content}}`

## 🎯 Cenários Prontos

### **Cenário 1: Miro → Todoist**
```
[Webhook Miro] → [Filter: item updated] → [Todoist: Create Task]
```

**Configuração do Filtro:**
- `event_type` = "item_updated"
- `data.type` = "sticky_note"

**Configuração Todoist:**
- Project: "Projetos Miro"
- Content: `{{data.plainText}}`
- Due date: `{{data.dueDate}}`

### **Cenário 2: Todoist → Miro**
```
[Webhook Todoist] → [Filter: item completed] → [Miro: Update Item]
```

**Configuração do Filtro:**
- `event_name` = "item:completed"

**Configuração Miro:**
- Board ID: Seu board
- Item ID: Mapeado do Todoist
- Update: Marcar como concluído

## 🔧 URLs dos Webhooks

### **Configurar no Miro**
```bash
curl -X POST https://api.miro.com/v2/webhooks \
  -H "Authorization: Bearer eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K66MkyC3_3M_UMAOuvmYAfA3nZo" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackUrl": "https://hook.eu1.make.com/SUA_URL_AQUI",
    "eventTypes": ["BOARD_CONTENT_UPDATED"]
  }'
```

### **Configurar no Todoist**
1. https://developer.todoist.com/appconsole.html
2. Webhooks → Add webhook
3. URL: `https://hook.eu1.make.com/SUA_URL_AQUI`
4. Events: `item:completed`, `item:updated`

## 🧪 Testar Integração

### **Teste 1: Miro → Todoist**
1. Abra seu board no Miro
2. Crie um sticky note com texto "Teste Make.com"
3. Verifique se apareceu no Todoist

### **Teste 2: Todoist → Miro**
1. Abra o Todoist
2. Marque uma tarefa como concluída
3. Verifique se foi atualizada no Miro

### **Monitorar Execuções**
1. No Make.com, vá em **"Scenarios"**
2. Clique no cenário
3. Veja **"Execution history"**
4. Debug erros se necessário

## 📊 Estrutura de Dados

### **Webhook do Miro**
```json
{
  "type": "BOARD_CONTENT_UPDATED",
  "data": {
    "boardId": "board-123",
    "items": [{
      "id": "item-456",
      "type": "sticky_note",
      "plainText": "Minha tarefa",
      "position": {"x": 100, "y": 200}
    }]
  }
}
```

### **Webhook do Todoist**
```json
{
  "event_name": "item:completed",
  "event_data": {
    "id": "task-789",
    "content": "Minha tarefa",
    "project_id": "project-123",
    "checked": 1,
    "date_completed": "2025-11-01T10:00:00Z"
  }
}
```

## 🎨 Cenários Avançados

### **Cenário 3: Sincronização Bidirecional Inteligente**
```
[Webhook] → [Router] → [Filter Miro] → [Todoist Action]
                    → [Filter Todoist] → [Miro Action]
```

### **Cenário 4: Notificações**
```
[Webhook] → [Filter] → [Email/Slack] → [Log to Sheet]
```

### **Cenário 5: Backup Automático**
```
[Schedule] → [Miro: List Items] → [Google Sheets: Add Row]
```

## 💡 Dicas Importantes

### **Evitar Loops Infinitos**
1. Use **filtros** para identificar origem
2. Adicione **delay** entre ações
3. Use **flags** para marcar itens sincronizados

### **Mapeamento de Dados**
- **Miro ID** ↔ **Todoist ID**: Salve em Google Sheets
- **Status**: Miro tags ↔ Todoist labels
- **Prioridade**: Miro cores ↔ Todoist priority

### **Tratamento de Erros**
1. Configure **Error handling**
2. Use **Break** para parar em erros
3. Adicione **Email notifications**

## 🚀 Vantagens do Make.com

| Aspecto | Make.com | Servidor Próprio |
|---------|----------|------------------|
| **Setup** | ✅ 10 minutos | ❌ Horas |
| **Manutenção** | ✅ Zero | ❌ Constante |
| **Webhooks** | ✅ Automático | ❌ Manual |
| **Monitoramento** | ✅ Interface visual | ❌ Logs complexos |
| **Escalabilidade** | ✅ Automática | ❌ Manual |
| **Custo** | ✅ Gratuito (1k ops) | ❌ Hosting |

## 📈 Planos Make.com

- **Free**: 1.000 operações/mês
- **Core**: $9/mês - 10.000 operações
- **Pro**: $16/mês - 40.000 operações
- **Teams**: $29/mês - 80.000 operações

## 🎯 Resultado Final

Com Make.com você terá:

✅ **Sincronização automática** Miro ↔ Todoist
✅ **Interface visual** para configurar
✅ **Monitoramento** em tempo real
✅ **Logs detalhados** de cada execução
✅ **Tratamento de erros** automático
✅ **Escalabilidade** sem configuração

## 🔗 Links Úteis

- **Make.com**: https://www.make.com/
- **Miro API**: https://developers.miro.com/
- **Todoist API**: https://developer.todoist.com/
- **Make Templates**: https://www.make.com/en/templates

---

**🎉 Com Make.com, você terá sincronização profissional sem escrever uma linha de código!**