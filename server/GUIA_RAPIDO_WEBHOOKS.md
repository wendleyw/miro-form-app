# 🚀 Guia Rápido: Configurar Webhooks Miro ↔ Todoist

## ⚡ Configuração Rápida (5 minutos)

### 1. **Preparar Ambiente**
```bash
# 1. Instalar ngrok (para desenvolvimento)
npm install -g ngrok

# 2. Expor servidor local
ngrok http 3001
# Copie a URL HTTPS (ex: https://abc123.ngrok.io)
```

### 2. **Configurar .env**
```bash
# Adicione no arquivo server/.env:
WEBHOOK_BASE_URL=https://abc123.ngrok.io
MIRO_ACCESS_TOKEN=seu_token_miro
TODOIST_API_TOKEN=seu_token_todoist
```

### 3. **Obter Tokens**

**Miro Token:**
1. Acesse https://developers.miro.com/
2. Crie um app → Copie o Access Token
3. Permissões necessárias: `boards:read`, `boards:write`, `webhooks:read`, `webhooks:write`

**Todoist Token:**
1. Acesse https://todoist.com/prefs/integrations
2. Role até "API token" → Copie o token
3. ⚠️ Requer conta Premium para webhooks

### 4. **Configurar Webhooks Automaticamente**
```bash
# Configurar todos os webhooks de uma vez
npx ts-node scripts/setup-all-webhooks.ts

# Ou individualmente:
npx ts-node scripts/setup-miro-webhook.ts
npx ts-node scripts/setup-todoist-webhook.ts
```

### 5. **Testar**
```bash
# Iniciar servidor
npm run dev

# Testar webhooks
npx ts-node scripts/test-webhooks.ts

# Testar sincronização completa
npx ts-node scripts/test-bidirectional-sync.ts
```

## 🎯 Configuração Manual (se automática falhar)

### **Miro (via API)**
```bash
curl -X POST https://api.miro.com/v2/webhooks \
  -H "Authorization: Bearer SEU_MIRO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackUrl": "https://sua-url.ngrok.io/api/webhooks/miro",
    "events": ["app_card.created", "app_card.updated", "app_card.deleted"]
  }'
```

### **Todoist (via Interface Web)**
1. Acesse https://developer.todoist.com/appconsole.html
2. Crie/selecione seu app
3. Em Webhooks, adicione:
   - **URL**: `https://sua-url.ngrok.io/api/webhooks/todoist`
   - **Eventos**: `item:added`, `item:updated`, `item:completed`

## 🧪 Teste Rápido

### **Teste via curl:**
```bash
# Testar endpoint Miro
curl -X POST http://localhost:3001/api/webhooks/miro \
  -H "Content-Type: application/json" \
  -d '{"type":"app_card.updated","data":{"boardId":"test","widgetId":"test","completed":true}}'

# Testar endpoint Todoist  
curl -X POST http://localhost:3001/api/webhooks/todoist \
  -H "Content-Type: application/json" \
  -d '{"event_name":"item:completed","event_data":{"id":"test","content":"Test task","checked":1}}'
```

### **Teste Real:**
1. **Miro**: Abra um board → Modifique um card → Veja logs do servidor
2. **Todoist**: Marque uma tarefa como concluída → Veja logs do servidor

## 🔍 Verificar se Funcionou

### **Verificar webhooks configurados:**
```bash
# Miro
curl -H "Authorization: Bearer SEU_MIRO_TOKEN" https://api.miro.com/v2/webhooks

# Todoist (via interface web)
# Acesse https://developer.todoist.com/appconsole.html
```

### **Logs do servidor devem mostrar:**
```
Miro webhook received: app_card.updated
Todoist webhook received: item:completed
Sync completed successfully
```

## ⚠️ Problemas Comuns

### **Webhook não recebe eventos**
- ✅ Verifique se a URL está acessível publicamente
- ✅ Use ngrok: `ngrok http 3001`
- ✅ Configure `WEBHOOK_BASE_URL` no .env

### **Erro 401 (Unauthorized)**
- ✅ Verifique tokens no .env
- ✅ Verifique permissões do app
- ✅ Regenere tokens se necessário

### **Erro 404 (Not Found)**
- ✅ Verifique se o servidor está rodando
- ✅ Verifique se as rotas existem
- ✅ Teste com curl primeiro

## 📊 Status Atual do Sistema

✅ **Endpoints funcionando:**
- `POST /api/webhooks/miro` - Processa eventos do Miro
- `POST /api/webhooks/todoist` - Processa eventos do Todoist
- `GET /api/webhooks/health` - Verifica saúde do sistema

✅ **Sincronização implementada:**
- Miro → Todoist (quando tarefa é marcada no Miro)
- Todoist → Miro (quando tarefa é marcada no Todoist)
- Resolução de conflitos (last-write-wins)
- Logs de auditoria

⚠️ **Para produção:**
- Configure URL permanente (não ngrok)
- Configure SSL/HTTPS
- Configure monitoramento
- Configure backup dos webhooks

## 🎉 Resultado Final

Após seguir este guia, você terá:

1. ✅ Webhooks configurados no Miro e Todoist
2. ✅ Sincronização bidirecional funcionando
3. ✅ Sistema testado e validado
4. ✅ Logs e monitoramento ativos

**Mudanças em uma plataforma serão automaticamente replicadas na outra!**

---

## 📚 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `setup-all-webhooks.ts` | Configura todos os webhooks |
| `setup-miro-webhook.ts` | Configura apenas Miro |
| `setup-todoist-webhook.ts` | Configura apenas Todoist |
| `test-webhooks.ts` | Testa se webhooks funcionam |
| `test-bidirectional-sync.ts` | Testa sincronização completa |
| `test-api-sync.ts` | Testa API REST |

## 🆘 Suporte

Se algo não funcionar:

1. **Verifique os logs** do servidor
2. **Execute** `npx ts-node scripts/test-webhooks.ts`
3. **Consulte** `server/CONFIGURACAO_WEBHOOKS.md` (guia completo)
4. **Teste manualmente** com curl primeiro

**🚀 Seu sistema de sincronização Miro ↔ Todoist está pronto!**