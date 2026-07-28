require('dotenv').config();

const crypto = require('node:crypto');
const mysql = require('mysql2/promise');

function envFlag(name, fallback = false) {
  const value = String(process.env[name] ?? '').trim().toLowerCase();
  if (!value) return fallback;
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function buildPoolConfig() {
  const sslEnabled = envFlag('DB_SSL', false);
  const databaseUrl = String(process.env.DATABASE_URL || process.env.DB_URL || '').trim();

  if (databaseUrl) {
    if (!/^mysql:\/\//i.test(databaseUrl)) {
      throw new Error('DATABASE_URL invalida para este projeto. Use URL mysql://');
    }

    const parsed = new URL(databaseUrl);
    const cfg = {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: decodeURIComponent(String(parsed.pathname || '/').replace(/^\//, '') || 'chamado'),
      waitForConnections: true,
      connectionLimit: 10,
      timezone: '+00:00'
    };

    if (sslEnabled) cfg.ssl = { rejectUnauthorized: false };
    return cfg;
  }

  const cfg = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chamado',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: '+00:00'
  };

  if (sslEnabled) cfg.ssl = { rejectUnauthorized: false };
  return cfg;
}

const allowMemoryFallback = envFlag(
  'DB_ALLOW_MEMORY_FALLBACK',
  String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'
);

const pool = mysql.createPool(buildPoolConfig());

let memoryMode = false;

const mem = {
  companies: [],
  users: [],
  tickets: [],
  ticketMessages: [],
  ids: { company: 1, user: 1, ticket: 1, message: 1 }
};

function nowString() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  const [salt, hash] = String(storedValue || '').split(':');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

function fmt(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().replace('T', ' ').slice(0, 19);
  return String(v);
}

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    companyId: row.company_id || row.companyId || null,
    companyName: row.company_name || row.companyName || null,
    companyLogo: row.company_logo || row.companyLogo || null,
    firstName: row.first_name || row.firstName,
    lastName: row.last_name || row.lastName,
    email: row.email,
    role: row.role || 'employee',
    fullName: `${row.first_name || row.firstName} ${row.last_name || row.lastName}`.trim(),
    createdAt: fmt(row.created_at || row.createdAt)
  };
}

function toTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id || row.userId || null,
    companyId: row.company_id || row.companyId || null,
    subject: row.subject,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    requesterName: row.requester_name || row.requesterName,
    companyName: row.company_name || row.companyName,
    email: row.email,
    phone: row.phone,
    createdAt: fmt(row.created_at || row.createdAt),
    updatedAt: fmt(row.updated_at || row.updatedAt)
  };
}

function toTicketMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    ticketId: row.ticket_id || row.ticketId,
    senderRole: row.sender_role || row.senderRole,
    senderName: row.sender_name || row.senderName,
    message: row.message,
    createdAt: fmt(row.created_at || row.createdAt)
  };
}

async function initSchema() {
  try {
    await pool.execute('SELECT 1');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(120) NOT NULL,
        email      VARCHAR(120) DEFAULT NULL,
        phone      VARCHAR(30)  DEFAULT NULL,
        logo_url   VARCHAR(512) DEFAULT NULL,
        created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        company_id    INT          DEFAULT NULL,
        first_name    VARCHAR(60)  NOT NULL,
        last_name     VARCHAR(60)  NOT NULL,
        email         VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(220) NOT NULL,
        role          VARCHAR(30)  NOT NULL DEFAULT 'employee',
        created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        user_id        INT          DEFAULT NULL,
        company_id     INT          DEFAULT NULL,
        subject        VARCHAR(200) NOT NULL,
        description    TEXT         NOT NULL,
        category       VARCHAR(60)  NOT NULL,
        priority       VARCHAR(30)  NOT NULL,
        status         VARCHAR(40)  NOT NULL DEFAULT 'Aberto',
        requester_name VARCHAR(120) NOT NULL,
        company_name   VARCHAR(120) NOT NULL,
        email          VARCHAR(120) NOT NULL,
        phone          VARCHAR(30)  NOT NULL,
        created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id   INT          NOT NULL,
        sender_role VARCHAR(30)  NOT NULL,
        sender_name VARCHAR(120) NOT NULL,
        message     TEXT         NOT NULL,
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } catch (error) {
    if (!allowMemoryFallback) {
      throw error;
    }
    memoryMode = true;
    console.warn('[db] MySQL indisponivel. Subindo em modo memoria (demo).', error.code || error.message);
  }
}

