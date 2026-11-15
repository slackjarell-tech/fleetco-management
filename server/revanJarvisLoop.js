/**
 * Background Jarvis loop — periodic business ops + optional executive SMS on urgent signals.
 */
import { filterUsers, listEntities } from './db.js';
import { executeRevanTool } from './revanAiTools.js';
import { smsExecutiveBriefing } from './revanComms.js';

function executives() {
  return filterUsers({}).filter((u) => ['owner', 'executive'].includes(u.role) && u.status !== 'suspended');
}

function countNewInquiries() {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  return listEntities('Inquiry', '-created_date', 200).filter(
    (i) => (i.created_date || i.created_at || '') >= since,
  ).length;
}

async function tick() {
  if (process.env.REVAN_AUTO_BUSINESS_OPS === 'false') return;

  const exec = executives()[0];
  if (!exec) return;

  try {
    await executeRevanTool(exec, 'run_business_operations', {});
  } catch (err) {
    console.warn('[revan jarvis loop] business ops', err.message);
  }

  if (process.env.REVAN_URGENT_SMS !== 'true') return;
  const newLeads = countNewInquiries();
  if (newLeads < 3) return;

  for (const user of executives()) {
    try {
      await smsExecutiveBriefing(user, {
        body: `Revan alert: ${newLeads} new inquiries in the last 2 hours. Open the portal for detail.`,
      });
    } catch (err) {
      console.warn('[revan jarvis loop] urgent sms', err.message);
    }
  }
}

export function startRevanJarvisLoop() {
  const mins = Math.max(15, parseInt(process.env.REVAN_LOOP_MINUTES || '30', 10) || 30);
  const ms = mins * 60 * 1000;
  setInterval(() => {
    tick().catch((err) => console.error('[revan jarvis loop]', err.message));
  }, ms);
  setTimeout(() => {
    tick().catch((err) => console.error('[revan jarvis loop]', err.message));
  }, 120_000);
  console.log(`[revan] Jarvis autonomous loop — business ops every ${mins} min`);
}