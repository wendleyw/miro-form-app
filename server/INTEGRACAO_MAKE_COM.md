# 🔗 Integração Miro ↔ Todoist via Make.com

## 🎯 Por que usar Make.com?

### **Vantagens**
- ✅ **Interface visual** - Sem código complexo
- ✅ **Conectores nativos** - Miro e Todoist já integrados
- ✅ **Webhooks automáticos** - Make.com gerencia tudo
- ✅ **Logs detalhados** - Debug fácil
- ✅ **Filtros avançados** - Controle total dos dados
- ✅ **Transformações** - Mapear dados entre plataformas
- ✅ **Retry automático** - Falhas são tratadas automaticamente

### **vs. Webhooks Diretos**
| Aspecto | Make.com | Webhooks Diretos |
|---------|----------|------------------|
| **Configuração** | ✅ Visual, 5 min | ❌ Código, horas |
| **Manutenção** | ✅ Automática | ❌ Manual |
| **Logs** | ✅ Interface web | ❌ Logs do servidor |
| **Retry** | ✅ Automático | ❌ Implementar manualmente |
| **Filtros** | ✅ Interface visual | ❌ Código |

## 🚀 Configuração Passo a Passo

### **Passo 1: Criar Conta no Make.com**

1. **Acesse**: https://www.make.com/
2. **Crie conta gratuita** (1000 operações/mês)
3. **Confirme email** e faça login

### **Passo 2: Criar Cenário Miro → Todoist**

#### **2.1 Novo Cenário**
1. Clique em **"Create a new scenario"**
2. Busque por **"Miro"** e selecione
3. Escolha **"Watch Board Items"** ou **"Watch Board Changes"**

#### **2.2 Configurar Trigger do Miro**
1. **Conectar conta Miro**:
   - Clique em **"Add"** ao lado de Connection
   - Autorize o Make.com no Miro
   - Use seu token: `eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K66MkyC3_3M_UMAOuvmYAfA3nZo`

2. **Configurar trigger**:
   - **Board ID**: ID do board que você quer monitorar
   - **Item Types**: Selecione tipos de itens (cards, sticky notes, etc.)
   - **Events**: Selecione eventos (created, updated, deleted)

#### **2.3 Adicionar Ação do Todoist**
1. Clique no **"+"** após o módulo Miro
2. Busque por **"Todoist"** e selecione
3. Escolha **"Create a Task"**

#### **2.4 Configurar Ação do Todoist**
1. **Conectar conta Todoist**:
   - Use seu token: `63dd8d664d3e8a0570a2bd7c4981be8421c70975`

2. **Mapear dados**:
   - **Content**: `{{1.text}}` (texto do item do Miro)
   - **Project ID**: ID do projeto Todoist
   - **Labels**: `miro-sync`
   - **Description**: `Criado a partir do Miro: {{1.id}}`

### **Passo 3: Criar Cenário Todoist → Miro**

#### **3.1 Novo Cenário**
1. Crie outro cenário
2. Busque por **"Todoist"** como trigger
3. Escolha **"Watch Events"** ou **"Watch Tasks"**

#### **3.2 Configurar Trigger do Todoist**
1. **Conectar conta** (mesmo token anterior)
2. **Event Types**: `item:completed`, `item:updated`
3. **Project ID**: Projeto específico ou todos

#### **3.3 Adicionar Ação do Miro**
1. Adicione módulo **Miro**
2. Escolha **"Update Board Item"** ou **"Create Board Item"**
3. **Mapear dados**:
   - **Board ID**: Board de destino
   - **Item ID**: `{{1.id}}` (se atualizando)
   - **Content**: `{{1.content}}`
   - **Status**: Baseado no status do Todoist

## 🔧 Configurações Avançadas

### **Filtros e Condições**

#### **Filtro por Labels**
```
{{1.labels}} contains "miro-sync"
```

#### **Filtro por Projeto**
```
{{1.project_id}} = "2203306141"
```

#### **Filtro por Status**
```
{{1.checked}} = true
```

### **Transformações de Dados**

#### **Mapear Status Todoist → Miro**
```javascript
// No Make.com, use funções condicionais
if({{1.checked}} = true, "completed", "pending")
```

#### **Criar Título Personalizado**
```
[{{1.project.name}}] {{1.content}}
```

### **Tratamento de Erros**

1. **Adicionar Error Handler**:
   - Clique com botão direito no módulo
   - Selecione **"Add error handler"**

2. **Configurar Retry**:
   - **Max attempts**: 3
   - **Interval**: 1 minuto

