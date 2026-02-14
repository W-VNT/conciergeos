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
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur ConciergeOS</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #fafafa;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e5e5;
        }
        .header {
            background-color: #0a0a0a;
            padding: 32px 30px;
            text-align: center;
            border-bottom: 1px solid #262626;
        }
        .logo {
            width: 48px;
            height: 48px;
            background-color: #ffffff;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            font-size: 24px;
        }
        .header h1 {
            color: #fafafa;
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            letter-spacing: -0.01em;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #0a0a0a;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 16px 0;
            letter-spacing: -0.01em;
        }
        .content p {
            color: #737373;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 16px 0;
        }
        .button {
            display: inline-block;
            background-color: #0a0a0a;
            color: #fafafa !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 6px;
            font-weight: 500;
            font-size: 15px;
            text-align: center;
            margin: 24px 0;
            border: 1px solid #0a0a0a;
        }
        .features {
            background-color: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 24px;
            margin: 32px 0;
        }
        .feature {
            display: flex;
            align-items: start;
            margin-bottom: 20px;
        }
        .feature:last-child {
            margin-bottom: 0;
        }
        .feature-icon {
            width: 40px;
            height: 40px;
            background-color: #0a0a0a;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            flex-shrink: 0;
            font-size: 20px;
        }
        .feature-content h3 {
            color: #0a0a0a;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px 0;
            letter-spacing: -0.01em;
        }
        .feature-content p {
            color: #737373;
            font-size: 14px;
            margin: 0;
        }
        .footer {
            background-color: #fafafa;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e5e5e5;
        }
        .footer p {
            color: #a3a3a3;
            font-size: 14px;
            margin: 6px 0;
        }
        .footer a {
            color: #525252;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏢</div>
            <h1>ConciergeOS</h1>
        </div>

        <div class="content">
            <h2>Bienvenue ${fullName} !</h2>

            <p>Votre compte <strong>${orgName}</strong> a été créé avec succès. Vous êtes maintenant prêt à gérer votre conciergerie de manière professionnelle et efficace.</p>

            <a href="https://conciergeos.vercel.app/dashboard" class="button">Accéder à mon dashboard</a>

            <h3 style="color: #0a0a0a; font-size: 18px; margin: 32px 0 16px 0; font-weight: 600; letter-spacing: -0.01em;">Pour bien démarrer</h3>

            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🏠</div>
                    <div class="feature-content">
                        <h3>Ajoutez vos logements</h3>
                        <p>Centralisez tous vos biens en gestion avec leurs informations clés</p>
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-icon">👥</div>
                    <div class="feature-content">
                        <h3>Créez vos propriétaires</h3>
                        <p>Enregistrez les coordonnées de vos clients et le niveau de service</p>
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-icon">📋</div>
                    <div class="feature-content">
                        <h3>Planifiez vos missions</h3>
                        <p>Check-in, check-out, ménage... Organisez toutes vos interventions</p>
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-icon">🔧</div>
                    <div class="feature-content">
                        <h3>Gérez les incidents</h3>
                        <p>Suivez les problèmes, assignez des prestataires et consultez vos KPIs</p>
                    </div>
                </div>
            </div>

            <p style="margin-top: 32px; color: #0a0a0a;"><strong>Besoin d'aide ?</strong></p>
            <p style="margin-top: 8px;">
                Notre équipe est là pour vous. Contactez-nous à
                <a href="mailto:support@conciergeos.com" style="color: #0a0a0a; text-decoration: underline;">support@conciergeos.com</a>
            </p>
        </div>

        <div class="footer">
            <p><strong>ConciergeOS</strong> — Gérez votre conciergerie en toute simplicité</p>
            <p>
                <a href="https://conciergeos.vercel.app">Site web</a> •
                <a href="mailto:support@conciergeos.com">Support</a>
            </p>
            <p style="margin-top: 12px;">© 2026 ConciergeOS. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
  `
}
