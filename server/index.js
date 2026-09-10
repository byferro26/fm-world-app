import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { pool, migrate } from "./db.js";
import { registerUser, loginUser, signToken, authMiddleware, requireAdmin } from "./auth.js";
import { jaTemDados, seedDados } from "./seed.js";
import { enviarWhatsApp, whatsappConfigurado } from "./whatsapp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const COLLECTIONS = ["pessoas", "financeiro", "agenda", "tarefas", "documentos", "chat"];

function checkCollection(req, res, next) {
  if (!COLLECTIONS.includes(req.params.name)) return res.status(404).json({ error: "unknown_collection" });
  next();
}

async function requirePro(req, res, next) {
  try {
    const r = await pool.query("SELECT papel, plano FROM users WHERE id=$1", [req.auth.uid]);
    const u = r.rows[0];
    if (u?.papel === "admin" || u?.plano === "pro") return next();
    return res.status(402).json({ error: "Esta funcionalidade está disponível apenas no plano Pro.", pro: true });
  } catch (e) {
    res.status(500).json({ error: "Erro ao validar plano." });
  }
}

// ---------- Auth ----------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nome, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email e palavra-passe são obrigatórios." });
    if (String(password).length < 6) return res.status(400).json({ error: "A palavra-passe deve ter pelo menos 6 caracteres." });
    const user = await registerUser({ nome, email, password });
    res.json({ token: signToken(user), user });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Já existe uma conta com este email." });
    console.error(e);
    res.status(500).json({ error: "Erro ao criar conta." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await loginUser({ email, password });
    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, nome: user.nome, papel: user.papel, plano: user.plano },
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Erro ao entrar." });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const r = await pool.query("SELECT id, email, nome, papel, plano FROM users WHERE id=$1", [req.auth.uid]);
  if (!r.rows[0]) return res.status(404).json({ error: "not_found" });
  res.json({ user: r.rows[0] });
});

// Pedido de reposição de password: sem servidor de email disponível, o pedido
// fica visível para um administrador tratar em Administração → Pedidos de acesso.
app.post("/api/auth/request-reset", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Indica o teu email." });
  const userRes = await pool.query("SELECT id FROM users WHERE email=$1", [String(email).toLowerCase().trim()]);
  if (!userRes.rows[0]) {
    return res.json({ ok: true });
  }
  const id = crypto.randomUUID();
  await pool.query("INSERT INTO documents (collection, id, data) VALUES ('reset_requests',$1,$2)", [
    id,
    { email: String(email).toLowerCase().trim(), userId: userRes.rows[0].id, estado: "Pendente" },
  ]);
  res.json({ ok: true });
});

// ---------- Administração (apenas admin) ----------
app.get("/api/admin/users", authMiddleware, requireAdmin, async (req, res) => {
  const r = await pool.query("SELECT id, email, nome, papel, plano, created_at FROM users ORDER BY created_at ASC");
  res.json(r.rows);
});

app.patch("/api/admin/users/:id", authMiddleware, requireAdmin, async (req, res) => {
  const { papel, nome, plano } = req.body || {};
  if (papel && !["admin", "parceiro"].includes(papel)) return res.status(400).json({ error: "Papel inválido." });
  if (plano && !["standard", "pro"].includes(plano)) return res.status(400).json({ error: "Plano inválido." });
  if (req.params.id === req.auth.uid && papel === "parceiro") {
    return res.status(400).json({ error: "Não podes remover o teu próprio acesso de administrador." });
  }
  const r = await pool.query(
    "UPDATE users SET papel = COALESCE($1, papel), nome = COALESCE($2, nome), plano = COALESCE($3, plano) WHERE id=$4 RETURNING id, email, nome, papel, plano, created_at",
    [papel || null, nome || null, plano || null, req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: "not_found" });
  res.json(r.rows[0]);
});

app.post("/api/admin/users/:id/reset-password", authMiddleware, requireAdmin, async (req, res) => {
  const { novaPassword } = req.body || {};
  const senha = novaPassword && String(novaPassword).length >= 6 ? String(novaPassword) : crypto.randomBytes(4).toString("hex");
  const hash = await bcrypt.hash(senha, 10);
  const r = await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING email", [hash, req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: "not_found" });
  await pool.query(
    "UPDATE documents SET data = data || '{\"estado\":\"Resolvido\"}'::jsonb WHERE collection='reset_requests' AND data->>'userId' = $1",
    [req.params.id]
  );
  res.json({ ok: true, password: senha });
});

