# 🔄 Miro Todoist Sync App

App interno do Miro para sincronizar sticky notes com tarefas do Todoist usando Make.com.

## 🚀 Funcionalidades

- ✅ **Sincronização Miro → Todoist** - Converte sticky notes em tarefas
- ✅ **Sincronização Todoist → Miro** - Importa tarefas como sticky notes  
- ✅ **Auto Sync** - Sincronização automática a cada 30 segundos
- ✅ **Interface nativa** - Integrado ao Miro
- ✅ **Estatísticas** - Acompanhe quantos itens estão sincronizados
- ✅ **Logs detalhados** - Veja o que está acontecendo

## 🔧 Como Usar

### 1. **Configurar Make.com**
1. Acesse https://www.make.com/
2. Crie um cenário com webhook
3. Copie a URL do webhook

### 2. **Configurar App**
1. Cole seu token do Todoist
2. Cole a URL do Make.com
3. Selecione um projeto no Todoist
4. Clique "Salvar Configuração"

### 3. **Sincronizar**
- **Miro → Todoist**: Clique "Miro → Todoist"
- **Todoist → Miro**: Clique "Todoist → Miro"
- **Auto**: Ative "Auto Sync" para sincronização automática

## 🎯 Fluxo de Dados

### **Miro → Todoist**
```
[Sticky Note] → [App] → [Make.com] → [Todoist Task]
```

### **Todoist → Miro**
```
[Todoist Task] → [Make.com Webhook] → [Miro API] → [Sticky Note]
```

## 📊 Arquivos

- `index.html` - Interface do app
- `style.css` - Estilos visuais
- `app.js` - Lógica principal
- `manifest.json` - Configuração do app Miro

## 🔗 Deploy

### **Opção 1: GitHub Pages**
1. Faça upload dos arquivos para um repositório
2. Ative GitHub Pages
3. Use a URL gerada

### **Opção 2: Vercel**
1. Conecte o repositório ao Vercel
2. Deploy automático
3. Use a URL gerada

### **Opção 3: Netlify**
1. Arraste a pasta para Netlify
2. Deploy instantâneo
3. Use a URL gerada

## 🎨 Instalar no Miro

1. Acesse https://developers.miro.com/
2. "Create new app"
3. Configure:
   - **App URL**: URL onde hospedou os arquivos
   - **Permissions**: boards:read, boards:write
4. Instale no seu board

## 🔧 Configuração Make.com

### **Cenário: Todoist → Miro**
```
[Webhook] → [HTTP Request para Miro API]
```

**Configuração HTTP Request:**
- URL: `https://api.miro.com/v2/boards/{{board_id}}/sticky_notes`
- Method: POST
- Headers: `Authorization: Bearer SEU_MIRO_TOKEN`
- Body:
```json
{
  "data": {
    "content": "{{event_data.content}}",
    "style": {
      "fillColor": "light_yellow"
    }
  }
}
```

## 🎉 Resultado

Com este app você terá:

- ✅ **Interface nativa** no Miro
- ✅ **Sincronização bidirecional** automática
- ✅ **Controle total** sobre quando sincronizar
- ✅ **Logs detalhados** para debug
- ✅ **Estatísticas** em tempo real
- ✅ **Sem servidor próprio** - usa Make.com

---

**🚀 App profissional integrado ao Miro para sincronização com Todoist!**