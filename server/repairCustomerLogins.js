import bcrypt from 'bcryptjs';
import {
  createUser,
  filterEntities,
  findUserByEmail,
  findUserById,
  getEntity,
  listEntities,
  updateEntity,
  updateUser,
} from './db.js';

/**
 * After deploy or data issues, Customer records may exist while User rows are missing.
 * Re-link existing users or recreate from PendingAccount temp passwords.
 */
export function repairCustomerPortalLogins() {
  const customers = listEntities('Customer');
  let repaired = 0;
  let relinked = 0;
  const broken = [];

  for (const customer of customers) {
    if (!customer.email) continue;

    const email = customer.email.trim().toLowerCase();
    let user = customer.user_id ? findUserById(customer.user_id) : null;

    if (!user) {
      user = findUserByEmail(email);
    }

    if (user) {
      const customerPatch = {};
      if (customer.user_id !== user.id) {
        customerPatch.user_id = user.id;
      }
      if (!customer.has_portal_login && ['user', 'driver'].includes(user.role)) {
        customerPatch.has_portal_login = true;
        customerPatch.portal_login_email = email;
      }
      if (Object.keys(customerPatch).length) {
        updateEntity('Customer', customer.id, customerPatch);
        relinked += 1;
      }
      if (user.customer_id !== customer.id && user.role === 'user') {
        updateUser(user.id, { customer_id: customer.id });
      }
      continue;
    }

    if (!customer.has_portal_login && !customer.user_id) {
      continue;
    }

    const pending =
      filterEntities('PendingAccount', { email, customer_id: customer.id }, null, 1)[0] ||
      filterEntities('PendingAccount', { email, activated: false }, null, 1)[0];

    if (pending?.temp_password && pending.role === 'user') {
      const created = createUser({
        email,
        passwordHash: bcrypt.hashSync(pending.temp_password, 10),
        fullName: customer.contact_name || customer.company_name,
        role: 'user',
        customerId: customer.id,
      });
      updateEntity('Customer', customer.id, {
        user_id: created.id,
        has_portal_login: true,
        portal_login_email: email,
      });
      repaired += 1;
      console.log(`[repair] Restored portal login for ${customer.company_name} (${email})`);
      continue;
    }

    if (customer.user_id || customer.has_portal_login) {
      if (customer.user_id) {
        updateEntity('Customer', customer.id, { user_id: null });
      }
      broken.push({
        id: customer.id,
        company_name: customer.company_name,
        email,
      });
      console.warn(
        `[repair] Missing portal user for ${customer.company_name} (${email}) — use Test Login to restore access`,
      );
    }
  }

  return { repaired, relinked, broken };
}
