# 🎯 Make.com - Passo a Passo Visual

## ⚡ 5 Passos Simples

### **Passo 1: Criar Conta Make.com**
1. Vá em https://www.make.com/
2. Clique "Sign up for free"
3. Use seu email para criar conta

### **Passo 2: Criar Primeiro Cenário (Miro → Todoist)**

#### **2.1 Novo Cenário**
- Dashboard → "Create a new scenario"
- Clique no **"+"** grande no centro

#### **2.2 Adicionar Webhook**
- Pesquise "Webhooks"
- Selecione "Custom webhook"
- Clique "Add"
- **COPIE A URL** que aparece (ex: `https://hook.eu1.make.com/abc123`)

#### **2.3 Configurar Webhook no Miro**
Execute este comando (substitua SUA_URL):

```bash
curl -X POST https://api.miro.com/v2/webhooks \
  -H "Authorization: Bearer eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K66MkyC3_3M_UMAOuvmYAfA3nZo" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackUrl": "SUA_URL_DO_MAKE_AQUI",
    "eventTypes": ["BOARD_CONTENT_UPDATED"]
  }'
```

#### **2.4 Adicionar Todoist**
- Clique no **"+"** após o webhook
- Pesquise "Todoist"
- Selecione "Create a Task"
- Conecte com token: `63dd8d664d3e8a0570a2bd7c4981be8421c70975`
- Configure:
  - **Project**: Escolha um projeto
  - **Content**: `{{data.plainText}}` (do webhook)

#### **2.5 Salvar e Ativar**
- Clique "Save"
- Toggle "ON" para ativar

### **Passo 3: Criar Segundo Cenário (Todoist → Miro)**

#### **3.1 Novo Cenário**
- "Create a new scenario"
- Adicione "Webhooks" → "Custom webhook"
- **COPIE A NOVA URL**

#### **3.2 Configurar Webhook no Todoist**
1. Vá em https://developer.todoist.com/appconsole.html
2. Crie um app ou use existente
3. Seção "Webhooks" → "Add webhook"
4. Cole a URL do Make.com
5. Selecione eventos: `item:completed`, `item:updated`

#### **3.3 Adicionar Miro**
- Clique **"+"** após webhook
- Pesquise "Miro"
- Selecione "Create Item"
- Conecte sua conta Miro
- Configure:
  - **Board**: Selecione seu board
  - **Type**: "sticky_note"
  - **Content**: `{{event_data.content}}`

#### **3.4 Salvar e Ativar**
- "Save" → Toggle "ON"

### **Passo 4: Testar**

#### **Teste Miro → Todoist**
1. Abra seu board no Miro
2. Crie um sticky note: "Teste Make.com"
3. Vá no Todoist → deve aparecer a tarefa

#### **Teste Todoist → Miro**
1. Abra Todoist
2. Crie tarefa: "Teste do Todoist"
3. Vá no Miro → deve aparecer sticky note

### **Passo 5: Monitorar**
- Make.com → "Scenarios"
- Clique no cenário
- Veja "Execution history"
- Debug erros se houver

## 🎯 URLs Importantes

### **Seus Tokens**
- **Miro**: `eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K66MkyC3_3M_UMAOuvmYAfA3nZo`
- **Todoist**: `63dd8d664d3e8a0570a2bd7c4981be8421c70975`

### **Configuração Webhooks**
- **Make.com**: https://www.make.com/
- **Miro Webhooks**: https://developers.miro.com/docs/webhooks
- **Todoist Webhooks**: https://developer.todoist.com/appconsole.html

## 🔧 Comandos Prontos

### **Configurar Webhook Miro**
```bash
curl -X POST https://api.miro.com/v2/webhooks \
  -H "Authorization: Bearer eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K66MkyC3_3M_UMAOuvmYAfA3nZo" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackUrl": "COLE_SUA_URL_DO_MAKE_AQUI",
    "eventTypes": ["BOARD_CONTENT_UPDATED"]
  }'
```

### **Verificar Webhooks Miro**
```bash
curl -H "Authorization: Bearer eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K66MkyC3_3M_UMAOuvmYAfA3nZo" \
  https://api.miro.com/v2/webhooks
```

## 🎉 Resultado

Após seguir estes passos:

✅ **Miro → Todoist**: Sticky notes viram tarefas
✅ **Todoist → Miro**: Tarefas viram sticky notes  
✅ **Monitoramento**: Interface visual no Make.com
✅ **Sem código**: Tudo visual e simples
✅ **Gratuito**: 1000 operações/mês

## 🆘 Se Algo Der Errado

1. **Webhook não funciona**: Verifique se URL está correta
2. **Erro de autenticação**: Verifique tokens
3. **Nada acontece**: Veja "Execution history" no Make.com
4. **Loop infinito**: Adicione filtros para evitar

---

**🚀 Em 10 minutos você terá sincronização automática funcionando!**