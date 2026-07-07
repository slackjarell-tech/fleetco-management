import {
  createEntity,
  deleteEntity,
  filterEntities,
  filterUsers,
  getEntity,
  getSiteSettings,
  listEntities,
  listUsers,
  updateEntity,
  updateSiteSettings,
  updateUser,
} from './db.js';

const ENTITY_TYPES = [
  'Customer', 'DriverLocation', 'DiagnosticCode', 'FuelLog', 'DeliveryRoute',
  'DeliveryStop', 'HOSLog', 'FuelStation', 'Inquiry', 'Incident', 'Inspection',
  'Invoice', 'Load', 'MaintenanceSchedule', 'Message', 'PartInventory',
  'PayrollRecord', 'PendingAccount', 'ScreeningRecord', 'ServiceTemplate',
  'UsageFeedback', 'Vehicle', 'VehicleDocument', 'Vendor', 'TimeClockEntry', 'WorkOrder',
];

const WRITE_ROLES = new Set(['executive', 'fleet_manager', 'fleet_coordinator', 'employee']);
const ADMIN_ROLES = new Set(['executive', 'fleet_manager']);
const SITE_ADMIN_ROLES = new Set(['executive']);

function canWrite(user) {
  return user && WRITE_ROLES.has(user.role);
}

function canAdmin(user) {
  return user && ADMIN_ROLES.has(user.role);
}

function canEditSite(user) {
  return user && SITE_ADMIN_ROLES.has(user.role);
}

function assertEntityType(type) {
  if (!ENTITY_TYPES.includes(type)) {
    throw new Error(`Unknown entity type "${type}". Valid types: ${ENTITY_TYPES.join(', ')}`);
  }
}

