# ⚡ Setup Rápido: Make.com para Miro ↔ Todoist

## 🎯 Configuração em 15 Minutos

### **Seus Tokens**
- **Miro**: `eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K66MkyC3_3M_UMAOuvmYAfA3nZo`
- **Todoist**: `63dd8d664d3e8a0570a2bd7c4981be8421c70975`

---

## 📋 Cenário 1: Miro → Todoist

### **Passo 1: Criar Cenário**
1. Acesse: https://www.make.com/
2. Clique **"Create a new scenario"**
3. Busque **"Miro"** → Selecione **"Watch Board Items"**

### **Passo 2: Configurar Miro**
```
Connection: [Adicionar nova conexão]
- Cole seu token Miro
- Teste conexão

Board ID: [ID do seu board Miro]
Item Types: ["sticky_note", "card", "text"]
Events: ["created", "updated"]
```

### **Passo 3: Adicionar Todoist**
1. Clique **"+"** após módulo Miro
2. Busque **"Todoist"** → **"Create a Task"**

### **Passo 4: Configurar Todoist**
```
Connection: [Adicionar nova conexão]
- Cole seu token Todoist
- Teste conexão

Content: {{1.text}}
Project ID: [ID do projeto Todoist]
Labels: ["miro-sync"]
Description: "Criado do Miro: {{1.id}}"
```

### **Passo 5: Ativar**
1. Clique **"Save"**
2. Ative o cenário (toggle ON)
3. Teste criando um item no Miro

---

## 📋 Cenário 2: Todoist → Miro

### **Passo 1: Novo Cenário**
1. **"Create a new scenario"**
2. **"Todoist"** → **"Watch Events"**

### **Passo 2: Configurar Todoist**
```
Connection: [Usar conexão existente]
Event Types: ["item:completed", "item:updated"]
Project ID: [Mesmo projeto anterior]
```

### **Passo 3: Adicionar Miro**
1. **"+"** → **"Miro"** → **"Update Board Item"**

### **Passo 4: Configurar Miro**
```
Connection: [Usar conexão existente]
Board ID: [Mesmo board anterior]
Item ID: {{1.id}}
Text: "✅ {{1.content}}"
```

### **Passo 5: Ativar**
1. **"Save"** e ativar
2. Teste marcando tarefa no Todoist

---

## 🔧 Configurações Essenciais

### **Filtros Recomendados**

#### **No Cenário Miro → Todoist:**
```
Condição: {{1.text}} não está vazio
```

#### **No Cenário Todoist → Miro:**
```
Condição: {{1.labels}} contém "miro-sync"
```

### **Mapeamento de Dados**

#### **Status Mapping:**
```javascript
// Todoist completed → Miro visual
if({{1.checked}} = true, "✅ CONCLUÍDO", "⏳ PENDENTE")
```

#### **Cores por Prioridade:**
```javascript
// Todoist priority → Miro color
switch({{1.priority}}, 
  4, "red",     // Urgente
  3, "orange",  // Alta
  2, "yellow",  // Média
  1, "blue"     // Baixa
)
```

---

## 🧪 Teste Rápido

### **Checklist de Teste**

#### **✅ Miro → Todoist**
- [ ] Criar sticky note no Miro
- [ ] Verificar se tarefa aparece no Todoist
- [ ] Verificar se tem label "miro-sync"

#### **✅ Todoist → Miro**
- [ ] Marcar tarefa como concluída no Todoist
- [ ] Verificar se item atualiza no Miro
- [ ] Verificar se aparece "✅ CONCLUÍDO"

#### **✅ Logs**
- [ ] Verificar execuções em Make.com → History
- [ ] Confirmar 0 erros
- [ ] Verificar tempo de execução < 30s

---

## 🚨 Troubleshooting Rápido

### **Erro: "Invalid token"**
```bash
# Verificar tokens
curl -H "Authorization: Bearer SEU_TOKEN_MIRO" https://api.miro.com/v2/boards
curl -H "Authorization: Bearer SEU_TOKEN_TODOIST" https://api.todoist.com/rest/v2/projects
```

### **Erro: "Board not found"**
1. Abra seu board no Miro
2. URL: `https://miro.com/app/board/BOARD_ID/`
3. Copie o `BOARD_ID` da URL

### **Erro: "Project not found"**
1. Abra Todoist
2. Clique no projeto
3. URL: `https://todoist.com/app/project/PROJECT_ID`
4. Copie o `PROJECT_ID`

---

## 💡 Dicas de Otimização

### **Performance**
- ✅ Use filtros para reduzir operações
- ✅ Configure intervalo de 5 minutos (suficiente)
- ✅ Limite tipos de itens monitorados

### **Organização**
- ✅ Nomeie cenários claramente: "Miro→Todoist Sync"
- ✅ Use labels consistentes: "miro-sync", "auto-created"
- ✅ Documente mapeamentos especiais

### **Monitoramento**
- ✅ Configure notificações de erro por email
- ✅ Verifique logs semanalmente
- ✅ Monitore uso de operações

---

## 📊 Resultado Final

### **O que você terá:**
- ✅ **Sincronização automática** Miro ↔ Todoist
- ✅ **Tempo real** - Mudanças em 1-5 minutos
- ✅ **Logs detalhados** - Debug fácil
- ✅ **Retry automático** - Falhas são tratadas
- ✅ **Interface visual** - Fácil de modificar

### **Operações estimadas:**
- **Uso básico**: ~50 operações/mês
- **Uso médio**: ~200 operações/mês
- **Uso intenso**: ~500 operações/mês

**Plano gratuito (1000 ops/mês) é suficiente para a maioria dos casos!**

---

## 🎉 Links Úteis

- **Make.com**: https://www.make.com/
- **Templates**: https://www.make.com/en/templates
- **Documentação**: https://www.make.com/en/help
- **Suporte**: Chat ao vivo no Make.com

---

**🚀 Em 15 minutos você terá uma integração profissional funcionando!**