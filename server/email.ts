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

export async function sendAppointmentRequestNotification(
  adminEmails: string[],
  appointmentData: {
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    vehicleInfo: string;
    serviceDescription: string;
    preferredDate: Date;
  }
) {
  if (adminEmails.length === 0) {
    console.log('No admin emails to notify');
    return;
  }

  try {
    const { client, fromEmail } = await getResendClient();
    
    const formattedDate = new Date(appointmentData.preferredDate).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #d4ff00; background: #1a1a1a; padding: 20px; margin: 0; border-radius: 8px 8px 0 0;">
          📅 Novo Pré-Agendamento de Serviço
        </h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Cliente:</strong> ${appointmentData.customerName}</p>
          <p><strong>Telefone:</strong> ${appointmentData.customerPhone}</p>
          <p><strong>Email:</strong> ${appointmentData.customerEmail || 'Não informado'}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
          <p><strong>Veículo:</strong> ${appointmentData.vehicleInfo}</p>
          <p><strong>Serviço Solicitado:</strong> ${appointmentData.serviceDescription}</p>
          <p><strong>Data Preferencial:</strong> ${formattedDate}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
          <p style="color: #e74c3c; font-weight: bold;">
            ⚠️ Este é um PRÉ-AGENDAMENTO. É necessário analisar a moto antes de confirmar a data e valor.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Data da solicitação: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    `;

    await client.emails.send({
      from: fromEmail || 'Daniel Valente Moto <onboarding@resend.dev>',
      to: adminEmails,
      subject: `📅 Novo pré-agendamento: ${appointmentData.customerName} - ${appointmentData.vehicleInfo}`,
      html: emailHtml
    });

    console.log('Appointment notification sent to admins:', adminEmails);
  } catch (error) {
    console.error('Failed to send appointment notification:', error);
  }
}

export async function sendAppointmentStatusUpdateNotification(
  customerEmail: string,
  appointmentData: {
    customerName: string;
    vehicleInfo: string;
    newStatus: string;
    confirmedDate?: Date | null;
    adminNotes?: string | null;
    estimatedPrice?: number | null;
  }
) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const statusLabels: Record<string, string> = {
      pre_agendamento: 'Pré-Agendamento (Aguardando Análise)',
      agendado_nao_iniciado: 'Agendamento Confirmado',
      em_andamento: 'Serviço em Andamento',
      concluido: 'Serviço Concluído',
      cancelado: 'Agendamento Cancelado'
    };
    
    const statusLabel = statusLabels[appointmentData.newStatus] || appointmentData.newStatus;
    const confirmedDateStr = appointmentData.confirmedDate 
      ? new Date(appointmentData.confirmedDate).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })
      : null;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #d4ff00; background: #1a1a1a; padding: 20px; margin: 0; border-radius: 8px 8px 0 0;">
          🏍️ Atualização do seu Agendamento
        </h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Olá <strong>${appointmentData.customerName}</strong>,</p>
          <p>O status do seu agendamento foi atualizado:</p>
          <p style="font-size: 18px; color: #1a1a1a; background: #d4ff00; padding: 10px; border-radius: 4px; text-align: center;">
            <strong>${statusLabel}</strong>
          </p>
          <p><strong>Veículo:</strong> ${appointmentData.vehicleInfo}</p>
          ${confirmedDateStr ? `<p><strong>Data Confirmada:</strong> ${confirmedDateStr}</p>` : ''}
          ${appointmentData.estimatedPrice ? `<p><strong>Valor Estimado:</strong> R$ ${appointmentData.estimatedPrice.toFixed(2)}</p>` : ''}
          ${appointmentData.adminNotes ? `<p><strong>Observações:</strong> ${appointmentData.adminNotes}</p>` : ''}
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Daniel Valente Moto Detalhamento
          </p>
        </div>
      </div>
    `;

    await client.emails.send({
      from: fromEmail || 'Daniel Valente Moto <onboarding@resend.dev>',
      to: [customerEmail],
      subject: `🏍️ Atualização do agendamento: ${statusLabel}`,
      html: emailHtml
    });

    console.log('Status update notification sent to customer:', customerEmail);
  } catch (error) {
    console.error('Failed to send status update notification:', error);
  }
}
