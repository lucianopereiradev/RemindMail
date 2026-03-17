require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const cron = require("node-cron");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// ─── Banco de dados ───────────────────────────────────────────────────────────

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
      }
);

// ─── Email (Brevo) ────────────────────────────────────────────────────────────

const BREVO_API_KEY = process.env.BREVO_API_KEY;

async function sendEmail({ to, subject, htmlContent, textContent }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "RemindMail", email: "lucianop.jogador@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${err}`);
  }

  return res.json();
}

// ─── Middleware de autenticação ───────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ error: "Token inválido" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

// ─── Frontend estático ────────────────────────────────────────────────────────

const path = require("path");
app.use(express.static(path.join(__dirname, "dist")));

// ─── Rotas ────────────────────────────────────────────────────────────────────

// Registro
app.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username)
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (email, password, username) VALUES ($1, $2, $3)",
      [email, hashed, username]
    );

    res.json({ success: true });
  } catch (err) {
    console.log("ERRO /register:", err.message);

    if (err.code === "23505")
      return res.status(400).json({ error: "Email já cadastrado" });

    res.status(500).json({ success: false });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length)
      return res.status(400).json({ error: "Usuário não encontrado" });

    const valid = await bcrypt.compare(password, result.rows[0].password);

    if (!valid)
      return res.status(400).json({ error: "Senha inválida" });

    const token = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.log("ERRO /login:", err.message);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Criar lembrete
