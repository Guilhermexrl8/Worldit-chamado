const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'support.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some(column => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
}

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'company',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aberto',
    requester_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS ticket_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    sender_role TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );
`);

ensureColumn('users', 'role', "role TEXT NOT NULL DEFAULT 'company'");

db.exec(`UPDATE users SET role = 'company' WHERE role IS NULL OR role = ''`);

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  const [salt, hash] = storedValue.split(':');
  if (!salt || !hash) {
    return false;
  }

  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

function toUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role || 'company',
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    createdAt: row.created_at
  };
}

function toTicket(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    subject: row.subject,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    requesterName: row.requester_name,
    companyName: row.company_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toTicketMessage(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    message: row.message,
    createdAt: row.created_at
  };
}

function seedDatabase() {
  const seeds = [
    {
      firstName: 'Teste',
      lastName: 'Usuario',
      email: 'admin@empresa.com',
      password: '123456',
      role: 'company'
    },
    {
      firstName: 'WorldIT',
      lastName: 'Admin',
      email: 'worldit@worldit.com',
      password: 'WIT#2026!Adm1n',
      role: 'admin'
    },
    {
      firstName: 'Paulo',
      lastName: 'Tecnico',
      email: 'tecnico@worldit.com',
      password: 'WIT#2026!Tec1',
      role: 'technician'
    },
    {
      firstName: 'Marina',
      lastName: 'Suporte',
      email: 'tecnico2@worldit.com',
      password: 'WIT#2026!Tec2',
      role: 'technician'
    },
    {
      firstName: 'Ricardo',
      lastName: 'Helpdesk',
      email: 'tecnico3@worldit.com',
      password: 'WIT#2026!Tec3',
      role: 'technician'
    }
  ];

  for (const seed of seeds) {
    const existingUser = getUserByEmail(seed.email);
    if (existingUser) {
      db.prepare('UPDATE users SET role = ? WHERE email = ?').run(seed.role, seed.email);
      continue;
    }

    createUser(seed);
  }

  const ticketCount = db.prepare('SELECT COUNT(*) AS count FROM tickets').get().count;
  if (ticketCount === 0) {
    const demoUser = getUserByEmail('admin@empresa.com');
    const demoTickets = [
      {
        subject: 'Configuração de impressora',
        description: 'Solicito que minha impressora seja configurada em meu novo computador.',
        category: 'Impressora',
        priority: 'Normal',
        status: 'Aberto',
        requesterName: 'Teste',
        companyName: 'Empresa Fantasia',
        email: 'teste@empresa.com',
        phone: '(12) 99999-9999'
      },
      {
        subject: 'Falha na rede',
        description: 'A internet está oscilando em alguns setores do escritório.',
        category: 'Rede',
        priority: 'Alta',
        status: 'Em andamento',
        requesterName: 'Renata Souza',
        companyName: 'Empresa Fantasia',
        email: 'renata@empresa.com',
        phone: '(11) 98888-1111'
      },
      {
        subject: 'Instalação de sistema',
        description: 'Preciso liberar a instalação do sistema em uma nova estação.',
        category: 'Sistema',
        priority: 'Normal',
        status: 'Aguardando cliente',
        requesterName: 'Carlos Lima',
        companyName: 'Filial Norte',
        email: 'carlos@empresa.com',
        phone: '(21) 97777-2222'
      }
    ];

    const insertTicket = db.prepare(`
      INSERT INTO tickets (
        user_id, subject, description, category, priority, status,
        requester_name, company_name, email, phone
      ) VALUES (
        @userId, @subject, @description, @category, @priority, @status,
        @requesterName, @companyName, @email, @phone
      )
    `);

    for (const ticket of demoTickets) {
      insertTicket.run({
        userId: demoUser.id,
        ...ticket
      });
    }
  }
}

function getUserByEmail(email) {
  return toUser(db.prepare('SELECT * FROM users WHERE email = ?').get(email));
}

function createUser({ firstName, lastName, email, password, role = 'company' }) {
  const passwordHash = hashPassword(password);
  const result = db.prepare(`
    INSERT INTO users (first_name, last_name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(firstName, lastName, email, passwordHash, role);

  return toUser(
    db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
  );
}

function authenticateUser(email, password) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return null;
  }

  return toUser(row);
}

function listTickets({ userId, role } = {}) {
  const isTechnician = role === 'technician';
  const rows = isTechnician || userId == null
    ? db.prepare(`
        SELECT *
        FROM tickets
        ORDER BY datetime(updated_at) DESC, id DESC
      `).all()
    : db.prepare(`
        SELECT *
        FROM tickets
        WHERE user_id = ?
        ORDER BY datetime(updated_at) DESC, id DESC
      `).all(userId);

  return rows.map(toTicket);
}

function listTechnicians() {
  const rows = db.prepare(`
    SELECT *
    FROM users
    WHERE role = 'technician'
    ORDER BY datetime(created_at) DESC, id DESC
  `).all();

  return rows.map(toUser);
}

function removeTechnicianById(id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!row || row.role !== 'technician') {
    return null;
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return toUser(row);
}

function getTicketById(id) {
  return toTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(id));
}

function createTicket(input) {
  const result = db.prepare(`
    INSERT INTO tickets (
      user_id, subject, description, category, priority, status,
      requester_name, company_name, email, phone
    ) VALUES (
      @userId, @subject, @description, @category, @priority, @status,
      @requesterName, @companyName, @email, @phone
    )
  `).run({
    userId: input.userId ?? null,
    subject: input.subject,
    description: input.description,
    category: input.category,
    priority: input.priority,
    status: input.status ?? 'Aberto',
    requesterName: input.requesterName,
    companyName: input.companyName,
    email: input.email,
    phone: input.phone
  });

  const ticketId = result.lastInsertRowid;
  if (input.description) {
    addTicketMessage({
      ticketId,
      senderRole: 'company',
      senderName: input.requesterName,
      message: input.description
    });
  }

  return getTicketById(ticketId);
}

function listTicketMessages(ticketId) {
  const rows = db.prepare(`
    SELECT *
    FROM ticket_messages
    WHERE ticket_id = ?
    ORDER BY datetime(created_at) ASC, id ASC
  `).all(ticketId);

  return rows.map(toTicketMessage);
}

function addTicketMessage({ ticketId, senderRole, senderName, message }) {
  const result = db.prepare(`
    INSERT INTO ticket_messages (ticket_id, sender_role, sender_name, message)
    VALUES (?, ?, ?, ?)
  `).run(ticketId, senderRole, senderName, message);

  return toTicketMessage(
    db.prepare('SELECT * FROM ticket_messages WHERE id = ?').get(result.lastInsertRowid)
  );
}

function updateTicketStatus(id, status) {
  db.prepare(`
    UPDATE tickets
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, id);

  return getTicketById(id);
}

seedDatabase();

module.exports = {
  addTicketMessage,
  authenticateUser,
  createTicket,
  createUser,
  getTicketById,
  getUserByEmail,
  listTicketMessages,
  listTickets,
  listTechnicians,
  removeTechnicianById,
  toTicketMessage,
  toTicket,
  toUser,
  updateTicketStatus
};