function scopeCriteria(user, criteria = {}) {
  if (!user?.customer_id || user.role === 'executive') return criteria;
  return { ...criteria, customer_id: user.customer_id };
}

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'list_records',
      description: 'List fleet portal records of a given type, optionally filtered.',
      parameters: {
        type: 'object',
        properties: {
          entity_type: { type: 'string', description: 'Entity type name, e.g. Vehicle, WorkOrder, Customer' },
          filter: { type: 'object', description: 'Optional field filters' },
          limit: { type: 'number', description: 'Max records to return (default 20)' },
        },
        required: ['entity_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_record',
      description: 'Get a single record by entity type and id.',
      parameters: {
        type: 'object',
        properties: {
          entity_type: { type: 'string' },
          id: { type: 'string' },
        },
        required: ['entity_type', 'id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_record',
      description: 'Create a new fleet portal record.',
      parameters: {
        type: 'object',
        properties: {
          entity_type: { type: 'string' },
          data: { type: 'object', description: 'Record fields' },
        },
        required: ['entity_type', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_record',
      description: 'Update fields on an existing record.',
      parameters: {
        type: 'object',
        properties: {
          entity_type: { type: 'string' },
          id: { type: 'string' },
          data: { type: 'object' },
        },
        required: ['entity_type', 'id', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_record',
      description: 'Delete a record (executive/fleet_manager only).',
      parameters: {
        type: 'object',
        properties: {
          entity_type: { type: 'string' },
          id: { type: 'string' },
        },
        required: ['entity_type', 'id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_site_settings',
      description: 'Read public website content settings (hero text, contact info, tagline).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_site_settings',
      description: 'Update public website content (hero headline, description, contact info). Executive only.',
      parameters: {
        type: 'object',
        properties: {
          changes: {
            type: 'object',
            description: 'Fields: hero_badge, hero_title_line1, hero_title_highlight, hero_description, tagline, contact_email, contact_phone, company_location',
          },
        },
        required: ['changes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_summary',
      description: 'Get counts and quick stats across fleet data.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_users',
      description: 'List portal users (admin only).',
      parameters: {
        type: 'object',
        properties: {
          filter: { type: 'object' },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_user',
      description: 'Update a user role or profile (admin only).',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          data: { type: 'object' },
        },
        required: ['id', 'data'],
      },
    },
  },
];

export function executeTool(user, name, args) {
  switch (name) {
    case 'list_records': {
      assertEntityType(args.entity_type);
      const limit = Math.min(args.limit || 20, 50);
      const criteria = scopeCriteria(user, args.filter || {});
      const items = filterEntities(args.entity_type, criteria, '-updated_date', limit);
      return { success: true, count: items.length, items };
    }

    case 'get_record': {
      assertEntityType(args.entity_type);
      const item = getEntity(args.entity_type, args.id);
      if (!item) return { success: false, error: 'Not found' };
      if (user?.customer_id && user.role !== 'executive' && item.customer_id && item.customer_id !== user.customer_id) {
        return { success: false, error: 'Access denied' };
      }
      return { success: true, item };
    }

    case 'create_record': {
      if (!canWrite(user)) return { success: false, error: 'Your role cannot create records' };
      assertEntityType(args.entity_type);
      const data = { ...(args.data || {}) };
      if (user?.customer_id && user.role !== 'executive' && !data.customer_id) {
        data.customer_id = user.customer_id;
      }
      const created = createEntity(args.entity_type, data);
      return { success: true, item: created };
    }

    case 'update_record': {
      if (!canWrite(user)) return { success: false, error: 'Your role cannot update records' };
      assertEntityType(args.entity_type);
      const existing = getEntity(args.entity_type, args.id);
      if (!existing) return { success: false, error: 'Not found' };
      if (user?.customer_id && user.role !== 'executive' && existing.customer_id && existing.customer_id !== user.customer_id) {
        return { success: false, error: 'Access denied' };
      }
      const updated = updateEntity(args.entity_type, args.id, args.data || {});
      return { success: true, item: updated };
    }

    case 'delete_record': {
      if (!canAdmin(user)) return { success: false, error: 'Only admins can delete records' };
      assertEntityType(args.entity_type);
      deleteEntity(args.entity_type, args.id);
      return { success: true, deleted: args.id };
    }

    case 'get_site_settings':
      return { success: true, settings: getSiteSettings() };

    case 'update_site_settings': {
      if (!canEditSite(user)) return { success: false, error: 'Only executives can edit website content' };
      const settings = updateSiteSettings(args.changes || {});
      return { success: true, settings };
    }

    case 'get_dashboard_summary': {
      const summary = {
        vehicles: listEntities('Vehicle', null, 500).length,
        drivers: filterUsers({ role: 'driver' }).length,
        work_orders: listEntities('WorkOrder', null, 500).length,
        open_work_orders: filterEntities('WorkOrder', { status: 'open' }).length,
        customers: listEntities('Customer', null, 500).length,
        loads: listEntities('Load', null, 500).length,
        inquiries: filterEntities('Inquiry', { status: 'new' }).length,
      };
      return { success: true, summary };
    }

    case 'list_users': {
      if (!canAdmin(user)) return { success: false, error: 'Admin access required' };
      let users = filterUsers(args.filter || {});
      const limit = Math.min(args.limit || 25, 50);
      users = users.slice(0, limit).map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        status: u.status,
      }));
      return { success: true, count: users.length, users };
    }

    case 'update_user': {
      if (!canAdmin(user)) return { success: false, error: 'Admin access required' };
      const allowed = ['full_name', 'role', 'status', 'sidebar_modules'];
      const data = {};
      for (const key of allowed) {
        if (args.data?.[key] !== undefined) data[key] = args.data[key];
      }
      const updated = updateUser(args.id, data);
      if (!updated) return { success: false, error: 'User not found' };
      return { success: true, user: updated };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

export function getToolsForUser(user, agentName) {
  // Revan executive: full tool suite including site settings, users, deletes
  if (agentName === 'revan' && user?.role === 'executive') {
    return TOOL_DEFINITIONS;
  }
  if (agentName === 'revan' && user?.role !== 'executive') {
    return TOOL_DEFINITIONS.filter((t) => ['get_dashboard_summary', 'list_records', 'get_record'].includes(t.function.name));
  }
  if (!canAdmin(user)) {
    return TOOL_DEFINITIONS.filter((t) => !['delete_record', 'list_users', 'update_user', 'update_site_settings'].includes(t.function.name));
  }
  if (!canEditSite(user)) {
    return TOOL_DEFINITIONS.filter((t) => t.function.name !== 'update_site_settings');
  }
  return TOOL_DEFINITIONS;
}
