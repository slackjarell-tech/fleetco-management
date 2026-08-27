/**
 * Create FleetCo internal hiring postings and email leadership.
 *
 * Production:
 *   node scripts/seed-fleetco-hiring-posts.mjs --production --to Dray071994@gmail.com
 *
 * Local database + email (RESEND_API_KEY required for email):
 *   node scripts/seed-fleetco-hiring-posts.mjs --to Dray071994@gmail.com
 */
import {
  FLEETCO_HIRING_ROLES,
  buildFleetCoHiringEmailHtml,
  buildFleetCoHiringEmailText,
  seedFleetCoHiringPostings,
  seedAndEmailFleetCoHiringPosts,
} from '../server/fleetcoHiringPosts.js';

const args = process.argv.slice(2);
const production = args.includes('--production');
const toIdx = args.indexOf('--to');
const to = toIdx >= 0 ? args[toIdx + 1] : 'Dray071994@gmail.com';

const BASE = production ? 'https://fleetcomanagement.org' : 'http://localhost:3001';
const APP_URL = 'https://fleetcomanagement.org';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'jarell.slack@fleetcomanagement.org';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || process.env.OWNER_BOOTSTRAP_PASSWORD || 'FleetCo2026!';

async function loginProduction() {
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(loginData.error || `Login failed (${loginRes.status})`);
  }
  return loginData.access_token;
}

async function runProductionViaFunction(token) {
  const fnRes = await fetch(`${BASE}/api/functions/seedFleetCoHiringPosts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to, reopen: true }),
  });
  const fnData = await fnRes.json();
  if (!fnRes.ok) {
    throw new Error(fnData.error || `seedFleetCoHiringPosts failed (${fnRes.status})`);
  }
  return fnData;
}

async function runProductionFallback(token) {
  const postings = [];

  for (const role of FLEETCO_HIRING_ROLES) {
    const {
      title, job_category, employment_type, pay_type, pay_description,
      location_city, location_state, description, requirements,
      home_time, equipment_type, contact_email, is_featured,
    } = role;
    const res = await fetch(`${BASE}/api/job-board/postings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        job_category,
        employment_type,
        pay_type,
        pay_description,
        location_city,
        location_state,
        description,
        requirements,
        home_time,
        equipment_type,
        contact_email,
        is_featured,
        status: 'open',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Failed to create ${role.title}`);
    }
    postings.push({
      action: 'created',
      posting: data,
      apply_url: `${APP_URL}/jobs/${data.slug}`,
    });
  }

  const emailRes = await fetch(`${BASE}/api/functions/sendSystemEmail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      subject: 'FleetCo open roles — job postings created (Customer Success, Sales, Platform Support)',
      html: buildFleetCoHiringEmailHtml(postings),
      text: buildFleetCoHiringEmailText(postings),
    }),
  });
  const email = await emailRes.json();
  if (!emailRes.ok) {
    throw new Error(email.error || 'Email send failed');
  }

  return { success: true, postings, jobs_url: `${APP_URL}/jobs`, email, mode: 'fallback' };
}

async function runProduction() {
  const token = await loginProduction();
  try {
    return await runProductionViaFunction(token);
  } catch (err) {
    if (!String(err.message).includes('Unknown function') && !String(err.message).includes('404')) {
      console.warn('[fallback]', err.message);
    }
    return runProductionFallback(token);
  }
}

async function runLocal() {
  const { initDatabase } = await import('../server/storePersist.js');
  await initDatabase();
  return seedAndEmailFleetCoHiringPosts({ to });
}

try {
  const result = production ? await runProduction() : await runLocal();
  console.log(JSON.stringify(result, null, 2));
  const emailOk = result.email?.success !== false;
  process.exit(emailOk ? 0 : 1);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