app.post("/reminder", authMiddleware, async (req, res) => {
  try {
    const { title, description, remind_at, recurring, recurring_type } = req.body;

    if (!title || !remind_at)
      return res.status(400).json({ error: "Título e data são obrigatórios" });

    await pool.query(
      `INSERT INTO reminders (user_id, title, description, remind_at, recurring, recurring_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, title, description, remind_at, recurring ?? false, recurring_type ?? null]
    );

    res.json({ message: "Lembrete criado" });
  } catch (err) {
    console.log("ERRO /reminder POST:", err.message);
    res.status(500).json({ error: "Erro ao criar lembrete" });
  }
});

// Listar lembretes
app.get("/reminders", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM reminders WHERE user_id = $1 ORDER BY remind_at ASC",
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.log("ERRO /reminders GET:", err.message);
    res.status(500).json({ error: "Erro ao buscar lembretes" });
  }
});

// Editar lembrete
app.put("/reminder/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, remind_at, recurring, recurring_type } = req.body;

    await pool.query(
      `UPDATE reminders 
       SET title = $1, description = $2, remind_at = $3, recurring = $4, recurring_type = $5, sent = false
       WHERE id = $6 AND user_id = $7`,
      [title, description, remind_at, recurring ?? false, recurring_type ?? null, req.params.id, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.log("ERRO /reminder PUT:", err.message);
    res.status(500).json({ success: false });
  }
});

// Deletar lembrete
app.delete("/reminder/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM reminders WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    res.json({ message: "Lembrete removido" });
  } catch (err) {
    console.log("ERRO /reminder DELETE:", err.message);
    res.status(500).json({ error: "Erro ao deletar lembrete" });
  }
});

// Deletar conta
app.delete("/delete-account", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM reminders WHERE user_id = $1", [req.user.id]);
    await pool.query("DELETE FROM users WHERE id = $1", [req.user.id]);

    res.json({ success: true });
  } catch (err) {
    console.log("ERRO /delete-account:", err.message);
    res.status(500).json({ success: false });
  }
});

// Catch-all — qualquer rota não reconhecida devolve o frontend
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ─── CRON — disparo de emails ─────────────────────────────────────────────────

cron.schedule("* * * * *", async () => {
  console.log("CRON RODANDO ✅", new Date());

  const now = new Date();

  const { rows: reminders } = await pool.query(
    `SELECT reminders.*, users.email, users.username 
     FROM reminders 
     JOIN users ON users.id = reminders.user_id 
     WHERE sent = false`
  );

  for (const reminder of reminders) {
    if (new Date(reminder.remind_at) > now) continue;

    try {
      const reminderDate = new Date(reminder.remind_at);

      const formattedDate = reminderDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const formattedTime = reminderDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      let nextDate = null;
      if (reminder.recurring) {
        nextDate = new Date(reminder.remind_at);
        if (reminder.recurring_type === "daily")   nextDate.setDate(nextDate.getDate() + 1);
        if (reminder.recurring_type === "weekly")  nextDate.setDate(nextDate.getDate() + 7);
        if (reminder.recurring_type === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const nextReminderText = nextDate
        ? nextDate.toLocaleDateString("pt-BR", { year: "numeric", month: "2-digit", day: "2-digit" })
        : "Não há próximos lembretes agendados";

      const APP_URL = process.env.APP_URL || "https://remindmail.onrender.com";

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; }
            .reminder-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .reminder-title { font-size: 22px; font-weight: bold; color: #667eea; margin: 0 0 10px 0; }
            .reminder-description { color: #555; font-size: 16px; margin: 10px 0; }
            .reminder-meta { font-size: 14px; color: #888; margin-top: 15px; display: flex; gap: 20px; }
            .next-reminder { background: #e8f4f8; border-left: 4px solid #17a2b8; padding: 15px 20px; margin: 20px 0; border-radius: 8px; font-size: 14px; color: #555; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 RemindMail</h1>
            </div>
            <div class="content">
              <p style="font-size:18px">Oi <strong>${reminder.username}</strong>! 👋</p>
              <p>Aqui está seu lembrete de agora:</p>
              <div class="reminder-box">
                <div class="reminder-title">🔔 ${reminder.title}</div>
                ${reminder.description ? `<div class="reminder-description">${reminder.description}</div>` : ""}
                <div class="reminder-meta">
                  <span>🕐 <strong>${formattedTime}</strong></span>
                  <span>📅 <strong>${formattedDate}</strong></span>
                </div>
              </div>
              ${reminder.recurring
                ? `<div class="next-reminder">⏰ Próximo lembrete em: <strong>${nextReminderText}</strong> (${reminder.recurring_type})</div>`
                : ""}
              <a href="${APP_URL}" class="cta-button">Gerencie seus lembretes</a>
              <p style="color:#888;font-size:14px;margin-top:30px">
                Abraços,<br>
                <strong>RemindMail – Seus compromissos, sempre lembrados.</strong>
              </p>
            </div>
            <div class="footer">
              <p>Esta é uma mensagem automática. Não responda este email.</p>
              <p>© ${new Date().getFullYear()} RemindMail. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Oi ${reminder.username}! 👋

Lembrete: ${reminder.title}
${reminder.description || ""}

🕐 ${formattedTime} — 📅 ${formattedDate}
${reminder.recurring ? `\n⏰ Próximo lembrete: ${nextReminderText} (${reminder.recurring_type})` : ""}

Gerencie seus lembretes: ${APP_URL}

Abraços,
RemindMail
      `.trim();

      await sendEmail({
        to: reminder.email,
        subject: `🔔 Lembrete: ${reminder.title}`,
        htmlContent,
        textContent,
      });

      if (reminder.recurring) {
        await pool.query(
          "UPDATE reminders SET remind_at = $1, sent = false WHERE id = $2",
          [nextDate, reminder.id]
        );
      } else {
        await pool.query(
          "UPDATE reminders SET sent = true WHERE id = $1",
          [reminder.id]
        );
      }

      console.log("✅ Email enviado para:", reminder.email);
    } catch (error) {
      console.log("❌ Erro ao enviar email:", error.message);
    }
  }
});

// ─── Inicialização ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT, "✅");
});

pool
  .connect()
  .then(async () => {
    console.log("BANCO CONECTADO ✅");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        username TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        remind_at TIMESTAMP NOT NULL,
        recurring BOOLEAN DEFAULT false,
        recurring_type TEXT,
        sent BOOLEAN DEFAULT false
      );
    `);

    console.log("TABELAS OK ✅");
  })
  .catch((err) => console.log("ERRO BANCO ❌", err));
