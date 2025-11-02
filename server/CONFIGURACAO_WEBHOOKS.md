# 🔗 Guia de Configuração de Webhooks

Este guia explica como configurar webhooks no Miro e Todoist para sincronização automática.

## 🎨 Configuração do Webhook do Miro

### Pré-requisitos
1. **App do Miro**: Você precisa ter um app criado no Miro
2. **Access Token**: Token de acesso com permissões adequadas
3. **Servidor público**: URL acessível pela internet (use ngrok para desenvolvimento)

### Passo 1: Criar App no Miro

1. Acesse [Miro Developer Console](https://developers.miro.com/)
2. Clique em "Create new app"
3. Preencha as informações:
   - **App name**: "Sistema de Sincronização"
   - **Description**: "App para sincronizar tarefas com Todoist"
4. Em **Permissions**, selecione:
   - `boards:read` - Ler boards
   - `boards:write` - Modificar boards
   - `webhooks:read` - Ler webhooks
   - `webhooks:write` - Criar webhooks

### Passo 2: Obter Access Token

1. No seu app, vá para a aba **OAuth & Permissions**
2. Copie o **Access Token**
3. Adicione no seu `.env`:
   ```bash
   MIRO_ACCESS_TOKEN=seu_token_aqui
   ```

### Passo 3: Configurar URL Pública (Desenvolvimento)

Para desenvolvimento local, use ngrok:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3001
ngrok http 3001
```

Copie a URL HTTPS gerada (ex: `https://abc123.ngrok.io`) e adicione no `.env`:
```bash
WEBHOOK_BASE_URL=https://abc123.ngrok.io
```

### Passo 4: Configurar Webhook Automaticamente

Execute o script de configuração:

```bash
npx ts-node scripts/setup-miro-webhook.ts
```

### Passo 5: Configuração Manual (Alternativa)

Se preferir configurar manualmente via API:

```bash
curl -X POST https://api.miro.com/v2/webhooks \
  -H "Authorization: Bearer SEU_MIRO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackUrl": "https://sua-url.ngrok.io/api/webhooks/miro",
    "events": [
      "app_card.created",
      "app_card.updated", 
      "app_card.deleted"
    ]
  }'
```

## 📝 Configuração do Webhook do Todoist

### Pré-requisitos
1. **Conta Todoist Premium**: Webhooks só estão disponíveis na versão premium
2. **API Token**: Token de acesso da API do Todoist
3. **Servidor público**: URL acessível pela internet

### Passo 1: Obter API Token

1. Acesse [Todoist Integrations](https://todoist.com/prefs/integrations)
2. Role até "API token"
3. Copie o token e adicione no `.env`:
   ```bash
   TODOIST_API_TOKEN=seu_token_aqui
   ```

### Passo 2: Configurar Webhook

O Todoist não tem uma API para criar webhooks automaticamente. Configure via interface web:

1. Acesse [Todoist App Console](https://developer.todoist.com/appconsole.html)
2. Crie um novo app ou use um existente
3. Em **Webhooks**, adicione:
   - **URL**: `https://sua-url.ngrok.io/api/webhooks/todoist`
   - **Events**: Selecione os eventos desejados:
     - `item:added` - Item criado
     - `item:updated` - Item atualizado
     - `item:completed` - Item concluído
     - `item:uncompleted` - Item reaberto

### Passo 3: Configuração Manual via API (Alternativa)

```bash
curl -X POST https://api.todoist.com/sync/v9/webhooks/add \
  -H "Authorization: Bearer SEU_TODOIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sua-url.ngrok.io/api/webhooks/todoist",
    "events": ["item:added", "item:updated", "item:completed"]
  }'
```

## 🛠️ Scripts de Configuração Automática

### Script para Miro

Crie o arquivo `scripts/setup-miro-webhook.ts`:

```typescript
#!/usr/bin/env ts-node

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupMiroWebhook() {
  const MIRO_TOKEN = process.env.MIRO_ACCESS_TOKEN;
  const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:3001';

  if (!MIRO_TOKEN) {
    console.error('❌ MIRO_ACCESS_TOKEN não encontrado no .env');
    return;
  }

  try {
    const webhookData = {
      callbackUrl: `${WEBHOOK_URL}/api/webhooks/miro`,
      events: [
        'app_card.created',
        'app_card.updated',
        'app_card.deleted'
      ]
    };

    const response = await axios.post('https://api.miro.com/v2/webhooks', webhookData, {
      headers: {
        'Authorization': `Bearer ${MIRO_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook do Miro configurado!');
    console.log(`ID: ${response.data.id}`);
    
  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

setupMiroWebhook();
```

### Script para Todoist

Crie o arquivo `scripts/setup-todoist-webhook.ts`:

```typescript
#!/usr/bin/env ts-node

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupTodoistWebhook() {
  const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN;
  const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:3001';

  if (!TODOIST_TOKEN) {
    console.error('❌ TODOIST_API_TOKEN não encontrado no .env');
    return;
  }

  try {
    const webhookData = {
      url: `${WEBHOOK_URL}/api/webhooks/todoist`,
      events: ['item:added', 'item:updated', 'item:completed', 'item:uncompleted']
    };

    const response = await axios.post('https://api.todoist.com/sync/v9/webhooks/add', webhookData, {
      headers: {
        'Authorization': `Bearer ${TODOIST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook do Todoist configurado!');
    console.log('Response:', response.data);
    
  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

setupTodoistWebhook();
```

## 🧪 Testando os Webhooks

### Teste do Webhook do Miro

1. **Inicie seu servidor**:
   ```bash
   npm run dev
   ```

2. **Abra um board no Miro**

3. **Adicione ou modifique um card**

4. **Verifique os logs do servidor** - você deve ver algo como:
   ```
   Miro webhook received: app_card.updated
   Processing board: board-123, widget: widget-456
   ```

### Teste do Webhook do Todoist

1. **Inicie seu servidor**:
   ```bash
   npm run dev
   ```

2. **Abra o Todoist**

3. **Marque uma tarefa como concluída**

4. **Verifique os logs do servidor** - você deve ver algo como:
   ```
   Todoist webhook received: item:completed
   Processing task: task-789, project: project-123
   ```

## 🔍 Verificação e Troubleshooting

### Verificar Webhooks Configurados

**Miro**:
```bash
curl -H "Authorization: Bearer SEU_MIRO_TOKEN" \
  https://api.miro.com/v2/webhooks
```

**Todoist**:
```bash
curl -H "Authorization: Bearer SEU_TODOIST_TOKEN" \
  https://api.todoist.com/sync/v9/webhooks/list
```

### Problemas Comuns

#### Webhook não recebe eventos

1. **Verifique a URL**: Certifique-se de que está acessível publicamente
2. **Teste com curl**:
   ```bash
   curl -X POST https://sua-url.ngrok.io/api/webhooks/miro \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

#### Erro 401 (Unauthorized)

1. **Verifique o token**: Certifique-se de que está correto no `.env`
2. **Verifique permissões**: O app precisa das permissões adequadas
3. **Reinstale o app**: Às vezes é necessário reinstalar no workspace

#### Erro 404 (Not Found)

1. **Verifique a rota**: Certifique-se de que `/api/webhooks/miro` existe
2. **Verifique o servidor**: Certifique-se de que está rodando na porta correta

## 📋 Checklist de Configuração

### Miro
- [ ] App criado no Miro Developer Console
- [ ] Permissões configuradas (boards:read, boards:write, webhooks:read, webhooks:write)
- [ ] Access Token obtido e adicionado ao .env
- [ ] URL pública configurada (ngrok para desenvolvimento)
- [ ] Webhook criado via API ou script
- [ ] Teste realizado (modificar card no Miro)

### Todoist
- [ ] Conta Todoist Premium ativa
- [ ] API Token obtido e adicionado ao .env
- [ ] App criado no Todoist App Console (se necessário)
- [ ] Webhook configurado via interface web ou API
- [ ] Eventos selecionados (item:added, item:updated, item:completed)
- [ ] Teste realizado (marcar tarefa como concluída)

### Servidor
- [ ] Servidor rodando na porta 3001
- [ ] Endpoints `/api/webhooks/miro` e `/api/webhooks/todoist` funcionando
- [ ] Logs habilitados para debug
- [ ] URL pública acessível (ngrok configurado)

## 🚀 Próximos Passos

Após configurar os webhooks:

1. **Teste a sincronização completa**:
   ```bash
   npx ts-node scripts/test-bidirectional-sync.ts
   ```

2. **Monitore os logs** para verificar se os eventos estão sendo processados

3. **Configure em produção** usando uma URL permanente (não ngrok)

4. **Implemente tratamento de erros** adicional se necessário

5. **Configure monitoramento** para acompanhar a saúde dos webhooks

---

**🎉 Com os webhooks configurados, seu sistema estará sincronizando automaticamente entre Miro e Todoist em tempo real!**