# RemindMail

Plataforma web para gerenciamento de lembretes com envio automático de emails. Crie compromissos com data e horário e receba notificações diretamente na sua caixa de entrada.

## Funcionalidades

- Cadastro e autenticação de usuários com JWT
- Criação, edição e exclusão de lembretes
- Lembretes recorrentes (diário, semanal, mensal)
- Envio automático de emails via Brevo
- Interface responsiva para mobile e desktop

## Tecnologias

**Backend**
- Node.js + Express 5
- PostgreSQL
- JWT + bcrypt
- node-cron
- Brevo API

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React

## Como rodar localmente

**Pré-requisitos:** Node.js 18+, PostgreSQL

```bash
# Clone o repositório
git clone https://github.com/lucianopereiradev/RemindMail.git
cd RemindMail
```

**Backend**
```bash
# Instale as dependências
npm install

# Crie o arquivo .env na raiz
cp .env.example .env
# Preencha as variáveis de ambiente

# Inicie o servidor
npm start
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Variáveis de ambiente

```env
DATABASE_URL=postgresql://...
JWT_SECRET=sua_chave_secreta
BREVO_API_KEY=sua_chave_brevo
APP_URL=https://remindmail.onrender.com
```

## Deploy

O projeto está configurado para deploy no **Render**.

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Root Directory:** `RemindMail`

O script de build instala as dependências do backend e do frontend, gera o `dist/` e o serve estaticamente pelo Express.

## Licença

MIT
