const isGithubPages = /\.github\.io$/i.test(window.location.hostname);
const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';
const githubPagesMessage = 'Esta versao no GitHub Pages e apenas uma vitrine visual. Para usar login, cadastro e chamados, rode o backend localmente com npm run start.';

const authScreen = document.getElementById('authScreen');
const companyScreen = document.getElementById('appScreen');
const techScreen = document.getElementById('techScreen');
const adminScreen = document.getElementById('adminScreen');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const companyRoleBtn = document.getElementById('companyRoleBtn');
const technicianRoleBtn = document.getElementById('technicianRoleBtn');
const adminRoleBtn = document.getElementById('adminRoleBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const openRegisterBtn = document.getElementById('openRegisterBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const forgotLink = document.getElementById('forgotLink');

const companyRefs = {
  ticketList: document.getElementById('ticketList'),
  ticketCount: document.getElementById('ticketCount'),
  messageBox: document.getElementById('messageBox'),
  detailsList: document.getElementById('detailsList'),
  ticketForm: document.getElementById('ticketForm'),
  ticketTitleHeader: document.getElementById('ticketTitleHeader'),
  userNameLabel: document.getElementById('userNameLabel'),
  userAvatar: document.getElementById('userAvatar'),
  ticketStatus: document.getElementById('dashboardTicketStatus'),
  newTicketBtn: document.getElementById('newTicketBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  topLogoutBtn: document.getElementById('companyTopLogoutBtn'),
  ticketStatusSelect: document.getElementById('ticketStatusSelect'),
  messageForm: document.getElementById('companyMessageForm'),
  messageInput: document.getElementById('companyMessageInput')
};

const techRefs = {
  ticketList: document.getElementById('techTicketList'),
  ticketCount: document.getElementById('techTicketCount'),
  openCount: document.getElementById('techOpenCount'),
  progressCount: document.getElementById('techProgressCount'),
  closedCount: document.getElementById('techClosedCount'),
  resolvedTicketList: document.getElementById('techResolvedTicketList'),
  resolvedTicketCount: document.getElementById('techResolvedTicketCount'),
  messageBox: document.getElementById('techMessageBox'),
  detailsList: document.getElementById('techDetailsList'),
  ticketTitleHeader: document.getElementById('techTicketTitleHeader'),
  ticketSummary: document.getElementById('techTicketSummary'),
  userNameLabel: document.getElementById('techUserNameLabel'),
  userAvatar: document.getElementById('techUserAvatar'),
  ticketStatus: document.getElementById('techTicketStatus'),
  techLogoutBtn: document.getElementById('techLogoutBtn'),
  messageForm: document.getElementById('techMessageForm'),
  messageInput: document.getElementById('techMessageInput'),
  actionButtons: {
    open: document.getElementById('techOpenBtn'),
    progress: document.getElementById('techProgressBtn'),
    waiting: document.getElementById('techWaitingBtn'),
    closed: document.getElementById('techClosedBtn')
  }
};

const adminRefs = {
  list: document.getElementById('adminTechnicianList'),
  count: document.getElementById('adminTechnicianCount'),
  messageBox: document.getElementById('adminMessageBox'),
  detailsList: document.getElementById('adminDetailsList'),
  title: document.getElementById('adminTitle'),
  subtitle: document.getElementById('adminSubtitle'),
  userNameLabel: document.getElementById('adminUserNameLabel'),
  userAvatar: document.getElementById('adminUserAvatar'),
  logoutBtn: document.getElementById('adminLogoutBtn'),
  form: document.getElementById('adminTechnicianForm'),
  firstName: document.getElementById('adminFirstName'),
  lastName: document.getElementById('adminLastName'),
  email: document.getElementById('adminEmail'),
  password: document.getElementById('adminPassword'),
  passwordHint: document.getElementById('adminPasswordHint')
};

const fields = {
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  firstName: document.getElementById('firstName'),
  lastName: document.getElementById('lastName'),
  registerEmail: document.getElementById('registerEmail'),
  registerPassword: document.getElementById('registerPassword'),
  registerPasswordRepeat: document.getElementById('registerPasswordRepeat'),
  ticketSubject: document.getElementById('ticketSubject'),
  ticketCategory: document.getElementById('ticketCategory'),
  ticketPriority: document.getElementById('ticketPriority'),
  ticketCompany: document.getElementById('ticketCompany'),
  ticketRequester: document.getElementById('ticketRequester'),
  ticketEmail: document.getElementById('ticketEmail'),
  ticketPhone: document.getElementById('ticketPhone'),
  ticketDescription: document.getElementById('ticketDescription')
};

const state = {
  currentUser: JSON.parse(localStorage.getItem('support_user') || 'null'),
  tickets: [],
  technicians: [],
  selectedTechnicianId: null,
  ticketMessages: {},
  selectedTicketId: null,
  authRole: 'company',
  activeRole: 'company'
};

function initials(name) {
  return String(name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

function toast(message) {
  window.alert(message);
}

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function api(path, options = {}) {
  if (isGithubPages) {
    throw new Error(githubPagesMessage);
  }

  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Erro ao processar a requisição.');
  }

  return payload;
}

function setAuthRole(role) {
  state.authRole = role;
  companyRoleBtn.classList.toggle('active', role === 'company');
  technicianRoleBtn.classList.toggle('active', role === 'technician');
  adminRoleBtn.classList.toggle('active', role === 'admin');
  registerTab.classList.toggle('hidden', role !== 'company');
  openRegisterBtn.classList.toggle('hidden', role !== 'company');
  if (role !== 'company') {
    showAuth('login');
  }
}

function showAuth(mode = 'login') {
  authScreen.classList.remove('hidden');
  companyScreen.classList.add('hidden');
  techScreen.classList.add('hidden');
  adminScreen.classList.add('hidden');

  const isRegister = mode === 'register' && state.authRole === 'company';
  loginTab.classList.toggle('active', !isRegister);
  registerTab.classList.toggle('active', isRegister);
  loginForm.classList.toggle('hidden', isRegister);
  registerForm.classList.toggle('hidden', !isRegister);
}

function showWorkspace(role) {
  state.activeRole = role;
  authScreen.classList.add('hidden');
  companyScreen.classList.toggle('hidden', role !== 'company');
  techScreen.classList.toggle('hidden', role !== 'technician');
  adminScreen.classList.toggle('hidden', role !== 'admin');

  const fullName = state.currentUser?.fullName || (role === 'technician' ? 'Técnico' : role === 'admin' ? 'WorldIT Admin' : 'WorldIT');
  const avatar = initials(fullName);

  if (role === 'technician') {
    techRefs.userNameLabel.textContent = fullName;
    techRefs.userAvatar.textContent = avatar;
  } else if (role === 'admin') {
    adminRefs.userNameLabel.textContent = fullName;
    adminRefs.userAvatar.textContent = avatar;
  } else {
    companyRefs.userNameLabel.textContent = fullName;
    companyRefs.userAvatar.textContent = avatar;
  }
}

function getSelectedTicket() {
  return state.tickets.find(ticket => ticket.id === state.selectedTicketId) || null;
}

function ticketStatusConfig(status) {
  if (status === 'Aberto') {
    return { background: '#fff4d5', color: '#9b6b00' };
  }

  if (status === 'Em andamento') {
    return { background: '#e8f3ff', color: '#2165a2' };
  }

  if (status === 'Resolvido') {
    return { background: '#e8f5eb', color: '#24734d' };
  }

  return { background: '#eef1f4', color: '#5f7184' };
}

function setStatusPill(element, status) {
  const config = ticketStatusConfig(status);
  element.textContent = status;
  element.style.background = config.background;
  element.style.color = config.color;
}

function renderTicketList(container, tickets, onSelect) {
  container.innerHTML = '';

  if (tickets.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum chamado encontrado.</div>';
    return;
  }

  for (const ticket of tickets) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `ticket-item ${ticket.id === state.selectedTicketId ? 'active' : ''}`;
    button.innerHTML = `
      <div class="ticket-badge">${String(ticket.id).slice(-2)}</div>
      <div class="ticket-meta">
        <strong>${ticket.subject}</strong>
        <span>${ticket.requesterName}</span>
        <span>${ticket.updatedAt}</span>
      </div>
    `;
    button.addEventListener('click', () => onSelect(ticket.id));
    container.appendChild(button);
  }
}

function isResolvedTicket(ticket) {
  return ticket?.status === 'Resolvido';
}

function toggleCompanyTicketInputs(disabled) {
  const fieldsToToggle = [
    fields.ticketSubject,
    fields.ticketCategory,
    fields.ticketPriority,
    fields.ticketCompany,
    fields.ticketRequester,
    fields.ticketEmail,
    fields.ticketPhone,
    fields.ticketDescription,
    companyRefs.ticketStatusSelect
  ];

  for (const element of fieldsToToggle) {
    element.disabled = disabled;
  }
}

function renderTicketMessages(container, ticketId, ownRole) {
  const messages = state.ticketMessages[ticketId];

  if (!messages) {
    container.innerHTML = '<div class="empty-state">Carregando mensagens...</div>';
    return;
  }

  if (messages.length === 0) {
    container.innerHTML = '<div class="empty-state">Sem mensagens ainda. Envie a primeira atualização.</div>';
    return;
  }

  container.innerHTML = messages
    .map(message => {
      const bubbleClass = message.senderRole === ownRole ? 'message-bubble user' : 'message-bubble system';
      return `
        <div class="${bubbleClass}">
          <div class="author">${escapeHtml(message.senderName)} • ${escapeHtml(message.createdAt)}</div>
          <p>${escapeHtml(message.message)}</p>
        </div>
      `;
    })
    .join('');

  container.scrollTop = container.scrollHeight;
}

function getMessageQueryForCurrentRole() {
  const role = state.currentUser?.role || state.activeRole || 'company';
  const params = new URLSearchParams({ role });
  if (state.currentUser?.id) {
    params.set('userId', String(state.currentUser.id));
  }

  return params.toString();
}

async function loadTicketMessages(ticketId, rerender = true) {
  if (!ticketId) {
    return;
  }

  const response = await api(`/tickets/${ticketId}/messages?${getMessageQueryForCurrentRole()}`);
  state.ticketMessages[ticketId] = response.messages || [];

  if (rerender && state.selectedTicketId === ticketId) {
    renderCurrentView();
  }
}

async function sendMessageForSelectedTicket(text, role) {
  const ticket = getSelectedTicket();
  if (!ticket) {
    throw new Error('Selecione um chamado para enviar mensagem.');
  }

  if (role === 'company' && isResolvedTicket(ticket)) {
    throw new Error('Este chamado foi finalizado e agora está disponível apenas no histórico.');
  }

  const payload = {
    role,
    userId: state.currentUser?.id || null,
    senderName: state.currentUser?.fullName || (role === 'technician' ? 'Técnico WorldIT' : 'Cliente'),
    message: text
  };

  await api(`/tickets/${ticket.id}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  await loadTicketMessages(ticket.id);
}

function updateSelectedTicketStatus(status) {
  const ticket = getSelectedTicket();
  if (!ticket) {
    return Promise.resolve();
  }

  return api(`/tickets/${ticket.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }).then(response => {
    const index = state.tickets.findIndex(item => item.id === response.ticket.id);
    if (index !== -1) {
      state.tickets[index] = response.ticket;
    }
    return loadTickets();
  });
}

function renderCompanyView() {
  const tickets = state.tickets;
  const activeTickets = tickets.filter(ticket => !isResolvedTicket(ticket));

  companyRefs.ticketCount.textContent = String(activeTickets.length);
  renderTicketList(companyRefs.ticketList, activeTickets, selectTicket);

  const ticket = activeTickets.find(item => item.id === state.selectedTicketId) || null;
  if (!ticket) {
    companyRefs.messageBox.innerHTML = '<div class="empty-state">Abra um chamado para ver os detalhes aqui.</div>';
    companyRefs.detailsList.innerHTML = '<div class="empty-state">Sem informações para exibir.</div>';
    companyRefs.ticketTitleHeader.textContent = 'Aguarde a seleção de um chamado';
    companyRefs.ticketStatus.textContent = 'Aberto';
    companyRefs.messageInput.disabled = true;
    companyRefs.ticketForm.classList.remove('hidden');
    companyRefs.messageForm.classList.remove('hidden');
    toggleCompanyTicketInputs(false);
    return;
  }

  companyRefs.ticketTitleHeader.textContent = ticket.subject;
  setStatusPill(companyRefs.ticketStatus, ticket.status);

  companyRefs.messageInput.disabled = false;
  companyRefs.ticketForm.classList.remove('hidden');
  companyRefs.messageForm.classList.remove('hidden');
  renderTicketMessages(companyRefs.messageBox, ticket.id, 'company');
  toggleCompanyTicketInputs(false);

  companyRefs.detailsList.innerHTML = `
    <div class="detail-item"><strong>Chamado</strong><span>#${ticket.id}</span></div>
    <div class="detail-item"><strong>Visibilidade</strong><span>Privado</span></div>
    <div class="detail-item"><strong>Criado</strong><span>${ticket.createdAt}</span></div>
    <div class="detail-item"><strong>Atualizado</strong><span>${ticket.updatedAt}</span></div>
    <div class="detail-item"><strong>Categoria</strong><span>${ticket.category}</span></div>
    <div class="detail-item"><strong>Prioridade</strong><span>${ticket.priority}</span></div>
    <div class="detail-item"><strong>Solicitante</strong><span>${ticket.requesterName}</span></div>
    <div class="detail-item"><strong>Empresa</strong><span>${ticket.companyName}</span></div>
    <div class="detail-item"><strong>E-mail</strong><a href="mailto:${ticket.email}">${ticket.email}</a></div>
    <div class="detail-item"><strong>WhatsApp</strong><a href="#">${ticket.phone}</a></div>
  `;

  fields.ticketSubject.value = ticket.subject;
  fields.ticketCategory.value = ticket.category;
  fields.ticketPriority.value = ticket.priority;
  fields.ticketCompany.value = ticket.companyName;
  fields.ticketRequester.value = ticket.requesterName;
  fields.ticketEmail.value = ticket.email;
  fields.ticketPhone.value = ticket.phone;
  fields.ticketDescription.value = ticket.description;
  companyRefs.ticketStatusSelect.value = ticket.status;
}

function renderTechnicianView() {
  const tickets = state.tickets;
  const activeTickets = tickets.filter(ticket => !isResolvedTicket(ticket));
  const resolvedTickets = tickets.filter(isResolvedTicket);
  const openCount = activeTickets.filter(ticket => ticket.status === 'Aberto').length;
  const progressCount = activeTickets.filter(ticket => ticket.status === 'Em andamento').length;
  const closedCount = resolvedTickets.length;

  techRefs.ticketCount.textContent = String(activeTickets.length);
  techRefs.openCount.textContent = String(openCount);
  techRefs.progressCount.textContent = String(progressCount);
  techRefs.closedCount.textContent = String(closedCount);
  techRefs.resolvedTicketCount.textContent = String(resolvedTickets.length);

  renderTicketList(techRefs.ticketList, activeTickets, selectTicket);
  renderTicketList(techRefs.resolvedTicketList, resolvedTickets, selectTicket);

  const ticket = getSelectedTicket();
  if (!ticket) {
    techRefs.ticketTitleHeader.textContent = 'Selecione um chamado';
    techRefs.ticketSummary.textContent = 'Escolha um chamado na fila para atualizar o status, orientar o cliente e registrar o atendimento.';
    techRefs.messageBox.innerHTML = '<div class="empty-state">Sem chamado selecionado.</div>';
    techRefs.detailsList.innerHTML = '<div class="empty-state">Sem detalhes para exibir.</div>';
    techRefs.ticketStatus.textContent = 'Aberto';
    techRefs.messageInput.disabled = true;
    return;
  }

  techRefs.ticketTitleHeader.textContent = `${ticket.subject} #${ticket.id}`;
  techRefs.ticketSummary.textContent = `${ticket.category} • ${ticket.priority} • ${ticket.requesterName} (${ticket.companyName})`;
  setStatusPill(techRefs.ticketStatus, ticket.status);

  techRefs.messageInput.disabled = false;
  renderTicketMessages(techRefs.messageBox, ticket.id, 'technician');

  techRefs.detailsList.innerHTML = `
    <div class="detail-item"><strong>Chamado</strong><span>#${ticket.id}</span></div>
    <div class="detail-item"><strong>Status atual</strong><span>${ticket.status}</span></div>
    <div class="detail-item"><strong>Empresa</strong><span>${ticket.companyName}</span></div>
    <div class="detail-item"><strong>Solicitante</strong><span>${ticket.requesterName}</span></div>
    <div class="detail-item"><strong>E-mail</strong><a href="mailto:${ticket.email}">${ticket.email}</a></div>
    <div class="detail-item"><strong>WhatsApp</strong><a href="#">${ticket.phone}</a></div>
    <div class="detail-item"><strong>Categoria</strong><span>${ticket.category}</span></div>
    <div class="detail-item"><strong>Prioridade</strong><span>${ticket.priority}</span></div>
    <div class="detail-item"><strong>Criado</strong><span>${ticket.createdAt}</span></div>
    <div class="detail-item"><strong>Atualizado</strong><span>${ticket.updatedAt}</span></div>
  `;
}

function renderAdminTechnicianDetails(technician) {
  if (!technician) {
    adminRefs.title.textContent = 'Novo técnico';
    adminRefs.subtitle.textContent = 'Cadastre novos acessos para a equipe';
    adminRefs.messageBox.innerHTML = `
      <div class="message-bubble system">
        <div class="author">Equipe técnica</div>
        <p>Cadastre novos logins para a equipe WorldIT e entregue o acesso com senha individual.</p>
      </div>
    `;
    adminRefs.detailsList.innerHTML = '<div class="empty-state">Sem técnicos cadastrados no momento.</div>';
    return;
  }

  adminRefs.title.textContent = technician.fullName;
  adminRefs.subtitle.textContent = technician.email;
  adminRefs.messageBox.innerHTML = `
    <div class="message-bubble system">
      <div class="author">Técnico cadastrado</div>
      <p>${escapeHtml(technician.fullName)} está liberado para acessar o painel técnico.</p>
    </div>
  `;
  adminRefs.detailsList.innerHTML = `
    <div class="detail-item"><strong>Nome</strong><span>${escapeHtml(technician.fullName)}</span></div>
    <div class="detail-item"><strong>E-mail</strong><span>${escapeHtml(technician.email)}</span></div>
    <div class="detail-item"><strong>Perfil</strong><span>${escapeHtml(technician.role)}</span></div>
    <div class="detail-item"><strong>Criado</strong><span>${escapeHtml(technician.createdAt)}</span></div>
  `;
}

async function removeTechnician(technician) {
  const confirmed = window.confirm(`Deseja remover o técnico ${technician.fullName}?`);
  if (!confirmed) {
    return;
  }

  const response = await api(`/technicians/${technician.id}?role=admin`, {
    method: 'DELETE'
  });

  if (state.selectedTechnicianId === technician.id) {
    state.selectedTechnicianId = null;
  }

  adminRefs.passwordHint.textContent = `Técnico ${response.technician.email} removido com sucesso.`;
  await loadTechnicians();
  toast('Técnico removido com sucesso.');
}

function renderAdminView() {
  const technicians = state.technicians;
  adminRefs.count.textContent = String(technicians.length);

  adminRefs.list.innerHTML = '';
  if (technicians.length === 0) {
    adminRefs.list.innerHTML = '<div class="empty-state">Nenhum técnico cadastrado.</div>';
    renderAdminTechnicianDetails(null);
  } else {
    for (const technician of technicians) {
      const row = document.createElement('div');
      row.className = 'ticket-item admin-tech-item';

      const selectButton = document.createElement('button');
      selectButton.type = 'button';
      selectButton.className = 'admin-tech-select';
      selectButton.innerHTML = `
        <div class="ticket-badge">${initials(technician.fullName)}</div>
        <div class="ticket-meta">
          <strong>${escapeHtml(technician.fullName)}</strong>
          <span>${escapeHtml(technician.email)}</span>
          <span>${escapeHtml(technician.createdAt)}</span>
        </div>
      `;

      selectButton.addEventListener('click', () => {
        state.selectedTechnicianId = technician.id;
        renderAdminTechnicianDetails(technician);
      });

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'admin-remove-btn';
      removeButton.textContent = 'Remover';
      removeButton.addEventListener('click', async event => {
        event.stopPropagation();
        try {
          await removeTechnician(technician);
        } catch (error) {
          toast(error.message);
        }
      });

      row.appendChild(selectButton);
      row.appendChild(removeButton);
      adminRefs.list.appendChild(row);
    }

    const selectedTechnician = technicians.find(technician => technician.id === state.selectedTechnicianId) || technicians[0];
    state.selectedTechnicianId = selectedTechnician.id;
    renderAdminTechnicianDetails(selectedTechnician);
  }
}

function renderCurrentView() {
  if (state.activeRole === 'technician') {
    renderTechnicianView();
    return;
  }

  if (state.activeRole === 'admin') {
    renderAdminView();
    return;
  }

  renderCompanyView();
}

function selectTicket(id) {
  state.selectedTicketId = id;
  renderCurrentView();
  loadTicketMessages(id).catch(error => toast(error.message));
}

async function loadTickets() {
  const role = state.currentUser?.role || state.activeRole || 'company';
  const params = new URLSearchParams({ role });

  if (role !== 'technician' && state.currentUser?.id) {
    params.set('userId', String(state.currentUser.id));
  }

  const response = await api(`/tickets?${params.toString()}`);
  state.tickets = response.tickets;
  const selectableTickets = role === 'company'
    ? state.tickets.filter(ticket => !isResolvedTicket(ticket))
    : state.tickets;

  if (!state.selectedTicketId || !selectableTickets.some(ticket => ticket.id === state.selectedTicketId)) {
    state.selectedTicketId = selectableTickets[0]?.id || null;
  }

  renderCurrentView();

  if (state.selectedTicketId) {
    await loadTicketMessages(state.selectedTicketId, true);
  }
}

async function loadTechnicians() {
  const response = await api('/technicians?role=admin');
  state.technicians = response.technicians;
  renderCurrentView();
}

loginTab.addEventListener('click', () => showAuth('login'));
registerTab.addEventListener('click', () => showAuth('register'));
companyRoleBtn.addEventListener('click', () => setAuthRole('company'));
technicianRoleBtn.addEventListener('click', () => setAuthRole('technician'));
adminRoleBtn.addEventListener('click', () => setAuthRole('admin'));
openRegisterBtn.addEventListener('click', () => showAuth('register'));
backToLoginBtn.addEventListener('click', () => showAuth('login'));
forgotLink.addEventListener('click', () => toast('Recuperação de senha pode ser integrada ao e-mail depois.'));

companyRefs.logoutBtn.addEventListener('click', () => {
  state.currentUser = null;
  state.activeRole = state.authRole;
  localStorage.removeItem('support_user');
  showAuth('login');
});

if (companyRefs.topLogoutBtn) {
  companyRefs.topLogoutBtn.addEventListener('click', () => {
    state.currentUser = null;
    state.activeRole = state.authRole;
    localStorage.removeItem('support_user');
    showAuth('login');
  });
}

techRefs.techLogoutBtn.addEventListener('click', () => {
  state.currentUser = null;
  state.activeRole = state.authRole;
  localStorage.removeItem('support_user');
  showAuth('login');
});

companyRefs.newTicketBtn.addEventListener('click', () => {
  if (isResolvedTicket(getSelectedTicket())) {
    state.selectedTicketId = null;
    renderCurrentView();
  }

  fields.ticketSubject.focus();
});

companyRefs.messageForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const message = companyRefs.messageInput.value.trim();
    if (!message) {
      return;
    }

    await sendMessageForSelectedTicket(message, 'company');
    companyRefs.messageInput.value = '';
    companyRefs.messageInput.focus();
  } catch (error) {
    toast(error.message);
  }
});

