// Configuração global
let config = {
    todoistToken: '63dd8d664d3e8a0570a2bd7c4981be8421c70975',
    makeWebhookUrl: '',
    projectId: null,
    autoSyncEnabled: false
};

let autoSyncInterval = null;
let isInitialized = false;

// Inicializar app quando Miro estiver pronto (SDK v2)
async function init() {
    console.log('🎨 Miro Todoist Sync App iniciado');
    await initializeApp();
}

// Aguardar o DOM carregar e inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Inicialização principal
async function initializeApp() {
    try {
        await loadConfig();
        setupEventListeners();
        await updateStats();
        await loadTodoistProjects();
        
        isInitialized = true;
        updateStatus('✅ App inicializado com sucesso', 'success');
        
    } catch (error) {
        console.error('Erro na inicialização:', error);
        updateStatus('❌ Erro na inicialização do app', 'error');
    }
}

// Carregar configuração salva
async function loadConfig() {
    try {
        const savedConfig = await miro.board.storage.get('todoistSyncConfig');
        if (savedConfig) {
            config = { ...config, ...savedConfig };
            
            // Atualizar interface
            document.getElementById('todoistToken').value = config.todoistToken || '';
            document.getElementById('makeWebhookUrl').value = config.makeWebhookUrl || '';
            document.getElementById('autoSyncEnabled').checked = config.autoSyncEnabled || false;
            
            if (config.projectId) {
                document.getElementById('todoistProject').value = config.projectId;
            }
        }
        
        logMessage('Configuração carregada', 'success');
        
    } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        logMessage('Erro ao carregar configuração', 'error');
    }
}

// Salvar configuração
async function saveConfig() {
    try {
        // Coletar dados da interface
        config.todoistToken = document.getElementById('todoistToken').value.trim();
        config.makeWebhookUrl = document.getElementById('makeWebhookUrl').value.trim();
        config.projectId = document.getElementById('todoistProject').value;
        config.autoSyncEnabled = document.getElementById('autoSyncEnabled').checked;
        
        // Validar dados
        if (!config.todoistToken) {
            throw new Error('Token do Todoist é obrigatório');
        }
        
        if (!config.makeWebhookUrl) {
            throw new Error('URL do Make.com é obrigatória');
        }
        
        if (!config.makeWebhookUrl.includes('hook.') || !config.makeWebhookUrl.includes('make.com')) {
            throw new Error('URL do Make.com inválida');
        }
        
        // Salvar no storage do Miro
        await miro.board.storage.set('todoistSyncConfig', config);
        
        updateStatus('✅ Configuração salva com sucesso', 'success');
        logMessage('Configuração salva', 'success');
        
        // Configurar auto sync se habilitado
        if (config.autoSyncEnabled) {
            startAutoSync();
        } else {
            stopAutoSync();
        }
        
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        updateStatus(`❌ ${error.message}`, 'error');
        logMessage(`Erro ao salvar: ${error.message}`, 'error');
    }
}

