/**
 * FleetCo Management LLC — internal hiring postings (founders: JaRell & Desiree Slack).
 */
import { createEntity, listEntities, nowIso, updateEntity } from './db.js';
import { sendEmail } from './email.js';
import { slugify } from './jobBoardTypes.js';

const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';
const HIRING_CONTACT = process.env.HIRING_CONTACT_EMAIL || 'support@fleetcomanagement.org';

export const FLEETCO_HIRING_ROLES = [
  {
    key: 'customer_success',
    title: 'Customer Success & Onboarding Specialist',
    job_category: 'hr_recruiting',
    employment_type: 'full_time',
    pay_type: 'salary',
    pay_description: '$45,000–$55,000/year + activation bonus · Dallas, TX (hybrid/remote friendly)',
    location_city: 'Dallas',
    location_state: 'TX',
    contact_email: HIRING_CONTACT,
    description: `FleetCo Management is hiring our first Customer Success & Onboarding Specialist to help owner-operators and small fleets get live on our platform fast.

You'll be the face of FleetCo after the sale — guiding new customers from signup to their first driver on the app, first load posted, and confident daily use of the portal.

**About FleetCo**
We build fleet software for owner-operators and small carriers: dispatch, drivers, maintenance, fuel, payroll, compliance, load board, and a driver mobile app — from $35/unit/month.

**Leadership**
JaRell Slack, CEO · Desiree Slack, COO · Founders, FleetCo Management LLC`,
    requirements: `• 2+ years in trucking office ops: dispatcher, fleet admin, safety, or customer-facing fleet role
• Comfortable leading Zoom onboarding calls and writing simple how-to notes
• Patient, organized, and clear on the phone — you enjoy teaching non-technical users
• Familiar with CDL fleets, DOT basics, and how small carriers actually run day-to-day
• Bonus: experience with TMS, ELD, or fleet software

**What you'll do**
• Run every new customer onboarding (portal setup, users, drivers, billing questions)
• Track activation: first login, first driver, first load (for brokers), 30-day check-in
• Tier-1 support: passwords, navigation, billing FAQs — escalate bugs to leadership
• Collect product feedback and log patterns for the CEO/COO
• Help refine onboarding checklists and help articles

**Reports to:** Desiree Slack, COO`,
    home_time: 'Mon–Fri core hours · occasional onboarding calls outside 9–5 CST',
    equipment_type: null,
    is_featured: true,
  },
  {
    key: 'inside_sales',
    title: 'Inside Sales / Business Development Representative',
    job_category: 'sales_account',
    employment_type: 'full_time',
    pay_type: 'salary',
    pay_description: '$40,000–$50,000 base + commission on closed fleet accounts · Remote (US)',
    location_city: 'Dallas',
    location_state: 'TX',
    contact_email: HIRING_CONTACT,
    description: `FleetCo Management is hiring an Inside Sales / BDR to grow our carrier and broker customer base.

You'll own outbound and inbound lead follow-up — turning website interest into demos, trials, and paying customers for our fleet portal and load board.

**About FleetCo**
All-in-one fleet platform + broker load board. Carriers pay $35/unit/month. Brokers post loads free and pay 3.5% when freight moves.

**Leadership**
JaRell Slack, CEO · Desiree Slack, COO`,
    requirements: `• 1–3 years inside sales, BDR, or business development (SaaS or trucking industry a plus)
• Comfortable with cold outreach: phone, email, LinkedIn, Facebook groups
• Can explain pricing simply and book demos for leadership
• Self-starter — you don't wait for leads to come to you
• Bonus: you've worked with carriers, brokers, factoring, or trucking insurance

**What you'll do**
• Follow up on inbound leads (website, contact form, marketing chat, trial requests)
• Outbound to owner-operators and 5–20 truck fleets
• Recruit freight brokers to post on the FleetCo Load Board
• Maintain pipeline in CRM/spreadsheet; report weekly to CEO
• Hit activity targets: calls, demos booked, accounts activated

**Reports to:** JaRell Slack, CEO`,
    home_time: 'Flexible remote · US time zones · weekly team sync CST',
    equipment_type: null,
    is_featured: true,
  },
  {
    key: 'platform_support',
    title: 'Part-Time Technical Support Specialist (Platform)',
    job_category: 'office_admin',
    employment_type: 'part_time',
    pay_type: 'hourly',
    pay_description: '$28–$38/hr · 10–20 hrs/week · Contract-to-hire possible',
    location_city: 'Remote',
    location_state: 'US',
    contact_email: HIRING_CONTACT,
    description: `FleetCo Management seeks a part-time Technical Support Specialist to keep our production platform healthy while founders focus on sales and customers.

This is not fleet dispatch — you'll support our web app, driver mobile app, billing (Stripe), and email systems.

**About FleetCo**
Fleet SaaS on React + Node, hosted on Render, email via Resend, payments via Stripe.

**Leadership**
JaRell Slack, CEO (technical product) · Desiree Slack, COO (operations)`,
    requirements: `• 2+ years technical support, help desk, or junior DevOps — SaaS preferred
• Comfortable with browser dev tools, basic API/log reading, and clear customer communication
• Familiar with Stripe checkout, DNS/email delivery troubleshooting, or cloud hosting (Render/AWS)
• Available for urgent production issues on a shared on-call rotation (paid)
• Bonus: JavaScript, React, or Node experience

**What you'll do**
• Tier-2 support: login issues, billing/checkout, driver app access, email delivery
• Monitor uptime and document runbooks for common fixes
• Triage bugs for CEO; verify steps to reproduce
• Assist with deployment checklists and environment variable documentation
• 10–20 hours/week to start; scale with customer count

**Reports to:** JaRell Slack, CEO`,
    home_time: 'Flexible hours · response SLA agreed per week',
    equipment_type: null,
    is_featured: false,
  },
];

