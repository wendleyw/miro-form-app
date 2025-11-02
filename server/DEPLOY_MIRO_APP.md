# 🚀 Deploy do App Miro - Guia Rápido

## ⚡ Problema com Vercel

O Vercel está com **Deployment Protection** ativada, bloqueando acesso público. Para apps do Miro, precisamos de acesso público sem autenticação.

## 🎯 Soluções Rápidas

### **Opção 1: GitHub Pages (Recomendado)**

#### **Passo 1: Criar Repositório**
1. Vá em https://github.com/
2. Clique "New repository"
3. Nome: `miro-todoist-app`
4. Marque "Public"
5. Clique "Create repository"

#### **Passo 2: Upload dos Arquivos**
1. Clique "uploading an existing file"
2. Arraste os arquivos da pasta `miro-app/`:
   - `index.html`
   - `style.css`
   - `app.js`
   - `manifest.json`
3. Commit: "Add Miro Todoist Sync App"

#### **Passo 3: Ativar GitHub Pages**
1. Repository → Settings
2. Pages (menu lateral)
3. Source: "Deploy from a branch"
4. Branch: "main"
5. Folder: "/ (root)"
6. Save

#### **Passo 4: Obter URL**
- URL será: `https://seuusuario.github.io/miro-todoist-app/`
- Aguarde 2-3 minutos para ativar

### **Opção 2: Netlify Drop**

#### **Passo 1: Preparar Pasta**
1. Crie uma pasta local com os arquivos:
   - `index.html`
   - `style.css` 
   - `app.js`
   - `manifest.json`

#### **Passo 2: Deploy**
1. Vá em https://app.netlify.com/drop
2. Arraste a pasta para a área
3. Deploy automático
4. URL gerada: `https://random-name.netlify.app/`

### **Opção 3: Vercel (Sem Proteção)**

Se quiser usar Vercel mesmo assim:

1. **Dashboard Vercel**: https://vercel.com/dashboard
2. **Projeto**: miro-app
3. **Settings** → **Deployment Protection**
4. **Disable** protection
5. **Redeploy**: `vercel --prod`

## 🎨 Registrar App no Miro

### **Passo 1: Criar App**
1. Acesse https://developers.miro.com/
2. Clique "Create new app"
3. Preencha:
   - **App name**: "Todoist Sync"
   - **Description**: "Sincroniza sticky notes com Todoist"

### **Passo 2: Configurar Permissões**
1. **Permissions**:
   - `boards:read` ✅
   - `boards:write` ✅
2. **App URL**: Cole a URL do GitHub Pages/Netlify
3. **Redirect URLs**: Mesma URL do app

### **Passo 3: Instalar no Board**
1. Abra seu board no Miro
2. Apps → "Install app"
3. Cole a URL do seu app
4. Ou busque na Miro App Store (se publicado)

## 🔧 Configurar Make.com

### **Passo 1: Criar Cenário**
1. https://www.make.com/
2. "Create a new scenario"
3. Adicione "Webhooks" → "Custom webhook"
4. **Copie a URL** (ex: `https://hook.eu1.make.com/abc123`)

### **Passo 2: Configurar Todoist**
1. Adicione módulo "Todoist" → "Create a Task"
2. Conecte com token: `63dd8d664d3e8a0570a2bd7c4981be8421c70975`
3. Configure:
   - **Project**: Selecione projeto
   - **Content**: `{{content}}` (do webhook)
   - **Description**: `Sincronizado do Miro: {{miro_id}}`

### **Passo 3: Ativar Cenário**
1. Salve o cenário
2. Toggle "ON"
3. Teste enviando dados

## 🧪 Testar o App

### **Passo 1: Abrir App no Miro**
1. Abra seu board
2. Apps → Seu app instalado
3. Interface deve carregar

### **Passo 2: Configurar**
1. **Token Todoist**: `63dd8d664d3e8a0570a2bd7c4981be8421c70975`
2. **URL Make.com**: Cole a URL do webhook
3. **Projeto**: Selecione um projeto
4. Clique "Salvar Configuração"

### **Passo 3: Sincronizar**
1. Crie alguns sticky notes no board
2. Clique "Miro → Todoist"
3. Verifique se tarefas apareceram no Todoist

## 📋 URLs Importantes

### **Seus Tokens**
- **Miro**: `eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K66MkyC3_3M_UMAOuvmYAfA3nZo`
- **Todoist**: `63dd8d664d3e8a0570a2bd7c4981be8421c70975`

### **Links Úteis**
- **GitHub**: https://github.com/
- **Netlify Drop**: https://app.netlify.com/drop
- **Miro Developers**: https://developers.miro.com/
- **Make.com**: https://www.make.com/

## 🎯 Comandos Rápidos

### **Testar App Localmente**
```bash
# Servir arquivos localmente
cd miro-app
python3 -m http.server 8000
# Acesse: http://localhost:8000
```

### **Verificar se App Funciona**
```bash
# Testar URL do app
curl -s https://seuusuario.github.io/miro-todoist-app/ | grep "Todoist Sync"
```

## 🎉 Resultado Final

Após seguir estes passos você terá:

✅ **App do Miro** hospedado publicamente
✅ **URL acessível** sem autenticação
✅ **Interface nativa** no Miro
✅ **Sincronização** Miro ↔ Todoist
✅ **Make.com** processando webhooks
✅ **Controle total** sobre sincronização

---

**🚀 Recomendo GitHub Pages - é gratuito, confiável e perfeito para apps do Miro!**