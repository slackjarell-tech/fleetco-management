/** US state payroll withholding forms — HR reference for employee setup (not legal advice). */
export const FEDERAL_W4_FIELDS = [
  { key: 'filing_status', label: 'Filing status', type: 'select', options: ['Single', 'Married filing jointly', 'Head of household'] },
  { key: 'dependents_credit', label: 'Dependents / credits ($)', type: 'number' },
  { key: 'other_income', label: 'Other income ($)', type: 'number' },
  { key: 'deductions', label: 'Deductions ($)', type: 'number' },
  { key: 'extra_withholding', label: 'Extra withholding ($/period)', type: 'number' },
  { key: 'exempt', label: 'Claim exempt', type: 'boolean' },
];

export const US_STATES = [
  { code: 'AL', name: 'Alabama', form: 'A-4', hasIncomeTax: true },
  { code: 'AK', name: 'Alaska', form: 'None (no state income tax)', hasIncomeTax: false },
  { code: 'AZ', name: 'Arizona', form: 'A-4', hasIncomeTax: true },
  { code: 'AR', name: 'Arkansas', form: 'AR4EC', hasIncomeTax: true },
  { code: 'CA', name: 'California', form: 'DE 4', hasIncomeTax: true },
  { code: 'CO', name: 'Colorado', form: 'DR 0004', hasIncomeTax: true },
  { code: 'CT', name: 'Connecticut', form: 'CT-W4', hasIncomeTax: true },
  { code: 'DE', name: 'Delaware', form: 'DE-W4', hasIncomeTax: true },
  { code: 'DC', name: 'District of Columbia', form: 'D-4', hasIncomeTax: true },
  { code: 'FL', name: 'Florida', form: 'None (no state income tax)', hasIncomeTax: false },
  { code: 'GA', name: 'Georgia', form: 'G-4', hasIncomeTax: true },
  { code: 'HI', name: 'Hawaii', form: 'HW-4', hasIncomeTax: true },
  { code: 'ID', name: 'Idaho', form: 'ID W-4', hasIncomeTax: true },
  { code: 'IL', name: 'Illinois', form: 'IL-W-4', hasIncomeTax: true },
  { code: 'IN', name: 'Indiana', form: 'WH-4', hasIncomeTax: true },
  { code: 'IA', name: 'Iowa', form: 'IA W-4', hasIncomeTax: true },
  { code: 'KS', name: 'Kansas', form: 'K-4', hasIncomeTax: true },
  { code: 'KY', name: 'Kentucky', form: 'K-4', hasIncomeTax: true },
  { code: 'LA', name: 'Louisiana', form: 'L-4', hasIncomeTax: true },
  { code: 'ME', name: 'Maine', form: 'W-4ME', hasIncomeTax: true },
  { code: 'MD', name: 'Maryland', form: 'MW507', hasIncomeTax: true },
  { code: 'MA', name: 'Massachusetts', form: 'M-4', hasIncomeTax: true },
  { code: 'MI', name: 'Michigan', form: 'MI-W4', hasIncomeTax: true },
  { code: 'MN', name: 'Minnesota', form: 'W-4MN', hasIncomeTax: true },
  { code: 'MS', name: 'Mississippi', form: '89-350', hasIncomeTax: true },
  { code: 'MO', name: 'Missouri', form: 'MO W-4', hasIncomeTax: true },
  { code: 'MT', name: 'Montana', form: 'MW-4', hasIncomeTax: true },
  { code: 'NE', name: 'Nebraska', form: 'W-4N', hasIncomeTax: true },
  { code: 'NV', name: 'Nevada', form: 'None (no state income tax)', hasIncomeTax: false },
  { code: 'NH', name: 'New Hampshire', form: 'None (no wage income tax)', hasIncomeTax: false },
  { code: 'NJ', name: 'New Jersey', form: 'NJ-W4', hasIncomeTax: true },
  { code: 'NM', name: 'New Mexico', form: 'RPD-41348', hasIncomeTax: true },
  { code: 'NY', name: 'New York', form: 'IT-2104', hasIncomeTax: true },
  { code: 'NC', name: 'North Carolina', form: 'NC-4', hasIncomeTax: true },
  { code: 'ND', name: 'North Dakota', form: 'ND W-4', hasIncomeTax: true },
  { code: 'OH', name: 'Ohio', form: 'IT-4', hasIncomeTax: true },
  { code: 'OK', name: 'Oklahoma', form: 'OK-W-4', hasIncomeTax: true },
  { code: 'OR', name: 'Oregon', form: 'OR-W-4', hasIncomeTax: true },
  { code: 'PA', name: 'Pennsylvania', form: 'REV-419', hasIncomeTax: true },
  { code: 'RI', name: 'Rhode Island', form: 'RI W-4', hasIncomeTax: true },
  { code: 'SC', name: 'South Carolina', form: 'SC W-4', hasIncomeTax: true },
  { code: 'SD', name: 'South Dakota', form: 'None (no state income tax)', hasIncomeTax: false },
  { code: 'TN', name: 'Tennessee', form: 'None (no wage income tax)', hasIncomeTax: false },
  { code: 'TX', name: 'Texas', form: 'None (no state income tax)', hasIncomeTax: false },
  { code: 'UT', name: 'Utah', form: 'W-4', hasIncomeTax: true },
  { code: 'VT', name: 'Vermont', form: 'W-4VT', hasIncomeTax: true },
  { code: 'VA', name: 'Virginia', form: 'VA-4', hasIncomeTax: true },
  { code: 'WA', name: 'Washington', form: 'None (no state income tax)', hasIncomeTax: false },
  { code: 'WV', name: 'West Virginia', form: 'IT-104', hasIncomeTax: true },
  { code: 'WI', name: 'Wisconsin', form: 'WT-4', hasIncomeTax: true },
  { code: 'WY', name: 'Wyoming', form: 'None (no state income tax)', hasIncomeTax: false },
];

export const STATE_W4_FIELDS = [
  { key: 'filing_status', label: 'State filing status', type: 'select', options: ['Single', 'Married', 'Head of household'] },
  { key: 'allowances', label: 'Allowances / exemptions', type: 'number' },
  { key: 'additional_withholding', label: 'Additional withholding ($/period)', type: 'number' },
  { key: 'exempt', label: 'Claim exempt from state withholding', type: 'boolean' },
  { key: 'notes', label: 'HR notes (form version, local tax)', type: 'text' },
];

export function getStateMeta(code) {
  return US_STATES.find((s) => s.code === code) || null;
}

export function defaultStateFormData(stateCode) {
  const meta = getStateMeta(stateCode);
  if (!meta?.hasIncomeTax) {
    return { no_state_income_tax: true, notes: meta?.form || '' };
  }
  return {
    filing_status: 'Single',
    allowances: 0,
    additional_withholding: 0,
    exempt: false,
    notes: '',
  };
}