3. **Notificação de Erro**:
   - Adicione módulo **Email** ou **Slack**
   - Configure para receber alertas

## 📋 Templates Prontos

### **Template 1: Sincronização Básica**

**Miro → Todoist:**
- **Trigger**: Miro - Watch Board Items
- **Filter**: Item type = "sticky_note"
- **Action**: Todoist - Create Task
- **Mapping**:
  - Content: `{{text}}`
  - Project: "Miro Tasks"
  - Labels: ["miro", "sync"]

**Todoist → Miro:**
- **Trigger**: Todoist - Watch Events
- **Filter**: Event = "item:completed"
- **Action**: Miro - Update Board Item
- **Mapping**:
  - Status: "completed"
  - Color: "green"

### **Template 2: Sincronização Avançada**

**Recursos adicionais:**
- ✅ Filtros por projeto/board específico
- ✅ Transformação de dados
- ✅ Notificações de erro
- ✅ Logs detalhados
- ✅ Retry automático

## 🧪 Teste da Integração

### **Passo 1: Teste Manual**
1. **No Make.com**:
   - Clique em **"Run once"** no cenário
   - Verifique se os módulos executam sem erro

2. **No Miro**:
   - Crie um sticky note no board configurado
   - Verifique se aparece no Todoist

3. **No Todoist**:
   - Marque uma tarefa como concluída
   - Verifique se atualiza no Miro

### **Passo 2: Monitoramento**
1. **Logs do Make.com**:
   - Vá para **"History"** no cenário
   - Verifique execuções e erros

2. **Teste de Carga**:
   - Crie várias tarefas rapidamente
   - Verifique se todas são sincronizadas

## 💰 Custos e Limites

### **Plano Gratuito**
- ✅ **1.000 operações/mês**
- ✅ **2 cenários ativos**
- ✅ **Execução a cada 15 minutos**

### **Plano Pago (Core - $9/mês)**
- ✅ **10.000 operações/mês**
- ✅ **Cenários ilimitados**
- ✅ **Execução a cada 1 minuto**
- ✅ **Webhooks instantâneos**

### **Estimativa de Uso**
- **Sincronização básica**: ~100 operações/mês
- **Uso intenso**: ~500 operações/mês
- **Equipe pequena**: ~1.000 operações/mês

## 🔍 Troubleshooting

### **Problemas Comuns**

#### **1. Conexão Falha**
```
Erro: "Invalid token"
```
**Solução**: Verificar tokens do Miro e Todoist

#### **2. Board/Projeto Não Encontrado**
```
Erro: "Board not found"
```
**Solução**: Verificar IDs e permissões

#### **3. Rate Limit**
```
Erro: "Too many requests"
```
**Solução**: Aumentar intervalo entre execuções

### **Debug Avançado**

1. **Logs Detalhados**:
   - Ative **"Store incomplete executions"**
   - Verifique dados de entrada/saída

2. **Teste Isolado**:
   - Execute módulos individualmente
   - Verifique mapeamento de dados

## 📚 Recursos Adicionais

### **Documentação**
- **Make.com Docs**: https://www.make.com/en/help
- **Miro API**: https://developers.miro.com/docs
- **Todoist API**: https://developer.todoist.com/

### **Templates da Comunidade**
- **Make.com Templates**: https://www.make.com/en/templates
- **Buscar por**: "Miro Todoist integration"

### **Suporte**
- **Make.com Support**: Chat ao vivo
- **Community Forum**: https://community.make.com/
- **Video Tutorials**: YouTube Make.com

## 🎉 Vantagens da Solução

### **Para Você**
- ✅ **Configuração rápida** - 15 minutos vs. horas de código
- ✅ **Sem manutenção** - Make.com cuida de tudo
- ✅ **Interface visual** - Fácil de entender e modificar
- ✅ **Logs detalhados** - Debug simples

### **Para o Projeto**
- ✅ **Menos código** - Foco no core business
- ✅ **Mais confiável** - Infraestrutura profissional
- ✅ **Escalável** - Suporta crescimento
- ✅ **Flexível** - Fácil de modificar

## 🚀 Próximos Passos

1. **Criar conta no Make.com**
2. **Configurar primeiro cenário** (Miro → Todoist)
3. **Testar sincronização**
4. **Configurar segundo cenário** (Todoist → Miro)
5. **Ativar monitoramento**
6. **Documentar fluxos** para a equipe

---

**🎯 Com Make.com, você terá uma integração profissional entre Miro e Todoist funcionando em minutos, não horas!**