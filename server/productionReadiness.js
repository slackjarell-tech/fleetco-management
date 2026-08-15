/**
 * Production readiness — which FleetCo subsystems are configured and running.
 */
import { getEmailConfigStatus } from './email.js';
import { getStripeConfigStatus } from './stripeBilling.js';
import { getConnectConfigStatus } from './stripeConnect.js';
import { isCarrierPayoutEnabled } from './stripeCarrierPayouts.js';
import { isAutopilotEnabled } from './marketingAutopilot.js';
import { getAiStatus, verifyAiProvider } from './aiProvider.js';
import { getStoreStats } from './db.js';

export async function getProductionReadiness({ verifyAi = false } = {}) {
  const email = getEmailConfigStatus();
  const stripe = getStripeConfigStatus();
  const connect = getConnectConfigStatus();
  const aiBase = getAiStatus();
  let ai = aiBase;
  if (verifyAi && aiBase.configured) {
    ai = await verifyAiProvider();
  }

  const store = getStoreStats?.() || {};

  const checks = [
    {
      id: 'api',
      label: 'Web API',
      live: true,
      detail: 'Server responding',
    },
    {
      id: 'database',
      label: 'PostgreSQL persistence',
      live: !!process.env.DATABASE_URL,
      detail: process.env.DATABASE_URL ? 'DATABASE_URL set' : 'Missing DATABASE_URL — data may reset on redeploy',
    },
    {
      id: 'email',
      label: 'Transactional email (Resend)',
      live: email.configured,
      detail: email.configured
        ? `From ${email.from}`
        : 'Set RESEND_API_KEY on Render and verify fleetcomanagement.org domain',
    },
    {
      id: 'ai',
      label: 'Marketing & guide AI',
      live: ai.configured && (verifyAi ? ai.healthy : true),
      detail: ai.configured
        ? `${ai.provider} · ${ai.model}${ai.healthy === false ? ` · unhealthy (${ai.health_error || 'check key'})` : ''}`
        : 'Set GROQ_API_KEY or GEMINI_API_KEY',
    },
    {
      id: 'marketing_autopilot',
      label: 'Marketing autopilot scheduler',
      live: isAutopilotEnabled() && email.configured && ai.configured,
      detail: isAutopilotEnabled()
        ? (email.configured ? 'Enabled — requires Resend + AI' : 'Needs RESEND_API_KEY')
        : 'MARKETING_AUTOPILOT_DISABLED=true',
    },
    {
      id: 'stripe_billing',
      label: 'Stripe subscriptions & broker cards',
      live: stripe.configured,
      detail: stripe.configured
        ? (stripe.webhookConfigured ? 'Stripe + webhook configured' : 'Add STRIPE_WEBHOOK_SECRET + webhook URL')
        : 'Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY',
    },
    {
      id: 'stripe_connect',
      label: 'Broker auto-pay to carriers',
      live: isCarrierPayoutEnabled(),
      detail: isCarrierPayoutEnabled()
        ? 'STRIPE_CONNECT_ENABLED=true — brokers need cards, carriers need Connect onboarding'
        : 'Set STRIPE_CONNECT_ENABLED=true and complete Stripe Connect setup',
    },
    {
      id: 'carrier_payments',
      label: 'Carrier payment terms & SLT alerts',
      live: true,
      detail: 'Net 7/15 terms, reminders, and SLT emails (needs Resend)',
    },
    {
      id: 'load_messaging',
      label: 'Immutable load board messaging',
      live: true,
      detail: 'Broker ↔ carrier threads + SLT oversight (code deployed)',
    },
  ];

  const liveCount = checks.filter((c) => c.live).length;
  const pending = checks.filter((c) => !c.live);

  return {
    ok: pending.length === 0,
    live_count: liveCount,
    total: checks.length,
    checks,
    pending: pending.map((c) => ({ id: c.id, label: c.label, detail: c.detail })),
    env: {
      node_env: process.env.NODE_ENV || 'development',
      public_app_url: process.env.PUBLIC_APP_URL || process.env.APP_ORIGIN || null,
      postgres: !!process.env.DATABASE_URL,
      stripe_connect: process.env.STRIPE_CONNECT_ENABLED === 'true',
      autopilot: isAutopilotEnabled(),
      carrier_payment_scheduler: process.env.CARRIER_PAYMENT_SCHEDULER_DISABLED !== 'true',
    },
    store,
    stripe_webhook_url: `${(process.env.PUBLIC_APP_URL || process.env.APP_ORIGIN || 'https://fleetcomanagement.org').replace(/\/$/, '')}/api/billing/webhook`,
    connect: {
      enabled: connect.connectEnabled,
      ready: connect.ready,
    },
  };
}
