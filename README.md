# Portal de Processos - pronto para Vercel

Este pacote foi ajustado para Vercel usando frontend Vite + React e API Serverless nativa em `/api`.

## Como publicar no Vercel

1. Suba todos os arquivos para um repositório no GitHub.
2. No Vercel, clique em **Add New > Project** e importe o repositório.
3. Em **Environment Variables**, adicione:
   - `APPS_SCRIPT_URL` = URL do Apps Script terminada em `/exec`
   - `GEMINI_API_KEY` = opcional, apenas se quiser usar a busca com IA
4. Deploy.

## Configuração esperada no Vercel

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- API de tutoriais: `/api/tutorials?lang=pt`
- Teste de saúde: `/api/health`

O arquivo `vercel.json` já está configurado com essas opções.

## Apps Script

O arquivo `APPS_SCRIPT.gs` também foi atualizado. Cole ele inteiro no Google Apps Script e reimplante como **App da Web** com acesso para **Qualquer pessoa**.

## Observação importante

Se o projeto for enviado para o GitHub, o arquivo `.env` normalmente não sobe por causa do `.gitignore`. Por isso, configure `APPS_SCRIPT_URL` diretamente nas variáveis de ambiente do Vercel.
