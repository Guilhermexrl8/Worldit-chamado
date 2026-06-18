# WorldIT - Sistema de Chamados

## Envio de e-mail no encerramento

Quando o chamado muda para `Resolvido`, o backend tenta enviar e-mail automaticamente para o cliente.

Configure as variáveis de ambiente SMTP antes de iniciar:

```
SMTP_HOST=smtp.seuprovedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=suporte@worldit.com
SMTP_PASS=sua-senha-forte
SMTP_FROM=WorldIT Suporte <suporte@worldit.com>
```

No PowerShell (sessão atual):

```
$env:SMTP_HOST="smtp.seuprovedor.com"
$env:SMTP_PORT="587"
$env:SMTP_SECURE="false"
$env:SMTP_USER="suporte@worldit.com"
$env:SMTP_PASS="sua-senha-forte"
$env:SMTP_FROM="WorldIT Suporte <suporte@worldit.com>"
node backend/server.js
```

Se SMTP não estiver configurado, o sistema não quebra: ele apenas registra no log que o e-mail foi ignorado.
