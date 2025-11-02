// Inicializar app quando Miro estiver pronto (SDK v2)
async function init() {
    console.log('🎨 Registrando ícone do Todoist Sync');
    
    // Verificar se Miro SDK está disponível
    if (typeof miro === 'undefined') {
        console.error('❌ Miro SDK não carregado');
        return;
    }
    
    try {
        // Registrar ícone na toolbar
        await miro.board.ui.on('icon:click', async () => {
            console.log('🔄 Ícone clicado, abrindo painel');
            await miro.board.ui.openPanel({
                url: 'panel.html',
                width: 400
            });
        });
        
        console.log('✅ Ícone registrado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao registrar ícone:', error);
    }
}

// Aguardar o DOM carregar e inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Código removido - toda a lógica agora está no panel.html