companyRefs.ticketStatusSelect.addEventListener('change', async () => {
  try {
    await updateSelectedTicketStatus(companyRefs.ticketStatusSelect.value);
  } catch (error) {
    toast(error.message);
  }
});

companyRefs.ticketForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const response = await api('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        userId: state.currentUser?.id || null,
        subject: fields.ticketSubject.value,
        description: fields.ticketDescription.value,
        category: fields.ticketCategory.value,
        priority: fields.ticketPriority.value,
        requesterName: fields.ticketRequester.value,
        companyName: fields.ticketCompany.value,
        email: fields.ticketEmail.value,
        phone: fields.ticketPhone.value
      })
    });

    state.selectedTicketId = response.ticket.id;
    await loadTickets();
    toast(`Chamado #${response.ticket.id} aberto com sucesso.`);
  } catch (error) {
    toast(error.message);
  }
});

techRefs.actionButtons.open.addEventListener('click', async () => {
  try {
    await updateSelectedTicketStatus('Aberto');
  } catch (error) {
    toast(error.message);
  }
});

techRefs.actionButtons.progress.addEventListener('click', async () => {
  try {
    await updateSelectedTicketStatus('Em andamento');
  } catch (error) {
    toast(error.message);
  }
});

techRefs.actionButtons.waiting.addEventListener('click', async () => {
  try {
    await updateSelectedTicketStatus('Aguardando cliente');
  } catch (error) {
    toast(error.message);
  }
});