function fleetcoSlug(title) {
  return `fleetco-${slugify(title)}`.slice(0, 90);
}

function findExistingPosting(key, title) {
  const slug = fleetcoSlug(title);
  return listEntities('JobPosting').find(
    (j) => j.slug === slug || j.internal_key === key || (j.title === title && !j.customer_id),
  );
}

export function seedFleetCoHiringPostings({ reopen = true } = {}) {
  const ts = nowIso();
  const results = [];

  for (const role of FLEETCO_HIRING_ROLES) {
    const slug = fleetcoSlug(role.title);
    let posting = findExistingPosting(role.key, role.title);

    const payload = {
      customer_id: null,
      internal_key: role.key,
      slug,
      title: role.title,
      job_category: role.job_category,
      employment_type: role.employment_type,
      pay_type: role.pay_type,
      pay_description: role.pay_description,
      location_city: role.location_city,
      location_state: role.location_state,
      description: role.description,
      requirements: role.requirements,
      home_time: role.home_time,
      equipment_type: role.equipment_type,
      contact_email: role.contact_email,
      is_featured: !!role.is_featured,
      status: 'open',
      application_count: posting?.application_count || 0,
      published_at: posting?.published_at || ts,
      updated_at: ts,
    };

    if (posting) {
      posting = updateEntity('JobPosting', posting.id, payload);
      results.push({ action: 'updated', posting, apply_url: `${APP_URL}/jobs/${posting.slug}` });
    } else {
      posting = createEntity('JobPosting', {
        ...payload,
        created_at: ts,
      });
      results.push({ action: 'created', posting, apply_url: `${APP_URL}/jobs/${posting.slug}` });
    }
  }

  return { success: true, postings: results, jobs_url: `${APP_URL}/jobs` };
}

function wrapEmailHtml(body) {
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:680px;color:#0f172a;line-height:1.6">
  ${body}
  <p style="margin-top:32px;font-size:13px;color:#64748b">
    FleetCo Management LLC · JaRell Slack, CEO · Desiree Slack, COO<br/>
    <a href="${APP_URL}">fleetcomanagement.org</a> · ${HIRING_CONTACT}
  </p>
</div>`;
}

export function buildFleetCoHiringEmailHtml(postings = []) {
  const cards = postings.map(({ posting, apply_url }) => `
    <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px">
      <h2 style="margin:0 0 8px;font-size:20px">${posting.title}</h2>
      <p style="margin:0 0 12px;color:#64748b;font-size:14px">${posting.pay_description || ''} · ${posting.location_city || ''}, ${posting.location_state || ''}</p>
      <p style="white-space:pre-wrap;font-size:14px">${(posting.description || '').slice(0, 600)}…</p>
      <p style="margin-top:16px"><a href="${apply_url}" style="display:inline-block;background:#f59e0b;color:#0f172a;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">View & share apply link</a></p>
    </div>
  `).join('');

  return wrapEmailHtml(`
    <h1 style="font-size:24px;margin-bottom:8px">FleetCo hiring postings — ready to publish</h1>
    <p>Hi JaRell &amp; Desiree,</p>
    <p>Three open roles are live on the FleetCo Jobs board. Share these links on LinkedIn, Indeed, or with candidates directly.</p>
    <p><a href="${APP_URL}/jobs" style="color:#b45309;font-weight:700">Browse all jobs → ${APP_URL}/jobs</a></p>
    ${cards}
    <h3 style="margin-top:24px">Hiring priority</h3>
    <ol style="font-size:14px">
      <li><strong>Customer Success &amp; Onboarding</strong> — hire first (activation &amp; retention)</li>
      <li><strong>Inside Sales / BDR</strong> — hire second (pipeline &amp; broker growth)</li>
      <li><strong>Part-Time Platform Support</strong> — hire third or contract (10–20 hrs/wk)</li>
    </ol>
    <p style="font-size:14px;color:#64748b">Manage applicants in Portal → Drivers &amp; Payroll → <strong>Hiring Hub</strong>.</p>
  `);
}

export function buildFleetCoHiringEmailText(postings = []) {
  const lines = [
    'FleetCo hiring postings are live.',
    '',
    `Jobs board: ${APP_URL}/jobs`,
    '',
  ];
  for (const { posting, apply_url } of postings) {
    lines.push(`--- ${posting.title} ---`, apply_url, posting.pay_description || '', '');
  }
  lines.push('Priority: 1) Customer Success  2) Inside Sales  3) Part-Time Platform Support');
  return lines.join('\n');
}

export async function seedAndEmailFleetCoHiringPosts({ to, reopen = true } = {}) {
  const seed = seedFleetCoHiringPostings({ reopen });
  const recipient = (to || '').trim();
  if (!recipient) {
    return { ...seed, email: { success: false, skipped: true, reason: 'no recipient' } };
  }

  const email = await sendEmail({
    to: recipient,
    subject: 'FleetCo open roles — job postings created (Customer Success, Sales, Platform Support)',
    html: buildFleetCoHiringEmailHtml(seed.postings),
    text: buildFleetCoHiringEmailText(seed.postings),
    replyTo: HIRING_CONTACT,
  });

  return { ...seed, email };
}
