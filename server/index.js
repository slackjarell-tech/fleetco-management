import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import {
  createEntity,
  createUser,
  deleteEntity,
  deleteUser,
  filterEntities,
  filterUsers,
  findUserByEmail,
  findUserById,
  getEntity,
  getUserRowByEmail,
  getSiteSettings,
  listEntities,
  listUsers,
  nowIso,
  updateEntity,
  updateUser,
  db,
} from './db.js';
import { seedDatabase } from './seed.js';
import { invokeFunction } from './functions.js';
import { runAgent, simpleLLM } from './aiAgent.js';
import { getBillingSnapshot } from './billing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'fleet-pulse-dev-secret-change-in-production';
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

seedDatabase();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

const upload = multer({ dest: uploadsDir });

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = findUserById(payload.sub);
  } catch {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.use(authMiddleware);

// ─── Auth ───────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const row = getUserRowByEmail(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const user = findUserById(row.id);
  const token = signToken(user.id);
  res.json({ access_token: token, user });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (getUserRowByEmail(email)) return res.status(409).json({ error: 'User already exists' });
  const hash = bcrypt.hashSync(password, 10);
  const user = createUser({ email, passwordHash: hash, role: 'user' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.setOtp(email.toLowerCase(), code, Date.now() + 3600000);
  console.log(`[OTP for ${email}]: ${code}`);
  res.json({ success: true, message: 'Registration successful. Check server console for OTP in dev mode.' });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otpCode } = req.body;
  const row = db.getOtp(email);
  const user = findUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (process.env.NODE_ENV === 'production' && row && row.code !== otpCode) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }
  if (!otpCode || otpCode.length < 6) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }
  db.deleteOtp(email);
  const token = signToken(user.id);
  res.json({ access_token: token, user });
});

app.post('/api/auth/resend-otp', (req, res) => {
  const { email } = req.body;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.setOtp(email.toLowerCase(), code, Date.now() + 3600000);
  console.log(`[OTP resent for ${email}]: ${code}`);
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = { ...req.user };
  if (user.customer_id) {
    const customer = getEntity('Customer', user.customer_id);
    if (customer) {
      user.billing = getBillingSnapshot(customer);
      user.system_paused = !!customer.system_paused;
      user.customer_name = customer.company_name;
    }
  }
  res.json(user);
});

app.patch('/api/auth/me', requireAuth, (req, res) => {
  const updated = updateUser(req.user.id, req.body);
  res.json(updated);
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const row = getUserRowByEmail(req.user.email);
  if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  updateUser(req.user.id, { password_hash: bcrypt.hashSync(newPassword, 10) });
  res.json({ success: true });
});