techRefs.actionButtons.closed.addEventListener('click', async () => {
  try {
    await updateSelectedTicketStatus('Resolvido');
  } catch (error) {
    toast(error.message);
  }
});

techRefs.messageForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const message = techRefs.messageInput.value.trim();
    if (!message) {
      return;
    }

    await sendMessageForSelectedTicket(message, 'technician');
    techRefs.messageInput.value = '';
    techRefs.messageInput.focus();
  } catch (error) {
    toast(error.message);
  }
});

adminRefs.logoutBtn.addEventListener('click', () => {
  state.currentUser = null;
  state.activeRole = state.authRole;
  localStorage.removeItem('support_user');
  showAuth('login');
});

adminRefs.form.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const password = adminRefs.password.value.trim();
    if (!password) {
      throw new Error('Defina uma senha para o novo técnico.');
    }

    const response = await api('/technicians?role=admin', {
      method: 'POST',
      body: JSON.stringify({
        firstName: adminRefs.firstName.value,
        lastName: adminRefs.lastName.value,
        email: adminRefs.email.value,
        password
      })
    });

    adminRefs.passwordHint.textContent = `Acesso criado para ${response.technician.email} com a senha informada.`;
    adminRefs.form.reset();
    await loadTechnicians();
    toast('Técnico criado com sucesso.');
  } catch (error) {
    toast(error.message);
  }
});