async function getUserByEmail(email) {
  const normalized = String(email || '').toLowerCase();
  if (memoryMode) {
    const row = mem.users.find(u => u.email.toLowerCase() === normalized);
    return row ? toUser(row) : null;
  }
  const [rows] = await pool.execute(
    'SELECT u.*, c.name AS company_name, c.logo_url AS company_logo FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.email = ?',
    [normalized]
  );
  return toUser(rows[0] || null);
}

async function getUserById(id) {
  if (memoryMode) {
    const row = mem.users.find(u => u.id === Number(id));
    return row ? toUser(row) : null;
  }
  const [rows] = await pool.execute(
    'SELECT u.*, c.name AS company_name, c.logo_url AS company_logo FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.id = ?',
    [id]
  );
  return toUser(rows[0] || null);
}

async function createUser({ firstName, lastName, email, password, role = 'employee', companyId = null }) {
  const normalized = String(email || '').toLowerCase();
  const passwordHash = hashPassword(password);

  if (memoryMode) {
    const company = mem.companies.find(c => c.id === Number(companyId)) || null;
    const row = {
      id: mem.ids.user++,
      companyId: companyId ? Number(companyId) : null,
      companyName: company ? company.name : null,
      companyLogo: company ? (company.logoUrl || null) : null,
      firstName,
      lastName,
      email: normalized,
      passwordHash,
      role,
      createdAt: nowString()
    };
    mem.users.push(row);
    return toUser(row);
  }

  const [result] = await pool.execute(
    'INSERT INTO users (first_name, last_name, email, password_hash, role, company_id) VALUES (?, ?, ?, ?, ?, ?)',
    [firstName, lastName, normalized, passwordHash, role, companyId || null]
  );
  return getUserById(result.insertId);
}

async function authenticateUser(email, password) {
  const normalized = String(email || '').toLowerCase();

  if (memoryMode) {
    const row = mem.users.find(u => u.email.toLowerCase() === normalized);
    if (!row || !verifyPassword(password, row.passwordHash)) return null;
    return toUser(row);
  }

  const [rows] = await pool.execute(
    'SELECT u.*, c.name AS company_name, c.logo_url AS company_logo FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.email = ?',
    [normalized]
  );
  const row = rows[0];
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  return toUser(row);
}

async function createCompany({ name, email = null, phone = null, logoUrl = null }) {
  if (memoryMode) {
    const row = { id: mem.ids.company++, name, email, phone, logoUrl, createdAt: nowString() };
    mem.companies.push(row);
    return { id: row.id, name: row.name, email: row.email, phone: row.phone, logoUrl: row.logoUrl || null, createdAt: row.createdAt };
  }

  const [result] = await pool.execute('INSERT INTO companies (name, email, phone, logo_url) VALUES (?, ?, ?, ?)', [name, email, phone, logoUrl]);
  const [rows] = await pool.execute('SELECT * FROM companies WHERE id = ?', [result.insertId]);
  const r = rows[0];
  return r ? { id: r.id, name: r.name, email: r.email, phone: r.phone, logoUrl: r.logo_url || null, createdAt: fmt(r.created_at) } : null;
}

async function listCompanies() {
  if (memoryMode) {
    return mem.companies.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      logoUrl: c.logoUrl || null,
      createdAt: c.createdAt
    }));
  }
  const [rows] = await pool.execute('SELECT * FROM companies ORDER BY name ASC');
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    logoUrl: r.logo_url || null,
    createdAt: fmt(r.created_at)
  }));
}

