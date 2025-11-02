console.log('🔧 Iniciando Miro App - Agency Management');

// Função para abrir o painel
async function openPanel() {
    console.log('🔄 Tentando abrir painel...');
    
    try {
        await miro.board.ui.openPanel({
            url: 'panel.html',
            width: 420,
            height: 600
        });
        console.log('✅ Painel aberto com sucesso');
    } catch (error) {
        console.error('❌ Erro ao abrir painel:', error);
        
        // Fallback: abrir em nova aba
        const panelUrl = new URL('panel.html', window.location.href).href;
        console.log('🔄 Abrindo painel em nova aba:', panelUrl);
        window.open(panelUrl, '_blank', 'width=420,height=600,scrollbars=yes,resizable=yes');
    }
}

// Método principal para SDK v2
if (typeof miro !== 'undefined' && miro.onReady) {
    console.log('🚀 Usando Miro SDK v2');
    
    miro.onReady(async () => {
        console.log('✅ Miro SDK v2 carregado');
        
        try {
            // Registrar evento de clique no ícone
            miro.board.ui.on('icon:click', openPanel);
            console.log('✅ Event listener registrado para icon:click');
            
            // Verificar informações do board
            const boardInfo = await miro.board.getInfo();
            console.log('📋 Board ID:', boardInfo.id);
            
        } catch (error) {
            console.error('❌ Erro no SDK v2:', error);
        }
    });
}

// Método alternativo para SDK v1 ou configuração manual
if (typeof miro !== 'undefined' && miro.initialize) {
    console.log('🚀 Usando Miro SDK v1 (initialize)');
    
    miro.initialize({
        extensionPoints: {
            toolbar: {
                title: 'Agency Management',
                toolbarSvgIcon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" stroke-width="2"/>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="currentColor" stroke-width="2"/>
                    <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
                </svg>`,
                onClick: openPanel
            }
        }
    });
    
    console.log('✅ Miro SDK v1 inicializado');
}

// Fallback: aguardar carregamento manual
setTimeout(() => {
    if (typeof miro === 'undefined') {
        console.warn('⚠️ Miro SDK não encontrado. Verifique se o app está instalado corretamente.');
        console.log('🔗 URL do painel para teste direto: panel.html');
    }
}, 2000);

console.log('🎯 App.js carregado completamente');