app.delete("/api/admin/users/:id", authMiddleware, requireAdmin, async (req, res) => {
  if (req.params.id === req.auth.uid) return res.status(400).json({ error: "Não podes remover a tua própria conta." });
  await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

app.get("/api/admin/reset-requests", authMiddleware, requireAdmin, async (req, res) => {
  const r = await pool.query(
    "SELECT id, data, created_at FROM documents WHERE collection='reset_requests' ORDER BY created_at DESC"
  );
  res.json(r.rows.map((row) => ({ id: row.id, ...row.data, criadoEm: row.created_at })));
});

app.delete("/api/admin/reset-requests/:id", authMiddleware, requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM documents WHERE collection='reset_requests' AND id=$1", [req.params.id]);
  res.json({ ok: true });
});

app.get("/api/admin/seed-status", authMiddleware, requireAdmin, async (req, res) => {
  res.json({ jaTemDados: await jaTemDados() });
});

app.post("/api/admin/seed", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const resumo = await seedDados();
    res.json({ ok: true, resumo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao gerar dados de teste." });
  }
});

// ---------- Coleções genéricas (pessoas, agenda, tarefas, documentos, chat, financeiro) ----------
app.get("/api/collections/:name", authMiddleware, checkCollection, async (req, res) => {
  const r = await pool.query(
    "SELECT id, data, created_at, updated_at FROM documents WHERE collection=$1 ORDER BY created_at ASC",
    [req.params.name]
  );
  res.json(r.rows.map((row) => ({ id: row.id, ...row.data, criadoEm: row.created_at, atualizadoEm: row.updated_at })));
});

app.post("/api/collections/:name", authMiddleware, checkCollection, async (req, res) => {
  const id = crypto.randomUUID();
  const data = req.body || {};
  await pool.query("INSERT INTO documents (collection, id, data) VALUES ($1,$2,$3)", [req.params.name, id, data]);

  // Ao marcar uma reunião/compromisso ligado a uma pessoa, avisa-a automaticamente por WhatsApp.
  if (req.params.name === "agenda" && data.pessoaId) {
    notificarCompromisso(data).catch((e) => console.error("Erro ao notificar compromisso:", e));
  }

  res.json({ id, ...data });
});

app.patch("/api/collections/:name/:id", authMiddleware, checkCollection, async (req, res) => {
  const r = await pool.query(
    "UPDATE documents SET data = data || $1::jsonb, updated_at = now() WHERE collection=$2 AND id=$3 RETURNING id, data",
    [JSON.stringify(req.body || {}), req.params.name, req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: "not_found" });
  res.json({ id: r.rows[0].id, ...r.rows[0].data });
});

app.delete("/api/collections/:name/:id", authMiddleware, checkCollection, async (req, res) => {
  await pool.query("DELETE FROM documents WHERE collection=$1 AND id=$2", [req.params.name, req.params.id]);
  res.json({ ok: true });
});

async function notificarCompromisso(evento) {
  const pessoaRes = await pool.query("SELECT data FROM documents WHERE collection='pessoas' AND id=$1", [evento.pessoaId]);
  const pessoa = pessoaRes.rows[0]?.data;
  if (!pessoa?.telefone) return;
  const quando = evento.hora ? `${evento.data} às ${evento.hora}` : evento.data;
  const texto = `Olá ${pessoa.nome}! Fica agendado: "${evento.titulo}" — ${quando}${evento.local ? ` (${evento.local})` : ""}.`;
  await enviarWhatsApp(pessoa.telefone, texto);
}

// ---------- Comunicações em massa (Pro) ----------
app.get("/api/comunicacoes/estado", authMiddleware, async (req, res) => {
  const r = await pool.query("SELECT papel, plano FROM users WHERE id=$1", [req.auth.uid]);
  const u = r.rows[0];
  res.json({ configurado: whatsappConfigurado(), pro: u?.papel === "admin" || u?.plano === "pro" });
});

app.post("/api/comunicacoes/enviar", authMiddleware, requirePro, async (req, res) => {
  const { destinatarioIds, mensagem } = req.body || {};
  if (!mensagem?.trim()) return res.status(400).json({ error: "Escreve uma mensagem." });
  if (!Array.isArray(destinatarioIds) || destinatarioIds.length === 0) return res.status(400).json({ error: "Escolhe pelo menos um destinatário." });

  const placeholders = destinatarioIds.map((_, i) => `$${i + 1}`).join(",");
  const r = await pool.query(
    `SELECT id, data FROM documents WHERE collection='pessoas' AND id IN (${placeholders})`,
    destinatarioIds
  );

  let enviadas = 0;
  let semTelefone = 0;
  for (const row of r.rows) {
    const pessoa = row.data;
    if (!pessoa.telefone) { semTelefone++; continue; }
    const ok = await enviarWhatsApp(pessoa.telefone, mensagem);
    if (ok) enviadas++;
  }

  const id = crypto.randomUUID();
  await pool.query("INSERT INTO documents (collection, id, data) VALUES ('comunicacoes',$1,$2)", [
    id,
    { mensagem, destinatarios: r.rows.length, enviadas, semTelefone, autorId: req.auth.uid },
  ]);

  res.json({ ok: true, destinatarios: r.rows.length, enviadas, semTelefone, configurado: whatsappConfigurado() });
});

app.get("/api/comunicacoes/historico", authMiddleware, requirePro, async (req, res) => {
  const r = await pool.query(
    "SELECT id, data, created_at FROM documents WHERE collection='comunicacoes' ORDER BY created_at DESC LIMIT 30"
  );
  res.json(r.rows.map((row) => ({ id: row.id, ...row.data, criadoEm: row.created_at })));
});

// ---------- Frontend estático (build do Vite) ----------
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 8080;
migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`FM World a correr na porta ${PORT}`));
  })
  .catch((e) => {
    console.error("Falha na migração da base de dados:", e);
    process.exit(1);
  });
