require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
      }
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

app.put("/reminder/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, remind_at } = req.body;

    await pool.query(
      `UPDATE reminders 
       SET title = $1, description = $2, remind_at = $3 
       WHERE id = $4 AND user_id = $5`,
      [title, description, remind_at, req.params.id, req.user.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.log("ERRO UPDATE", err);
    res.status(500).json({ success: false });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    console.log("EMAIL:", email);
    console.log("PASSWORD:", password);
    if (!username) {
      return res.status(400).json({ error: "Username obrigatório" });
    }


    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password, username) VALUES ($1, $2, $3)",
      [email, hashed, username]
    );

    console.log("INSERT OK ✅");

    res.json({ success: true });

  } catch (err) {
    console.log("ERRO BANCO ");
    console.log(err);

    res.status(500).json({ success: false });
  }
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (!user.rows.length)
    return res.status(400).json({ error: "Usuário não encontrado" });

  const valid = await bcrypt.compare(
    password,
    user.rows[0].password
  );

  if (!valid)
    return res.status(400).json({ error: "Senha inválida" });

  const token = jwt.sign(
    { id: user.rows[0].id },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

app.post("/reminder", authMiddleware, async (req, res) => {
  const { title, description, remind_at, recurring, recurring_type } = req.body;


  await pool.query(
    `INSERT INTO reminders (user_id, title, description, remind_at, recurring, recurring_type)
   VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user.id, title, description, remind_at, recurring, recurring_type]
  );


  res.json({ message: "Lembrete criado" });
});

app.get("/reminders", authMiddleware, async (req, res) => {
  const reminders = await pool.query(
    "SELECT * FROM reminders WHERE user_id = $1 ORDER BY remind_at ASC",
    [req.user.id]
  );

  res.json(reminders.rows);
});

app.delete("/reminder/:id", authMiddleware, async (req, res) => {
  await pool.query(
    "DELETE FROM reminders WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );

  res.json({ message: "Lembrete removido" });
});

app.delete("/delete-account", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query("DELETE FROM reminders WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

cron.schedule("* * * * *", async () => {
  console.log("CRON RODANDO ✅", new Date());

  const now = new Date();

  const reminders = await pool.query(
    `SELECT reminders.*, users.email, users.username 
     FROM reminders 
     JOIN users ON users.id = reminders.user_id 
     WHERE sent = false`
  );

  for (const reminder of reminders.rows) {
    if (new Date(reminder.remind_at) <= now) {
      try {
        // Format date and time
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

        // Calculate next reminder if recurring
        let nextDate = null;
        if (reminder.recurring) {
          nextDate = new Date(reminder.remind_at);
          if (reminder.recurring_type === "daily")
            nextDate.setDate(nextDate.getDate() + 1);
          if (reminder.recurring_type === "weekly")
            nextDate.setDate(nextDate.getDate() + 7);
          if (reminder.recurring_type === "monthly")
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        const nextReminderDate = nextDate
          ? nextDate.toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
          : "Não há próximos lembretes agendados";

        // HTML Email Template 
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content {
                background: white;
                padding: 30px;
              }
              .greeting {
                font-size: 18px;
                margin-bottom: 20px;
              }
              .reminder-box {
                background: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
              }
              .reminder-title {
                font-size: 22px;
                font-weight: bold;
                color: #667eea;
                margin: 0 0 10px 0;
              }
              .reminder-description {
                color: #555;
                font-size: 16px;
                margin: 10px 0;
              }
              .reminder-meta {
                font-size: 14px;
                color: #888;
                margin-top: 15px;
                display: flex;
                gap: 20px;
              }
              .meta-item {
                display: flex;
                align-items: center;
                gap: 5px;
              }
              .next-reminder {
                background: #e8f4f8;
                border-left: 4px solid #17a2b8;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 8px;
                font-size: 14px;
                color: #555;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
              }
              .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #888;
                border-top: 1px solid #ddd;
              }
              .emoji {
                font-size: 20px;
                margin-right: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 RemindMail</h1>
              </div>
              
              <div class="content">
                <div class="greeting">
                  Oi <strong>${reminder.username}</strong>! 👋
                </div>
                
                <p>Aqui está seu lembrete de agora:</p>
                
                <div class="reminder-box">
                  <div class="reminder-title">🔔 ${reminder.title}</div>
                  ${reminder.description
            ? `<div class="reminder-description">${reminder.description}</div>`
            : ""
          }
                  <div class="reminder-meta">
                    <div class="meta-item">🕐 <strong>${formattedTime}</strong></div>
                    <div class="meta-item">📅 <strong>${formattedDate}</strong></div>
                  </div>
                </div>
                
                ${reminder.recurring
            ? `<div class="next-reminder">
                        ⏰ Próximo lembrete em: <strong>${nextReminderDate}</strong> (${reminder.recurring_type})
                      </div>`
            : ""
          }
                
                <a href="http://localhost:5173" class="cta-button">Gerencie seus lembretes</a>
                
                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                  Abraços,<br>
                  <strong>RemindMail – Seus compromissos, sempre lembrados.</strong>
                </p>
              </div>
              
              <div class="footer">
                <p>Esta é uma mensagem automática. Não responda este email.</p>
                <p>© 2025 RemindMail. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Plain text version as fallback
        const textContent = `
Oi ${reminder.username}! 👋

Aqui está seu lembrete de agora:

🔔 ${reminder.title}
${reminder.description ? reminder.description : ""}

🕐 ${formattedTime}
📅 ${formattedDate}

${reminder.recurring ? `⏰ Próximo lembrete em: ${nextReminderDate} (${reminder.recurring_type})` : ""}

Gerencie seus lembretes: http://localhost:5173

Abraços,
RemindMail – Seus compromissos, sempre lembrados.
        `;

        // Send email
        await transporter.sendMail({
          from: `RemindMail <${process.env.EMAIL_USER}>`,
          to: reminder.email,
          subject: `🔔 Lembrete: ${reminder.title}`,
          html: htmlContent,
          text: textContent,
        });

        // Update database based on recurrence
        if (reminder.recurring) {
          let nextDate = new Date(reminder.remind_at);

          if (reminder.recurring_type === "daily")
            nextDate.setDate(nextDate.getDate() + 1);
          if (reminder.recurring_type === "weekly")
            nextDate.setDate(nextDate.getDate() + 7);
          if (reminder.recurring_type === "monthly")
            nextDate.setMonth(nextDate.getMonth() + 1);

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

        console.log("✅ Email enviado:", reminder.email);
      } catch (error) {
        console.log("❌ Erro ao enviar email:", error.message);
      }
    }
  }
});


  const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT, "✅");
});
 pool.connect()
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
        title TEXT,
        description TEXT,
        remind_at TIMESTAMP,
        recurring BOOLEAN DEFAULT false,
        recurring_type TEXT,
        sent BOOLEAN DEFAULT false
      );
    `);

    console.log("TABELAS OK ✅");
  })
  .catch(err => console.log("ERRO BANCO ❌", err));