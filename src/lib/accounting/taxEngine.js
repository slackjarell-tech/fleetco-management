/** Tax estimates for payroll, sales tax, and business summaries (not CPA-grade filing). */

export const STATE_INCOME_TAX_RATES = {
  TX: 0, FL: 0, WA: 0, NV: 0, WY: 0, SD: 0, AK: 0, TN: 0, NH: 0,
  CA: 0.093, NY: 0.0685, IL: 0.0495, PA: 0.0307, OH: 0.0399, GA: 0.0575,
  NC: 0.0525, MI: 0.0425, AZ: 0.0259, CO: 0.044, IA: 0.057, OR: 0.099,
  NJ: 0.1075, VA: 0.0575, MA: 0.05, IN: 0.0323, MO: 0.054, MD: 0.0575,
  WI: 0.0765, MN: 0.0985, SC: 0.07, AL: 0.05, LA: 0.0425, KY: 0.045,
  OK: 0.0475, UT: 0.0485, AR: 0.055, MS: 0.05, KS: 0.057, NM: 0.059,
  NE: 0.0684, ID: 0.058, WV: 0.065, HI: 0.11, ME: 0.0715, RI: 0.0599,
  DE: 0.066, MT: 0.059, ND: 0.029, VT: 0.0875, CT: 0.0699, DC: 0.085,
};

export const STATE_SALES_TAX_RATES = {
  TX: 0.0825, CA: 0.0725, FL: 0.07, NY: 0.08, IL: 0.0625, PA: 0.06,
  OH: 0.0725, GA: 0.07, NC: 0.0475, MI: 0.06, AZ: 0.056, CO: 0.029,
  IA: 0.06, OR: 0, NJ: 0.06625, VA: 0.053, MA: 0.0625, IN: 0.07,
  MO: 0.04225, MD: 0.06, WI: 0.05, MN: 0.06875, SC: 0.06, AL: 0.04,
  LA: 0.0445, OK: 0.045, UT: 0.061, AR: 0.065, MS: 0.07, KS: 0.065,
  NE: 0.055, ID: 0.06, WV: 0.06, HI: 0.04, ME: 0.055, RI: 0.07,
  DE: 0, MT: 0, ND: 0.05, VT: 0.06, TN: 0.07, WA: 0.065, NV: 0.0685,
  WY: 0.04, SD: 0.045, AK: 0, NH: 0, NM: 0.05125, KY: 0.06, CT: 0.0635,
};

const FICA_SS_RATE = 0.062;
const FICA_MEDICARE_RATE = 0.0145;
const FEDERAL_EST_RATE = 0.12;
const SS_WAGE_BASE_ANNUAL = 168600;

export function normalizeState(state) {
  if (!state) return 'TX';
  const s = String(state).trim().toUpperCase();
  return s.length === 2 ? s : 'TX';
}

export function calculateSalesTax(subtotal, state) {
  const st = normalizeState(state);
  const rate = STATE_SALES_TAX_RATES[st] ?? 0.06;
  const tax = (Number(subtotal) || 0) * rate;
  return { rate, tax: round2(tax), total: round2((Number(subtotal) || 0) + tax) };
}

export function calculateW2Withholding(grossPay, { state = 'TX', periodsPerYear = 26 } = {}) {
  const gross = Number(grossPay) || 0;
  const st = normalizeState(state);
  const periodCap = SS_WAGE_BASE_ANNUAL / periodsPerYear;
  const ssWages = Math.min(gross, periodCap);
  const socialSecurity = ssWages * FICA_SS_RATE;
  const medicare = gross * FICA_MEDICARE_RATE;
  const federalIncome = gross * FEDERAL_EST_RATE;
  const stateRate = STATE_INCOME_TAX_RATES[st] ?? 0.05;
  const stateIncome = gross * stateRate;
  const totalEmployee = socialSecurity + medicare + federalIncome + stateIncome;
  const employerMatch = socialSecurity + medicare;
  const futa = gross * 0.006;

  return {
    gross,
    federalIncome: round2(federalIncome),
    socialSecurity: round2(socialSecurity),
    medicare: round2(medicare),
    stateIncome: round2(stateIncome),
    totalEmployeeWithholding: round2(totalEmployee),
    netPay: round2(gross - totalEmployee),
    employerTaxes: round2(employerMatch + futa),
    breakdown: [
      { label: 'Federal income (est. 12%)', amount: round2(federalIncome) },
      { label: 'Social Security (6.2%)', amount: round2(socialSecurity) },
      { label: 'Medicare (1.45%)', amount: round2(medicare) },
      { label: `State income (${st}, ${(stateRate * 100).toFixed(2)}%)`, amount: round2(stateIncome) },
    ],
  };
}

export function calculate1099Estimate(grossPay) {
  const gross = Number(grossPay) || 0;
  const seTax = gross * 0.9235 * 0.153;
  const incomeTaxEst = gross * 0.22;
  return {
    gross,
    selfEmploymentTax: round2(seTax),
    estimatedIncomeTax: round2(incomeTaxEst),
    totalEstimatedTax: round2(seTax + incomeTaxEst),
    netAfterEstTax: round2(gross - seTax - incomeTaxEst),
    note: '1099 contractors handle own taxes — estimates for planning only.',
  };
}

export function calculatePayrollTaxes(record, customerState = 'TX') {
  const gross = Number(record.gross_pay) || 0;
  if (record.pay_type === 'W2' || record.pay_type === 'Hourly') {
    return calculateW2Withholding(gross, { state: customerState });
  }
  if (record.pay_type === '1099') {
    return calculate1099Estimate(gross);
  }
  return {
    gross,
    totalEmployeeWithholding: Number(record.deductions) || 0,
    netPay: round2(gross - (Number(record.deductions) || 0)),
    breakdown: [{ label: 'Manual deductions', amount: Number(record.deductions) || 0 }],
    employerTaxes: 0,
  };
}

export function summarizeBusinessTaxes({ invoices = [], payrollRecords = [], fuelLogs = [], state = 'TX' }) {
  const st = normalizeState(state);
  const revenue = invoices.filter(i => i.status === 'paid')
    .reduce((s, i) => s + (Number(i.total ?? i.amount) || 0), 0);
  const payrollGross = payrollRecords.reduce((s, p) => s + (Number(p.gross_pay) || 0), 0);
  const payrollNet = payrollRecords.reduce((s, p) => s + (Number(p.net_pay) || 0), 0);
  const payrollWithholding = payrollGross - payrollNet;
  const fuelSpend = fuelLogs.reduce((s, f) => s + (Number(f.total_cost ?? f.cost) || 0), 0);
  const salesTaxCollected = invoices.reduce((s, i) => s + (Number(i.tax) || 0), 0);

  let payrollTaxDetail = { employerTaxes: 0, employeeWithholding: payrollWithholding };
  payrollRecords.filter(p => p.pay_type === 'W2' || p.pay_type === 'Hourly').forEach(p => {
    const t = calculateW2Withholding(p.gross_pay, { state: st });
    payrollTaxDetail.employerTaxes += t.employerTaxes || 0;
  });

  return {
    revenue: round2(revenue),
    payrollGross: round2(payrollGross),
    payrollNet: round2(payrollNet),
    payrollWithholding: round2(payrollWithholding),
    employerPayrollTaxes: round2(payrollTaxDetail.employerTaxes),
    fuelSpend: round2(fuelSpend),
    salesTaxCollected: round2(salesTaxCollected),
    estimatedTaxableIncome: round2(revenue - fuelSpend - payrollGross),
  };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
