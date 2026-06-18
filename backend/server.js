const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const {
  authenticateUser,
  createTicket,
  createUser,
  getTicketById,
  getUserByEmail,
  addTicketMessage,
  listTicketMessages,
  listTickets,
  listTechnicians,
  removeTechnicianById,
  updateTicketStatus
} = require('./db');
const { sendTicketResolvedEmail } = require('./mailer');

const port = Number(process.env.PORT || 3000);
const frontendDir = path.join(__dirname, '..', 'frontend');
const indexFile = path.join(frontendDir, 'index.html');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
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
  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      sendJson(res, 404, { error: 'Arquivo não encontrado.' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(buffer);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sanitizePathname(requestPath) {
  const normalized = path.normalize(requestPath).replace(/^([/\\])+/, '');
  const resolved = path.join(frontendDir, normalized);
  if (!resolved.startsWith(frontendDir)) {
    return null;
  }

  return resolved;
}

function canAccessTicket(ticket, role, userId) {
  if (!ticket) {
    return false;
  }

  if (role === 'technician' || role === 'admin') {
    return true;
  }

  if (userId == null) {
    return true;
  }

  return ticket.userId === userId;
}

function routeApi(req, res, pathname) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const role = requestUrl.searchParams.get('role') || 'company';
  const userIdParam = requestUrl.searchParams.get('userId');
  const userId = userIdParam ? Number(userIdParam) : null;

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'support-center' });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/tickets') {
    sendJson(res, 200, { ok: true, tickets: listTickets({ userId, role }) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/technicians') {
    if (role !== 'admin') {
      sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' });
      return;
    }

    sendJson(res, 200, { ok: true, technicians: listTechnicians() });
    return;
  }

  if (req.method === 'GET' && /^\/api\/tickets\/\d+$/.test(pathname)) {
    const ticketId = Number(pathname.split('/').pop());
    const ticket = getTicketById(ticketId);
    if (!ticket) {
      sendJson(res, 404, { error: 'Chamado não encontrado.' });
      return;
    }

    if (!canAccessTicket(ticket, role, userId)) {
      sendJson(res, 403, { error: 'Acesso negado para visualizar este chamado.' });
      return;
    }

    sendJson(res, 200, { ok: true, ticket });
    return;
  }

  if (req.method === 'GET' && /^\/api\/tickets\/\d+\/messages$/.test(pathname)) {
    const ticketId = Number(pathname.split('/')[3]);
    const ticket = getTicketById(ticketId);
    if (!ticket) {
      sendJson(res, 404, { error: 'Chamado não encontrado.' });
      return;
    }

    if (!canAccessTicket(ticket, role, userId)) {
      sendJson(res, 403, { error: 'Acesso negado às mensagens deste chamado.' });
      return;
    }

    sendJson(res, 200, { ok: true, messages: listTicketMessages(ticketId) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/register') {
    parseBody(req)
      .then(body => {
        const firstName = String(body.firstName || '').trim();
        const lastName = String(body.lastName || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '').trim();

        if (!firstName || !lastName || !email || !password) {
          sendJson(res, 400, { error: 'Preencha todos os campos do cadastro.' });
          return;
        }

        if (getUserByEmail(email)) {
          sendJson(res, 409, { error: 'Já existe uma conta com este e-mail.' });
          return;
        }

        const user = createUser({ firstName, lastName, email, password, role: 'company' });
        sendJson(res, 201, { ok: true, user });
      })
      .catch(() => sendJson(res, 400, { error: 'Dados inválidos.' }));
    return;
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    parseBody(req)
      .then(body => {
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '').trim();

        if (!email || !password) {
          sendJson(res, 400, { error: 'Informe e-mail e senha.' });
          return;
        }

        const user = authenticateUser(email, password);
        if (!user) {
          sendJson(res, 401, { error: 'Credenciais inválidas.' });
          return;
        }

        sendJson(res, 200, { ok: true, user });
      })
      .catch(() => sendJson(res, 400, { error: 'Dados inválidos.' }));
    return;
  }

  if (req.method === 'POST' && pathname === '/api/tickets') {
    parseBody(req)
      .then(body => {
        const subject = String(body.subject || '').trim();
        const description = String(body.description || '').trim();
        const category = String(body.category || 'Suporte técnico').trim();
        const priority = String(body.priority || 'Normal').trim();
        const requesterName = String(body.requesterName || '').trim();
        const companyName = String(body.companyName || '').trim();
        const email = String(body.email || '').trim();
        const phone = String(body.phone || '').trim();

        if (!subject || !description || !requesterName || !companyName || !email || !phone) {
          sendJson(res, 400, { error: 'Preencha os campos obrigatórios do chamado.' });
          return;
        }

        const ticket = createTicket({
          userId: body.userId || null,
          subject,
          description,
          category,
          priority,
          requesterName,
          companyName,
          email,
          phone,
          status: 'Aberto'
        });

        sendJson(res, 201, { ok: true, ticket });
      })
      .catch(() => sendJson(res, 400, { error: 'Dados inválidos.' }));
    return;
  }

  if (req.method === 'POST' && /^\/api\/tickets\/\d+\/messages$/.test(pathname)) {
    parseBody(req)
      .then(body => {
        const ticketId = Number(pathname.split('/')[3]);
        const ticket = getTicketById(ticketId);
        if (!ticket) {
          sendJson(res, 404, { error: 'Chamado não encontrado.' });
          return;
        }

        const bodyRole = String(body.role || role || 'company').trim();
        const bodyUserId = body.userId != null && body.userId !== '' ? Number(body.userId) : userId;

        if (!canAccessTicket(ticket, bodyRole, bodyUserId)) {
          sendJson(res, 403, { error: 'Acesso negado às mensagens deste chamado.' });
          return;
        }

        const messageText = String(body.message || '').trim();
        if (!messageText) {
          sendJson(res, 400, { error: 'Informe uma mensagem.' });
          return;
        }

        const senderName = String(body.senderName || '').trim() || (bodyRole === 'technician' ? 'Técnico WorldIT' : 'Cliente');
        const message = addTicketMessage({
          ticketId,
          senderRole: bodyRole,
          senderName: senderName.slice(0, 120),
          message: messageText.slice(0, 800)
        });

        sendJson(res, 201, { ok: true, message });
      })
      .catch(() => sendJson(res, 400, { error: 'Dados inválidos.' }));
    return;
  }

  if (req.method === 'POST' && pathname === '/api/technicians') {
    if (role !== 'admin') {
      sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' });
      return;
    }

    parseBody(req)
      .then(body => {
        const firstName = String(body.firstName || '').trim();
        const lastName = String(body.lastName || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '').trim();

        if (!firstName || !lastName || !email || !password) {
          sendJson(res, 400, { error: 'Preencha nome, sobrenome, e-mail e senha.' });
          return;
        }

        if (getUserByEmail(email)) {
          sendJson(res, 409, { error: 'Já existe um usuário com este e-mail.' });
          return;
        }

        const technician = createUser({
          firstName,
          lastName,
          email,
          password,
          role: 'technician'
        });

        sendJson(res, 201, { ok: true, technician });
      })
      .catch(() => sendJson(res, 400, { error: 'Dados inválidos.' }));
    return;
  }

  if (req.method === 'DELETE' && /^\/api\/technicians\/\d+$/.test(pathname)) {
    if (role !== 'admin') {
      sendJson(res, 403, { error: 'Acesso permitido apenas para administrador.' });
      return;
    }

    const technicianId = Number(pathname.split('/').pop());
    const removedTechnician = removeTechnicianById(technicianId);

    if (!removedTechnician) {
      sendJson(res, 404, { error: 'Técnico não encontrado.' });
      return;
    }

    sendJson(res, 200, { ok: true, technician: removedTechnician });
    return;
  }

  if (req.method === 'PATCH' && pathname.startsWith('/api/tickets/')) {
    const ticketId = Number(pathname.split('/').pop());
    parseBody(req)
      .then(async body => {
        const status = String(body.status || '').trim();
        if (!status) {
          sendJson(res, 400, { error: 'Informe o novo status.' });
          return;
        }

        const existing = getTicketById(ticketId);
        if (!existing) {
          sendJson(res, 404, { error: 'Chamado não encontrado.' });
          return;
        }

        if (!canAccessTicket(existing, role, userId)) {
          sendJson(res, 403, { error: 'Acesso negado para atualizar este chamado.' });
          return;
        }

        const ticket = updateTicketStatus(ticketId, status);

        if (existing.status !== 'Resolvido' && ticket.status === 'Resolvido') {
          addTicketMessage({
            ticketId,
            senderRole: 'system',
            senderName: 'WorldIT',
            message: `Chamado finalizado em ${ticket.updatedAt}. O atendimento foi encerrado e permanece disponível apenas no histórico.`
          });

          try {
            await sendTicketResolvedEmail(ticket);
          } catch (error) {
            console.error('[mail] Falha ao enviar e-mail de encerramento:', error.message);
          }
        }

        sendJson(res, 200, { ok: true, ticket });
      })
      .catch(() => sendJson(res, 400, { error: 'Dados inválidos.' }));
    return;
  }

  sendJson(res, 404, { error: 'Rota não encontrada.' });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = requestUrl;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (pathname.startsWith('/api/')) {
    routeApi(req, res, pathname);
    return;
  }

  let filePath = indexFile;
  if (pathname !== '/') {
    const resolved = sanitizePathname(pathname.replace(/^\//, ''));
    if (!resolved) {
      sendJson(res, 403, { error: 'Acesso negado.' });
      return;
    }

    filePath = resolved;
  }

  if (!fs.existsSync(filePath)) {
    filePath = indexFile;
  }

  sendFile(res, filePath);
});

server.listen(port, () => {
  console.log(`Support center running at http://localhost:${port}`);
});
