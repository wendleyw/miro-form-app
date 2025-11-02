# 🎨 App Interno do Miro + Make.com

## 💡 Arquitetura Simplificada

### **Fluxo Proposto:**
```
[Miro App Interno] → [Make.com] → [Todoist]
[Todoist] → [Make.com Webhook] → [Miro API]
```

### **Vantagens:**
- ✅ **App nativo** - Interface integrada no Miro
- ✅ **Sem webhooks Miro** - App interno detecta mudanças
- ✅ **1 webhook só** - Apenas Todoist → Make.com
- ✅ **Mais simples** - Menos configuração
- ✅ **Mais confiável** - Menos pontos de falha

## 🚀 Desenvolvimento do App Miro

### **1. Estrutura do App**

```
miro-todoist-app/
├── index.html          # Interface do app
├── style.css           # Estilos
├── app.js             # Lógica principal
├── manifest.json      # Configuração do app
└── README.md          # Documentação
```

### **2. Manifest.json**
```json
{
  "name": "Todoist Sync",
  "description": "Sincroniza sticky notes com Todoist",
  "version": "1.0.0",
  "author": "Seu Nome",
  "buildVersion": "1.0.0",
  "sdkVersion": "2.0",
  "scopes": [
    "boards:read",
    "boards:write"
  ],
  "permissions": [
    "https://api.todoist.com/*",
    "https://hook.*.make.com/*"
  ],
  "icons": {
    "24": "icon-24.png",
    "48": "icon-48.png"
  }
}
```

### **3. Interface HTML (index.html)**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Todoist Sync</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://miro.com/app/static/sdk/v2/miro.js"></script>
</head>
<body>
    <div class="container">
        <h2>🔄 Todoist Sync</h2>
        
        <div class="config-section">
            <h3>Configuração</h3>
            <input type="text" id="todoistToken" placeholder="Token do Todoist" 
                   value="63dd8d664d3e8a0570a2bd7c4981be8421c70975">
            <input type="text" id="makeWebhookUrl" placeholder="URL do Make.com">
            <button id="saveConfig">Salvar</button>
        </div>

        <div class="sync-section">
            <h3>Sincronização</h3>
            <button id="syncToTodoist">📝 Enviar para Todoist</button>
            <button id="syncFromTodoist">⬇️ Buscar do Todoist</button>
            <button id="autoSync">🔄 Auto Sync</button>
        </div>

        <div class="status-section">
            <h3>Status</h3>
            <div id="status">Pronto para sincronizar</div>
            <div id="log"></div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
```

### **4. Lógica Principal (app.js)**
```javascript
// Configuração
let config = {
    todoistToken: '63dd8d664d3e8a0570a2bd7c4981be8421c70975',
    makeWebhookUrl: '',
    projectId: null
};

// Inicializar app
miro.onReady(() => {
    console.log('Miro App iniciado');
    loadConfig();
    setupEventListeners();
});

// Carregar configuração salva
async function loadConfig() {
    try {
        const savedConfig = await miro.board.storage.get('todoistConfig');
        if (savedConfig) {
            config = { ...config, ...savedConfig };
            document.getElementById('todoistToken').value = config.todoistToken;
            document.getElementById('makeWebhookUrl').value = config.makeWebhookUrl || '';
        }
    } catch (error) {
        console.error('Erro ao carregar config:', error);
    }
}

// Salvar configuração
async function saveConfig() {
    config.todoistToken = document.getElementById('todoistToken').value;
    config.makeWebhookUrl = document.getElementById('makeWebhookUrl').value;
    
    try {
        await miro.board.storage.set('todoistConfig', config);
        updateStatus('✅ Configuração salva');
    } catch (error) {
        updateStatus('❌ Erro ao salvar configuração');
    }
}

// Sincronizar sticky notes para Todoist
async function syncToTodoist() {
    updateStatus('🔄 Sincronizando para Todoist...');
    
    try {
        // Buscar sticky notes no board
        const stickyNotes = await miro.board.get({
            type: 'sticky_note'
        });

        // Filtrar apenas notes não sincronizados
        const notesToSync = stickyNotes.filter(note => 
            !note.tagIds?.includes('synced-todoist')
        );

        updateStatus(`📝 Encontrados ${notesToSync.length} sticky notes para sincronizar`);

        // Enviar cada note para Make.com → Todoist
        for (const note of notesToSync) {
            await sendToMakecom({
                action: 'create_task',
                content: note.content,
                miroId: note.id,
                boardId: await miro.board.getInfo().then(info => info.id)
            });

            // Marcar como sincronizado
            await miro.board.tags.create({
                title: 'synced-todoist',
                color: 'green'
            });
            
            // Adicionar tag ao sticky note
            await note.sync();
        }

        updateStatus(`✅ ${notesToSync.length} tarefas enviadas para Todoist`);
        
    } catch (error) {
        updateStatus(`❌ Erro na sincronização: ${error.message}`);
    }
}

// Enviar dados para Make.com
async function sendToMakecom(data) {
    if (!config.makeWebhookUrl) {
        throw new Error('URL do Make.com não configurada');
    }

    const response = await fetch(config.makeWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }

    return response.json();
}