async function getCompanyById(id) {
  if (memoryMode) {
    const c = mem.companies.find(x => x.id === Number(id));
    return c ? { id: c.id, name: c.name, email: c.email, phone: c.phone, logoUrl: c.logoUrl || null } : null;
  }
  const [rows] = await pool.execute('SELECT * FROM companies WHERE id = ?', [id]);
  const r = rows[0];
  return r ? { id: r.id, name: r.name, email: r.email, phone: r.phone, logoUrl: r.logo_url || null } : null;
}

async function updateCompany(id, { name, email = null, phone = null, logoUrl = null }) {
  const companyId = Number(id);
  if (memoryMode) {
    const idx = mem.companies.findIndex(c => c.id === companyId);
    if (idx === -1) return null;

    mem.companies[idx] = {
      ...mem.companies[idx],
      name,
      email,
      phone,
      logoUrl
    };

    for (const user of mem.users) {
      if (user.companyId === companyId) {
        user.companyName = name;
        user.companyLogo = logoUrl;
      }
    }

    const c = mem.companies[idx];
    return { id: c.id, name: c.name, email: c.email, phone: c.phone, logoUrl: c.logoUrl || null, createdAt: c.createdAt };
  }

  await pool.execute(
    'UPDATE companies SET name = ?, email = ?, phone = ?, logo_url = ? WHERE id = ?',
    [name, email, phone, logoUrl, companyId]
  );

  const [rows] = await pool.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
  const r = rows[0];
  return r ? { id: r.id, name: r.name, email: r.email, phone: r.phone, logoUrl: r.logo_url || null, createdAt: fmt(r.created_at) } : null;
}

async function removeCompanyById(id) {
  const companyId = Number(id);
  if (memoryMode) {
    const company = mem.companies.find(c => c.id === companyId) || null;
    if (!company) return null;

    const linkedUsers = mem.users.filter(u => u.companyId === companyId);
    const hasInternalUsers = linkedUsers.some(u => u.role === 'admin' || u.role === 'technician');
    if (hasInternalUsers) {
      return { blocked: true, reason: 'internal_users' };
    }

    const ticketIds = new Set(mem.tickets.filter(t => t.companyId === companyId).map(t => t.id));
    mem.ticketMessages = mem.ticketMessages.filter(m => !ticketIds.has(m.ticketId));
    mem.tickets = mem.tickets.filter(t => t.companyId !== companyId);
    mem.users = mem.users.filter(u => u.companyId !== companyId);
    mem.companies = mem.companies.filter(c => c.id !== companyId);

    return {
      blocked: false,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        logoUrl: company.logoUrl || null,
        createdAt: company.createdAt
      }
    };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [companyRows] = await conn.execute('SELECT * FROM companies WHERE id = ? FOR UPDATE', [companyId]);
    const company = companyRows[0];
    if (!company) {
      await conn.rollback();
      return null;
    }

    const [userRows] = await conn.execute('SELECT id, role FROM users WHERE company_id = ?', [companyId]);
    const hasInternalUsers = userRows.some(u => u.role === 'admin' || u.role === 'technician');
    if (hasInternalUsers) {
      await conn.rollback();
      return { blocked: true, reason: 'internal_users' };
    }

    const [ticketRows] = await conn.execute('SELECT id FROM tickets WHERE company_id = ?', [companyId]);
    if (ticketRows.length > 0) {
      const placeholders = ticketRows.map(() => '?').join(', ');
      const ticketIds = ticketRows.map(t => t.id);
      await conn.execute(`DELETE FROM ticket_messages WHERE ticket_id IN (${placeholders})`, ticketIds);
    }

    await conn.execute('DELETE FROM tickets WHERE company_id = ?', [companyId]);
    await conn.execute('DELETE FROM users WHERE company_id = ?', [companyId]);
    await conn.execute('DELETE FROM companies WHERE id = ?', [companyId]);

    await conn.commit();
    return {
      blocked: false,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        logoUrl: company.logo_url || null,
        createdAt: fmt(company.created_at)
      }
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function createEmployee({ companyId, firstName, lastName, email, password }) {
  return createUser({ companyId, firstName, lastName, email, password, role: 'employee' });
}

async function listEmployees(companyId) {
  if (memoryMode) {
    return mem.users
      .filter(u => u.role === 'employee' && u.companyId === Number(companyId))
      .map(toUser);
  }
  const [rows] = await pool.execute(
    "SELECT u.*, c.name AS company_name FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.company_id = ? AND u.role = 'employee' ORDER BY u.first_name ASC",
    [companyId]
  );
  return rows.map(toUser);
}

async function removeEmployeeById(id, companyId) {
  if (memoryMode) {
    const idx = mem.users.findIndex(
      u => u.id === Number(id) && u.companyId === Number(companyId) && u.role === 'employee'
    );
    if (idx === -1) return null;
    const [removed] = mem.users.splice(idx, 1);
    return toUser(removed);
  }
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE id = ? AND company_id = ? AND role = 'employee'",
    [id, companyId]
  );
  if (!rows[0]) return null;
  const user = toUser(rows[0]);
  await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  return user;
}

