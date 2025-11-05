import { Resend } from "resend"

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  try {
    const fromEmail = from || process.env.FROM_EMAIL || "noreply@ikou.mz"

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error("Error sending email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}

/**
 * Send RSVP confirmation email with QR code
 */
export async function sendRSVPConfirmationEmail(
  userEmail: string,
  userName: string,
  event: any,
  rsvp: any,
  qrCodeDataUrl: string
) {
  const eventDate = new Date(event.start_date).toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const ticketName = rsvp.event_tickets?.name || "Entrada Gratuita"

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Inscrição</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">✓ Inscrição Confirmada!</h1>
  </div>

  <!-- Content -->
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Olá <strong>${userName}</strong>,
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Sua inscrição para <strong>${event.title}</strong> foi confirmada com sucesso! 🎉
    </p>

    <!-- Event Details Card -->
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">Detalhes do Evento</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">📅 Data:</td>
          <td style="padding: 8px 0; font-weight: 600;">${eventDate}</td>
        </tr>
        ${
          event.venue_name
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">📍 Local:</td>
          <td style="padding: 8px 0; font-weight: 600;">${event.venue_name}</td>
        </tr>
        ${event.address ? `<tr><td></td><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${event.address}</td></tr>` : ""}
        `
            : ""
        }
        ${
          event.external_url
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">🔗 Link:</td>
          <td style="padding: 8px 0;"><a href="${event.external_url}" style="color: #667eea; text-decoration: underline;">Acessar Evento</a></td>
        </tr>
        `
            : ""
        }
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">🎟️ Ingresso:</td>
          <td style="padding: 8px 0; font-weight: 600;">${ticketName}</td>
        </tr>
      </table>
    </div>

    <!-- QR Code -->
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="margin-top: 0; color: #667eea;">Seu QR Code de Entrada</h3>
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
        Apresente este código no evento para fazer check-in
      </p>
      <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 250px; height: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px;" />
    </div>

    <!-- Important Note -->
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Importante:</strong> Salve este email ou tire um print do QR code. Você precisará dele no dia do evento!
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-tickets"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Ver Meu Ingresso
      </a>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
      <p>
        Tem alguma dúvida? Responda este email ou visite nossa
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea;">central de ajuda</a>.
      </p>
      <p style="margin-top: 10px;">
        © ${new Date().getFullYear()} iKou - Plataforma de Eventos de Moçambique
      </p>
    </div>
  </div>

</body>
</html>
  `

  return sendEmail({
    to: userEmail,
    subject: `✓ Confirmação: ${event.title}`,
    html,
  })
}

/**
 * Send event reminder email
 */
export async function sendEventReminderEmail(
  userEmail: string,
  userName: string,
  event: any,
  hoursUntilEvent: number
) {
  const eventDate = new Date(event.start_date).toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const reminderText =
    hoursUntilEvent <= 1
      ? "O evento começa em menos de 1 hora!"
      : `O evento começa em ${hoursUntilEvent} horas!`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembrete de Evento</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">⏰ ${reminderText}</h1>
  </div>

  <!-- Content -->
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Olá <strong>${userName}</strong>,
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Não se esqueça: o evento <strong>${event.title}</strong> está chegando!
    </p>

    <!-- Event Details Card -->
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h2 style="margin-top: 0; color: #f59e0b; font-size: 20px;">${event.title}</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">📅 Data:</td>
          <td style="padding: 8px 0; font-weight: 600;">${eventDate}</td>
        </tr>
        ${
          event.venue_name
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">📍 Local:</td>
          <td style="padding: 8px 0; font-weight: 600;">${event.venue_name}</td>
        </tr>
        ${event.address ? `<tr><td></td><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${event.address}</td></tr>` : ""}
        `
            : ""
        }
        ${
          event.external_url
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">🔗 Link:</td>
          <td style="padding: 8px 0;"><a href="${event.external_url}" style="color: #f59e0b; text-decoration: underline;">Acessar Evento</a></td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <!-- CTA Buttons -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-tickets"
         style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 10px;">
        Ver Meu Ingresso
      </a>
      ${
        event.external_url
          ? `
      <br>
      <a href="${event.external_url}"
         style="display: inline-block; background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Entrar no Evento
      </a>
      `
          : ""
      }
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
      <p>
        Nos vemos lá! 🎉
      </p>
      <p style="margin-top: 10px;">
        © ${new Date().getFullYear()} iKou - Plataforma de Eventos de Moçambique
      </p>
    </div>
  </div>

</body>
</html>
  `

  return sendEmail({
    to: userEmail,
    subject: `⏰ Lembrete: ${event.title} ${hoursUntilEvent <= 1 ? "começa em breve" : `começa em ${hoursUntilEvent}h`}`,
    html,
  })
}

/**
 * Send event cancellation email
 */
export async function sendEventCancellationEmail(userEmail: string, userName: string, event: any, reason?: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evento Cancelado</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">Evento Cancelado</h1>
  </div>

  <!-- Content -->
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Olá <strong>${userName}</strong>,
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Lamentamos informar que o evento <strong>${event.title}</strong> foi cancelado.
    </p>

    ${
      reason
        ? `
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin-top: 0; color: #dc2626;">Motivo do Cancelamento:</h3>
      <p style="margin: 0;">${reason}</p>
    </div>
    `
        : ""
    }

    <p style="font-size: 16px;">
      Se você adquiriu um ingresso pago, o reembolso será processado automaticamente nos próximos dias úteis.
    </p>

    <p style="font-size: 16px;">
      Pedimos desculpas pelo inconveniente e esperamos vê-lo em nossos próximos eventos!
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/events"
         style="display: inline-block; background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Ver Outros Eventos
      </a>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
      <p>
        Tem alguma dúvida? Responda este email.
      </p>
      <p style="margin-top: 10px;">
        © ${new Date().getFullYear()} iKou - Plataforma de Eventos de Moçambique
      </p>
    </div>
  </div>

</body>
</html>
  `

  return sendEmail({
    to: userEmail,
    subject: `❌ Cancelado: ${event.title}`,
    html,
  })
}
