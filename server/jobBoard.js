/**
 * Multi-tenant job board — public listings + portal hiring hub.
 */
import bcrypt from 'bcryptjs';
import {
  createEntity,
  createUser,
  findUserByEmail,
  getEntity,
  listEntities,
  nowIso,
  updateEntity,
} from './db.js';
import {
  resolveCustomerContext,
  buildScopeIndex,
  filterEntitiesForContext,
  assertEntityAccess,
  stampEntityForCreate,
  isInternalRole,
} from './entityScope.js';
import { canManageCustomerTeam } from './roles.js';
import { generateNextDriverNumber } from './entityNumbers.js';
import { isDriverCapableUser } from './driverAccess.js';
import { sendWelcomeSignupEmail } from './customerEmails.js';
import {
  JOB_CATEGORIES,
  EMPLOYMENT_TYPES,
  PAY_TYPES,
  APPLICATION_STATUSES,
  JOB_POSTING_STATUSES,
  slugify,
  jobCategoryLabel,
} from './jobBoardTypes.js';
import { enrollApplicantInAutopilot, notifyHiringTeam } from './jobApplicantAutopilot.js';

const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

function canManageHiring(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  return canManageCustomerTeam(user.role);
}

function getHiringContext(req) {
  const requested = req.headers['x-customer-context']?.trim() || null;
  const ctx = resolveCustomerContext(req.user, requested);
  if (ctx.customerId) ctx.scopeIndex = buildScopeIndex(ctx.customerId);
  return ctx;
}

function companySlug(customer) {
  if (!customer) return 'fleetco';
  return slugify(customer.company_name || customer.contact_name || customer.id);
}

function uniqueJobSlug(title, customerId, excludeId) {
  const base = slugify(title);
  const customer = customerId ? getEntity('Customer', customerId) : null;
  const prefix = companySlug(customer);
  let candidate = `${prefix}-${base}`.slice(0, 80);
  const existing = listEntities('JobPosting').filter((j) => j.id !== excludeId);
  if (!existing.some((j) => j.slug === candidate)) return candidate;
  let n = 2;
  while (existing.some((j) => j.slug === `${candidate}-${n}`)) n += 1;
  return `${candidate}-${n}`.slice(0, 90);
}

function enrichPublicJob(job) {
  const customer = job.customer_id ? getEntity('Customer', job.customer_id) : null;
  return {
    ...job,
    company_name: customer?.company_name || 'FleetCo Management',
    company_slug: companySlug(customer),
    category_label: jobCategoryLabel(job.job_category),
    apply_url: `${APP_URL}/jobs/${job.slug}`,
  };
}

function listOpenJobs(filters = {}) {
  let jobs = listEntities('JobPosting', '-published_at', 500)
    .filter((j) => j.status === 'open');

  if (filters.customer_id) {
    jobs = jobs.filter((j) => j.customer_id === filters.customer_id);
  }
  if (filters.company_slug) {
    jobs = jobs.filter((j) => {
      const c = j.customer_id ? getEntity('Customer', j.customer_id) : null;
      return companySlug(c) === filters.company_slug;
    });
  }
  if (filters.category) {
    jobs = jobs.filter((j) => j.job_category === filters.category);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.location_city || '').toLowerCase().includes(q) ||
        (j.location_state || '').toLowerCase().includes(q),
    );
  }
  return jobs.map(enrichPublicJob);
}

function scopedPostings(user, ctx) {
  let items = listEntities('JobPosting', '-updated_at', 500);
  items = filterEntitiesForContext('JobPosting', items, ctx, ctx.scopeIndex);
  if (!isInternalRole(user.role) && user.customer_id) {
    items = items.filter((j) => j.customer_id === user.customer_id);
  }
  return items;
}

function scopedApplications(user, ctx, jobPostingId) {
  let items = listEntities('JobApplication', '-created_at', 500);
  items = filterEntitiesForContext('JobApplication', items, ctx, ctx.scopeIndex);
  if (jobPostingId) items = items.filter((a) => a.job_posting_id === jobPostingId);
  if (!isInternalRole(user.role) && user.customer_id) {
    items = items.filter((a) => a.customer_id === user.customer_id);
  }
  return items;
}

function buildDashboard(user, ctx) {
  const postings = scopedPostings(user, ctx);
  const applications = scopedApplications(user, ctx);
  const open = postings.filter((p) => p.status === 'open').length;
  const newApps = applications.filter((a) => a.application_status === 'new').length;
  const pipeline = APPLICATION_STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.application_status === s).length;
    return acc;
  }, {});

  return {
    summary: {
      open_postings: open,
      total_postings: postings.length,
      total_applications: applications.length,
      new_applications: newApps,
      pipeline,
    },
    recent_applications: applications.slice(0, 12).map((a) => {
      const job = getEntity('JobPosting', a.job_posting_id);
      return { ...a, job_title: job?.title, job_slug: job?.slug };
    }),
    postings: postings.slice(0, 50).map((p) => ({
      ...p,
      application_count: applications.filter((a) => a.job_posting_id === p.id).length,
      apply_url: p.status === 'open' ? `${APP_URL}/jobs/${p.slug}` : null,
    })),
  };
}

