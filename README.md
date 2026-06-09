# Instruções de Implantação no Vercel

Este projeto foi otimizado para funcionar perfeitamente no Vercel. Siga os passos abaixo:

## 1. Preparação
Certifique-se de que você tem uma conta no [Vercel](https://vercel.com).

## 2. Configuração do Google Sheets (Apps Script)
Se você ainda não configurou sua planilha, use o código contido no arquivo `APPS_SCRIPT.gs` enviado junto com este projeto:
1. Abra sua Planilha Google.
2. Vá em **Extensões** > **Apps Script**.
3. Cole o código de `APPS_SCRIPT.gs`.
4. Clique em **Implantar** > **Nova Implantação**.
5. Selecione **App da Web**, configure para que **Qualquer pessoa** tenha acesso.
6. Copie a URL gerada.

## 3. Implantação no Vercel
Você pode subir o projeto de duas formas:

### Opção A: Via Dashboard (Mais fácil)
1. Crie um novo repositório no GitHub/GitLab e suba estes arquivos.
2. No Vercel, clique em **Add New** > **Project** e selecione o repositório.
3. **IMPORTANTE**: Antes de clicar em Deploy, adicione as seguintes **Environment Variables**:
   - `GEMINI_API_KEY`: Sua chave da API do Google Gemini.
   - `APPS_SCRIPT_URL`: A URL que você copiou no passo 2.

### Opção B: Via Vercel CLI
1. Instale o CLI: `npm i -g vercel`
2. Execute `vercel` na pasta do projeto.
3. Siga as instruções e adicione as variáveis de ambiente quando solicitado.

## 4. Notas Técnicas
- O Backend está configurado como **Vercel Serverless Functions** na pasta `/api`.
- O Frontend é uma aplicação **Vite + React**.
- Todas as rotas `/api/*` são roteadas automaticamente para o interpretador Node.js do Vercel.


## Alteração V3 - idioma no botão Atualizar

O botão Atualizar/Update/Actualizar agora força a atualização usando o idioma selecionado no momento.
Exemplo: se estiver em EN, atualiza `/api/tutorials?lang=en`; se estiver em ES, atualiza `/api/tutorials?lang=es`.

## URL do Apps Script e permissão Owner

A tela de login não exibe campo para configurar URL do Apps Script. O login usa somente a variável `APPS_SCRIPT_URL` configurada no Vercel.

Depois de logado, o botão **Configurar Script** aparece somente para contas com `Cargo` igual a `Owner` na aba `USUARIOS`. Para qualquer outro cargo, essa área fica oculta e o backend ignora tentativas de enviar URL manual.

Para valer para todos os usuários, configure a variável `APPS_SCRIPT_URL` no Vercel em Settings > Environment Variables e faça Redeploy.
