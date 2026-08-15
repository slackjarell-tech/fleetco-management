import { jobCategoryLabel } from './jobBoardTypes.js';

const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

function firstName(app) {
  return (app.name || 'there').split(' ')[0];
}

function wrapHtml(body, companyName) {
  return `
<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;color:#0f172a;line-height:1.6">
  ${body}
  <p style="margin-top:28px;font-size:13px;color:#64748b">
    ${companyName || 'FleetCo Management LLC'}<br/>
    Powered by <a href="${APP_URL}">FleetCo Management</a>
  </p>
</div>`;
}

export const APPLICANT_NURTURE_SEQUENCE = [
  {
    step: 1,
    delayHours: 0,
    name: 'application_received',
    subject: (app, job) => `Application received — ${job?.title || 'your position'}`,
    build: (app, job, company) => {
      const text = [
        `Hi ${firstName(app)},`,
        '',
        `Thank you for applying for ${job?.title || 'the open position'} at ${company?.company_name || 'our fleet'}.`,
        '',
        'Our hiring team is reviewing applications and will contact you if your experience is a match.',
        '',
        '— Hiring Team',
      ].join('\n');
      const html = wrapHtml(`
        <p>Hi ${firstName(app)},</p>
        <p>Thank you for applying for <strong>${job?.title || 'the open position'}</strong> at <strong>${company?.company_name || 'our fleet'}</strong>.</p>
        <p>We received your application and our team will review it shortly.</p>
      `, company?.company_name);
      return { text, html };
    },
  },
  {
    step: 2,
    delayHours: 48,
    name: 'complete_profile',
    subject: () => 'Quick tip — stand out to fleet hiring managers',
    build: (app, job, company) => {
      const text = [
        `Hi ${firstName(app)},`,
        '',
        'Fleet hiring teams look for clear CDL class, endorsements, and home-time preferences.',
        'If you have not already, reply to this email with any updates to your experience or availability.',
        '',
        `Position: ${job?.title || 'Open role'}`,
        '',
        '— Hiring Team',
      ].join('\n');
      const html = wrapHtml(`<p>Hi ${firstName(app)},</p><p>Make sure your CDL class, endorsements, and availability are up to date — it helps our team match you faster.</p>`, company?.company_name);
      return { text, html };
    },
  },
  {
    step: 3,
    delayHours: 120,
    name: 'still_hiring',
    subject: (app, job) => `Still hiring — ${job?.title || 'open role'}`,
    build: (app, job, company) => {
      const text = [
        `Hi ${firstName(app)},`,
        '',
        `We are still accepting applications for ${job?.title || 'this role'} (${jobCategoryLabel(job?.job_category)}).`,
        'If you are still interested, no action is needed — your application remains on file.',
        '',
        '— Hiring Team',
      ].join('\n');
      const html = wrapHtml(`<p>Hi ${firstName(app)},</p><p>Your application for <strong>${job?.title || 'this role'}</strong> is still active. We will reach out when there is a next step.</p>`, company?.company_name);
      return { text, html };
    },
  },
];

export function buildNewApplicantAlertHtml(application, job, company) {
  return wrapHtml(`
    <h2 style="margin:0 0 12px">New job applicant</h2>
    <p><strong>${application.name}</strong> applied for <strong>${job?.title}</strong></p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
      <tr><td style="padding:8px;color:#64748b">Email</td><td>${application.email}</td></tr>
      <tr><td style="padding:8px;color:#64748b">Phone</td><td>${application.phone || '—'}</td></tr>
      <tr><td style="padding:8px;color:#64748b">CDL</td><td>${application.cdl_class || '—'}</td></tr>
      <tr><td style="padding:8px;color:#64748b">Experience</td><td>${application.years_experience ?? '—'} yrs</td></tr>
    </table>
    <p style="margin-top:16px;white-space:pre-wrap">${(application.message || '').slice(0, 500)}</p>
    <p><a href="${APP_URL}/portal/hiring" style="display:inline-block;background:#f59e0b;color:#0f172a;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Review in FleetCo Portal</a></p>
  `, company?.company_name);
}