export function registerJobBoardRoutes(app, requireAuth) {
  app.get('/api/public/jobs/meta', (_req, res) => {
    res.json({
      categories: JOB_CATEGORIES,
      employment_types: EMPLOYMENT_TYPES,
      pay_types: PAY_TYPES,
      application_statuses: APPLICATION_STATUSES,
      posting_statuses: JOB_POSTING_STATUSES,
    });
  });

  app.get('/api/public/jobs', (req, res) => {
    const { q, category, company } = req.query;
    const jobs = listOpenJobs({
      q,
      category,
      company_slug: company,
    });
    res.json({ jobs, total: jobs.length });
  });

  app.get('/api/public/jobs/:slug', (req, res) => {
    const job = listEntities('JobPosting').find((j) => j.slug === req.params.slug);
    if (!job || job.status !== 'open') {
      return res.status(404).json({ error: 'Job not found or no longer accepting applications' });
    }
    res.json(enrichPublicJob(job));
  });

  app.post('/api/public/jobs/:slug/apply', async (req, res) => {
    try {
      const job = listEntities('JobPosting').find((j) => j.slug === req.params.slug);
      if (!job || job.status !== 'open') {
        return res.status(404).json({ error: 'Job not found or no longer accepting applications' });
      }

      const {
        name, email, phone, message,
        cdl_class, endorsements, years_experience,
        location_city, location_state, resume_url,
      } = req.body || {};

      if (!name?.trim() || !email?.trim()) {
        return res.status(400).json({ error: 'Name and email are required' });
      }
      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Valid email required' });
      }

      const application = createEntity('JobApplication', {
        job_posting_id: job.id,
        customer_id: job.customer_id || null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        message: message?.trim() || null,
        cdl_class: cdl_class || null,
        endorsements: endorsements || null,
        years_experience: years_experience != null ? Number(years_experience) : null,
        location_city: location_city?.trim() || null,
        location_state: location_state?.trim() || null,
        resume_url: resume_url?.trim() || null,
        application_status: 'new',
        nurture_step: 0,
        source: 'web',
        created_at: nowIso(),
        updated_at: nowIso(),
      });

      updateEntity('JobPosting', job.id, {
        application_count: (job.application_count || 0) + 1,
        updated_at: nowIso(),
      });

      const company = job.customer_id ? getEntity('Customer', job.customer_id) : null;
      await notifyHiringTeam(application, job, company);
      const enroll = await enrollApplicantInAutopilot(application.id);

      res.status(201).json({
        success: true,
        application_id: application.id,
        message: 'Application submitted — check your email for confirmation.',
        autopilot: enroll,
      });
    } catch (err) {
      console.error('[job-board apply]', err);
      res.status(500).json({ error: err.message || 'Application failed' });
    }
  });

  app.get('/api/job-board/dashboard', requireAuth, (req, res) => {
    if (!canManageHiring(req.user)) {
      return res.status(403).json({ error: 'Hiring access required' });
    }
    const ctx = getHiringContext(req);
    res.json(buildDashboard(req.user, ctx));
  });

  app.get('/api/job-board/postings', requireAuth, (req, res) => {
    if (!canManageHiring(req.user)) {
      return res.status(403).json({ error: 'Hiring access required' });
    }
    const ctx = getHiringContext(req);
    res.json(scopedPostings(req.user, ctx));
  });

  app.post('/api/job-board/postings', requireAuth, (req, res) => {
    if (!canManageHiring(req.user)) {
      return res.status(403).json({ error: 'Hiring access required' });
    }
    const ctx = getHiringContext(req);
    const body = req.body || {};
    if (!body.title?.trim()) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    let customerId = body.customer_id || ctx.customerId || req.user.customer_id || null;
    if (!isInternalRole(req.user.role)) {
      customerId = req.user.customer_id;
    }
    if (!customerId && !isInternalRole(req.user.role)) {
      return res.status(400).json({ error: 'Customer context required' });
    }

    const status = body.status || 'draft';
    const slug = body.slug?.trim() || uniqueJobSlug(body.title, customerId);
    const ts = nowIso();

    const posting = createEntity('JobPosting', stampEntityForCreate('JobPosting', {
      customer_id: customerId,
      slug,
      title: body.title.trim(),
      job_category: body.job_category || 'other',
      employment_type: body.employment_type || 'full_time',
      pay_type: body.pay_type || 'negotiable',
      pay_min: body.pay_min ?? null,
      pay_max: body.pay_max ?? null,
      pay_description: body.pay_description?.trim() || null,
      location_city: body.location_city?.trim() || null,
      location_state: body.location_state?.trim() || null,
      description: body.description?.trim() || null,
      requirements: body.requirements?.trim() || null,
      cdl_class_required: body.cdl_class_required || null,
      endorsements_required: body.endorsements_required || null,
      home_time: body.home_time?.trim() || null,
      equipment_type: body.equipment_type?.trim() || null,
      contact_email: body.contact_email?.trim() || null,
      external_apply_url: body.external_apply_url?.trim() || null,
      is_featured: !!body.is_featured,
      status,
      application_count: 0,
      published_at: status === 'open' ? ts : null,
      created_at: ts,
      updated_at: ts,
    }, ctx));

    res.status(201).json(enrichPublicJob(posting));
  });

  app.patch('/api/job-board/postings/:id', requireAuth, (req, res) => {
    if (!canManageHiring(req.user)) {
      return res.status(403).json({ error: 'Hiring access required' });
    }
    const ctx = getHiringContext(req);
    const posting = getEntity('JobPosting', req.params.id);
    if (!posting) return res.status(404).json({ error: 'Not found' });
    try {
      assertEntityAccess('JobPosting', posting, ctx, ctx.scopeIndex);
    } catch (err) {
      return res.status(err.status || 403).json({ error: err.message });
    }

    const patch = { ...req.body, updated_at: nowIso() };
    delete patch.id;
    delete patch.customer_id;
    delete patch.application_count;

    if (patch.status === 'open' && !posting.published_at) {
      patch.published_at = nowIso();
    }
    if (patch.title && !patch.slug) {
      patch.slug = uniqueJobSlug(patch.title, posting.customer_id, posting.id);
    }

    const updated = updateEntity('JobPosting', posting.id, patch);
    res.json(enrichPublicJob(updated));
  });

  app.get('/api/job-board/applications', requireAuth, (req, res) => {
    if (!canManageHiring(req.user)) {
      return res.status(403).json({ error: 'Hiring access required' });
    }
    const ctx = getHiringContext(req);
    const jobId = req.query.job_posting_id;
    const apps = scopedApplications(req.user, ctx, jobId);
    res.json(
      apps.map((a) => {
        const job = getEntity('JobPosting', a.job_posting_id);
        return { ...a, job_title: job?.title, job_slug: job?.slug };
      }),
    );
  });

  app.patch('/api/job-board/applications/:id', requireAuth, (req, res) => {
    if (!canManageHiring(req.user)) {
      return res.status(403).json({ error: 'Hiring access required' });
    }
    const ctx = getHiringContext(req);
    const appRecord = getEntity('JobApplication', req.params.id);
    if (!appRecord) return res.status(404).json({ error: 'Not found' });
    try {
      assertEntityAccess('JobApplication', appRecord, ctx, ctx.scopeIndex);
    } catch (err) {
      return res.status(err.status || 403).json({ error: err.message });
    }

    const patch = { updated_at: nowIso() };
    if (req.body.application_status) patch.application_status = req.body.application_status;
    if (req.body.autopilot_paused != null) patch.autopilot_paused = !!req.body.autopilot_paused;
    if (req.body.notes != null) patch.notes = req.body.notes;

    const updated = updateEntity('JobApplication', appRecord.id, patch);
    res.json(updated);
  });

  app.post('/api/job-board/applications/:id/hire', requireAuth, async (req, res) => {
    if (!canManageHiring(req.user)) {
      return res.status(403).json({ error: 'Hiring access required' });
    }
    const ctx = getHiringContext(req);
    const appRecord = getEntity('JobApplication', req.params.id);
    if (!appRecord) return res.status(404).json({ error: 'Not found' });
    try {
      assertEntityAccess('JobApplication', appRecord, ctx, ctx.scopeIndex);
    } catch (err) {
      return res.status(err.status || 403).json({ error: err.message });
    }

    const job = getEntity('JobPosting', appRecord.job_posting_id);
    const customerId = appRecord.customer_id || job?.customer_id || req.user.customer_id;
    const { role = 'driver', send_welcome_email = true } = req.body || {};

    if (findUserByEmail(appRecord.email)) {
      return res.status(409).json({ error: 'A portal user with this email already exists' });
    }

    const tempPassword = req.body.temp_password || `Hire${Math.random().toString(36).slice(2, 8)}!`;
    const hash = bcrypt.hashSync(tempPassword, 10);
    let employeeNumber = null;
    if (isDriverCapableUser({ role, customer_id: customerId })) {
      employeeNumber = generateNextDriverNumber();
    }

    const user = createUser({
      email: appRecord.email,
      passwordHash: hash,
      fullName: appRecord.name,
      role,
      customerId,
      employeeNumber,
      phone: appRecord.phone,
    });

    updateEntity('JobApplication', appRecord.id, {
      application_status: 'hired',
      hired_user_id: user.id,
      autopilot_paused: true,
      updated_at: nowIso(),
    });

    let welcomeEmail = null;
    if (send_welcome_email) {
      const company = customerId ? getEntity('Customer', customerId) : null;
      welcomeEmail = await sendWelcomeSignupEmail({
        to: appRecord.email,
        companyName: company?.company_name || 'Your fleet',
        contactName: appRecord.name,
        tempPassword,
      });
    }

    res.json({
      success: true,
      user,
      temp_password: tempPassword,
      welcomeEmail,
      message: `Hired ${appRecord.name} — driver account created.`,
    });
  });
}

export { listOpenJobs, buildDashboard, canManageHiring };
