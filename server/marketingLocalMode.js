/**
 * Local-first marketing — no Groq, Resend, or social API keys required.
 * Set MARKETING_LOCAL_ONLY=false to allow optional email/LLM when keys are configured.
 */
import { getResendApiKey } from './email.js';
import { getAiStatus } from './aiProvider.js';

export function isLocalMarketingMode() {
  if (process.env.MARKETING_LOCAL_ONLY === 'false') return false;
  return true;
}

export function marketingModeStatus() {
  const local = isLocalMarketingMode();
  const ai = getAiStatus();
  const hasResend = !!getResendApiKey();
  return {
    mode: local ? 'local' : 'hybrid',
    local_only: local,
    email_available: !local && hasResend,
    llm_available: !local && ai.configured && ai.healthy,
    description: local
      ? 'Marketing runs inside FleetCo — in-app alerts, outbox copy, rule-based website chat. No API keys.'
      : 'Hybrid mode — email/LLM used when keys are configured.',
  };
}
