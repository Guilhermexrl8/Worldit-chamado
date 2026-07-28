const http = require('node:http');
const fs   = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const db  = require('./db');
const { sendTicketResolvedEmail } = require('./mailer');

const port         = Number(process.env.PORT || 3000);
const frontendDir  = path.join(__dirname, '..', 'frontend');
const rootDir      = path.join(__dirname, '..');
const indexFile    = path.join(frontendDir, 'index.html');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (error, buffer) => {
    if (error) { sendJson(res, 404, { error: 'Arquivo não encontrado.' }); return; }
    res.writeHead(200, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
    res.end(buffer);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length === 0) { resolve({}); return; }
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function sanitizePathname(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  const resolved   = path.join(frontendDir, normalized);
  return resolved.startsWith(frontendDir) ? resolved : null;
}

function sanitizePathnameFrom(baseDir, requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  const resolved = path.join(baseDir, normalized);
  return resolved.startsWith(baseDir) ? resolved : null;
}

function canAccessTicket(ticket, role, userId, companyId) {
  if (!ticket) return false;
  if (role === 'technician' || role === 'admin') return true;
  if (role === 'company_admin' && companyId && ticket.companyId === companyId) return true;
  if (userId == null) return true;
  return ticket.userId === userId;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function uniqueValidEmails(...emails) {
  return [...new Set(
    emails
      .map(value => String(value || '').trim().toLowerCase())
      .filter(isValidEmail)
  )];
}

function normalizeDomainFromEmail(email) {
  const trimmed = String(email || '').trim().toLowerCase();
  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1) return '';
  const domain = trimmed.slice(atIndex + 1).trim();
  if (!domain || !domain.includes('.')) return '';
  return domain;
}

function normalizeCompanySlug(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function buildLogoCandidateDomains({ name, email }) {
  const candidates = [];
  const fromEmail = normalizeDomainFromEmail(email);
  if (fromEmail) {
    candidates.push(fromEmail);
  }

  const slug = normalizeCompanySlug(name);
  if (slug) {
    candidates.push(`${slug}.com.br`);
    candidates.push(`${slug}.com`);
  }

  return [...new Set(candidates)];
}

function buildLogoUrlsFromDomain(domain) {
  const safeDomain = String(domain || '').trim().toLowerCase();
  if (!safeDomain) return [];

  return [
    `https://logo.clearbit.com/${safeDomain}`,
    `https://icons.duckduckgo.com/ip3/${safeDomain}.ico`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeDomain)}&sz=128`
  ];
}

async function probeImageUrl(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) return false;
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    return contentType.includes('image/');
  } catch (_error) {
    return false;
  }
}

async function suggestLogoUrl({ name, email }) {
  const domains = buildLogoCandidateDomains({ name, email });
  for (const domain of domains) {
    const urls = buildLogoUrlsFromDomain(domain);
    for (const url of urls) {
      // Avoid storing broken logo links by probing candidate URLs before returning.
      if (await probeImageUrl(url)) {
        return { logoUrl: url, domain };
      }
    }
  }

  return { logoUrl: null, domain: null };
}

async function routeApi(req, res, pathname) {
  const requestUrl   = new URL(req.url, `http://${req.headers.host}`);
  const role         = requestUrl.searchParams.get('role') || 'employee';
  const userIdParam  = requestUrl.searchParams.get('userId');
  const userId       = userIdParam ? Number(userIdParam) : null;
  const companyIdParam = requestUrl.searchParams.get('companyId');
  const companyId    = companyIdParam ? Number(companyIdParam) : null;

  // ── GET /api/health ─────────────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'support-center' });
    return;
  }

  // ── GET /api/tickets ────────────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/tickets') {
    const tickets = await db.listTickets({ userId, role, companyId });
    sendJson(res, 200, { ok: true, tickets });
    return;
  }

  // ── GET /api/technicians ────────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/technicians') {
    if (role !== 'admin') { sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' }); return; }
    const technicians = await db.listTechnicians();
    sendJson(res, 200, { ok: true, technicians });
    return;
  }

  // ── GET /api/companies ──────────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/companies') {
    if (role !== 'admin') { sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' }); return; }
    const companies = await db.listCompanies();
    sendJson(res, 200, { ok: true, companies });
    return;
  }

  // ── GET /api/company-logo-suggest ───────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/company-logo-suggest') {
    if (role !== 'admin') { sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' }); return; }

    const name = String(requestUrl.searchParams.get('name') || '').trim();
    const email = String(requestUrl.searchParams.get('email') || '').trim();
    if (!name && !email) {
      sendJson(res, 400, { error: 'Informe o nome ou e-mail da empresa para buscar a logo.' });
      return;
    }

    const suggested = await suggestLogoUrl({ name, email });
    sendJson(res, 200, { ok: true, logoUrl: suggested.logoUrl, domain: suggested.domain });
    return;
  }

  // ── POST /api/companies ─────────────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/companies') {
    if (role !== 'admin') { sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' }); return; }
    const body = await parseBody(req);
    const name = String(body.name || '').trim();
    if (!name) { sendJson(res, 400, { error: 'Informe o nome da empresa.' }); return; }
    const company = await db.createCompany({ name, email: body.email || null, phone: body.phone || null });
    sendJson(res, 201, { ok: true, company });
    return;
  }

  // ── PATCH /api/companies/:id ────────────────────────────────────────────────
  if (req.method === 'PATCH' && /^\/api\/companies\/\d+$/.test(pathname)) {
    if (role !== 'admin') { sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' }); return; }

    const companyId = Number(pathname.split('/').pop());
    const current = await db.getCompanyById(companyId);
    if (!current) { sendJson(res, 404, { error: 'Empresa não encontrada.' }); return; }

    const body = await parseBody(req);
    const name = String(body.name || '').trim();
    if (!name) { sendJson(res, 400, { error: 'Informe o nome da empresa.' }); return; }

    const company = await db.updateCompany(companyId, {
      name,
      email: String(body.email || '').trim() || null,
      phone: String(body.phone || '').trim() || null,
      logoUrl: String(body.logoUrl || '').trim() || null
    });

    sendJson(res, 200, { ok: true, company });
    return;
  }

  // ── DELETE /api/companies/:id ───────────────────────────────────────────────
  if (req.method === 'DELETE' && /^\/api\/companies\/\d+$/.test(pathname)) {
    if (role !== 'admin') { sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' }); return; }

    const companyId = Number(pathname.split('/').pop());
    const removed = await db.removeCompanyById(companyId);

    if (!removed) { sendJson(res, 404, { error: 'Empresa não encontrada.' }); return; }
    if (removed.blocked) {
      sendJson(res, 409, { error: 'Não é possível excluir esta empresa enquanto houver administradores/técnicos internos vinculados.' });
      return;
    }

    sendJson(res, 200, { ok: true, company: removed.company });
    return;
  }

  // ── POST /api/company-access ───────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/company-access') {
    if (role !== 'admin') { sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' }); return; }

    const body = await parseBody(req);
    const companyName = String(body.companyName || '').trim();
    let logoUrl = String(body.logoUrl || '').trim() || null;
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!companyName || !firstName || !lastName || !email || !password) {
      sendJson(res, 400, { error: 'Preencha empresa, nome, sobrenome, e-mail e senha.' });
      return;
    }

    if (await db.getUserByEmail(email)) {
      sendJson(res, 409, { error: 'Já existe um usuário com este e-mail.' });
      return;
    }

    const companies = await db.listCompanies();
    let company = companies.find(item => item.name.toLowerCase() === companyName.toLowerCase()) || null;

    if (!logoUrl) {
      const suggested = await suggestLogoUrl({ name: companyName, email });
      logoUrl = suggested.logoUrl;
    }

    if (!company) {
      company = await db.createCompany({ name: companyName, logoUrl });
    } else if (!company.logoUrl && logoUrl) {
      company = await db.updateCompany(company.id, {
        name: company.name,
        email: company.email,
        phone: company.phone,
        logoUrl
      });
    }

    const user = await db.createUser({
      firstName,
      lastName,
      email,
      password,
      role: 'company_admin',
      companyId: company.id
    });

    sendJson(res, 201, { ok: true, company, user });
    return;
  }

  // ── GET /api/companies/:id/employees ────────────────────────────────────────
  if (req.method === 'GET' && /^\/api\/companies\/\d+\/employees$/.test(pathname)) {
    const cId = Number(pathname.split('/')[3]);
    if (role !== 'admin' && !(role === 'company_admin' && companyId === cId)) {
      sendJson(res, 403, { error: 'Acesso negado.' }); return;
    }
    const employees = await db.listEmployees(cId);
    sendJson(res, 200, { ok: true, employees });
    return;
  }

  // ── POST /api/companies/:id/employees ───────────────────────────────────────
  if (req.method === 'POST' && /^\/api\/companies\/\d+\/employees$/.test(pathname)) {
    const cId = Number(pathname.split('/')[3]);
    if (role !== 'admin' && !(role === 'company_admin' && companyId === cId)) {
      sendJson(res, 403, { error: 'Acesso negado.' }); return;
    }
    const body      = await parseBody(req);
    const firstName = String(body.firstName || '').trim();
    const lastName  = String(body.lastName  || '').trim();
    const email     = String(body.email     || '').trim().toLowerCase();
    const password  = String(body.password  || '').trim();
    if (!firstName || !lastName || !email || !password) {
      sendJson(res, 400, { error: 'Preencha nome, sobrenome, e-mail e senha.' }); return;
    }
    if (await db.getUserByEmail(email)) {
      sendJson(res, 409, { error: 'Já existe um usuário com este e-mail.' }); return;
    }
    const employee = await db.createEmployee({ companyId: cId, firstName, lastName, email, password });
    sendJson(res, 201, { ok: true, employee });
    return;
  }

  // ── DELETE /api/employees/:id ───────────────────────────────────────────────
  if (req.method === 'DELETE' && /^\/api\/employees\/\d+$/.test(pathname)) {
    if (role !== 'admin' && role !== 'company_admin') {
      sendJson(res, 403, { error: 'Acesso negado.' }); return;
    }
    const empId   = Number(pathname.split('/').pop());
    const removed = await db.removeEmployeeById(empId, companyId);
    if (!removed) { sendJson(res, 404, { error: 'Funcionário não encontrado.' }); return; }
    sendJson(res, 200, { ok: true, employee: removed });
    return;
  }

  // ── GET /api/tickets/:id ────────────────────────────────────────────────────
  if (req.method === 'GET' && /^\/api\/tickets\/\d+$/.test(pathname)) {
    const ticketId = Number(pathname.split('/').pop());
    const ticket   = await db.getTicketById(ticketId);
    if (!ticket) { sendJson(res, 404, { error: 'Chamado não encontrado.' }); return; }
    if (!canAccessTicket(ticket, role, userId, companyId)) {
      sendJson(res, 403, { error: 'Acesso negado para visualizar este chamado.' }); return;
    }
    sendJson(res, 200, { ok: true, ticket });
    return;
  }

  // ── GET /api/tickets/:id/messages ───────────────────────────────────────────
  if (req.method === 'GET' && /^\/api\/tickets\/\d+\/messages$/.test(pathname)) {
    const ticketId = Number(pathname.split('/')[3]);
    const ticket   = await db.getTicketById(ticketId);
    if (!ticket) { sendJson(res, 404, { error: 'Chamado não encontrado.' }); return; }
    if (!canAccessTicket(ticket, role, userId, companyId)) {
      sendJson(res, 403, { error: 'Acesso negado às mensagens deste chamado.' }); return;
    }
    const messages = await db.listTicketMessages(ticketId);
    sendJson(res, 200, { ok: true, messages });
    return;
  }

  // ── POST /api/register ──────────────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/register') {
    const body = await parseBody(req);
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!firstName || !lastName || !email || !password) {
      sendJson(res, 400, { error: 'Preencha todos os campos do cadastro.' }); return;
    }

    if (await db.getUserByEmail(email)) {
      sendJson(res, 409, { error: 'Já existe uma conta com este e-mail.' }); return;
    }

    const user = await db.createUser({
      firstName,
      lastName,
      email,
      password,
      role: 'employee',
      companyId: null
    });

    sendJson(res, 201, { ok: true, user });
    return;
  }

  // ── POST /api/login ─────────────────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/login') {
    const body     = await parseBody(req);
    const email    = String(body.email    || '').trim().toLowerCase();
    const password = String(body.password || '').trim();
    if (!email || !password) { sendJson(res, 400, { error: 'Informe e-mail e senha.' }); return; }
    const user = await db.authenticateUser(email, password);
    if (!user) { sendJson(res, 401, { error: 'Credenciais inválidas.' }); return; }
    sendJson(res, 200, { ok: true, user });
    return;
  }

  // ── POST /api/tickets ───────────────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/tickets') {
    const body          = await parseBody(req);
    const subject       = String(body.subject       || '').trim();
    const description   = String(body.description   || '').trim();
    const category      = String(body.category      || 'Suporte técnico').trim();
    const priority      = String(body.priority      || 'Normal').trim();
    const requesterName = String(body.requesterName || '').trim();
    const companyName   = String(body.companyName   || '').trim();
    const email         = String(body.email         || '').trim();
    const phone         = String(body.phone         || '').trim();
    if (!subject || !description || !requesterName || !companyName || !email || !phone) {
      sendJson(res, 400, { error: 'Preencha os campos obrigatórios do chamado.' }); return;
    }
    const ticket = await db.createTicket({
      userId:    body.userId    || null,
      companyId: body.companyId || null,
      subject, description, category, priority, requesterName, companyName, email, phone
    });
    sendJson(res, 201, { ok: true, ticket });
    return;
  }

  // ── POST /api/tickets/:id/messages ──────────────────────────────────────────
  if (req.method === 'POST' && /^\/api\/tickets\/\d+\/messages$/.test(pathname)) {
    const ticketId = Number(pathname.split('/')[3]);
    const ticket   = await db.getTicketById(ticketId);
    if (!ticket) { sendJson(res, 404, { error: 'Chamado não encontrado.' }); return; }
    const body        = await parseBody(req);
    const bodyRole    = String(body.role || role || 'employee').trim();
    const bodyUserId  = body.userId    != null && body.userId    !== '' ? Number(body.userId)    : userId;
    const bodyCompany = body.companyId != null && body.companyId !== '' ? Number(body.companyId) : companyId;
    if (!canAccessTicket(ticket, bodyRole, bodyUserId, bodyCompany)) {
      sendJson(res, 403, { error: 'Acesso negado às mensagens deste chamado.' }); return;
    }
    const messageText = String(body.message || '').trim();
    if (!messageText) { sendJson(res, 400, { error: 'Informe uma mensagem.' }); return; }
    if (bodyRole === 'employee' && ticket.status === 'Resolvido') {
      sendJson(res, 403, { error: 'Este chamado foi finalizado.' }); return;
    }
    const senderName = String(body.senderName || '').trim() || (bodyRole === 'technician' ? 'Técnico WorldIT' : 'Cliente');
    const message = await db.addTicketMessage({
      ticketId,
      senderRole: bodyRole,
      senderName: senderName.slice(0, 120),
      message:    messageText.slice(0, 800)
    });
    sendJson(res, 201, { ok: true, message });
    return;
  }

  // ── POST /api/technicians ───────────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/technicians') {
    if (role !== 'admin') { sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' }); return; }
    const body      = await parseBody(req);
    const firstName = String(body.firstName || '').trim();
    const lastName  = String(body.lastName  || '').trim();
    const email     = String(body.email     || '').trim().toLowerCase();
    const password  = String(body.password  || '').trim();
    if (!firstName || !lastName || !email || !password) {
      sendJson(res, 400, { error: 'Preencha nome, sobrenome, e-mail e senha.' }); return;
    }
    if (await db.getUserByEmail(email)) {
      sendJson(res, 409, { error: 'Já existe um usuário com este e-mail.' }); return;
    }
    const technician = await db.createUser({ firstName, lastName, email, password, role: 'technician' });
    sendJson(res, 201, { ok: true, technician });
    return;
  }

  // ── DELETE /api/technicians/:id ─────────────────────────────────────────────
  if (req.method === 'DELETE' && /^\/api\/technicians\/\d+$/.test(pathname)) {
    if (role !== 'admin') { sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' }); return; }
    const techId  = Number(pathname.split('/').pop());
    const removed = await db.removeTechnicianById(techId);
    if (!removed) { sendJson(res, 404, { error: 'Técnico não encontrado.' }); return; }
    sendJson(res, 200, { ok: true, technician: removed });
    return;
  }

  // ── PATCH /api/tickets/:id ──────────────────────────────────────────────────
  if (req.method === 'PATCH' && /^\/api\/tickets\/\d+$/.test(pathname)) {
    const ticketId = Number(pathname.split('/').pop());
    const body     = await parseBody(req);
    const status   = String(body.status || '').trim();
    if (!status) { sendJson(res, 400, { error: 'Informe o novo status.' }); return; }
    const existing = await db.getTicketById(ticketId);
    if (!existing) { sendJson(res, 404, { error: 'Chamado não encontrado.' }); return; }
    if (!canAccessTicket(existing, role, userId, companyId)) {
      sendJson(res, 403, { error: 'Acesso negado para atualizar este chamado.' }); return;
    }
    const ticket = await db.updateTicketStatus(ticketId, status);
    if (existing.status !== 'Resolvido' && ticket.status === 'Resolvido') {
      await db.addTicketMessage({
        ticketId,
        senderRole: 'system',
        senderName: 'WorldIT',
        message: `Chamado finalizado em ${ticket.updatedAt}. O atendimento foi encerrado e permanece disponível apenas no histórico.`
      });

      let technicianEmail = null;
      if (role === 'technician' && userId) {
        const technicianUser = await db.getUserById(userId);
        if (technicianUser?.role === 'technician') {
          technicianEmail = technicianUser.email;
        }
      }

      const recipients = uniqueValidEmails(ticket.email, technicianEmail);
      try { await sendTicketResolvedEmail(ticket, { recipients }); }
      catch (error) { console.error('[mail] Falha ao enviar e-mail de encerramento:', error.message); }
    }
    sendJson(res, 200, { ok: true, ticket });
    return;
  }

  sendJson(res, 404, { error: 'Rota não encontrada.' });
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const requestUrl  = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = requestUrl;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (pathname.startsWith('/api/')) {
    routeApi(req, res, pathname).catch(error => {
      console.error('[api error]', error);
      sendJson(res, 500, { error: 'Erro interno do servidor.' });
    });
    return;
  }

  // Serve o app de suporte (com login) na raiz e mantém compatibilidade com /app.
  let normalizedPath = pathname;
  if (normalizedPath === '/app' || normalizedPath.startsWith('/app/')) {
    normalizedPath = normalizedPath.replace(/^\/app(?=\/|$)/, '') || '/';
  }

  let filePath = indexFile;
  if (normalizedPath !== '/') {
    const relativePath = normalizedPath.replace(/^\//, '');
    const resolved = relativePath.startsWith('img/')
      ? sanitizePathnameFrom(rootDir, relativePath)
      : sanitizePathname(relativePath);
    if (!resolved) { sendJson(res, 403, { error: 'Acesso negado.' }); return; }
    filePath = resolved;
  }

  if (!fs.existsSync(filePath)) filePath = indexFile;
  sendFile(res, filePath);
});

async function start() {
  try {
    await db.initSchema();
    await db.seedDatabase();
    server.listen(port, () => console.log(`Support center running at http://localhost:${port}`));
  } catch (error) {
    console.error('[startup]', error);
    process.exit(1);
  }
}

start();
