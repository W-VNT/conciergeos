import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

interface InvitationEmailData {
  email: string;
  inviteeName: string | null;
  organisationName: string;
  inviterName: string;
  invitationUrl: string;
  role: string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  try {
    const { email, inviteeName, organisationName, inviterName, invitationUrl, role } = data;

    const roleLabel = role === "ADMIN" ? "Administrateur" : "Opérateur";
    const greeting = inviteeName ? `Bonjour ${inviteeName},` : "Bonjour,";

    await getResend().emails.send({
      from: "ConciergeOS <noreply@classazur.fr>",
      to: email,
      subject: `🏠 ${inviterName} vous invite à rejoindre ${organisationName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation à rejoindre ${organisationName}</title>
          </head>
          <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <!-- Wrapper avec fond clair -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <!-- Container principal -->
                  <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); max-width: 480px; border: 1px solid #e5e5e5;">

                    <!-- Header avec logo -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #0f0f0f 0%, #1f1f1f 100%); padding: 40px 30px; text-align: center;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <!-- Logo icon SVG -->
                              <div style="margin-bottom: 16px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 32 32" style="display: inline-block;">
                                  <rect width="32" height="32" rx="7" fill="#ffffff" fill-opacity="0.12"/>
                                  <g transform="translate(4, 4)" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none">
                                    <path d="M10 12h4"/>
                                    <path d="M10 8h4"/>
                                    <path d="M14 21v-3a2 2 0 0 0-4 0v3"/>
                                    <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/>
                                    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
                                  </g>
                                </svg>
                              </div>
                              <h1 style="color: white; margin: 0 0 8px 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">ConciergeOS</h1>
                              <p style="color: rgba(255, 255, 255, 0.6); margin: 0; font-size: 14px; font-weight: 400;">Gestion de conciergerie nouvelle génération</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Corps du message -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <!-- Badge invitation -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding-bottom: 30px;">
                              <div style="background: linear-gradient(135deg, #171717 0%, #262626 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); display: inline-block;">
                                ✨ Nouvelle invitation
                              </div>
                            </td>
                          </tr>
                        </table>

                        <h2 style="color: #0a0a0a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center; line-height: 1.3;">
                          Rejoignez l'équipe<br>
                          <span style="color: #171717;">${organisationName}</span>
                        </h2>

                        <p style="font-size: 17px; color: #525252; line-height: 1.7; margin: 0 0 10px 0; text-align: center;">
                          ${greeting}
                        </p>

                        <p style="font-size: 17px; color: #525252; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
                          <strong style="color: #171717;">${inviterName}</strong> vous a invité(e) à collaborer sur ConciergeOS
                        </p>

                        <!-- Card informations -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-radius: 12px; border: 2px solid #e5e5e5; margin: 30px 0;">
                          <tr>
                            <td style="padding: 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding: 8px 0;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td width="32">
                                          <span style="font-size: 20px;">👤</span>
                                        </td>
                                        <td>
                                          <div style="color: #737373; font-size: 14px; margin-bottom: 4px;">Rôle attribué</div>
                                          <div style="color: #171717; font-size: 16px; font-weight: 600;">${roleLabel}</div>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 16px 0 8px 0;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td width="32">
                                          <span style="font-size: 20px;">🏢</span>
                                        </td>
                                        <td>
                                          <div style="color: #737373; font-size: 14px; margin-bottom: 4px;">Organisation</div>
                                          <div style="color: #171717; font-size: 16px; font-weight: 600;">${organisationName}</div>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 40px 0;">
                              <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #171717 0%, #0a0a0a 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                                Accepter l'invitation →
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Lien alternatif -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafafa; border-radius: 8px; border-left: 4px solid #171717; margin: 40px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <p style="margin: 0 0 8px 0; color: #525252; font-size: 13px; font-weight: 600;">Lien d'activation direct :</p>
                              <p style="margin: 0; font-size: 12px; color: #737373; word-break: break-all; font-family: 'Courier New', monospace;">
                                ${invitationUrl}
                              </p>
                            </td>
                          </tr>
                        </table>

                        <!-- Infos de sécurité -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-top: 30px;">
                          <tr>
                            <td style="padding: 16px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td width="30" style="vertical-align: top; padding-top: 2px;">
                                    <span style="font-size: 18px;">🔒</span>
                                  </td>
                                  <td>
                                    <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.6;">
                                      <strong>Sécurité :</strong> Cette invitation expire dans 7 jours. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                        <p style="margin: 0 0 16px 0; color: #525252; font-size: 14px; font-weight: 600;">
                          ConciergeOS
                        </p>
                        <p style="margin: 0 0 20px 0; color: #737373; font-size: 13px; line-height: 1.6;">
                          La plateforme tout-en-un pour gérer votre conciergerie<br>
                          Réservations • Missions • Incidents • Finances
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 24px 0;">
                              <a href="#" style="color: #171717; text-decoration: none; font-size: 12px; padding: 0 8px;">Support</a>
                              <span style="color: #d4d4d4;">•</span>
                              <a href="#" style="color: #171717; text-decoration: none; font-size: 12px; padding: 0 8px;">Documentation</a>
                              <span style="color: #d4d4d4;">•</span>
                              <a href="#" style="color: #171717; text-decoration: none; font-size: 12px; padding: 0 8px;">Confidentialité</a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 20px 0 0 0; color: #a3a3a3; font-size: 12px;">
                          © ${new Date().getFullYear()} ConciergeOS. Tous droits réservés.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Send email error:", error);
    return { error: "Erreur lors de l'envoi de l'email" };
  }
}
