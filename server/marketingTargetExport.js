/**
 * Excel export for FMCSA/Motus-backed prospects + portal records.
 */
import * as XLSX from 'xlsx';
import { filterEntities, listEntities } from './db.js';
import { PRICE_PER_UNIT_MONTHLY } from './roles.js';
import { buildFmcsaProspectRows } from './marketingProspectEnrichment.js';
import { motusAccountUrl } from './fmcsaCarrierLookup.js';

export const ICP_EXPORT_FILENAME = 'FleetCo-ICP-Prospect-Outreach.xlsx';

export const PROSPECT_HEADERS = [
  'USDOT_Number',
  'Source',
  'Segment',
  'Company_Name',
  'Region',
  'Fleet_Size_Range',
  'Est_Units',
  'Fit_Notes',
  'Top_Pain_Point',
  'FleetCo_Value_Prop',
  'How_To_Find_Contact',
  'Contact_Name',
  'Title',
  'Email',
  'Phone',
  'Website',
  'LinkedIn_URL',
  'MC_Number',
  'Physical_Address',
  'Motus_Account_URL',
  'FMCSA_Status',
  'Outreach_Status',
  'Suggested_Email_Subject',
  'Suggested_Email_Opening',
  'Notes',
];

function suggestedSubject(companyName) {
  const short = String(companyName || 'your fleet').slice(0, 48);
  return `Fleet admin in one portal — ${short}?`;
}

function suggestedOpening(segmentLabel, pain) {
  return [
    'Hi {{Contact First Name}},',
    '',
    `We work with ${segmentLabel.toLowerCase()} that are often dealing with ${(pain || 'spreadsheet-heavy fleet admin').toLowerCase()}.`,
    '',
    `FleetCo Management puts maintenance, compliance, driver tools, and payroll in one portal (about $${PRICE_PER_UNIT_MONTHLY}/unit/month).`,
    '',
    'Open to a quick 15-minute demo this week?',
    '',
    'Best,',
    '{{Your Name}}',
    'FleetCo Management · (360) 952-1249 · support@fleetcomanagement.org',
  ].join('\n');
}

function rowFromObject(obj) {
  return PROSPECT_HEADERS.map((h) => obj[h] ?? '');
}

function portalProspectRows() {
  const rows = [];

  const customers = filterEntities('Customer', { status: 'prospect' }, null, 500);
  for (const c of customers) {
    const usdot = String(c.dot_number || '').replace(/\D/g, '');
    rows.push({
      USDOT_Number: usdot || '',
      Source: 'Portal customer (prospect)',
      Segment: 'Customer record',
      Company_Name: c.company_name || c.contact_name || '',
      Region: [c.city, c.state].filter(Boolean).join(', '),
      Fleet_Size_Range: c.fleet_size ? `${c.fleet_size} units` : '',
      Est_Units: c.fleet_size || '',
      Fit_Notes: c.notes || '',
      Top_Pain_Point: '',
      FleetCo_Value_Prop: '',
      How_To_Find_Contact: usdot ? `Motus account: ${motusAccountUrl(usdot)}` : '',
      Contact_Name: c.contact_name || '',
      Title: '',
      Email: c.email || c.portal_login_email || '',
      Phone: c.phone || '',
      Website: '',
      LinkedIn_URL: '',
      MC_Number: c.mc_number || '',
      Physical_Address: [c.address, c.city, c.state, c.zip].filter(Boolean).join(', '),
      Motus_Account_URL: usdot ? motusAccountUrl(usdot) : '',
      FMCSA_Status: '',
      Outreach_Status: 'In CRM',
      Suggested_Email_Subject: suggestedSubject(c.company_name || c.contact_name),
      Suggested_Email_Opening: suggestedOpening('prospect fleets', 'onboarding'),
      Notes: usdot ? '' : 'Add USDOT on customer record for Motus POC refresh.',
    });
  }

  const inquiries = listEntities('Inquiry', '-created_date', 500);
  for (const inq of inquiries) {
    if (!inq.email && !inq.name) continue;
    rows.push({
      USDOT_Number: '',
      Source: 'Website inquiry / AI lead',
      Segment: inq.interest || inq.source || 'Inbound',
      Company_Name: inq.company || inq.name || '',
      Region: '',
      Fleet_Size_Range: inq.fleet_size || '',
      Est_Units: inq.fleet_size || '',
      Fit_Notes: inq.message || '',
      Top_Pain_Point: '',
      FleetCo_Value_Prop: '',
      How_To_Find_Contact: '',
      Contact_Name: inq.name || '',
      Title: '',
      Email: inq.email || '',
      Phone: inq.phone || '',
      Website: '',
      LinkedIn_URL: '',
      MC_Number: '',
      Physical_Address: '',
      Motus_Account_URL: '',
      FMCSA_Status: '',
      Outreach_Status: inq.lead_status || 'new',
      Suggested_Email_Subject: suggestedSubject(inq.company || inq.name),
      Suggested_Email_Opening: suggestedOpening('inbound leads', inq.message || 'fleet software'),
      Notes: `Lead status: ${inq.lead_status || 'new'}`,
    });
  }

  return rows;
}

