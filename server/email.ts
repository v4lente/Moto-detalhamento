// Email service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendNewCustomerNotification(
  adminEmails: string[],
  customerData: { name: string; email: string | null; phone: string }
) {
  if (adminEmails.length === 0) {
    console.log('No admin emails to notify');
    return;
  }

  try {
    const { client, fromEmail } = await getResendClient();
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #d4ff00; background: #1a1a1a; padding: 20px; margin: 0; border-radius: 8px 8px 0 0;">
          🏍️ Novo Cliente Cadastrado
        </h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Nome:</strong> ${customerData.name}</p>
          <p><strong>Email:</strong> ${customerData.email || 'Não informado'}</p>
          <p><strong>Telefone:</strong> ${customerData.phone}</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Data do cadastro: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    `;

    await client.emails.send({
      from: fromEmail || 'Daniel Valente Moto <onboarding@resend.dev>',
      to: adminEmails,
      subject: `🏍️ Novo cliente cadastrado: ${customerData.name}`,
      html: emailHtml
    });

    console.log('Email notification sent to admins:', adminEmails);
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}