// Carregar projetos do Todoist
async function loadTodoistProjects() {
    if (!config.todoistToken) return;
    
    try {
        const response = await fetch('https://api.todoist.com/rest/v2/projects', {
            headers: {
                'Authorization': `Bearer ${config.todoistToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const projects = await response.json();
        const select = document.getElementById('todoistProject');
        
        // Limpar opções existentes
        select.innerHTML = '<option value="">Selecione um projeto</option>';
        
        // Adicionar projetos
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });
        
        // Restaurar seleção salva
        if (config.projectId) {
            select.value = config.projectId;
        }
        
        logMessage(`${projects.length} projetos carregados`, 'success');
        
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        logMessage('Erro ao carregar projetos do Todoist', 'error');
    }
}

// Sincronizar sticky notes para Todoist
async function syncToTodoist() {
    if (!validateConfig()) return;
    
    updateStatus('🔄 Sincronizando Miro → Todoist...', 'warning');
    
    try {
        // Buscar sticky notes no board
        const items = await miro.board.get({
            type: 'sticky_note'
        });
        
        logMessage(`Encontrados ${items.length} sticky notes`, 'info');
        
        // Filtrar notes não sincronizados
        const notesToSync = [];
        for (const item of items) {
            const metadata = await getItemMetadata(item.id);
            if (!metadata.todoistId && item.content.trim()) {
                notesToSync.push(item);
            }
        }
        
        if (notesToSync.length === 0) {
            updateStatus('ℹ️ Nenhum sticky note novo para sincronizar', 'info');
            return;
        }
        
        logMessage(`${notesToSync.length} sticky notes para sincronizar`, 'info');
        
        // Enviar cada note para Make.com
        let syncedCount = 0;
        for (const note of notesToSync) {
            try {
                const taskData = {
                    action: 'create_task',
                    content: note.content,
                    project_id: config.projectId,
                    miro_id: note.id,
                    board_id: (await miro.board.getInfo()).id,
                    position: note.x && note.y ? { x: note.x, y: note.y } : null
                };
                
                const result = await sendToMakecom(taskData);
                
                // Salvar ID da tarefa no metadata
                if (result && result.task_id) {
                    await setItemMetadata(note.id, {
                        todoistId: result.task_id,
                        syncedAt: new Date().toISOString()
                    });
                }
                
                syncedCount++;
                logMessage(`Sincronizado: "${note.content.substring(0, 30)}..."`, 'success');
                
            } catch (error) {
                logMessage(`Erro ao sincronizar: "${note.content.substring(0, 30)}..."`, 'error');
            }
        }
        
        updateStatus(`✅ ${syncedCount} tarefas enviadas para Todoist`, 'success');
        await updateStats();
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
        updateStatus(`❌ Erro na sincronização: ${error.message}`, 'error');
        logMessage(`Erro na sincronização: ${error.message}`, 'error');
    }
}

// Sincronizar tarefas do Todoist para Miro
async function syncFromTodoist() {
    if (!validateConfig()) return;
    
    updateStatus('⬇️ Sincronizando Todoist → Miro...', 'warning');
    
    try {
        // Buscar tarefas do projeto específico
        const url = config.projectId 
            ? `https://api.todoist.com/rest/v2/tasks?project_id=${config.projectId}`
            : 'https://api.todoist.com/rest/v2/tasks';
            
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${config.todoistToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const tasks = await response.json();
        logMessage(`Encontradas ${tasks.length} tarefas no Todoist`, 'info');
        
        // Buscar sticky notes existentes
        const existingItems = await miro.board.get({
            type: 'sticky_note'
        });
        
        // Mapear IDs do Todoist já existentes
        const existingTodoistIds = new Set();
        for (const item of existingItems) {
            const metadata = await getItemMetadata(item.id);
            if (metadata.todoistId) {
                existingTodoistIds.add(metadata.todoistId);
            }
        }
        
        // Filtrar tarefas novas
        const newTasks = tasks.filter(task => !existingTodoistIds.has(task.id));
        
        if (newTasks.length === 0) {
            updateStatus('ℹ️ Nenhuma tarefa nova no Todoist', 'info');
            return;
        }
        
        logMessage(`${newTasks.length} tarefas novas para importar`, 'info');
        
        // Criar sticky notes para novas tarefas
        let importedCount = 0;
        for (const task of newTasks) {
            try {
                const stickyNote = await miro.board.createStickyNote({
                    content: task.content,
                    style: {
                        fillColor: task.is_completed ? 'light_green' : 'light_yellow',
                        textAlign: 'left'
                    },
                    x: Math.random() * 800 + 100, // Posição aleatória
                    y: Math.random() * 600 + 100
                });
                
                // Salvar metadata
                await setItemMetadata(stickyNote.id, {
                    todoistId: task.id,
                    syncedAt: new Date().toISOString(),
                    isCompleted: task.is_completed
                });
                
                importedCount++;
                logMessage(`Importado: "${task.content.substring(0, 30)}..."`, 'success');
                
            } catch (error) {
                logMessage(`Erro ao importar: "${task.content.substring(0, 30)}..."`, 'error');
            }
        }
        
        updateStatus(`✅ ${importedCount} tarefas importadas do Todoist`, 'success');
        await updateStats();
        
    } catch (error) {
        console.error('Erro ao sincronizar do Todoist:', error);
        updateStatus(`❌ Erro ao sincronizar: ${error.message}`, 'error');
        logMessage(`Erro ao sincronizar: ${error.message}`, 'error');
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

// Gerenciar metadata dos itens
async function getItemMetadata(itemId) {
    try {
        const metadata = await miro.board.storage.get(`item_${itemId}`);
        return metadata || {};
    } catch (error) {
        return {};
    }
}

async function setItemMetadata(itemId, metadata) {
    try {
        const existing = await getItemMetadata(itemId);
        const updated = { ...existing, ...metadata };
        await miro.board.storage.set(`item_${itemId}`, updated);
    } catch (error) {
        console.error('Erro ao salvar metadata:', error);
    }
}

// Auto sincronização
function startAutoSync() {
    if (autoSyncInterval) return;
    
    autoSyncInterval = setInterval(async () => {
        if (isInitialized && validateConfig()) {
            logMessage('Auto sync executando...', 'info');
            await syncToTodoist();
            await syncFromTodoist();
        }
    }, 30000); // 30 segundos
    
    logMessage('Auto sync iniciado (30s)', 'success');
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
        logMessage('Auto sync parado', 'info');
    }
}

// Atualizar estatísticas
async function updateStats() {
    try {
        const items = await miro.board.get({
            type: 'sticky_note'
        });
        
        let syncedCount = 0;
        for (const item of items) {
            const metadata = await getItemMetadata(item.id);
            if (metadata.todoistId) {
                syncedCount++;
            }
        }
        
        // Buscar tarefas do Todoist
        let todoistCount = 0;
        if (config.todoistToken && config.projectId) {
            try {
                const response = await fetch(`https://api.todoist.com/rest/v2/tasks?project_id=${config.projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${config.todoistToken}`
                    }
                });
                
                if (response.ok) {
                    const tasks = await response.json();
                    todoistCount = tasks.length;
                }
            } catch (error) {
                // Ignorar erro silenciosamente
            }
        }
        
        // Atualizar interface
        document.getElementById('miroCount').textContent = items.length;
        document.getElementById('todoistCount').textContent = todoistCount;
        document.getElementById('syncedCount').textContent = syncedCount;
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// Validar configuração
function validateConfig() {
    if (!config.todoistToken) {
        updateStatus('❌ Token do Todoist não configurado', 'error');
        return false;
    }
    
    if (!config.makeWebhookUrl) {
        updateStatus('❌ URL do Make.com não configurada', 'error');
        return false;
    }
    
    return true;
}

// Event listeners
function setupEventListeners() {
    document.getElementById('saveConfig').addEventListener('click', saveConfig);
    document.getElementById('syncToTodoist').addEventListener('click', syncToTodoist);
    document.getElementById('syncFromTodoist').addEventListener('click', syncFromTodoist);
    
    document.getElementById('autoSyncEnabled').addEventListener('change', (e) => {
        config.autoSyncEnabled = e.target.checked;
        if (config.autoSyncEnabled) {
            startAutoSync();
        } else {
            stopAutoSync();
        }
    });
    
    // Atualizar estatísticas periodicamente
    setInterval(updateStats, 10000); // 10 segundos
}

// Atualizar status na interface
function updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    
    // Remover classes anteriores
    statusDiv.classList.remove('error', 'warning', 'success');
    
    // Adicionar nova classe
    if (type !== 'info') {
        statusDiv.classList.add(type);
    }
    
    logMessage(message, type);
}

// Log de mensagens
function logMessage(message, type = 'info') {
    const logDiv = document.getElementById('log');
    const timestamp = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = type;
    logEntry.textContent = `${timestamp}: ${message}`;
    
    // Adicionar no topo
    logDiv.insertBefore(logEntry, logDiv.firstChild);
    
    // Manter apenas últimas 20 mensagens
    while (logDiv.children.length > 20) {
        logDiv.removeChild(logDiv.lastChild);
    }
}