app.post('/api/auth/reset-password-request', (req, res) => {
  const { email } = req.body;
  const user = findUserByEmail(email);
  if (user) {
    const token = jwt.sign({ email: user.email, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
    console.log(`[password reset for ${email}]: /reset-password?token=${token}`);
  }
  res.json({ success: true, message: 'If the email exists, a reset link was sent (check server console in dev).' });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { resetToken, newPassword } = req.body;
  try {
    const payload = jwt.verify(resetToken, JWT_SECRET);
    if (payload.type !== 'reset') throw new Error('Invalid token');
    const user = findUserByEmail(payload.email);
    if (!user) throw new Error('User not found');
    updateUser(user.id, { password_hash: bcrypt.hashSync(newPassword, 10) });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Invalid or expired reset token' });
  }
});

// Public settings (replaces Base44 public-settings check)
app.get('/api/public-settings', (_req, res) => {
  res.json({
    id: 'fleet-pulse',
    public_settings: {
      auth_required: false,
      site: getSiteSettings(),
    },
  });
});

// ─── AI Agent (Site Commander) ───────────────────────────────────────────────

const conversations = new Map();

app.get('/api/agents/status', requireAuth, async (_req, res) => {
  const { getAiStatus } = await import('./aiProvider.js');
  res.json(getAiStatus());
});

app.post('/api/agents/conversations', requireAuth, (req, res) => {
  const { agent_name = 'site_commander', metadata = {} } = req.body || {};
  const id = randomUUID();
  const welcome =
    agent_name === 'revan'
      ? 'Revan online — executive commander with Cursor-style control. I can change fleetcomanagement.org content, manage fleet records, run audits, and update users. Try: "Run a system health audit" or "Change the homepage headline to …"'
      : 'Site Commander online. I can read your fleet data and make real changes — like Cursor for your portal. Try: "Show open work orders" or "Change the homepage headline to …"';
  const conversation = {
    id,
    agent_name,
    metadata,
    user_id: req.user.id,
    messages: [{ role: 'assistant', content: welcome }],
    created_at: new Date().toISOString(),
  };
  conversations.set(id, conversation);
  res.json(conversation);
});

app.post('/api/agents/conversations/:id/messages', requireAuth, async (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation || conversation.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const { role, content } = req.body || {};
  if (role !== 'user' || !content?.trim()) {
    return res.status(400).json({ error: 'Message content required' });
  }

  conversation.messages.push({ role: 'user', content: content.trim() });

  try {
    const { message, actions, ai_status } = await runAgent({
      user: req.user,
      messages: conversation.messages,
      agentName: conversation.agent_name,
    });

    conversation.messages.push({
      role: 'assistant',
      content: message.content,
      actions: actions?.length ? actions : undefined,
    });

    res.json({
      ...conversation,
      ai_status,
      last_actions: actions || [],
    });
  } catch (err) {
    console.error('[agent error]', err);
    res.status(500).json({ error: err.message || 'Agent failed' });
  }
});

// ─── Entities ───────────────────────────────────────────────────────────────

const ENTITY_NAMES = [
  'Customer', 'DriverLocation', 'DiagnosticCode', 'FuelLog', 'DeliveryRoute',
  'DeliveryStop', 'HOSLog', 'FuelStation', 'Inquiry', 'Incident', 'Inspection',
  'Invoice', 'Load', 'MaintenanceSchedule', 'Message', 'PartInventory',
  'PayrollRecord', 'PendingAccount', 'ScreeningRecord', 'ServiceTemplate',
  'DomainEmail', 'PaymentReminder', 'BarcodeScan', 'Subscription', 'UsageFeedback', 'Vehicle', 'VehicleDocument', 'Vendor', 'TimeClockEntry', 'WorkOrder', 'User',
];

function handleUserEntity(req, res, action) {
  const { sort, limit: limitStr } = req.query;
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  if (action === 'list') {
    let users = listUsers();
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      users = users.sort((a, b) => {
        const av = a[field] ?? '';
        const bv = b[field] ?? '';
        return desc ? (av < bv ? 1 : av > bv ? -1 : 0) : (av > bv ? 1 : av < bv ? -1 : 0);
      });
    }
    if (limit) users = users.slice(0, limit);
    return res.json(users);
  }

  if (action === 'filter') {
    return res.json(filterUsers(req.body.criteria || {}));
  }

  if (action === 'get') {
    const user = findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json(user);
  }

  if (action === 'create') {
    const { email, password, ...rest } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (findUserByEmail(email)) return res.status(409).json({ error: 'User exists' });
    const hash = bcrypt.hashSync(password || 'changeme123', 10);
    const user = createUser({ email, passwordHash: hash, ...rest });
    return res.status(201).json(user);
  }

  if (action === 'update') {
    const updated = updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  }

  if (action === 'delete') {
    deleteUser(req.params.id);
    return res.json({ success: true });
  }
}

app.get('/api/entities/:type', requireAuth, (req, res) => {
  const { type } = req.params;
  if (!ENTITY_NAMES.includes(type)) return res.status(404).json({ error: 'Unknown entity' });
  if (type === 'User') return handleUserEntity(req, res, 'list');
  const { sort, limit } = req.query;
  res.json(listEntities(type, sort, limit ? parseInt(limit, 10) : undefined));
});

app.post('/api/entities/:type/filter', requireAuth, (req, res) => {
  const { type } = req.params;
  if (!ENTITY_NAMES.includes(type)) return res.status(404).json({ error: 'Unknown entity' });
  if (type === 'User') return handleUserEntity(req, res, 'filter');
  const { criteria, sort, limit } = req.body;
  res.json(filterEntities(type, criteria || {}, sort, limit));
});

app.get('/api/entities/:type/:id', requireAuth, (req, res) => {
  const { type, id } = req.params;
  if (type === 'User') return handleUserEntity(req, res, 'get');
  const item = getEntity(type, id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/entities/:type', requireAuth, (req, res) => {
  const { type } = req.params;
  if (type === 'User') return handleUserEntity(req, res, 'create');
  const item = createEntity(type, req.body);
  res.status(201).json(item);
});

app.patch('/api/entities/:type/:id', requireAuth, (req, res) => {
  const { type, id } = req.params;
  if (type === 'User') { req.params.id = id; return handleUserEntity(req, res, 'update'); }
  const item = updateEntity(type, id, req.body);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.delete('/api/entities/:type/:id', requireAuth, (req, res) => {
  const { type, id } = req.params;
  if (type === 'User') { req.params.id = id; return handleUserEntity(req, res, 'delete'); }
  deleteEntity(type, id);
  res.json({ success: true });
});

// ─── Functions & Integrations ───────────────────────────────────────────────

app.post('/api/functions/:name', authMiddleware, async (req, res) => {
  try {
    const result = await invokeFunction(req.params.name, req.body, req.user);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/integrations/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ file_url: fileUrl });
});

app.post('/api/integrations/llm', requireAuth, async (req, res) => {
  try {
    const result = await simpleLLM({ prompt: req.body?.prompt, user: req.user });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Production: serve built frontend + SPA fallback
const distDir = path.join(__dirname, '..', 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const siteUrl = process.env.APP_ORIGIN || `http://localhost:${PORT}`;
app.listen(PORT, () => {
  console.log(`Fleetco Management API running on ${siteUrl}`);
});
