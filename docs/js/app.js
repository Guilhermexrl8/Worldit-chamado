function normalizeApiBase(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  let normalized = raw.replace(/\/+$/, '');
  if (!/\/api$/i.test(normalized)) {
    normalized = `${normalized}/api`;
  }
  return normalized;
}

function resolveApiBase() {
  const storageKey = 'support_api_base';

  const queryOverride = normalizeApiBase(new URLSearchParams(window.location.search).get('apiBase'));
  if (queryOverride) {
    try { window.localStorage.setItem(storageKey, queryOverride); } catch (_error) { /* ignore */ }
    return queryOverride;
  }

  const storedOverride = normalizeApiBase(window.localStorage?.getItem(storageKey));
  if (storedOverride) return storedOverride;

  const globalOverride = normalizeApiBase(window.SUPPORT_API_BASE);
  if (globalOverride) {
    try { window.localStorage.setItem(storageKey, globalOverride); } catch (_error) { /* ignore */ }
    return globalOverride;
  }

  const path = String(window.location.pathname || '');
  if (path.startsWith('/chamado/')) return '/chamado/api';
  return '/api';
}

const apiBase = resolveApiBase();
const worlditLogoUrl = String(window.location.pathname || '').startsWith('/chamado/')
  ? '/chamado/img/logo%20word.png'
  : '/img/logo%20word.png';

const authScreen        = document.getElementById('authScreen');
const companyScreen     = document.getElementById('appScreen');
const companyAdminScreen = document.getElementById('companyAdminScreen');
const techScreen        = document.getElementById('techScreen');
const adminScreen       = document.getElementById('adminScreen');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const companyRoleBtn = document.getElementById('companyRoleBtn');
const externalRoleBtn = document.getElementById('externalRoleBtn');
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
  brandLogo: document.getElementById('companyBrandLogo'),
  brandName: document.getElementById('companyBrandName'),
  brandSub: document.getElementById('companyBrandSub'),
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
  companyList: document.getElementById('adminCompanyList'),
  companyCount: document.getElementById('adminCompanyCount'),
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
  passwordHint: document.getElementById('adminPasswordHint'),
  companyForm: document.getElementById('adminCompanyForm'),
  companyName: document.getElementById('adminCompanyName'),
  companyFirstName: document.getElementById('adminCompanyFirstName'),
  companyLastName: document.getElementById('adminCompanyLastName'),
  companyEmail: document.getElementById('adminCompanyEmail'),
  companyLogoUrl: document.getElementById('adminCompanyLogoUrl'),
  companyLogoLookupBtn: document.getElementById('adminCompanyLogoLookupBtn'),
  companyPassword: document.getElementById('adminCompanyPassword'),
  companyHint: document.getElementById('adminCompanyHint'),
  companyEditForm: document.getElementById('adminCompanyEditForm'),
  editCompanyId: document.getElementById('adminEditCompanyId'),
  editCompanyName: document.getElementById('adminEditCompanyName'),
  editCompanyEmail: document.getElementById('adminEditCompanyEmail'),
  editCompanyPhone: document.getElementById('adminEditCompanyPhone'),
  editCompanyLogoUrl: document.getElementById('adminEditCompanyLogoUrl'),
  editCompanyLogoLookupBtn: document.getElementById('adminEditCompanyLogoLookupBtn'),
  editCompanyCancelBtn: document.getElementById('adminEditCompanyCancelBtn'),
  companyEditHint: document.getElementById('adminCompanyEditHint')
};