// Buscar tarefas do Todoist
async function syncFromTodoist() {
    updateStatus('⬇️ Buscando tarefas do Todoist...');
    
    try {
        // Buscar tarefas via API do Todoist
        const response = await fetch('https://api.todoist.com/rest/v2/tasks', {
            headers: {
                'Authorization': `Bearer ${config.todoistToken}`
            }
        });

        const tasks = await response.json();
        
        // Filtrar tarefas que não estão no Miro
        const existingStickyNotes = await miro.board.get({
            type: 'sticky_note'
        });
        
        const existingTodoistIds = existingStickyNotes
            .map(note => note.metadata?.todoistId)
            .filter(Boolean);

        const newTasks = tasks.filter(task => 
            !existingTodoistIds.includes(task.id)
        );

        // Criar sticky notes para novas tarefas
        for (const task of newTasks) {
            await miro.board.createStickyNote({
                content: task.content,
                style: {
                    fillColor: task.is_completed ? 'light_green' : 'light_yellow'
                },
                metadata: {
                    todoistId: task.id,
                    syncedAt: new Date().toISOString()
                }
            });
        }

        updateStatus(`✅ ${newTasks.length} tarefas importadas do Todoist`);
        
    } catch (error) {
        updateStatus(`❌ Erro ao buscar do Todoist: ${error.message}`);
    }
}

// Auto sincronização
let autoSyncInterval;

function toggleAutoSync() {
    const button = document.getElementById('autoSync');
    
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
        button.textContent = '🔄 Auto Sync';
        updateStatus('Auto sync desabilitado');
    } else {
        autoSyncInterval = setInterval(() => {
            syncToTodoist();
            syncFromTodoist();
        }, 30000); // A cada 30 segundos
        
        button.textContent = '⏹️ Parar Auto Sync';
        updateStatus('Auto sync habilitado (30s)');
    }
}

// Event listeners
function setupEventListeners() {
    document.getElementById('saveConfig').addEventListener('click', saveConfig);
    document.getElementById('syncToTodoist').addEventListener('click', syncToTodoist);
    document.getElementById('syncFromTodoist').addEventListener('click', syncFromTodoist);
    document.getElementById('autoSync').addEventListener('click', toggleAutoSync);
}

// Atualizar status
function updateStatus(message) {
    const statusDiv = document.getElementById('status');
    const logDiv = document.getElementById('log');
    
    statusDiv.textContent = message;
    
    const timestamp = new Date().toLocaleTimeString();
    logDiv.innerHTML = `<div>${timestamp}: ${message}</div>` + logDiv.innerHTML;
    
    // Manter apenas últimas 10 mensagens
    const logs = logDiv.children;
    while (logs.length > 10) {
        logDiv.removeChild(logs[logs.length - 1]);
    }
}
```

### **5. Estilos (style.css)**
```css
.container {
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 400px;
}

.config-section, .sync-section, .status-section {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
}

h2 {
    margin: 0 0 20px 0;
    color: #333;
}

h3 {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
}

input {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
}

button {
    width: 100%;
    padding: 10px;
    margin-bottom: 5px;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

button:hover {
    background: #0052a3;
}

#status {
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
}

#log {
    font-size: 12px;
    color: #666;
    max-height: 150px;
    overflow-y: auto;
}

#log div {
    padding: 2px 0;
    border-bottom: 1px solid #f0f0f0;
}
```

## 🔧 Configuração Make.com

### **Cenário Único: Todoist → Miro**
```
[Webhook Todoist] → [Filter] → [HTTP Request para Miro API]
```

### **Configuração:**
1. **Webhook**: URL do Make.com
2. **Filter**: `event_name = "item:completed"`
3. **HTTP Request**:
   - URL: `https://api.miro.com/v2/boards/BOARD_ID/sticky_notes`
   - Method: POST
   - Headers: `Authorization: Bearer SEU_TOKEN`
   - Body: Criar sticky note com dados da tarefa

## 🚀 Deploy do App

### **1. Hospedar Arquivos**
- **GitHub Pages** (gratuito)
- **Vercel** (gratuito)
- **Netlify** (gratuito)

### **2. Registrar App no Miro**
1. https://developers.miro.com/
2. "Create new app"
3. App URL: URL onde hospedou os arquivos
4. Configurar permissões

### **3. Instalar no Board**
1. Abrir board no Miro
2. Apps → "Install app"
3. Colar URL do app ou buscar na loja

## 🎯 Fluxo Final

### **Miro → Todoist:**
1. Usuário cria sticky note no Miro
2. Clica "Sincronizar" no app
3. App envia para Make.com
4. Make.com cria tarefa no Todoist

### **Todoist → Miro:**
1. Usuário completa tarefa no Todoist
2. Webhook dispara para Make.com
3. Make.com atualiza sticky note no Miro
4. App mostra status atualizado

## ✅ Vantagens desta Abordagem

- ✅ **Interface nativa** - App integrado no Miro
- ✅ **Controle total** - Usuário decide quando sincronizar
- ✅ **Menos webhooks** - Só Todoist → Make.com
- ✅ **Mais confiável** - Menos dependências externas
- ✅ **Fácil debug** - Logs visíveis no app
- ✅ **Personalizável** - Interface customizada

---

**🎉 Com esta abordagem você tem um app profissional integrado ao Miro, muito mais elegante que webhooks externos!**