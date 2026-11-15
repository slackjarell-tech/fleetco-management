import { TARGET_SEGMENTS } from './marketingTargetCompanies.js';
import { uniqueProspectSeeds } from './marketingProspectUsdots.js';
import { getMotusProspectRecord } from './motusProspectCache.js';
import { fetchSaferCarrierByUsdot, motusAccountUrl } from './fmcsaCarrierLookup.js';
import { PRICE_PER_UNIT_MONTHLY } from './roles.js';

function segmentMeta(segmentId) {
  return TARGET_SEGMENTS.find((s) => s.id === segmentId) || TARGET_SEGMENTS[0];
}

function formatPhone(raw) {
  if (!raw) return '';
  const d = String(raw).replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return String(raw).trim();
}

function suggestedSubject(name) {
  return `Fleet admin in one portal — ${String(name || 'your fleet').slice(0, 48)}?`;
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

export async function enrichProspectSeed(seed, { fetchSafer = true } = {}) {
  const usdot = String(seed.usdot).replace(/\D/g, '');
  const seg = segmentMeta(seed.segment_id);
  const motus = getMotusProspectRecord(usdot);
  const safer = fetchSafer ? await fetchSaferCarrierByUsdot(usdot) : null;

  const companyName =
    motus?.legalName ||
    safer?.legalName ||
    safer?.dbaName ||
    `USDOT ${usdot}`;

  const email = motus?.businessEmail || '';
  const phone = formatPhone(motus?.businessPhone || safer?.phone || '');
  const contactName = motus?.officialName || '';
  const title = motus?.officialTitle || (contactName ? 'Company official (Motus)' : 'FMCSA business contact (verify POC)');
  const address = motus?.address || safer?.physicalAddress || '';
  const region = address.split(',').slice(-2).join(',').trim() || '';

  let outreachStatus = 'Not started';
  if (safer?.inactive) outreachStatus = 'Inactive USDOT — skip';
  else if (motus?.motusStatus === 'Inactive') outreachStatus = 'Inactive on Motus — verify';
  else if (email) outreachStatus = 'Ready for email (verify CAN-SPAM)';

  const motusUrl = motusAccountUrl(usdot);
  const notes = [
    motus ? `Motus POC researched ${motus.researchedAt || ''}`.trim() : 'Motus: open account URL to refresh POC',
    safer?.saferUrl ? `SAFER: ${safer.saferUrl}` : '',
    safer?.powerUnits != null ? `Power units (SAFER): ${safer.powerUnits}` : '',
    motus?.motusStatus ? `Motus status: ${motus.motusStatus}` : '',
  ].filter(Boolean).join(' · ');

  return {
    USDOT_Number: usdot,
    Source: 'FMCSA / Motus research',
    Segment: seg.label,
    Company_Name: companyName,
    Region: region,
    Fleet_Size_Range: seg.fleet_size,
    Est_Units: safer?.powerUnits != null ? String(safer.powerUnits) : '',
    Fit_Notes: seg.why_fleetco,
    Top_Pain_Point: seg.pain_points?.[0] || '',
    FleetCo_Value_Prop: seg.why_fleetco,
    How_To_Find_Contact: `Motus account: ${motusUrl}`,
    Contact_Name: contactName,
    Title: title,
    Email: email,
    Phone: phone,
    Website: '',
    LinkedIn_URL: '',
    MC_Number: safer?.mcNumber || '',
    Physical_Address: address,
    Motus_Account_URL: motusUrl,
    FMCSA_Status: safer?.usdotStatus || motus?.motusStatus || '',
    Outreach_Status: outreachStatus,
    Suggested_Email_Subject: suggestedSubject(companyName),
    Suggested_Email_Opening: suggestedOpening(seg.label, seg.pain_points?.[0]),
    Notes: notes,
  };
}

export async function buildFmcsaProspectRows({ fetchSafer = true, delayMs = 400 } = {}) {
  const seeds = uniqueProspectSeeds();
  const rows = [];
  for (const seed of seeds) {
    rows.push(await enrichProspectSeed(seed, { fetchSafer }));
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return rows;
}
