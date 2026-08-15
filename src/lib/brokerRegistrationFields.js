/** Required freight broker business fields for self-service signup. */
export const BROKER_REQUIRED_FIELDS = [
  'company_name',
  'contact_name',
  'email',
  'phone',
  'address',
  'city',
  'state',
  'zip',
  'mc_number',
  'dot_number',
  'loads_per_week',
  'equipment_types',
];

export const BROKER_FIELD_LABELS = {
  company_name: 'Legal company name',
  contact_name: 'Primary contact name',
  email: 'Business email',
  phone: 'Business phone',
  address: 'Street address',
  city: 'City',
  state: 'State',
  zip: 'ZIP code',
  mc_number: 'MC number',
  dot_number: 'DOT number',
  loads_per_week: 'Estimated loads posted per week',
  equipment_types: 'Equipment types you broker',
};

export function validateBrokerRegistrationForm(body) {
  const errors = [];
  for (const key of BROKER_REQUIRED_FIELDS) {
    const val = body?.[key];
    if (val == null || String(val).trim() === '') {
      errors.push(`${BROKER_FIELD_LABELS[key] || key} is required`);
    }
  }
  if (body?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
    errors.push('Valid business email is required');
  }
  if (body?.state && String(body.state).trim().length !== 2) {
    errors.push('State must be a 2-letter abbreviation (e.g. TX)');
  }
  if (body?.zip && !/^\d{5}(-\d{4})?$/.test(String(body.zip).trim())) {
    errors.push('ZIP code must be 5 digits (or ZIP+4)');
  }
  if (errors.length) {
    throw new Error(errors[0]);
  }
}
