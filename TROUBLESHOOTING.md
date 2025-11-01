# 🔧 Troubleshooting - Miro App

## ❌ **Problema: App não aparece no menu lateral**

### **Possíveis Causas e Soluções:**

### **1. Verificar GitHub Pages**
✅ **Teste a URL diretamente:**
- Acesse: https://wendleyw.github.io/miro-form-app/
- Deve carregar a interface do app
- Se não carregar, GitHub Pages não está ativo

### **2. Verificar Configuração no Miro Developer Console**
1. Acesse: https://developers.miro.com/
2. Vá no seu app "Brianna Dawes Studios" 
3. Verifique:
   - **App URL**: `https://wendleyw.github.io/miro-form-app/`
   - **Permissions**: `boards:read`, `boards:write`
   - **Redirect URLs**: Adicione a URL do app

### **3. Testar SDK Básico**
✅ **Use o arquivo de teste:**
- Acesse: https://wendleyw.github.io/miro-form-app/test.html
- Deve mostrar "Miro SDK: Carregado"
- Se não carregar, há problema com o SDK

### **4. Verificar Instalação do App**
1. **No Board do Miro:**
   - Clique no ícone **"Apps"** (lateral esquerda)
   - Clique **"Install app"** ou **"+"**
   - Cole: `https://wendleyw.github.io/miro-form-app/`
   - Clique **"Install"**

2. **Alternativa - Developer Console:**
   - No Developer Console do Miro
   - Vá no app "Brianna Dawes Studios"
   - Clique **"Install app"**
   - Selecione o board
   - Confirme instalação

### **5. Verificar Permissões**
- O app precisa de permissões `boards:read` e `boards:write`
- Verifique se foram aprovadas durante a instalação

### **6. Limpar Cache**
1. **No Miro:**
   - Pressione `Ctrl+F5` (ou `Cmd+Shift+R` no Mac)
   - Recarregue o board

2. **No Navegador:**
   - Limpe cache e cookies do Miro
   - Tente em aba anônima

### **7. Verificar Console de Erros**
1. **Abra Developer Tools** (`F12`)
2. **Vá na aba Console**
3. **Procure por erros em vermelho**
4. **Erros comuns:**
   - `CORS policy` - Problema de domínio
   - `404 Not Found` - URL incorreta
   - `SDK not loaded` - Problema com o SDK

## 🧪 **Testes de Diagnóstico**

### **Teste 1: URL Básica**
```
https://wendleyw.github.io/miro-form-app/
```
✅ Deve carregar a interface do app

### **Teste 2: SDK Test**
```
https://wendleyw.github.io/miro-form-app/test.html
```
✅ Deve mostrar "Miro SDK: Carregado"

### **Teste 3: Manifest**
```
https://wendleyw.github.io/miro-form-app/manifest.json
```
✅ Deve retornar JSON válido

## 🔄 **Reinstalar App (Se necessário)**

### **Remover App:**
1. No board, vá em **Apps**
2. Encontre "Todoist Sync"
3. Clique nos **3 pontos** → **Remove**

### **Reinstalar:**
1. Clique **"Install app"**
2. Cole: `https://wendleyw.github.io/miro-form-app/`
3. Clique **"Install"**
4. Aceite as permissões

## 📞 **Suporte**

Se o problema persistir:

1. **Verifique se GitHub Pages está ativo**
2. **Teste a URL diretamente no navegador**
3. **Verifique o console de erros do navegador**
4. **Tente reinstalar o app**

## ✅ **Checklist Final**

- [ ] GitHub Pages ativo
- [ ] URL acessível: https://wendleyw.github.io/miro-form-app/
- [ ] App configurado no Developer Console
- [ ] App instalado no board
- [ ] Permissões aprovadas
- [ ] Cache limpo
- [ ] Sem erros no console

---

**🎯 Com essas correções, o app deve aparecer no menu lateral do Miro!**