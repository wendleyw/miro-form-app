# 🚀 Deploy no Vercel para Webhooks

## ⚡ Configuração Rápida

### 1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

### 2. **Preparar o Projeto**
```bash
cd server

# Copiar configuração do package.json para Vercel
cp package.json.vercel package.json

# Login no Vercel
vercel login
```

### 3. **Deploy**
```bash
# Primeiro deploy (vai configurar o projeto)
vercel

# Responda as perguntas:
# ? Set up and deploy "~/server"? [Y/n] y
# ? Which scope do you want to deploy to? [sua conta]
# ? Link to existing project? [Y/n] n
# ? What's your project's name? ticket-management-server
# ? In which directory is your code located? ./
```

### 4. **Configurar Variáveis de Ambiente**
```bash
# Adicionar todas as variáveis do .env
vercel env add DATABASE_URL
vercel env add MIRO_ACCESS_TOKEN
vercel env add TODOIST_API_TOKEN
vercel env add JWT_SECRET

# Ou via interface web:
# https://vercel.com/dashboard → seu projeto → Settings → Environment Variables
```

### 5. **Atualizar .env Local**
Após o deploy, você receberá uma URL como `https://ticket-management-server.vercel.app`

Atualize seu `.env`:
```bash
WEBHOOK_BASE_URL=https://ticket-management-server.vercel.app
```

### 6. **Configurar Webhooks**
```bash
# Agora configure os webhooks com a URL do Vercel
npx ts-node scripts/setup-all-webhooks.ts
```

## 📋 Comandos Vercel Úteis

```bash
# Deploy de produção
vercel --prod

# Ver logs
vercel logs

# Ver domínios
vercel domains

# Ver variáveis de ambiente
vercel env ls

# Remover projeto
vercel remove
```

## 🔧 Configuração Avançada

### **vercel.json** (já criado)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/index.ts": {
      "maxDuration": 30
    }
  }
}
```

### **Variáveis de Ambiente Necessárias**
```bash
DATABASE_URL=sua_url_supabase
MIRO_ACCESS_TOKEN=seu_token_miro
TODOIST_API_TOKEN=seu_token_todoist
JWT_SECRET=seu_jwt_secret
NODE_ENV=production
PORT=3001
```

## 🧪 Testar Deploy

### 1. **Verificar se está funcionando**
```bash
curl https://sua-url.vercel.app/api/projects/health
```

### 2. **Testar webhooks**
```bash
curl -X POST https://sua-url.vercel.app/api/webhooks/miro \
  -H "Content-Type: application/json" \
  -d '{"type":"app_card.updated","data":{"completed":true}}'

curl -X POST https://sua-url.vercel.app/api/webhooks/todoist \
  -H "Content-Type: application/json" \
  -d '{"event_name":"item:completed","event_data":{"checked":1}}'
```

### 3. **Configurar webhooks nas plataformas**
- **Miro**: `https://sua-url.vercel.app/api/webhooks/miro`
- **Todoist**: `https://sua-url.vercel.app/api/webhooks/todoist`

## ⚠️ Limitações do Vercel

### **Serverless Functions**
- Máximo 30 segundos de execução
- Sem estado persistente entre requests
- Redis/Bull queues não funcionam (use alternativas)

### **Alternativas para Background Jobs**
```typescript
// Em vez de Bull queues, use:
// 1. Vercel Cron Jobs
// 2. Webhook chains
// 3. External services (Upstash, etc.)
```

## 🔄 Workflow de Deploy

### **Desenvolvimento**
```bash
# 1. Desenvolver localmente
npm run dev

# 2. Testar
npm test

# 3. Deploy para preview
vercel

# 4. Deploy para produção
vercel --prod
```

### **CI/CD Automático**
O Vercel pode conectar ao seu repositório Git e fazer deploy automático:

1. Conecte seu repositório no dashboard do Vercel
2. Cada push para `main` fará deploy automático
3. Pull requests criam previews automáticos

## 🌐 URLs Finais

Após o deploy, você terá:

- **API Base**: `https://sua-url.vercel.app/api`
- **Health Check**: `https://sua-url.vercel.app/api/projects/health`
- **Webhook Miro**: `https://sua-url.vercel.app/api/webhooks/miro`
- **Webhook Todoist**: `https://sua-url.vercel.app/api/webhooks/todoist`

## 🎉 Vantagens do Vercel

✅ **Deploy instantâneo** - Segundos para estar online
✅ **HTTPS automático** - SSL gratuito
✅ **Global CDN** - Performance mundial
✅ **Escalabilidade automática** - Sem configuração
✅ **Logs em tempo real** - Debug fácil
✅ **Preview deployments** - Teste antes de produção
✅ **Integração Git** - Deploy automático

## 🚀 Próximos Passos

1. **Deploy no Vercel** seguindo os passos acima
2. **Configurar webhooks** com a URL do Vercel
3. **Testar sincronização** em produção
4. **Monitorar logs** via `vercel logs`
5. **Configurar domínio customizado** (opcional)

---

**🎯 Com o Vercel, seus webhooks estarão acessíveis globalmente e funcionando 24/7!**