const caRefs = {
  userNameLabel:    document.getElementById('caUserNameLabel'),
  userAvatar:       document.getElementById('caUserAvatar'),
  brandLogo:        document.getElementById('caBrandLogo'),
  brandName:        document.getElementById('caBrandName'),
  brandSub:         document.getElementById('caBrandSub'),
  logoutBtn:        document.getElementById('caLogoutBtn'),
  tabTickets:       document.getElementById('caTabTickets'),
  tabEmployees:     document.getElementById('caTabEmployees'),
  ticketsSidebar:   document.getElementById('caTicketsSidebar'),
  employeesSidebar: document.getElementById('caEmployeesSidebar'),
  ticketsMain:      document.getElementById('caTicketsMain'),
  employeesMain:    document.getElementById('caEmployeesMain'),
  ticketInfo:       document.getElementById('caTicketInfo'),
  employeeInfo:     document.getElementById('caEmployeeInfo'),
  ticketList:       document.getElementById('caTicketList'),
  ticketCount:      document.getElementById('caTicketCount'),
  resolvedTicketList: document.getElementById('caResolvedTicketList'),
  resolvedTicketCount: document.getElementById('caResolvedTicketCount'),
  ticketTitleHeader: document.getElementById('caTicketTitleHeader'),
  ticketSummary:    document.getElementById('caTicketSummary'),
  ticketStatus:     document.getElementById('caTicketStatus'),
  messageBox:       document.getElementById('caMessageBox'),
  messageForm:      document.getElementById('caMessageForm'),
  messageInput:     document.getElementById('caMessageInput'),
  detailsList:      document.getElementById('caDetailsList'),
  employeeList:     document.getElementById('caEmployeeList'),
  employeeCount:    document.getElementById('caEmployeeCount'),
  employeeForm:     document.getElementById('caEmployeeForm'),
  empFirstName:     document.getElementById('caEmpFirstName'),
  empLastName:      document.getElementById('caEmpLastName'),
  empEmail:         document.getElementById('caEmpEmail'),
  empPassword:      document.getElementById('caEmpPassword'),
  empHint:          document.getElementById('caEmpHint'),
  empMessageBox:    document.getElementById('caEmpMessageBox'),
  empDetailsList:   document.getElementById('caEmployeeDetailsList')
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
  companies: [],
  employees: [],
  selectedTechnicianId: null,
  selectedEmployeeId: null,
  ticketMessages: {},
  selectedTicketId: null,
  authRole: 'company',
  activeRole: 'company',
  caTab: 'tickets',
  pollTimerId: null,
  pollInFlight: false
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
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  let payload = null;

  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const raw = await response.text();
    throw new Error(
      `A API retornou HTML em vez de JSON. Verifique rota/proxy do Nginx para ${apiBase}${path}.`
    );
  }

  if (!response.ok) {
    throw new Error(payload.error || 'Erro ao processar a requisição.');
  }

  return payload;
}

function setAuthRole(role) {
  state.authRole = role;
  companyRoleBtn.classList.toggle('active', role === 'company');
  externalRoleBtn.classList.toggle('active', role === 'external');
  technicianRoleBtn.classList.toggle('active', role === 'technician');
  adminRoleBtn.classList.toggle('active', role === 'admin');
  registerTab.classList.toggle('hidden', role !== 'external');
  openRegisterBtn.classList.toggle('hidden', role !== 'external');
  if (role !== 'external') {
    showAuth('login');
  }
}

function showAuth(mode = 'login') {
  authScreen.classList.remove('hidden');
  companyScreen.classList.add('hidden');
  companyAdminScreen.classList.add('hidden');
  techScreen.classList.add('hidden');
  adminScreen.classList.add('hidden');

  const isRegister = mode === 'register' && state.authRole === 'external';
  loginTab.classList.toggle('active', !isRegister);
  registerTab.classList.toggle('active', isRegister);
  loginForm.classList.toggle('hidden', isRegister);
  registerForm.classList.toggle('hidden', !isRegister);
}

function showWorkspace(role) {
  state.activeRole = role;
  authScreen.classList.add('hidden');
  companyScreen.classList.toggle('hidden',      role !== 'employee');
  companyAdminScreen.classList.toggle('hidden', role !== 'company_admin');
  techScreen.classList.toggle('hidden',         role !== 'technician');
  adminScreen.classList.toggle('hidden',        role !== 'admin');

  const fullName = state.currentUser?.fullName || (role === 'technician' ? 'Técnico' : role === 'admin' ? 'WorldIT Admin' : 'WorldIT');
  const avatar = initials(fullName);

  if (role === 'technician') {
    techRefs.userNameLabel.textContent = fullName;
    techRefs.userAvatar.textContent = avatar;
  } else if (role === 'admin') {
    adminRefs.userNameLabel.textContent = fullName;
    adminRefs.userAvatar.textContent = avatar;
  } else if (role === 'company_admin') {
    caRefs.userNameLabel.textContent = fullName;
    caRefs.userAvatar.textContent = avatar;
    applyCompanyBranding(caRefs, state.currentUser);
  } else {
    companyRefs.userNameLabel.textContent = fullName;
    companyRefs.userAvatar.textContent = avatar;
    applyCompanyBranding(companyRefs, state.currentUser);
  }
}

