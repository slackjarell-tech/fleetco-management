/**
 * FMCSA-backed prospect list for outreach export (USDOT is the primary key).
 * Segment tags are FleetCo ICP — assign for messaging, not from FMCSA.
 */
export const PROSPECT_CARRIER_SEEDS = [
  { usdot: '4290274', segment_id: 'owner_operator' },
  { usdot: '3495775', segment_id: 'construction_haul' },
  { usdot: '1869625', segment_id: 'ag_livestock' },
  { usdot: '3847291', segment_id: 'owner_operator' },
  { usdot: '3807647', segment_id: 'owner_operator' },
  { usdot: '3868385', segment_id: 'owner_operator' },
  { usdot: '3066594', segment_id: 'regional_carrier' },
  { usdot: '3651117', segment_id: 'regional_carrier' },
  { usdot: '2060420', segment_id: 'regional_carrier' },
  { usdot: '1256453', segment_id: 'regional_carrier' },
  { usdot: '2530569', segment_id: 'regional_carrier' },
  { usdot: '2791611', segment_id: 'regional_carrier' },
  { usdot: '2827159', segment_id: 'regional_carrier' },
  { usdot: '1277340', segment_id: 'regional_carrier' },
  { usdot: '3815096', segment_id: 'regional_carrier' },
  { usdot: '3759326', segment_id: 'regional_carrier' },
  { usdot: '3148082', segment_id: 'regional_carrier' },
  { usdot: '4196781', segment_id: 'regional_carrier' },
  { usdot: '289918', segment_id: 'food_beverage' },
];

/** Unique USDOT seeds (dedupe). */
export function uniqueProspectSeeds() {
  const seen = new Set();
  const out = [];
  for (const row of PROSPECT_CARRIER_SEEDS) {
    const usdot = String(row.usdot).replace(/\D/g, '');
    if (!usdot || seen.has(usdot)) continue;
    seen.add(usdot);
    out.push({ ...row, usdot });
  }
  return out;
}
