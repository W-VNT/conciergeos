// Edge Function triggered after email confirmation
// Send welcome email via Resend (or any email service)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

serve(async (req) => {
  try {
    const { record } = await req.json()

    // Only send if email is confirmed
    if (!record.email_confirmed_at) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    // Get user metadata
    const fullName = record.raw_user_meta_data?.full_name || 'Admin'
    const orgName = record.raw_user_meta_data?.org_name || 'Ma Conciergerie'

    // Send welcome email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ConciergeOS <noreply@conciergeos.com>',
        to: record.email,
        subject: 'Bienvenue sur ConciergeOS',
        html: getWelcomeEmailHTML(fullName, orgName),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend error:', error)
      return new Response(JSON.stringify({ error }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

function getWelcomeEmailHTML(fullName: string, orgName: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur ConciergeOS</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); max-width: 480px; border: 1px solid #e5e5e5;">
            <tr>
              <td style="background: linear-gradient(135deg, #0f0f0f 0%, #1f1f1f 100%); padding: 40px 30px; text-align: center;">
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
            <tr>
              <td style="padding: 40px 30px;">
                <div style="text-align: center; padding-bottom: 30px;">
                  <div style="background: linear-gradient(135deg, #171717 0%, #262626 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); display: inline-block;">
                    🎉 Bienvenue !
                  </div>
                </div>
                <h2 style="color: #0a0a0a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center; line-height: 1.3;">
                  Bienvenue <span style="color: #171717;">${fullName}</span>
                </h2>
                <p style="font-size: 17px; color: #525252; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
                  Votre compte <strong>${orgName}</strong> a été créé avec succès. Vous êtes maintenant prêt à gérer votre conciergerie de manière professionnelle et efficace.
                </p>

                <div style="text-align: center; padding: 30px 0;">
                  <a href="https://conciergeos.vercel.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #171717 0%, #0a0a0a 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                    Accéder à mon dashboard →
                  </a>
                </div>

                <h3 style="color: #0a0a0a; font-size: 20px; font-weight: 700; margin: 30px 0 20px 0; text-align: center;">Pour bien démarrer</h3>

                <div style="background: #fafafa; border-radius: 12px; padding: 24px; margin: 20px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 12px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="40" style="vertical-align: top;">
                              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #171717 0%, #262626 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 40px; font-size: 20px;">🏠</div>
                            </td>
                            <td style="padding-left: 16px;">
                              <h4 style="margin: 0 0 6px 0; color: #0a0a0a; font-size: 16px; font-weight: 600;">Ajoutez vos logements</h4>
                              <p style="margin: 0; color: #737373; font-size: 14px; line-height: 1.5;">Centralisez tous vos biens en gestion avec leurs informations clés</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="40" style="vertical-align: top;">
                              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #171717 0%, #262626 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 40px; font-size: 20px;">👥</div>
                            </td>
                            <td style="padding-left: 16px;">
                              <h4 style="margin: 0 0 6px 0; color: #0a0a0a; font-size: 16px; font-weight: 600;">Créez vos propriétaires</h4>
                              <p style="margin: 0; color: #737373; font-size: 14px; line-height: 1.5;">Enregistrez les coordonnées de vos clients et le niveau de service</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="40" style="vertical-align: top;">
                              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #171717 0%, #262626 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 40px; font-size: 20px;">📋</div>
                            </td>
                            <td style="padding-left: 16px;">
                              <h4 style="margin: 0 0 6px 0; color: #0a0a0a; font-size: 16px; font-weight: 600;">Planifiez vos missions</h4>
                              <p style="margin: 0; color: #737373; font-size: 14px; line-height: 1.5;">Check-in, check-out, ménage... Organisez toutes vos interventions</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="40" style="vertical-align: top;">
                              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #171717 0%, #262626 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 40px; font-size: 20px;">🔧</div>
                            </td>
                            <td style="padding-left: 16px;">
                              <h4 style="margin: 0 0 6px 0; color: #0a0a0a; font-size: 16px; font-weight: 600;">Gérez les incidents</h4>
                              <p style="margin: 0; color: #737373; font-size: 14px; line-height: 1.5;">Suivez les problèmes, assignez des prestataires et consultez vos KPIs</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 30px;">
                  <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                    💬 <strong>Besoin d'aide ?</strong> Notre équipe est là pour vous. Contactez-nous à <a href="mailto:support@conciergeos.com" style="color: #1e40af; text-decoration: underline;">support@conciergeos.com</a>
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0 0 16px 0; color: #525252; font-size: 14px; font-weight: 600;">ConciergeOS</p>
                <p style="margin: 0 0 20px 0; color: #737373; font-size: 13px; line-height: 1.6;">
                  La plateforme tout-en-un pour gérer votre conciergerie<br>Réservations • Missions • Incidents • Finances
                </p>
                <p style="margin: 0; color: #a3a3a3; font-size: 12px;">© 2026 ConciergeOS. Tous droits réservés.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