function applyCompanyBranding(refs, user) {
  if (!refs?.brandName || !refs?.brandSub || !refs?.brandLogo) return;

  const logoMark = refs.brandLogo.closest('.topbar-logo-mark');
  const companyName = String(user?.companyName || '').trim();
  const companyLogo = String(user?.companyLogo || '').trim();
  const logoToUse = companyLogo || worlditLogoUrl;

  refs.brandName.textContent = companyName || 'WorldIT';
  refs.brandSub.textContent = companyName ? 'Portal da empresa' : 'Soluções em Tecnologia';

  if (logoToUse) {
    refs.brandLogo.src = logoToUse;
    refs.brandLogo.alt = companyName ? `Logo da empresa ${companyName}` : 'Logo da WorldIT';
    refs.brandLogo.onerror = () => {
      refs.brandLogo.onerror = null;
      refs.brandLogo.classList.add('hidden');
      if (logoMark) logoMark.classList.remove('has-image');
    };
    refs.brandLogo.classList.remove('hidden');
    if (logoMark) logoMark.classList.add('has-image');
  } else {
    refs.brandLogo.removeAttribute('src');
    refs.brandLogo.classList.add('hidden');
    if (logoMark) logoMark.classList.remove('has-image');
  }
}

async function suggestCompanyLogo({ name, email }) {
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim();
  if (!trimmedName && !trimmedEmail) {
    return '';
  }

  try {
    const params = new URLSearchParams({ role: 'admin' });
    if (trimmedName) {
      params.set('name', trimmedName);
    }
    if (trimmedEmail) {
      params.set('email', trimmedEmail);
    }
    const response = await api(`/company-logo-suggest?${params.toString()}`);
    return String(response.logoUrl || '').trim();
  } catch (error) {
    return '';
  }
}

