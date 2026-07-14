/** Filter report datasets by customer — read-only; never mutates source data. */

export function buildCustomerNameMap(customers) {
  return Object.fromEntries(
    (customers || []).map((c) => [c.id, c.company_name || c.contact_name || c.id]),
  );
}

export function vehicleIdsForCustomers(vehicles, customerIds) {
  const set = new Set(customerIds);
  return new Set(
    (vehicles || [])
      .filter((v) => set.has(v.customer_id) || set.has(v.assigned_customer_id))
      .map((v) => v.id),
  );
}

export function userIdsForCustomers(users, customerIds) {
  const set = new Set(customerIds);
  return new Set(
    (users || []).filter((u) => set.has(u.customer_id)).map((u) => u.id),
  );
}

/** @param {string[]|null} customerIds — null or empty = all customers */
export function filterReportData(data, customerIds) {
  if (!customerIds || customerIds.length === 0) return data;

  const idSet = new Set(customerIds);
  const vIds = vehicleIdsForCustomers(data.vehicles, customerIds);
  const uIds = userIdsForCustomers(data.users, customerIds);

  return {
    ...data,
    customers: (data.customers || []).filter((c) => idSet.has(c.id)),
    loads: (data.loads || []).filter((l) => l.customer_id && idSet.has(l.customer_id)),
    invoices: (data.invoices || []).filter((i) => i.customer_id && idSet.has(i.customer_id)),
    vehicles: (data.vehicles || []).filter(
      (v) => idSet.has(v.customer_id) || idSet.has(v.assigned_customer_id),
    ),
    fuel: (data.fuel || []).filter((f) => vIds.has(f.vehicle_id)),
    workOrders: (data.workOrders || []).filter((w) => vIds.has(w.vehicle_id)),
    maintenance: (data.maintenance || []).filter((m) => vIds.has(m.vehicle_id)),
    inspections: (data.inspections || []).filter((i) => vIds.has(i.vehicle_id)),
    hosLogs: (data.hosLogs || []).filter(
      (h) => vIds.has(h.vehicle_id) || uIds.has(h.driver_id),
    ),
    payroll: (data.payroll || []).filter(
      (p) => uIds.has(p.driver_id) || (p.customer_id && idSet.has(p.customer_id)),
    ),
    screenings: (data.screenings || []).filter(
      (s) => uIds.has(s.driver_id) || (s.customer_id && idSet.has(s.customer_id)),
    ),
    incidents: (data.incidents || []).filter(
      (i) => vIds.has(i.vehicle_id) || idSet.has(i.customer_id),
    ),
    users: (data.users || []).filter((u) => u.customer_id && idSet.has(u.customer_id)),
  };
}

export function customerFilterLabel(customerIds, customers) {
  if (!customerIds || customerIds.length === 0) return 'All customers';
  if (customerIds.length === 1) {
    const c = (customers || []).find((x) => x.id === customerIds[0]);
    return c?.company_name || '1 customer';
  }
  return `${customerIds.length} customers selected`;
}