async function listTechnicians() {
  if (memoryMode) return mem.users.filter(u => u.role === 'technician').map(toUser);
  const [rows] = await pool.execute("SELECT * FROM users WHERE role = 'technician' ORDER BY first_name ASC");
  return rows.map(toUser);
}

async function removeTechnicianById(id) {
  if (memoryMode) {
    const idx = mem.users.findIndex(u => u.id === Number(id) && u.role === 'technician');
    if (idx === -1) return null;
    const [removed] = mem.users.splice(idx, 1);
    return toUser(removed);
  }
  const [rows] = await pool.execute("SELECT * FROM users WHERE id = ? AND role = 'technician'", [id]);
  if (!rows[0]) return null;
  const user = toUser(rows[0]);
  await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  return user;
}

async function getTicketById(id) {
  if (memoryMode) {
    const row = mem.tickets.find(t => t.id === Number(id));
    return row ? toTicket(row) : null;
  }
  const [rows] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [id]);
  return toTicket(rows[0] || null);
}

async function createTicket(input) {
  if (memoryMode) {
    const row = {
      id: mem.ids.ticket++,
      userId: input.userId ? Number(input.userId) : null,
      companyId: input.companyId ? Number(input.companyId) : null,
      subject: input.subject,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: input.status || 'Aberto',
      requesterName: input.requesterName,
      companyName: input.companyName,
      email: input.email,
      phone: input.phone,
      createdAt: nowString(),
      updatedAt: nowString()
    };
    mem.tickets.push(row);

    if (input.description) {
      await addTicketMessage({
        ticketId: row.id,
        senderRole: 'employee',
        senderName: input.requesterName,
        message: input.description
      });
    }

    return toTicket(row);
  }

  const [result] = await pool.execute(
    `INSERT INTO tickets
      (user_id, company_id, subject, description, category, priority, status,
       requester_name, company_name, email, phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userId || null,
      input.companyId || null,
      input.subject,
      input.description,
      input.category,
      input.priority,
      input.status || 'Aberto',
      input.requesterName,
      input.companyName,
      input.email,
      input.phone
    ]
  );

  const ticketId = result.insertId;
  if (input.description) {
    await addTicketMessage({
      ticketId,
      senderRole: 'employee',
      senderName: input.requesterName,
      message: input.description
    });
  }

  return getTicketById(ticketId);
}

async function listTickets({ userId, role, companyId } = {}) {
  if (memoryMode) {
    if (role === 'admin' || role === 'technician') {
      return [...mem.tickets]
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map(toTicket);
    }
    if (role === 'company_admin' && companyId) {
      return mem.tickets
        .filter(t => t.companyId === Number(companyId))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map(toTicket);
    }
    if (userId) {
      return mem.tickets
        .filter(t => t.userId === Number(userId))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map(toTicket);
    }
    return [];
  }

  if (role === 'admin' || role === 'technician') {
    const [rows] = await pool.execute('SELECT * FROM tickets ORDER BY updated_at DESC, id DESC');
    return rows.map(toTicket);
  }
  if (role === 'company_admin' && companyId) {
    const [rows] = await pool.execute('SELECT * FROM tickets WHERE company_id = ? ORDER BY updated_at DESC, id DESC', [companyId]);
    return rows.map(toTicket);
  }
  if (userId) {
    const [rows] = await pool.execute('SELECT * FROM tickets WHERE user_id = ? ORDER BY updated_at DESC, id DESC', [userId]);
    return rows.map(toTicket);
  }
  return [];
}

async function updateTicketStatus(id, status) {
  if (memoryMode) {
    const row = mem.tickets.find(t => t.id === Number(id));
    if (!row) return null;
    row.status = status;
    row.updatedAt = nowString();
    return toTicket(row);
  }
  await pool.execute('UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  return getTicketById(id);
}

async function listTicketMessages(ticketId) {
  if (memoryMode) {
    return mem.ticketMessages
      .filter(m => m.ticketId === Number(ticketId))
      .map(toTicketMessage);
  }
  const [rows] = await pool.execute(
    'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC, id ASC',
    [ticketId]
  );
  return rows.map(toTicketMessage);
}

async function addTicketMessage({ ticketId, senderRole, senderName, message }) {
  if (memoryMode) {
    const row = {
      id: mem.ids.message++,
      ticketId: Number(ticketId),
      senderRole,
      senderName,
      message,
      createdAt: nowString()
    };
    mem.ticketMessages.push(row);
    const t = mem.tickets.find(x => x.id === Number(ticketId));
    if (t) t.updatedAt = row.createdAt;
    return toTicketMessage(row);
  }

  const [result] = await pool.execute(
    'INSERT INTO ticket_messages (ticket_id, sender_role, sender_name, message) VALUES (?, ?, ?, ?)',
    [ticketId, senderRole, senderName, message]
  );
  const [rows] = await pool.execute('SELECT * FROM ticket_messages WHERE id = ?', [result.insertId]);
  return toTicketMessage(rows[0]);
}

async function seedDatabase() {
  const companyExists = await listCompanies();
  if (companyExists.length > 0) return;

  const witCompany = await createCompany({ name: 'WorldIT', email: 'contato@worldit.com' });
  const existing = await getUserByEmail('worldit@worldit.com');
  if (!existing) {
    await createUser({
      firstName: 'WorldIT',
      lastName: 'Admin',
      email: 'worldit@worldit.com',
      password: 'WIT#2026!Adm1n',
      role: 'admin',
      companyId: witCompany.id
    });
  }
}

async function resetToAdminOnly() {
  if (memoryMode) {
    mem.companies = [];
    mem.users = [];
    mem.tickets = [];
    mem.ticketMessages = [];
    mem.ids = { company: 1, user: 1, ticket: 1, message: 1 };
    await seedDatabase();
    return { ok: true, mode: 'memory' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM ticket_messages');
    await conn.execute('DELETE FROM tickets');
    await conn.execute('DELETE FROM users');
    await conn.execute('DELETE FROM companies');
    await conn.execute('ALTER TABLE ticket_messages AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE tickets AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE companies AUTO_INCREMENT = 1');
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  await seedDatabase();
  return { ok: true, mode: 'mysql' };
}

module.exports = {
  pool,
  initSchema,
  seedDatabase,
  authenticateUser,
  createUser,
  getUserByEmail,
  getUserById,
  createCompany,
  listCompanies,
  getCompanyById,
  updateCompany,
  removeCompanyById,
  createEmployee,
  listEmployees,
  removeEmployeeById,
  listTechnicians,
  removeTechnicianById,
  getTicketById,
  createTicket,
  listTickets,
  updateTicketStatus,
  listTicketMessages,
  addTicketMessage,
  resetToAdminOnly
};