async function lookupAndFillCompanyLogo({ name, email, input, sourceLabel }) {
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim();

  if (!trimmedName && !trimmedEmail) {
    throw new Error('Informe o nome ou e-mail da empresa antes de buscar a logo.');
  }

  const logoUrl = await suggestCompanyLogo({ name: trimmedName, email: trimmedEmail });
  if (!logoUrl) {
    throw new Error('Não foi possível encontrar uma logo automaticamente para esta empresa.');
  }

  input.value = logoUrl;
  if (sourceLabel === 'create') {
    adminRefs.companyHint.textContent = 'Logo encontrada automaticamente. Você pode salvar o cadastro agora.';
  }
  if (sourceLabel === 'edit') {
    adminRefs.companyEditHint.textContent = 'Logo encontrada automaticamente. Clique em Salvar alterações para aplicar.';
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
  const role = state.currentUser?.role || state.activeRole || 'employee';
  const params = new URLSearchParams({ role });
  if (state.currentUser?.id) {
    params.set('userId', String(state.currentUser.id));
  }
  if (role === 'company_admin' && state.currentUser?.companyId) {
    params.set('companyId', String(state.currentUser.companyId));
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

  if (role === 'employee' && isResolvedTicket(ticket)) {
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

  const params = new URLSearchParams({
    role: state.currentUser?.role || state.activeRole || 'employee'
  });
  if (state.currentUser?.id) {
    params.set('userId', String(state.currentUser.id));
  }
  if (state.currentUser?.companyId) {
    params.set('companyId', String(state.currentUser.companyId));
  }

  return api(`/tickets/${ticket.id}?${params.toString()}`, {
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

function clearCompanyEditForm() {
  adminRefs.editCompanyId.value = '';
  adminRefs.companyEditForm.reset();
  adminRefs.companyEditHint.textContent = 'Nenhuma empresa selecionada para edição.';
}

function populateCompanyEditForm(company) {
  adminRefs.editCompanyId.value = String(company.id);
  adminRefs.editCompanyName.value = company.name || '';
  adminRefs.editCompanyEmail.value = company.email || '';
  adminRefs.editCompanyPhone.value = company.phone || '';
  adminRefs.editCompanyLogoUrl.value = company.logoUrl || '';
  adminRefs.companyEditHint.textContent = `Editando ${company.name}. Salve para aplicar as alterações.`;
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

async function removeCompany(company) {
  const confirmed = window.confirm(`Deseja excluir a empresa ${company.name}? Essa ação remove também usuários e chamados vinculados.`);
  if (!confirmed) {
    return;
  }

  const response = await api(`/companies/${company.id}?role=admin`, {
    method: 'DELETE'
  });

  if (Number(adminRefs.editCompanyId.value || 0) === company.id) {
    clearCompanyEditForm();
  }

  adminRefs.companyEditHint.textContent = `Empresa ${response.company.name} excluída com sucesso.`;
  await loadCompanies();
  toast('Empresa excluída com sucesso.');
}

function renderAdminView() {
  const technicians = state.technicians;
  const companies = state.companies;
  adminRefs.count.textContent = String(technicians.length);
  adminRefs.companyCount.textContent = String(companies.length);

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

  adminRefs.companyList.innerHTML = '';
  if (companies.length === 0) {
    adminRefs.companyList.innerHTML = '<div class="empty-state">Nenhuma empresa salva.</div>';
    return;
  }

  for (const company of companies) {
    const item = document.createElement('div');
    item.className = 'ticket-item admin-company-item';

    const main = document.createElement('div');
    main.className = 'admin-company-main';

    if (company.logoUrl) {
      const logoImg = document.createElement('img');
      logoImg.src = company.logoUrl;
      logoImg.alt = company.name;
      logoImg.className = 'admin-company-logo';
      logoImg.onerror = () => {
        const badge = document.createElement('div');
        badge.className = 'ticket-badge';
        badge.textContent = initials(company.name);
        logoImg.replaceWith(badge);
      };
      main.appendChild(logoImg);
    } else {
      const badge = document.createElement('div');
      badge.className = 'ticket-badge';
      badge.textContent = initials(company.name);
      main.appendChild(badge);
    }

    const meta = document.createElement('div');
    meta.className = 'ticket-meta';
    meta.innerHTML = `
      <strong>${escapeHtml(company.name)}</strong>
      <span>${escapeHtml(company.email || 'Sem e-mail cadastrado')}</span>
      <span>${escapeHtml(company.createdAt || '')}</span>
    `;

    main.appendChild(meta);
    item.appendChild(main);

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'admin-company-edit-btn';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => {
      populateCompanyEditForm(company);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'admin-company-delete-btn';
    deleteButton.textContent = 'Excluir';
    deleteButton.addEventListener('click', async () => {
      try {
        await removeCompany(company);
      } catch (error) {
        toast(error.message);
      }
    });

    item.appendChild(editButton);
    item.appendChild(deleteButton);

    adminRefs.companyList.appendChild(item);
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

  if (state.activeRole === 'company_admin') {
    renderCompanyAdminView();
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
  const role = state.currentUser?.role || state.activeRole || 'employee';
  const params = new URLSearchParams({ role });

  if (role === 'company_admin' && state.currentUser?.companyId) {
    params.set('companyId', String(state.currentUser.companyId));
  } else if (role !== 'technician' && role !== 'admin' && state.currentUser?.id) {
    params.set('userId', String(state.currentUser.id));
  }

  const response = await api(`/tickets?${params.toString()}`);
  state.tickets = response.tickets;
  const selectableTickets = role === 'employee'
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

async function loadCompanies() {
  const response = await api('/companies?role=admin');
  state.companies = response.companies || [];
  renderCurrentView();
}

async function loadEmployees() {
  if (!state.currentUser?.companyId) return;
  const cId = state.currentUser.companyId;
  const response = await api(`/companies/${cId}/employees?role=company_admin&companyId=${cId}`);
  state.employees = response.employees;
  renderCurrentView();
}

function stopRealtimePolling() {
  if (state.pollTimerId) {
    clearInterval(state.pollTimerId);
    state.pollTimerId = null;
  }
  state.pollInFlight = false;
}

async function refreshRealtimeData() {
  if (!state.currentUser) return;

  const selectedBefore = state.selectedTicketId;
  const role = state.currentUser.role;

  await loadTickets();

  if (selectedBefore && selectedBefore === state.selectedTicketId) {
    await loadTicketMessages(selectedBefore, true);
  }

  if (role === 'admin') {
    await loadTechnicians();
    await loadCompanies();
  }

  if (role === 'company_admin' && state.caTab === 'employees') {
    await loadEmployees();
  }
}

function startRealtimePolling() {
  stopRealtimePolling();

  if (!state.currentUser) return;

  state.pollTimerId = setInterval(async () => {
    if (!state.currentUser || document.hidden || state.pollInFlight) return;

    state.pollInFlight = true;
    try {
      await refreshRealtimeData();
    } catch (error) {
      console.warn('[poll] Falha ao atualizar dados em tempo real:', error.message);
    } finally {
      state.pollInFlight = false;
    }
  }, 3000);
}

loginTab.addEventListener('click', () => showAuth('login'));
registerTab.addEventListener('click', () => showAuth('register'));
companyRoleBtn.addEventListener('click', () => setAuthRole('company'));
externalRoleBtn.addEventListener('click', () => setAuthRole('external'));
technicianRoleBtn.addEventListener('click', () => setAuthRole('technician'));
adminRoleBtn.addEventListener('click', () => setAuthRole('admin'));
openRegisterBtn.addEventListener('click', () => showAuth('register'));
backToLoginBtn.addEventListener('click', () => showAuth('login'));
forgotLink.addEventListener('click', () => toast('Recuperação de senha pode ser integrada ao e-mail depois.'));

companyRefs.logoutBtn.addEventListener('click', () => {
  stopRealtimePolling();
  state.currentUser = null;
  state.activeRole = state.authRole;
  localStorage.removeItem('support_user');
  showAuth('login');
});

if (companyRefs.topLogoutBtn) {
  companyRefs.topLogoutBtn.addEventListener('click', () => {
    stopRealtimePolling();
    state.currentUser = null;
    state.activeRole = state.authRole;
    localStorage.removeItem('support_user');
    showAuth('login');
  });
}

techRefs.techLogoutBtn.addEventListener('click', () => {
  stopRealtimePolling();
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

    await sendMessageForSelectedTicket(message, 'employee');
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
  stopRealtimePolling();
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

adminRefs.companyForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const password = adminRefs.companyPassword.value.trim();
    if (!password) {
      throw new Error('Defina uma senha para o acesso da empresa.');
    }

    const companyName = adminRefs.companyName.value.trim();
    const companyEmail = adminRefs.companyEmail.value.trim();
    let logoUrl = adminRefs.companyLogoUrl.value.trim();
    if (!logoUrl) {
      logoUrl = await suggestCompanyLogo({ name: companyName, email: companyEmail });
      if (logoUrl) {
        adminRefs.companyLogoUrl.value = logoUrl;
      }
    }

    const response = await api('/company-access?role=admin', {
      method: 'POST',
      body: JSON.stringify({
        companyName,
        firstName: adminRefs.companyFirstName.value,
        lastName: adminRefs.companyLastName.value,
        email: companyEmail,
        logoUrl,
        password
      })
    });

    adminRefs.companyHint.textContent = logoUrl
      ? `Acesso da empresa ${response.company.name} criado para ${response.user.email}. Logo aplicada automaticamente.`
      : `Acesso da empresa ${response.company.name} criado para ${response.user.email}.`;
    adminRefs.companyForm.reset();
    await loadCompanies();
    toast('Acesso da empresa criado com sucesso.');
  } catch (error) {
    toast(error.message);
  }
});

adminRefs.companyLogoLookupBtn.addEventListener('click', async () => {
  try {
    await lookupAndFillCompanyLogo({
      name: adminRefs.companyName.value,
      email: adminRefs.companyEmail.value,
      input: adminRefs.companyLogoUrl,
      sourceLabel: 'create'
    });
    toast('Logo preenchida automaticamente.');
  } catch (error) {
    toast(error.message);
  }
});

adminRefs.companyEditForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const companyId = Number(adminRefs.editCompanyId.value || 0);
    if (!companyId) {
      throw new Error('Selecione uma empresa na lista para editar.');
    }

    const name = adminRefs.editCompanyName.value.trim();
    if (!name) {
      throw new Error('Informe o nome da empresa.');
    }

    const email = adminRefs.editCompanyEmail.value.trim();
    let logoUrl = adminRefs.editCompanyLogoUrl.value.trim();
    if (!logoUrl) {
      logoUrl = await suggestCompanyLogo({ name, email });
      if (logoUrl) {
        adminRefs.editCompanyLogoUrl.value = logoUrl;
      }
    }

    const response = await api(`/companies/${companyId}?role=admin`, {
      method: 'PATCH',
      body: JSON.stringify({
        name,
        email,
        phone: adminRefs.editCompanyPhone.value.trim(),
        logoUrl
      })
    });

    adminRefs.companyEditHint.textContent = `Empresa ${response.company.name} atualizada com sucesso.`;
    await loadCompanies();
    toast('Empresa atualizada com sucesso.');
  } catch (error) {
    toast(error.message);
  }
});

adminRefs.editCompanyLogoLookupBtn.addEventListener('click', async () => {
  try {
    await lookupAndFillCompanyLogo({
      name: adminRefs.editCompanyName.value,
      email: adminRefs.editCompanyEmail.value,
      input: adminRefs.editCompanyLogoUrl,
      sourceLabel: 'edit'
    });
    toast('Logo preenchida automaticamente.');
  } catch (error) {
    toast(error.message);
  }
});

adminRefs.editCompanyCancelBtn.addEventListener('click', () => {
  clearCompanyEditForm();
});

// ── Company Admin logout ──────────────────────────────────────────────────────
caRefs.logoutBtn.addEventListener('click', () => {
  stopRealtimePolling();
  state.currentUser = null;
  state.activeRole  = 'company';
  localStorage.removeItem('support_user');
  showAuth('login');
});

// ── Company Admin tab switch ──────────────────────────────────────────────────
function setCaTab(tab) {
  state.caTab = tab;
  caRefs.tabTickets.classList.toggle('active',   tab === 'tickets');
  caRefs.tabEmployees.classList.toggle('active', tab === 'employees');
  caRefs.ticketsSidebar.classList.toggle('hidden',   tab !== 'tickets');
  caRefs.employeesSidebar.classList.toggle('hidden', tab !== 'employees');
  caRefs.ticketsMain.classList.toggle('hidden',   tab !== 'tickets');
  caRefs.employeesMain.classList.toggle('hidden', tab !== 'employees');
  caRefs.ticketInfo.classList.toggle('hidden',    tab !== 'tickets');
  caRefs.employeeInfo.classList.toggle('hidden',  tab !== 'employees');
  renderCurrentView();
}

caRefs.tabTickets.addEventListener('click',   () => setCaTab('tickets'));
caRefs.tabEmployees.addEventListener('click', () => setCaTab('employees'));

// ── Company Admin render ──────────────────────────────────────────────────────
function renderEmployeeDetails(employee) {
  if (!employee) {
    caRefs.empMessageBox.innerHTML = '<div class="message-bubble system"><div class="author">Funcionários</div><p>Selecione um funcionário para ver os detalhes ou cadastre um novo.</p></div>';
    caRefs.empDetailsList.innerHTML = '';
    return;
  }

  const employeeTickets = state.tickets
    .filter(ticket => ticket.userId === employee.id)
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  const resolvedCount = employeeTickets.filter(isResolvedTicket).length;
  const openCount = employeeTickets.length - resolvedCount;
  const latestTicketsMarkup = employeeTickets.length === 0
    ? '<div class="detail-item"><strong>Histórico</strong><span>Nenhum chamado aberto por este funcionário até agora.</span></div>'
    : employeeTickets
        .slice(0, 5)
        .map(ticket => `
          <div class="detail-item">
            <strong>#${ticket.id} • ${escapeHtml(ticket.subject)}</strong>
            <span>${escapeHtml(ticket.status)} • ${escapeHtml(ticket.updatedAt)}</span>
          </div>
        `)
        .join('');

  caRefs.empMessageBox.innerHTML = `
    <div class="message-bubble system">
      <div class="author">Funcionário ativo</div>
      <p>${escapeHtml(employee.fullName)} está cadastrado e pode abrir chamados no portal.</p>
      <p>Total de chamados: ${employeeTickets.length} • Em andamento/abertos: ${openCount} • Resolvidos: ${resolvedCount}</p>
    </div>
  `;
  caRefs.empDetailsList.innerHTML = `
    <div class="detail-item"><strong>Nome</strong><span>${escapeHtml(employee.fullName)}</span></div>
    <div class="detail-item"><strong>E-mail</strong><span>${escapeHtml(employee.email)}</span></div>
    <div class="detail-item"><strong>Perfil</strong><span>Funcionário</span></div>
    <div class="detail-item"><strong>Cadastrado</strong><span>${escapeHtml(employee.createdAt)}</span></div>
    <div class="detail-item"><strong>Total de chamados</strong><span>${employeeTickets.length}</span></div>
    <div class="detail-item"><strong>Chamados ativos</strong><span>${openCount}</span></div>
    <div class="detail-item"><strong>Chamados resolvidos</strong><span>${resolvedCount}</span></div>
    ${latestTicketsMarkup}
  `;
}

function renderEmployeeTab() {
  const { employees } = state;
  caRefs.employeeCount.textContent = String(employees.length);
  caRefs.employeeList.innerHTML = '';

  if (employees.length === 0) {
    caRefs.employeeList.innerHTML = '<div class="empty-state">Nenhum funcionário cadastrado.</div>';
    renderEmployeeDetails(null);
    return;
  }

  for (const employee of employees) {
    const row       = document.createElement('div');
    row.className   = 'ticket-item admin-tech-item';

    const selectBtn = document.createElement('button');
    selectBtn.type  = 'button';
    selectBtn.className = 'admin-tech-select';
    selectBtn.innerHTML = `
      <div class="ticket-badge">${initials(employee.fullName)}</div>
      <div class="ticket-meta">
        <strong>${escapeHtml(employee.fullName)}</strong>
        <span>${escapeHtml(employee.email)}</span>
        <span>${escapeHtml(employee.createdAt)}</span>
      </div>
    `;
    selectBtn.addEventListener('click', () => {
      state.selectedEmployeeId = employee.id;
      renderEmployeeDetails(employee);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type  = 'button';
    removeBtn.className = 'admin-remove-btn';
    removeBtn.textContent = 'Remover';
    removeBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!window.confirm(`Remover o funcionário ${employee.fullName}?`)) return;
      try {
        const cId = state.currentUser.companyId;
        await api(`/employees/${employee.id}?role=company_admin&companyId=${cId}`, { method: 'DELETE' });
        await loadEmployees();
        toast('Funcionário removido com sucesso.');
      } catch (error) {
        toast(error.message);
      }
    });

    row.appendChild(selectBtn);
    row.appendChild(removeBtn);
    caRefs.employeeList.appendChild(row);
  }

  const selected = employees.find(e => e.id === state.selectedEmployeeId) || employees[0];
  state.selectedEmployeeId = selected?.id || null;
  renderEmployeeDetails(selected || null);
}

function renderTicketsTabCa() {
  const { tickets } = state;
  const activeTickets = tickets.filter(ticket => !isResolvedTicket(ticket));
  const resolvedTickets = tickets.filter(isResolvedTicket);

  caRefs.ticketCount.textContent = String(activeTickets.length);
  caRefs.resolvedTicketCount.textContent = String(resolvedTickets.length);
  renderTicketList(caRefs.ticketList, activeTickets, selectTicket);
  renderTicketList(caRefs.resolvedTicketList, resolvedTickets, selectTicket);

  const ticket = tickets.find(t => t.id === state.selectedTicketId) || null;
  if (!ticket) {
    caRefs.ticketTitleHeader.textContent = 'Selecione um chamado';
    caRefs.ticketSummary.textContent     = 'Acompanhe os chamados abertos pelos funcionários da sua empresa.';
    caRefs.messageBox.innerHTML          = '<div class="empty-state">Selecione um chamado para ver as mensagens.</div>';
    caRefs.detailsList.innerHTML         = '<div class="empty-state">Sem chamado selecionado.</div>';
    caRefs.messageInput.disabled         = true;
    return;
  }

  caRefs.ticketTitleHeader.textContent = `${ticket.subject} #${ticket.id}`;
  caRefs.ticketSummary.textContent     = `${ticket.category} • ${ticket.priority} • ${ticket.requesterName}`;
  setStatusPill(caRefs.ticketStatus, ticket.status);
  caRefs.messageInput.disabled = false;
  renderTicketMessages(caRefs.messageBox, ticket.id, 'company_admin');

  caRefs.detailsList.innerHTML = `
    <div class="detail-item"><strong>Chamado</strong><span>#${ticket.id}</span></div>
    <div class="detail-item"><strong>Status</strong><span>${ticket.status}</span></div>
    <div class="detail-item"><strong>Funcionário</strong><span>${escapeHtml(ticket.requesterName)}</span></div>
    <div class="detail-item"><strong>E-mail</strong><a href="mailto:${ticket.email}">${ticket.email}</a></div>
    <div class="detail-item"><strong>Categoria</strong><span>${ticket.category}</span></div>
    <div class="detail-item"><strong>Prioridade</strong><span>${ticket.priority}</span></div>
    <div class="detail-item"><strong>Criado</strong><span>${ticket.createdAt}</span></div>
    <div class="detail-item"><strong>Atualizado</strong><span>${ticket.updatedAt}</span></div>
  `;
}

function renderCompanyAdminView() {
  if (state.caTab === 'employees') {
    renderEmployeeTab();
  } else {
    renderTicketsTabCa();
  }
}

// ── Company Admin message form ────────────────────────────────────────────────
caRefs.messageForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const message = caRefs.messageInput.value.trim();
    if (!message) return;
    const ticket = state.tickets.find(t => t.id === state.selectedTicketId);
    if (!ticket) throw new Error('Selecione um chamado.');
    const cId = state.currentUser?.companyId;
    await api(`/tickets/${ticket.id}/messages?role=company_admin&companyId=${cId}`, {
      method: 'POST',
      body: JSON.stringify({
        role: 'company_admin',
        userId: state.currentUser?.id,
        companyId: cId,
        senderName: state.currentUser?.fullName || 'Admin da empresa',
        message
      })
    });
    caRefs.messageInput.value = '';
    await loadTicketMessages(ticket.id);
  } catch (error) {
    toast(error.message);
  }
});

// ── Company Admin employee form ───────────────────────────────────────────────
caRefs.employeeForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const password = caRefs.empPassword.value.trim();
    if (!password) throw new Error('Defina uma senha para o funcionário.');
    const cId = state.currentUser?.companyId;
    const response = await api(`/companies/${cId}/employees?role=company_admin&companyId=${cId}`, {
      method: 'POST',
      body: JSON.stringify({
        firstName: caRefs.empFirstName.value,
        lastName:  caRefs.empLastName.value,
        email:     caRefs.empEmail.value,
        password
      })
    });
    caRefs.empHint.textContent = `Acesso criado para ${response.employee.email} com a senha informada.`;
    caRefs.employeeForm.reset();
    await loadEmployees();
    toast('Funcionário cadastrado com sucesso.');
  } catch (error) {
    toast(error.message);
  }
});

