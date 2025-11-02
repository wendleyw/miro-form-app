# Troubleshooting - Todoist Integration

## Problema: Erro 403 (Forbidden) ao criar tarefas

### Possíveis Causas:
1. **Token inválido ou expirado**
2. **Permissões insuficientes**
3. **Projeto inválido ou sem acesso**
4. **Rate limiting (muitas requisições)**

### Soluções:

#### 1. Verificar Token
- Acesse: https://todoist.com/prefs/integrations
- Copie um novo token
- Cole no campo "Token Todoist"
- Clique "🔍 Testar Token"

#### 2. Verificar Permissões do Projeto
- Certifique-se que você é **proprietário** ou **administrador** do projeto
- Projetos compartilhados podem ter restrições
- Teste com um projeto pessoal primeiro

#### 3. Usar o Debug
- Selecione um projeto
- Clique "🐛 Debug Projeto"
- Verifique o console do navegador (F12)

#### 4. Verificar Rate Limiting
- Aguarde 1-2 minutos entre tentativas
- Sincronize poucos elementos por vez
- O app agora inclui pausas automáticas

## Problema: Importando todos os projetos em vez do selecionado

### Solução Aplicada:
- ✅ Corrigido: Agora usa o projeto selecionado no dropdown
- ✅ Adicionada validação dupla do project_id
- ✅ Logs detalhados para debug

### Como Testar:
1. Selecione um projeto específico no dropdown
2. Clique "🐛 Debug Projeto" para confirmar
3. Use "⬇️ Todoist → Miro" para importar

## Melhorias Implementadas:

### 1. Validação de Token Melhorada
- Testa acesso básico
- Testa criação de tarefa
- Remove tarefa de teste automaticamente

### 2. Tratamento de Erros
- Mensagens específicas para cada erro HTTP
- Logs detalhados no console
- Paradas automáticas em caso de erro crítico

### 3. Limpeza de Conteúdo
- Remove tags HTML dos elementos Miro
- Limita tamanho do conteúdo (500 chars)
- Nomes padrão para elementos vazios

### 4. Rate Limiting
- Pausa de 100ms entre requisições
- Detecção de erro 429 (Too Many Requests)
- Limite de 50 tarefas por sincronização

## Como Usar:

### Primeira Configuração:
1. Cole seu token Todoist
2. Clique "🔍 Testar Token"
3. Selecione um projeto
4. Clique "🐛 Debug Projeto"
5. Clique "💾 Salvar Configuração"

### Sincronização:
- **Miro → Todoist**: Cria tarefas no projeto selecionado
- **Todoist → Miro**: Importa tarefas do projeto selecionado

### Debug:
- Abra o Console do navegador (F12)
- Todos os logs aparecem com emojis para fácil identificação
- Use "🐛 Debug Projeto" para verificar configuração

## Códigos de Erro Comuns:

- **401**: Token inválido/expirado
- **403**: Sem permissão no projeto
- **404**: Projeto não encontrado
- **429**: Muitas requisições (aguarde)
- **500**: Erro interno do Todoist

## Dicas:

1. **Use projetos pessoais** para testes iniciais
2. **Verifique o console** sempre que houver erro
3. **Aguarde entre tentativas** se houver erro 429
4. **Teste com poucos elementos** primeiro
5. **Mantenha o token seguro** (não compartilhe)