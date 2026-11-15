/**
 * FMCSA carrier lookup via public SAFER HTML (same registry as Motus search).
 */

const SAFER_SNAPSHOT_URL = 'https://safer.fmcsa.dot.gov/query.asp';

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseSaferCarrierHtml(html, usdot) {
  if (/Record Inactive/i.test(html) && /INACTIVE in the SAFER/i.test(html)) {
    return { usdot: String(usdot), inactive: true, error: 'Inactive USDOT in SAFER' };
  }

  const text = stripTags(html);
  const pick = (re) => {
    const m = text.match(re);
    return m ? m[1].trim() : '';
  };

  const legalName = pick(/Legal Name:\s*([^:]+?)(?=DBA Name:|Physical Address:|Phone:|$)/i);
  const dbaName = pick(/DBA Name:\s*([^:]+?)(?=Physical Address:|Phone:|$)/i);
  const phone = pick(/Phone:\s*([\d()\s\-+.]+)/i);
  const mc = pick(/MC\/MX\/FF Number\(s\):\s*(MC[-\d]+)/i) || pick(/MC[-\d]+/i);
  const powerUnits = pick(/Power Units:\s*(\d+)/i);
  const drivers = pick(/Drivers:\s*(\d+)/i);
  const phy = pick(/Physical Address:\s*(.+?)(?=Mailing Address:|Phone:|DUNS)/i);
  const status = /USDOT Status:\s*ACTIVE/i.test(text) ? 'Active' : pick(/USDOT Status:\s*(\w+)/i);

  return {
    usdot: String(usdot),
    inactive: false,
    legalName: legalName || dbaName || '',
    dbaName,
    phone,
    mcNumber: mc,
    powerUnits: powerUnits ? Number(powerUnits) : null,
    drivers: drivers ? Number(drivers) : null,
    physicalAddress: phy,
    usdotStatus: status,
    saferUrl: `${SAFER_SNAPSHOT_URL}?query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${usdot}`,
  };
}

export async function fetchSaferCarrierByUsdot(usdot, { timeoutMs = 25000 } = {}) {
  const id = String(usdot || '').replace(/\D/g, '');
  if (!id) return { usdot: id, error: 'Invalid USDOT' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `${SAFER_SNAPSHOT_URL}?query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${id}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FleetCo-Prospect-Export/1.0 (FMCSA public SAFER)' },
    });
    const html = await res.text();
    return parseSaferCarrierHtml(html, id);
  } catch (err) {
    return { usdot: id, error: err.name === 'AbortError' ? 'SAFER timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

export function motusAccountUrl(usdot) {
  return `https://motus.dot.gov/customer/${String(usdot).replace(/\D/g, '')}/account`;
}

export function motusSearchUrl(usdot) {
  return `https://motus.dot.gov/public/search`;
}
