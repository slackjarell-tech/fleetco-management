export const NOTIFICATION_OPTIONS = [
  {
    key: 'billing_reminders',
    label: 'Billing & payment reminders',
    description: 'Subscription due dates, payment confirmations, and billing alerts',
  },
  {
    key: 'load_updates',
    label: 'Load & dispatch updates',
    description: 'New load assignments, status changes, and dispatch notifications',
  },
  {
    key: 'maintenance_alerts',
    label: 'Maintenance & work order alerts',
    description: 'PM schedules, overdue service, and work order updates',
  },
  {
    key: 'invoice_notices',
    label: 'Invoice notices',
    description: 'When invoices are sent or updated',
  },
  {
    key: 'compliance_alerts',
    label: 'Compliance & safety alerts',
    description: 'HOS, inspections, incidents, and regulatory reminders',
  },
  {
    key: 'portal_messages',
    label: 'Messages from FleetCo team',
    description: 'Direct messages and account updates from your FleetCo team',
  },
  {
    key: 'product_updates',
    label: 'Product news & tips',
    description: 'New features, tips, and occasional product announcements',
  },
];

export const DEFAULT_NOTIFICATION_PREFS = {
  billing_reminders: true,
  load_updates: true,
  maintenance_alerts: true,
  invoice_notices: true,
  compliance_alerts: true,
  portal_messages: true,
  product_updates: false,
};
