export const NOTIFICATION_PREF_KEYS = [
  'billing_reminders',
  'load_updates',
  'maintenance_alerts',
  'invoice_notices',
  'compliance_alerts',
  'portal_messages',
  'product_updates',
];

export const NOTIFICATION_PREF_LABELS = {
  billing_reminders: 'Billing & payment reminders',
  load_updates: 'Load & dispatch updates',
  maintenance_alerts: 'Maintenance & work order alerts',
  invoice_notices: 'Invoice notices',
  compliance_alerts: 'Compliance & safety alerts',
  portal_messages: 'Messages from FleetCo team',
  product_updates: 'Product news & tips',
};

export const NOTIFICATION_TYPE_TO_PREF = {
  load_assigned: 'load_updates',
  invoice_sent: 'invoice_notices',
  billing_reminder: 'billing_reminders',
  maintenance_due: 'maintenance_alerts',
  compliance_alert: 'compliance_alerts',
  portal_message: 'portal_messages',
  product_update: 'product_updates',
};

export const DEFAULT_NOTIFICATION_PREFS = {
  billing_reminders: true,
  load_updates: true,
  maintenance_alerts: true,
  invoice_notices: true,
  compliance_alerts: true,
  portal_messages: true,
  product_updates: false,
};

export function normalizeNotificationPrefs(raw = {}) {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS };
  for (const key of NOTIFICATION_PREF_KEYS) {
    if (typeof raw[key] === 'boolean') prefs[key] = raw[key];
  }
  return prefs;
}

export function getCustomerNotificationPrefs(customer) {
  return normalizeNotificationPrefs(customer?.notification_prefs);
}

export function shouldSendCustomerNotification(customer, prefKey) {
  if (!customer || !prefKey) return true;
  const prefs = getCustomerNotificationPrefs(customer);
  return prefs[prefKey] !== false;
}
