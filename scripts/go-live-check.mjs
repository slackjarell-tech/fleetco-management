/**
 * Check production go-live status (no secrets required).
 * Usage: node scripts/go-live-check.mjs
 *        node scripts/go-live-check.mjs --local
 */
const BASE = process.argv.includes('--local')
  ? 'http://localhost:3001'
  : (process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org');

async function main() {
  console.log(`\n=== FleetCo go-live check (${BASE}) ===\n`);

  const health = await fetch(`${BASE}/api/public-settings`);
  console.log(`API health: ${health.status} ${health.ok ? 'OK' : 'FAIL'}`);
  if (!health.ok) {
    console.error('Production API is not responding. Check Render deploy logs.');
    process.exit(1);
  }

  const live = await fetch(`${BASE}/api/system/live-status`);
  if (!live.ok) {
    console.warn('Live status endpoint not deployed yet — redeploy latest main on Render.');
    process.exit(1);
  }

  const data = await live.json();
  console.log(`\nLive: ${data.live_count}/${data.total} subsystems\n`);

  for (const c of data.checks || []) {
    console.log(`  ${c.live ? '✓' : '✗'} ${c.label}`);
  }

  if (data.pending?.length) {
    console.log('\n--- Still needed on Render (Environment) ---\n');
    for (const p of data.pending) {
      console.log(`  • ${p.label}`);
      console.log(`    ${p.detail}\n`);
    }
    console.log('Render dashboard: https://dashboard.render.com/ → fleetco-management → Environment');
    console.log('After saving env vars, click Manual Deploy → Deploy latest commit.\n');
    console.log('Stripe webhook URL (when Stripe is configured):');
    console.log(`  ${BASE.replace(/\/$/, '')}/api/billing/webhook`);
    console.log('  Events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed, invoice.paid\n');
    process.exit(1);
  }

  console.log('\nAll subsystems report live.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
