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

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME }
);

const BREVO_API_KEY = process.env.BREVO_API_KEY;

async function sendEmail({ to, subject, htmlContent, textContent }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: "RemindMail", email: "lucianopereiradejesus14@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent,
    }),
  });

  if (!res.ok) throw new Error(`Brevo: ${await res.text()}`);
  return res.json();
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token inválido" });
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

const path = require("path");
app.use(express.static(path.join(__dirname, "dist")));

app.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username)
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    const hashed = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (email, password, username) VALUES ($1, $2, $3)", [email, hashed, username]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "E-mail já cadastrado" });
    res.status(500).json({ success: false });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (!result.rows.length) return res.status(400).json({ error: "Usuário não encontrado" });
    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (!valid) return res.status(400).json({ error: "Senha incorreta" });
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Erro interno" });
  }
});

app.post("/reminder", authMiddleware, async (req, res) => {
  try {
    const { title, description, remind_at, recurring, recurring_type } = req.body;
    if (!title || !remind_at) return res.status(400).json({ error: "Título e data são obrigatórios" });
    await pool.query(
      `INSERT INTO reminders (user_id, title, description, remind_at, recurring, recurring_type) VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, title, description, remind_at, recurring ?? false, recurring_type ?? null]
    );
    res.json({ message: "Lembrete criado" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar lembrete" });
  }
});

app.get("/reminders", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM reminders WHERE user_id = $1 ORDER BY remind_at ASC", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar lembretes" });
  }
});

app.put("/reminder/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, remind_at, recurring, recurring_type } = req.body;
    await pool.query(
      `UPDATE reminders SET title=$1, description=$2, remind_at=$3, recurring=$4, recurring_type=$5, sent=false WHERE id=$6 AND user_id=$7`,
      [title, description, remind_at, recurring ?? false, recurring_type ?? null, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.delete("/reminder/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM reminders WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    res.json({ message: "Lembrete removido" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover lembrete" });
  }
});

app.delete("/delete-account", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM reminders WHERE user_id=$1", [req.user.id]);
    await pool.query("DELETE FROM users WHERE id=$1", [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const RECURRING_LABELS = { daily: "Diariamente", weekly: "Semanalmente", monthly: "Mensalmente" };

cron.schedule("* * * * *", async () => {
  console.log("CRON ✅", new Date());
  const now = new Date();

  const { rows: reminders } = await pool.query(
    `SELECT reminders.*, users.email, users.username FROM reminders JOIN users ON users.id = reminders.user_id WHERE sent = false`
  );

  for (const reminder of reminders) {
    if (new Date(reminder.remind_at) > now) continue;

    try {
      const reminderDate = new Date(reminder.remind_at);
      const formattedDate = reminderDate.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const formattedTime = reminderDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      let nextDate = null;
      if (reminder.recurring) {
        nextDate = new Date(reminder.remind_at);
        if (reminder.recurring_type === "daily") nextDate.setDate(nextDate.getDate() + 1);
        if (reminder.recurring_type === "weekly") nextDate.setDate(nextDate.getDate() + 7);
        if (reminder.recurring_type === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const nextText = nextDate
        ? nextDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
        : null;

      const APP_URL = process.env.APP_URL || "https://remindmail.onrender.com";

      const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviso de lembrete</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; color: #333; }
    .wrapper { max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.75); font-size: 13px; margin-top: 4px; }
    .body { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .card { background: #f8f7ff; border: 1px solid #e0dbff; border-left: 4px solid #4f46e5; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
    .card-title { font-size: 20px; font-weight: 700; color: #4f46e5; margin-bottom: 8px; }
    .card-desc { font-size: 14px; color: #555; margin-bottom: 16px; line-height: 1.6; }
    .card-meta { display: flex; gap: 20px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; }
    .meta-item strong { color: #374151; }
    .recurring-badge { display: inline-flex; align-items: center; gap: 6px; background: #ede9fe; color: #5b21b6; border-radius: 20px; padding: 8px 16px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .cta { display: block; text-align: center; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .sign { font-size: 14px; color: #9ca3af; border-top: 1px solid #f0f0f0; padding-top: 20px; }
    .footer { background: #f8f9fa; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🔔 RemindMail</h1>
      <p>Seu aviso chegou na hora certa</p>
    </div>
    <div class="body">
      <p class="greeting">Olá, ${reminder.username}! 👋</p>
      <p class="subtitle">Você tem um compromisso agendado para agora.</p>

      <div class="card">
        <div class="card-title">${reminder.title}</div>
        ${reminder.description ? `<div class="card-desc">${reminder.description}</div>` : ""}
        <div class="card-meta">
          <div class="meta-item">🕐 <strong>${formattedTime}</strong></div>
          <div class="meta-item">📅 <strong>${formattedDate}</strong></div>
        </div>
      </div>

      ${reminder.recurring && nextText ? `
      <div class="recurring-badge">
      Próximo aviso: ${nextText} &mdash; ${RECURRING_LABELS[reminder.recurring_type] || reminder.recurring_type}
      </div>` : ""}

      <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff !important;text-decoration:none;padding:14px 32px;border-radius:30px;font-weight:600;font-size:15px;margin:8px 0 24px;">Gerenciar meus lembretes →</a>

      <div class="sign">
        Abraços,<br>
        <strong>Equipe RemindMail</strong><br>
        <span style="font-size:12px">Seus compromissos, sempre lembrados.</span>
      </div>
    </div>
    <div class="footer">
      Esta mensagem foi enviada automaticamente. Por favor, não responda.<br>
      © ${new Date().getFullYear()} RemindMail. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>`;

      const textContent = `Olá, ${reminder.username}!

Você tem um compromisso agendado:

📌 ${reminder.title}
${reminder.description ? `📝 ${reminder.description}\n` : ""}🕐 ${formattedTime} — 📅 ${formattedDate}
${reminder.recurring && nextText ? `🔁 Próximo aviso: ${nextText} (${RECURRING_LABELS[reminder.recurring_type]})` : ""}

Acesse seus lembretes: ${APP_URL}

Abraços,
Equipe RemindMail`.trim();

      await sendEmail({
        to: reminder.email,
        subject: `🔔 Lembrete: ${reminder.title}`,
        htmlContent,
        textContent,
      });

      if (reminder.recurring) {
        await pool.query("UPDATE reminders SET remind_at=$1, sent=false WHERE id=$2", [nextDate, reminder.id]);
      } else {
        await pool.query("UPDATE reminders SET sent=true WHERE id=$1", [reminder.id]);
      }

      console.log("✅ E-mail enviado para:", reminder.email);
    } catch (error) {
      console.log("❌ Erro ao enviar e-mail:", error.message);
    }
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => console.log("Servidor na porta", PORT, "✅"));

pool.connect()
  .then(async () => {
    console.log("BANCO CONECTADO ✅");
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, username TEXT NOT NULL);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS reminders (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, remind_at TIMESTAMP NOT NULL, recurring BOOLEAN DEFAULT false, recurring_type TEXT, sent BOOLEAN DEFAULT false);`);
    console.log("TABELAS OK ✅");
  })
  .catch(err => console.log("ERRO BANCO ❌", err));
