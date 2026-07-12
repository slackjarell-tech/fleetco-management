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
  getStoreStats,
  exportStoreSnapshot,
} from './db.js';
import { seedDatabase } from './seed.js';
import { invokeFunction } from './functions.js';
import { runAgent, simpleLLM } from './aiAgent.js';
import { getBillingSnapshot } from './billing.js';
import { getCustomerNotificationPrefs } from './notificationPreferences.js';
import {
  canListAllUsers,
  canMutateUsers,
  canDeleteUser,
  canProvisionCustomers,
  canManageCustomerTeam,
  canManageDatastore,
} from './roles.js';
import { bulkCreateEntities } from './bulkImport.js';
import {
  buildFullBackup,
  buildCredentialsManifest,
  restoreFromBackup,
  validateBackup,
} from './datastoreBackup.js';
import { userMustChangePassword, activatePendingAccount } from './authHelpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'fleet-pulse-dev-secret-change-in-production';
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
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
  const email = (req.body.email || '').trim().toLowerCase();
  const { password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const row = getUserRowByEmail(email);
  if (!row || !row.password_hash || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (row.status === 'suspended') {
    return res.status(403).json({ error: 'This account is suspended. Contact your fleet administrator.' });
  }
  const user = findUserById(row.id);
  const token = signToken(user.id);
  const mustChangePassword = userMustChangePassword(email);
  res.json({ access_token: token, user, must_change_password: mustChangePassword });
});

app.post('/api/auth/register', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Public registration is disabled. Contact your fleet administrator.' });
  }
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
  const user = { ...req.user, must_change_password: userMustChangePassword(req.user.email) };
  if (user.customer_id) {
    const customer = getEntity('Customer', user.customer_id);
    if (customer) {
      user.billing = getBillingSnapshot(customer);
      user.system_paused = !!customer.system_paused;
      user.customer_name = customer.company_name;
      user.notification_prefs = getCustomerNotificationPrefs(customer);
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
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const row = getUserRowByEmail(req.user.email);
  if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (bcrypt.compareSync(newPassword, row.password_hash)) {
    return res.status(400).json({ error: 'New password must be different from your current password' });
  }
  updateUser(req.user.id, { password_hash: bcrypt.hashSync(newPassword, 10) });
  activatePendingAccount(req.user.email);
  res.json({ success: true, must_change_password: false });
});

