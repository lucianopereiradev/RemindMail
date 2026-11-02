# RemindMail

Lembretes por e-mail na hora certa. Você anota o compromisso uma vez e recebe um e-mail no horário marcado, com repetição e aviso antecipado.

**Acesse:** https://remindmail.lucianopereiradejesus14.workers.dev

![Página inicial do RemindMail](docs/preview.jpg)

## Funcionalidades

- Cadastro com confirmação de e-mail, recuperação de senha e login com Google (opcional)
- Aviso na hora do compromisso ou com antecedência (de 5 minutos até 1 dia antes)
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

- **Front-end:** React 19, Vite, Tailwind CSS v4 e React Router, hospedado na Cloudflare.
- **Banco e autenticação:** Supabase. O Postgres usa Row Level Security, então cada usuário só acessa os próprios dados.
- **Agendamento:** `pg_cron` procura lembretes vencidos a cada minuto e só chama a Edge Function quando existe algo para enviar.
- **Envio:** Edge Function em Deno que envia pela API da Brevo, tenta de novo em caso de falha e já agenda a próxima ocorrência dos lembretes recorrentes.

## Estrutura

```
frontend/
  src/pages/                 Telas
  src/components/            Componentes de interface
  src/lib/datetime.js        Conversão de fusos e rótulos de data (com testes)
supabase/
  migrations/                Tabelas, regras RLS e agendador
  functions/send-reminders/  Envio dos e-mails
.github/workflows/           CI e ping diário no banco
```

## Rodando localmente

Requer Node.js 20 ou superior e um projeto no Supabase.

```bash
cd frontend
cp .env.example .env.local   # URL e chave publishable do projeto Supabase
npm install
npm run dev
```

| Comando | O que faz |
| --- | --- |
| `npm test` | Testes (Vitest) |
| `npm run lint` | ESLint |
| `npm run build` | Build de produção |

O CI roda lint, testes e build do front-end e a checagem de tipos da Edge Function a cada push.

## Licença

[MIT](LICENSE) © Luciano Pereira
