#!/bin/bash

# Script para configurar variáveis de ambiente no Vercel
# Execute com: chmod +x scripts/setup-vercel-env.sh && ./scripts/setup-vercel-env.sh

echo "🔧 Configurando variáveis de ambiente no Vercel..."

# Ler variáveis do .env
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

# Configurar variáveis principais
echo "📋 Configurando DATABASE_URL..."
vercel env add DATABASE_URL production < <(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)

echo "📋 Configurando MIRO_ACCESS_TOKEN..."
vercel env add MIRO_ACCESS_TOKEN production < <(grep "^MIRO_ACCESS_TOKEN=" .env | cut -d'=' -f2-)

echo "📋 Configurando TODOIST_API_TOKEN..."
vercel env add TODOIST_API_TOKEN production < <(grep "^TODOIST_API_TOKEN=" .env | cut -d'=' -f2-)

echo "📋 Configurando JWT_SECRET..."
vercel env add JWT_SECRET production < <(grep "^JWT_SECRET=" .env | cut -d'=' -f2-)

echo "📋 Configurando NODE_ENV..."
echo "production" | vercel env add NODE_ENV production

echo "📋 Configurando PORT..."
echo "3001" | vercel env add PORT production

echo "✅ Variáveis de ambiente configuradas!"
echo ""
echo "🚀 Fazendo redeploy..."
vercel --prod

echo ""
echo "🧪 Testando deploy..."
sleep 5
curl -s https://server-29yenaa6d-wendleyws-projects.vercel.app/api/projects/health | jq '.' || echo "Aguarde alguns segundos e teste novamente"

echo ""
echo "🎉 Deploy concluído!"
echo "URL: https://server-29yenaa6d-wendleyws-projects.vercel.app"