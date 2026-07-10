/**
 * Send welcome/login email to a customer by name (production API + optional CC).
 *
 * node scripts/send-customer-welcome-test.mjs --name "Terrance Wilson" --cc slackjarell@gmail.com
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = process.env.BASE_URL || 'https://fleetcomanagement.org';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'jarrell@fleetcomanagement.org';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'FleetCo2026!';

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const args = process.argv.slice(2);
const nameIdx = args.indexOf('--name');
const ccIdx = args.indexOf('--cc');
const searchName = nameIdx >= 0 ? args[nameIdx + 1] : 'Terrance Wilson';
const cc = ccIdx >= 0 ? args[ccIdx + 1] : '';

async function api(pathname, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${pathname}`);
  return data;
}

async function main() {
  console.log(`Logging in as ${OWNER_EMAIL}…`);
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
  });
  const token = login.access_token;

  console.log('Loading customers…');
  const customers = await api('/api/entities/Customer?sort=-created_date', { token });
  const needle = searchName.toLowerCase();
  const customer = customers.find(
    (c) =>
      c.contact_name?.toLowerCase().includes(needle) ||
      c.company_name?.toLowerCase().includes(needle) ||
      `${c.contact_name || ''} ${c.company_name || ''}`.toLowerCase().includes(needle),
  );

  if (!customer) {
    console.error(`No customer found matching "${searchName}".`);
    console.log('Recent customers:');
    customers.slice(0, 10).forEach((c) => {
      console.log(`  - ${c.contact_name || '—'} / ${c.company_name} <${c.email || 'no email'}>`);
    });
    process.exit(1);
  }

  console.log(`Found: ${customer.contact_name || customer.company_name} (${customer.company_name})`);
  console.log(`Email: ${customer.email}`);
  console.log(`Sending test login${cc ? ` (CC: ${cc})` : ''}…`);

  const result = await api('/api/functions/sendCustomerTestLogin', {
    method: 'POST',
    token,
    body: { customerId: customer.id, cc: cc || undefined },
  });

  let welcomeEmail = result.welcomeEmail;

  if (cc && !welcomeEmail?.success) {
    const { getResendApiKey } = await import('../server/email.js');
    const { sendWelcomeSignupEmail } = await import('../server/customerEmails.js');
    const { getCustomerNotificationPrefs } = await import('../server/notificationPreferences.js');
    if (getResendApiKey()) {
      console.log('Production email failed or CC not deployed — sending locally with CC…');
      welcomeEmail = await sendWelcomeSignupEmail({
        to: result.email,
        cc,
        companyName: customer.company_name,
        contactName: customer.contact_name,
        tempPassword: result.tempPassword,
        notificationPrefs: getCustomerNotificationPrefs(customer),
      });
    }
  }

  console.log('\n--- Result ---');
  console.log(result.message);
  console.log(`Login URL: ${result.loginUrl}`);
  console.log(`Email: ${result.email}`);
  console.log(`Temp password: ${result.tempPassword}`);
  if (result.welcomeEmail) {
    console.log('Welcome email:', welcomeEmail || result.welcomeEmail);
  }
  const sent = welcomeEmail || result.welcomeEmail;
  if (!sent?.success) {
    process.exit(1);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
