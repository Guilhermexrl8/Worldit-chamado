const nodemailer = require('nodemailer');

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getMailerConfig() {
  return {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'suporte@worldit.com'
  };
}

function canSendMail(config) {
  return Boolean(config.host && config.user && config.pass);
}

function buildResolvedMessage(ticket) {
  const greetingName = ticket.requesterName || 'cliente';
  const ticketNumber = `#${ticket.id}`;
  const safeName = escapeHtml(greetingName);
  const safeSubject = escapeHtml(ticket.subject);
  const safeCompany = escapeHtml(ticket.companyName || 'sua empresa');

  return {
    subject: `WorldIT - Chamado ${ticketNumber} finalizado com sucesso`,
    text: [
      `Olá, ${greetingName}.`,
      '',
      `Seu chamado ${ticketNumber} foi finalizado com sucesso pela equipe WorldIT.`,
      `Assunto: ${ticket.subject}`,
      `Empresa: ${ticket.companyName || 'N/A'}`,
      '',
      'O atendimento agora permanece disponível apenas no histórico do portal.',
      'Caso ainda precise de ajuda, abra um novo chamado.',
      '',
      'Atenciosamente,',
      'Equipe WorldIT'
    ].join('\n'),
    html: `
      <div style="margin:0;padding:32px 0;background:#edf4f4;font-family:Arial,Helvetica,sans-serif;color:#102226;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 18px 42px rgba(7,31,35,0.12);">
          <div style="padding:28px 32px;background:linear-gradient(135deg,#071f23 0%,#0f6b63 70%,#13b1a9 100%);color:#ffffff;">
            <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,0.12);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">WorldIT</div>
            <h1 style="margin:18px 0 8px;font-size:28px;line-height:1.1;">Chamado finalizado com sucesso</h1>
            <p style="margin:0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.92);">Seu atendimento foi encerrado e ficou salvo no histórico do portal para consulta futura.</p>
          </div>

          <div style="padding:30px 32px;">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Olá, <strong>${safeName}</strong>.</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">O chamado <strong>${ticketNumber}</strong> foi concluído pela equipe WorldIT.</p>

            <div style="padding:18px 20px;border-radius:18px;background:#f5faf9;border:1px solid #d7ebe8;">
              <div style="margin-bottom:10px;font-size:13px;font-weight:700;color:#0f6b63;text-transform:uppercase;letter-spacing:0.06em;">Resumo do atendimento</div>
              <div style="font-size:15px;line-height:1.8;">
                <div><strong>Chamado:</strong> ${ticketNumber}</div>
                <div><strong>Assunto:</strong> ${safeSubject}</div>
                <div><strong>Empresa:</strong> ${safeCompany}</div>
                <div><strong>Status:</strong> Finalizado</div>
              </div>
            </div>

            <div style="margin-top:22px;padding:18px 20px;border-radius:18px;background:#fff7df;border:1px solid #f2df9b;">
              <div style="font-size:15px;line-height:1.7;color:#5f4b09;">
                O atendimento agora permanece disponível apenas no histórico do portal. Se precisar de um novo suporte, basta abrir outro chamado.
              </div>
            </div>

            <p style="margin:26px 0 0;font-size:15px;line-height:1.7;">Atenciosamente,<br /><strong>Equipe WorldIT</strong></p>
          </div>
        </div>
      </div>
    `
  };
}

async function sendTicketResolvedEmail(ticket) {
  const config = getMailerConfig();
  if (!canSendMail(config)) {
    console.log('[mail] SMTP não configurado. E-mail não enviado para:', ticket.email);
    return { sent: false, skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  const message = buildResolvedMessage(ticket);
  const info = await transporter.sendMail({
    from: config.from,
    to: ticket.email,
    subject: message.subject,
    text: message.text,
    html: message.html
  });

  return { sent: true, messageId: info.messageId };
}

module.exports = {
  sendTicketResolvedEmail
};