app.post('/api/auth/reset-password-request', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = findUserByEmail(email.trim());
  if (user) {
    const token = jwt.sign({ email: user.email, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
    const appOrigin = (process.env.APP_ORIGIN || process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org').replace(/\/$/, '');
    const resetUrl = `${appOrigin}/reset-password?token=${encodeURIComponent(token)}`;
    console.log(`[password reset for ${user.email}]: ${resetUrl}`);

    try {
      const { sendPasswordResetEmail } = await import('./passwordResetEmails.js');
      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        fullName: user.full_name,
        resetUrl,
      });
      if (emailResult.skipped) {
        console.warn('[password reset] Email not sent — RESEND_API_KEY not configured. Use the link above manually.');
      } else if (!emailResult.success) {
        console.error('[password reset email failed]', emailResult.error, emailResult.hint || '');
      }
    } catch (err) {
      console.error('[password reset email error]', err.message);
    }
  }

  res.json({
    success: true,
    message: 'If an account exists with that email, a password reset link was sent.',
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const payload = jwt.verify(resetToken, JWT_SECRET);
    if (payload.type !== 'reset') throw new Error('Invalid token');
    const user = findUserByEmail(payload.email);
    if (!user) throw new Error('User not found');
    updateUser(user.id, { password_hash: bcrypt.hashSync(newPassword, 10) });
    activatePendingAccount(user.email);
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
  'DomainEmail', 'PaymentReminder', 'BarcodeScan', 'DashcamSession', 'DashcamFrame', 'Subscription', 'UsageFeedback', 'Vehicle', 'VehicleDocument', 'Vendor', 'TimeClockEntry', 'WorkOrder', 'User', 'Yard', 'YardPlacement',
];

function filterUsersForActor(actor, users) {
  if (!actor) return [];
  if (canListAllUsers(actor.role)) return users;
  if (actor.customer_id) {
    return users.filter((u) => u.customer_id === actor.customer_id);
  }
  return [];
}

function handleUserEntity(req, res, action) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { sort, limit: limitStr } = req.query;
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  if (action === 'list') {
    let users = filterUsersForActor(req.user, listUsers());
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
    return res.json(filterUsersForActor(req.user, filterUsers(req.body.criteria || {})));
  }

  if (action === 'get') {
    const user = findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (!filterUsersForActor(req.user, [user]).length) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json(user);
  }

  if (action === 'create') {
    if (!canMutateUsers(req.user)) return res.status(403).json({ error: 'Forbidden' });
    const { email, password, customer_id, customerId, ...rest } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (findUserByEmail(email)) return res.status(409).json({ error: 'User exists' });
    const effectiveCustomerId = customer_id || customerId || (canManageCustomerTeam(req.user.role) ? req.user.customer_id : null);
    if (canManageCustomerTeam(req.user.role) && effectiveCustomerId && effectiveCustomerId !== req.user.customer_id) {
      return res.status(403).json({ error: 'You can only add users to your own organization' });
    }
    const hash = bcrypt.hashSync(password || 'changeme123', 10);
    const user = createUser({
      email,
      passwordHash: hash,
      customerId: effectiveCustomerId,
      fullName: rest.full_name || rest.fullName,
      role: rest.role,
      employeeNumber: rest.employee_number || rest.employeeNumber,
    });
    return res.status(201).json(user);
  }

  if (action === 'update') {
    if (!canMutateUsers(req.user)) return res.status(403).json({ error: 'Forbidden' });
    const target = findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Not found' });
    if (!filterUsersForActor(req.user, [target]).length) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  }

  if (action === 'delete') {
    const target = findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Not found' });
    const customerRecord = target.customer_id ? getEntity('Customer', target.customer_id) : null;
    if (!canDeleteUser(req.user, target, customerRecord)) {
      return res.status(403).json({ error: 'You do not have permission to delete this user' });
    }
    deleteUser(req.params.id, { force: true });
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

app.post('/api/entities/:type/bulk', requireAuth, (req, res) => {
  const { type } = req.params;
  if (!ENTITY_NAMES.includes(type)) return res.status(404).json({ error: 'Unknown entity' });
  const records = req.body?.records;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records array required' });
  }
  if (records.length > 500) {
    return res.status(400).json({ error: 'Maximum 500 records per import' });
  }
  const result = bulkCreateEntities(type, records, req.user);
  res.status(result.created ? 201 : 400).json(result);
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
  if (type === 'Customer' && !canProvisionCustomers(req.user.role)) {
    return res.status(403).json({ error: 'Only FleetCo staff can delete customer records' });
  }
  deleteEntity(type, id);
  res.json({ success: true });
});

// ─── Functions & Integrations ───────────────────────────────────────────────

app.post('/api/customers/welcome-email', requireAuth, async (req, res) => {
  if (!canProvisionCustomers(req.user.role)) {
    return res.status(403).json({ error: 'Only FleetCo staff can send customer welcome emails' });
  }
  try {
    const result = await invokeFunction('sendCustomerWelcomeEmail', req.body, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

app.get('/api/admin/datastore', requireAuth, (req, res) => {
  if (!canManageDatastore(req.user.role)) {
    return res.status(403).json({ error: 'Executive or SLT access required' });
  }
  res.json({ success: true, stats: getStoreStats() });
});

app.get('/api/admin/datastore/export', requireAuth, (req, res) => {
  if (!canManageDatastore(req.user.role)) {
    return res.status(403).json({ error: 'Executive or SLT access required' });
  }
  const backup = buildFullBackup(req.user);
  const filename = `fleetco-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(backup);
});

app.get('/api/admin/datastore/credentials', requireAuth, (req, res) => {
  if (!canManageDatastore(req.user.role)) {
    return res.status(403).json({ error: 'Executive or SLT access required' });
  }
  res.json({
    success: true,
    credentials: buildCredentialsManifest(exportStoreSnapshot()),
  });
});

app.post('/api/admin/datastore/import', requireAuth, async (req, res) => {
  if (!canManageDatastore(req.user.role)) {
    return res.status(403).json({ error: 'Executive or SLT access required' });
  }
  if (req.body?.confirm !== true) {
    return res.status(400).json({
      error: 'Send { "confirm": true, "backup": { ... } } to replace all data with the backup file',
    });
  }
  const payload = req.body.backup || req.body;
  try {
    const result = await restoreFromBackup(payload);
    const { repairCustomerPortalLogins } = await import('./repairCustomerLogins.js');
    const repair = repairCustomerPortalLogins();
    const { flushDatabase } = await import('./storePersist.js');
    await flushDatabase();
    res.json({ ...result, repair });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/datastore/validate', requireAuth, (req, res) => {
  if (!canManageDatastore(req.user.role)) {
    return res.status(403).json({ error: 'Executive or SLT access required' });
  }
  try {
    const payload = req.body.backup || req.body;
    res.json({ success: true, ...validateBackup(payload) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** @deprecated use GET /api/admin/datastore/export */
app.post('/api/admin/datastore/backup', requireAuth, (req, res) => {
  if (!canManageDatastore(req.user.role)) {
    return res.status(403).json({ error: 'Executive or SLT access required' });
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="fleetco-backup-${Date.now()}.json"`);
  res.json(exportStoreSnapshot());
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

async function startServer() {
  const { beginStartupPhase, endStartupPhase } = await import('./dataIntegrity.js');
  const { initDatabase, flushDatabase } = await import('./storePersist.js');

  beginStartupPhase();
  await initDatabase();
  seedDatabase();
  endStartupPhase();
  console.log('[integrity] Startup complete — user passwords and records are protected on future deploys');

  const shutdown = async (signal) => {
    console.log(`[shutdown] ${signal} — saving database…`);
    await flushDatabase();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  app.listen(PORT, () => {
    console.log(`Fleetco Management API running on ${siteUrl}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
