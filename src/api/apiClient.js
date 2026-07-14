const TOKEN_KEY = 'fleet_pulse_access_token';
export const CUSTOMER_CONTEXT_KEY = 'fleetco_view_customer_id';

export function getViewAsCustomerId() {
  try {
    return sessionStorage.getItem(CUSTOMER_CONTEXT_KEY) || null;
  } catch {
    return null;
  }
}

export function setViewAsCustomerId(customerId) {
  try {
    sessionStorage.setItem(CUSTOMER_CONTEXT_KEY, customerId);
  } catch {
    /* ignore */
  }
}

export function clearViewAsCustomerId() {
  try {
    sessionStorage.removeItem(CUSTOMER_CONTEXT_KEY);
  } catch {
    /* ignore */
  }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const API_ROOT = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
  const url = `${API_ROOT}/api${path.startsWith('/') ? path : `/${path}`}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (!options.skipCustomerContext) {
    const customerContext = getViewAsCustomerId();
    if (customerContext) headers['X-Customer-Context'] = customerContext;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function createEntityApi(entityName) {
  const subscribers = new Set();

  const notify = (event) => {
    subscribers.forEach((cb) => {
      try { cb(event); } catch (_) { /* ignore */ }
    });
  };

  return {
    async list(sort, limit) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return apiFetch(`/entities/${entityName}${qs ? `?${qs}` : ''}`);
    },

    async filter(criteria = {}, sort, limit) {
      return apiFetch(`/entities/${entityName}/filter`, {
        method: 'POST',
        body: JSON.stringify({ criteria, sort, limit }),
      });
    },

    async create(data) {
      const result = await apiFetch(`/entities/${entityName}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      notify({ type: 'create', data: result });
      return result;
    },

    async bulkCreate(records) {
      const result = await apiFetch(`/entities/${entityName}/bulk`, {
        method: 'POST',
        body: JSON.stringify({ records }),
      });
      notify({ type: 'bulkCreate', data: result });
      return result;
    },

    async update(id, data) {
      const result = await apiFetch(`/entities/${entityName}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      notify({ type: 'update', data: result });
      return result;
    },

    async delete(id) {
      await apiFetch(`/entities/${entityName}/${id}`, { method: 'DELETE' });
      notify({ type: 'delete', data: { id } });
    },

    subscribe(callback) {
      subscribers.add(callback);
      const interval = setInterval(() => {
        callback({ type: 'poll', data: null });
      }, 3000);
      return () => {
        subscribers.delete(callback);
        clearInterval(interval);
      };
    },
  };
}

const ENTITY_NAMES = [
  'Customer', 'DriverLocation', 'DiagnosticCode', 'FuelLog', 'DeliveryRoute',
  'DeliveryStop', 'HOSLog', 'FuelStation', 'Inquiry', 'Incident', 'Inspection',
  'Invoice', 'Load', 'MaintenanceSchedule', 'Message', 'PartInventory',
  'PayrollRecord', 'PayrollRun', 'PurchaseOrder', 'PendingAccount', 'ScreeningRecord', 'ServiceTemplate',
  'DomainEmail', 'PaymentReminder', 'BarcodeScan', 'DashcamSession', 'DashcamFrame', 'Subscription', 'UsageFeedback', 'PortalActivity', 'Vehicle', 'VehicleDocument', 'Vendor', 'TimeClockEntry', 'WorkOrder', 'User', 'Yard', 'YardPlacement',
];

const entities = {};
for (const name of ENTITY_NAMES) {
  entities[name] = createEntityApi(name);
}

const auth = {
  async me() {
    const token = getToken();
    if (!token) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    return apiFetch('/auth/me');
  },

  async loginViaEmailPassword(email, password) {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    setToken(result.access_token);
    return result;
  },

  async register({ email, password }) {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async verifyOtp({ email, otpCode }) {
    const result = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode }),
    });
    if (result.access_token) setToken(result.access_token);
    return result;
  },

  async resendOtp(email) {
    return apiFetch('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  setToken(token) {
    setToken(token);
  },

  logout(redirectUrl) {
    setToken(null);
    if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.startsWith('/')) {
      window.location.href = redirectUrl;
    } else if (redirectUrl && typeof redirectUrl === 'string') {
      window.location.href = '/login';
    }
  },

  redirectToLogin(returnUrl) {
    const url = `/login${returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ''}`;
    window.location.href = url;
  },

  async changePassword({ currentPassword, newPassword }) {
    return apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async resetPasswordRequest(email) {
    return apiFetch('/auth/reset-password-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword({ resetToken, newPassword }) {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  },

  async updateMe(data) {
    return apiFetch('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

const functions = {
  async invoke(name, payload = {}) {
    return apiFetch(`/functions/${name}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

const integrations = {
  Core: {
    async UploadFile({ file }) {
      const form = new FormData();
      form.append('file', file);
      const token = getToken();
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const API_ROOT = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
      const res = await fetch(`${API_ROOT}/api/integrations/upload`, { method: 'POST', headers, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    },

    async InvokeLLM(params) {
      return apiFetch('/integrations/llm', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  },
};

const agents = {
  async getStatus() {
    return apiFetch('/agents/status');
  },

  async createConversation({ agent_name, metadata }) {
    return apiFetch('/agents/conversations', {
      method: 'POST',
      body: JSON.stringify({ agent_name, metadata }),
    });
  },

  subscribeToConversation(_conversationId, callback) {
    return () => {};
  },

  async addMessage(conversation, { role, content }) {
    const updated = await apiFetch(`/agents/conversations/${conversation.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role, content }),
    });
    return updated;
  },
};

export const api = { auth, entities, functions, integrations, agents, reports: {
  listEntity(entityName, sort, limit) {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return apiFetch(`/entities/${entityName}${qs ? `?${qs}` : ''}`, { skipCustomerContext: true });
  },
}, admin: {
  async getDatastoreStats() {
    return apiFetch('/admin/datastore');
  },
  async exportFullBackup() {
    const API_ROOT = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
    const token = getToken();
    const res = await fetch(`${API_ROOT}/api/admin/datastore/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Export failed');
    }
    return res.json();
  },
  async getCredentials() {
    return apiFetch('/admin/datastore/credentials');
  },
  async validateBackup(backup) {
    return apiFetch('/admin/datastore/validate', {
      method: 'POST',
      body: JSON.stringify({ backup }),
    });
  },
  async importBackup(backup) {
    return apiFetch('/admin/datastore/import', {
      method: 'POST',
      body: JSON.stringify({ confirm: true, backup }),
    });
  },
  async sendCustomerWelcomeEmail(payload) {
    return apiFetch('/customers/welcome-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
}, customerView: {
  async options() {
    return apiFetch('/customer-view/options', { skipCustomerContext: true });
  },
}, customerAnalytics: {
  async track(payload) {
    return apiFetch('/customer-analytics/track', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async summary() {
    return apiFetch('/customer-analytics/summary');
  },
} };

export { getToken, setToken };