(function boot() {
  if (state.currentUser) {
    const role = state.currentUser.role;
    state.activeRole = role;
    setAuthRole(role === 'company_admin' ? 'company' : role === 'employee' ? 'external' : role);
    showWorkspace(role);
    const loaders = [loadTickets()];
    if (role === 'admin') loaders.push(loadTechnicians(), loadCompanies());
    if (role === 'company_admin') loaders.push(loadEmployees());
    Promise.all(loaders)
      .then(() => startRealtimePolling())
      .catch(error => toast(error.message));
    return;
  }

  stopRealtimePolling();
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

    if (state.authRole === 'company' && response.user.role !== 'company_admin') {
      throw new Error('Use um acesso de empresa criado pelo admin WorldIT.');
    }

    if (state.authRole === 'external' && response.user.role !== 'employee') {
      throw new Error('Use uma conta de pessoa externa para esta aba.');
    }

    state.currentUser = response.user;
    const role = response.user.role;
    state.activeRole = role;
    localStorage.setItem('support_user', JSON.stringify(response.user));
    setAuthRole(role === 'company_admin' ? 'company' : role === 'employee' ? 'external' : role);
    showWorkspace(role);
    const loaders = [loadTickets()];
    if (role === 'admin') loaders.push(loadTechnicians(), loadCompanies());
    if (role === 'company_admin') loaders.push(loadEmployees());
    await Promise.all(loaders);
    startRealtimePolling();
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
        firstName:   fields.firstName.value,
        lastName:    fields.lastName.value,
        email:       fields.registerEmail.value,
        password:    fields.registerPassword.value
      })
    });

    state.currentUser = response.user;
    state.activeRole  = 'employee';
    localStorage.setItem('support_user', JSON.stringify(response.user));
    setAuthRole('external');
    showWorkspace('employee');
    await loadTickets();
    startRealtimePolling();
  } catch (error) {
    toast(error.message);
  }
});
