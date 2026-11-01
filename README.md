# RemindMail

Lembretes por e-mail na hora certa. Crie um compromisso com data e hora e receba um e-mail no momento marcado, com repetição e aviso antecipado.

## Funcionalidades

- Cadastro com confirmação de e-mail, recuperação de senha e login com Google (opcional)
- Lembretes com antecedência (na hora, 5 min até 1 dia antes)
- Repetição diária, semanal, mensal, anual ou em dias da semana escolhidos
- Fuso horário por usuário
- Painel com agenda por dia, histórico de envios e busca
- Pausa dos e-mails sem apagar lembretes
- Exclusão de conta com remoção de todos os dados

## Arquitetura

```
Navegador (React)  ──>  Supabase Auth + Postgres (RLS)
                              │
                     pg_cron (a cada minuto, dentro do banco)
                              │  só quando há lembrete vencido
                              ▼
                   Edge Function send-reminders  ──>  Brevo (e-mail)
```

- **Front-end:** React 19, Vite, Tailwind CSS v4, React Router. Hospedado na Cloudflare Pages.
- **Banco e autenticação:** Supabase (Postgres com Row Level Security: cada usuário só acessa os próprios dados).
- **Agendamento:** `pg_cron` verifica os lembretes vencidos a cada minuto e só chama a Edge Function quando existe algo para enviar.
- **Envio:** Edge Function em Deno que envia pela API da Brevo, com novas tentativas em caso de falha e avanço automático da recorrência.

## Estrutura

```
frontend/                 App React
  src/lib/datetime.js     Conversão de fusos e rótulos (com testes)
  src/pages/              Telas
supabase/
  migrations/             Schema do banco (tabelas, RLS, agendador)
  functions/send-reminders/  Envio dos e-mails
.github/workflows/        CI e ping diário
```

## Rodando localmente

Pré-requisito: Node.js 20 ou superior.

```bash
cd frontend
cp .env.example .env.local   # preencha com a URL e a chave publishable do seu projeto Supabase
npm install
npm run dev
```

Outros comandos: `npm test`, `npm run lint`, `npm run build`.

## Configuração do Supabase

1. Aplique as migrações de `supabase/migrations/` em ordem.
2. Crie os secrets no Vault:
   ```sql
   select vault.create_secret('https://SEU-PROJETO.supabase.co', 'project_url');
   select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'cron_secret');
   ```
3. Publique a função `send-reminders` com verificação de JWT desligada (ela confere o próprio segredo).
4. Em Edge Functions > Secrets, crie `BREVO_API_KEY`. Opcionais: `SENDER_EMAIL`, `SENDER_NAME`, `APP_URL`.
5. Em Authentication: defina a Site URL, as Redirect URLs e o SMTP da Brevo para os e-mails de cadastro.

## Deploy do front-end (Cloudflare Pages)

- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Output directory:** `dist`

## Observações

- O plano gratuito do Supabase pausa projetos parados. O workflow `keepalive.yml` faz um ping diário. O GitHub desativa workflows agendados em repositórios sem commits há 60 dias; se isso acontecer, reative em Actions.
- O plano gratuito da Brevo envia até 300 e-mails por dia.

## Licença

MIT