(function boot() {
  if (isGithubPages) {
    localStorage.removeItem('support_user');
    state.currentUser = null;
    setAuthRole('company');
    showAuth('login');
    toast(githubPagesMessage);
    return;
  }

  if (state.currentUser) {
    state.activeRole = state.currentUser.role === 'technician' ? 'technician' : state.currentUser.role === 'admin' ? 'admin' : 'company';
    setAuthRole(state.activeRole);
    showWorkspace(state.activeRole);
    const loaders = [loadTickets()];
    if (state.activeRole === 'admin') {
      loaders.push(loadTechnicians());
    }
    Promise.all(loaders).catch(error => toast(error.message));
    return;
  }

  setAuthRole('company');
  showAuth('login');
})();

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const response = await api('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: fields.loginEmail.value,
        password: fields.loginPassword.value
      })
    });

    if (state.authRole === 'technician' && response.user.role !== 'technician') {
      throw new Error('Entre com uma conta de técnico para acessar este painel.');
    }

    if (state.authRole === 'admin' && response.user.role !== 'admin') {
      throw new Error('Entre com uma conta de administrador para acessar este painel.');
    }

    state.currentUser = response.user;
    state.activeRole = response.user.role === 'technician' ? 'technician' : response.user.role === 'admin' ? 'admin' : 'company';
    localStorage.setItem('support_user', JSON.stringify(response.user));
    setAuthRole(state.activeRole);
    showWorkspace(state.activeRole);
    await loadTickets();
    if (state.activeRole === 'admin') {
      await loadTechnicians();
    }
  } catch (error) {
    toast(error.message);
  }
});

registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    if (fields.registerPassword.value !== fields.registerPasswordRepeat.value) {
      throw new Error('As senhas informadas não coincidem.');
    }

    const response = await api('/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: fields.firstName.value,
        lastName: fields.lastName.value,
        email: fields.registerEmail.value,
        password: fields.registerPassword.value
      })
    });

    state.currentUser = response.user;
    state.activeRole = 'company';
    localStorage.setItem('support_user', JSON.stringify(response.user));
    setAuthRole('company');
    showWorkspace('company');
    await loadTickets();
  } catch (error) {
    toast(error.message);
  }
});