function instructionsSheetRows() {
  return [
    ['FleetCo prospect outreach workbook (USDOT = row ID)'],
    [''],
    ['How to use'],
    ['1. USDOT_Number is the primary key — same as FMCSA / Motus (motus.dot.gov).'],
    ['2. Email and Phone come from Motus business registration + SAFER when available.'],
    ['3. Confirm the right POC before bulk email; FMCSA email is often dispatch/operations.'],
    ['4. Motus_Account_URL — official FMCSA customer account (refresh POC there).'],
    ['5. Outreach_Status: Not started → Ready for email → Emailed → Replied → Meeting.'],
    ['6. npm run marketing:icp-export — regenerate; npm run marketing:motus-cache — refresh Motus JSON.'],
    [''],
    ['Compliance: CAN-SPAM / TCPA — use business contacts responsibly; honor opt-outs.'],
    [''],
    [`Generated: ${new Date().toISOString()}`],
  ];
}

function emailTemplatesSheetRows() {
  return [
    ['Template_Name', 'Subject', 'Body'],
    [
      'Cold intro (segment)',
      'Cut fleet admin time — one portal for {{Company}}',
      [
        'Hi {{Contact First Name}},',
        '',
        'I noticed {{Company}} (USDOT {{USDOT}}) still juggles maintenance, compliance, and payroll across disconnected tools.',
        '',
        `FleetCo Management is an all-in-one fleet portal + driver app (about $${PRICE_PER_UNIT_MONTHLY}/unit/month).`,
        '',
        'Would you be open to a 15-minute demo?',
        '',
        '{{Your Name}} · FleetCo Management',
        'https://fleetcomanagement.org · (360) 952-1249',
      ].join('\n'),
    ],
    [
      'Follow-up #1 (48h)',
      'Re: fleet portal demo',
      [
        'Hi {{Contact First Name}},',
        '',
        'Following up in case a unified fleet + payroll portal is still on your radar.',
        '',
        '{{Your Name}}',
      ].join('\n'),
    ],
  ];
}

export async function buildIcpProspectExportRows({ includePortalRecords = true, fetchSafer = true } = {}) {
  const rows = await buildFmcsaProspectRows({ fetchSafer });
  if (includePortalRecords) {
    rows.push(...portalProspectRows());
  }
  return rows;
}

export async function buildIcpProspectWorkbook(options) {
  const prospectObjects = await buildIcpProspectExportRows(options);
  const prospectAoa = [PROSPECT_HEADERS, ...prospectObjects.map(rowFromObject)];

  const wb = XLSX.utils.book_new();
  const wsProspects = XLSX.utils.aoa_to_sheet(prospectAoa);
  wsProspects['!cols'] = PROSPECT_HEADERS.map((h) => ({
    wch: Math.min(55, Math.max(12, h.length + 4)),
  }));
  XLSX.utils.book_append_sheet(wb, wsProspects, 'Prospects');

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsSheetRows());
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  const wsTemplates = XLSX.utils.aoa_to_sheet(emailTemplatesSheetRows());
  XLSX.utils.book_append_sheet(wb, wsTemplates, 'Email Templates');

  return wb;
}

export async function buildIcpProspectWorkbookBuffer(options) {
  const wb = await buildIcpProspectWorkbook(options);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export async function writeIcpProspectWorkbookFile(outputPath, options) {
  const wb = await buildIcpProspectWorkbook(options);
  XLSX.writeFile(wb, outputPath);
  const rows = await buildIcpProspectExportRows(options);
  const withEmail = rows.filter((r) => String(r.Email || '').includes('@')).length;
  return {
    path: outputPath,
    prospect_count: rows.length,
    with_email: withEmail,
  };
}
