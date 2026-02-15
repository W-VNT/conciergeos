// Email templates for ConciergeOS
// To activate: Configure RESEND_API_KEY in your environment variables

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function missionAssignedEmail(data: {
  operatorName: string;
  missionType: string;
  logementName: string;
  scheduledAt: string;
  missionUrl: string;
}): EmailTemplate {
  return {
    subject: `Nouvelle mission assignée - ${data.missionType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📋 Nouvelle mission assignée</h2>
        <p>Bonjour ${data.operatorName},</p>
        <p>Une nouvelle mission vous a été assignée :</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 8px 0;"><strong>Type :</strong> ${data.missionType}</p>
          <p style="margin: 8px 0;"><strong>Logement :</strong> ${data.logementName}</p>
          <p style="margin: 8px 0;"><strong>Date :</strong> ${data.scheduledAt}</p>
        </div>
        <a href="${data.missionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Voir la mission
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          ConciergeOS - Gestion de conciergerie
        </p>
      </div>
    `,
    text: `
Nouvelle mission assignée

Bonjour ${data.operatorName},

Une nouvelle mission vous a été assignée :

Type : ${data.missionType}
Logement : ${data.logementName}
Date : ${data.scheduledAt}

Voir la mission : ${data.missionUrl}

--
ConciergeOS - Gestion de conciergerie
    `,
  };
}

export function criticalIncidentEmail(data: {
  adminName: string;
  logementName: string;
  description: string;
  incidentUrl: string;
}): EmailTemplate {
  return {
    subject: `🚨 URGENT - Incident critique sur ${data.logementName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🚨 Incident critique</h2>
        <p>Bonjour ${data.adminName},</p>
        <p><strong>Un incident critique a été signalé et nécessite une attention immédiate.</strong></p>
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
          <p style="margin: 8px 0;"><strong>Logement :</strong> ${data.logementName}</p>
          <p style="margin: 8px 0;"><strong>Description :</strong></p>
          <p style="margin: 8px 0;">${data.description}</p>
        </div>
        <a href="${data.incidentUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Voir l'incident
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          ConciergeOS - Gestion de conciergerie
        </p>
      </div>
    `,
    text: `
🚨 INCIDENT CRITIQUE

Bonjour ${data.adminName},

Un incident critique a été signalé et nécessite une attention immédiate.

Logement : ${data.logementName}
Description : ${data.description}

Voir l'incident : ${data.incidentUrl}

--
ConciergeOS - Gestion de conciergerie
    `,
  };
}

export function contractExpiringEmail(data: {
  adminName: string;
  proprietaireName: string;
  daysRemaining: number;
  endDate: string;
  contractUrl: string;
}): EmailTemplate {
  const urgency = data.daysRemaining <= 2 ? "URGENT - " : "";

  return {
    subject: `${urgency}Contrat expire dans ${data.daysRemaining} jours`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">📋 Contrat expirant bientôt</h2>
        <p>Bonjour ${data.adminName},</p>
        <p>Un contrat arrive à expiration prochainement :</p>
        <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; margin: 16px 0;">
          <p style="margin: 8px 0;"><strong>Propriétaire :</strong> ${data.proprietaireName}</p>
          <p style="margin: 8px 0;"><strong>Date de fin :</strong> ${data.endDate}</p>
          <p style="margin: 8px 0;"><strong>Jours restants :</strong> ${data.daysRemaining}</p>
        </div>
        <p><strong>Action recommandée :</strong> Contactez le propriétaire pour renouveler le contrat.</p>
        <a href="${data.contractUrl}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Voir le contrat
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          ConciergeOS - Gestion de conciergerie
        </p>
      </div>
    `,
    text: `
Contrat expirant bientôt

Bonjour ${data.adminName},

Un contrat arrive à expiration prochainement :

Propriétaire : ${data.proprietaireName}
Date de fin : ${data.endDate}
Jours restants : ${data.daysRemaining}

Action recommandée : Contactez le propriétaire pour renouveler le contrat.

Voir le contrat : ${data.contractUrl}

--
ConciergeOS - Gestion de conciergerie
    `,
  };
}

export function teamInvitationEmail(data: {
  invitedEmail: string;
  inviterName: string;
  organisationName: string;
  role: string;
  invitationUrl: string;
}): EmailTemplate {
  return {
    subject: `Invitation à rejoindre ${data.organisationName} sur ConciergeOS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">👋 Vous êtes invité !</h2>
        <p>Bonjour,</p>
        <p><strong>${data.inviterName}</strong> vous invite à rejoindre <strong>${data.organisationName}</strong> sur ConciergeOS.</p>
        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 8px 0;"><strong>Organisation :</strong> ${data.organisationName}</p>
          <p style="margin: 8px 0;"><strong>Rôle :</strong> ${data.role}</p>
        </div>
        <a href="${data.invitationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Accepter l'invitation
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          Cette invitation expire dans 7 jours.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          ConciergeOS - Gestion de conciergerie
        </p>
      </div>
    `,
    text: `
Invitation à rejoindre ${data.organisationName}

Bonjour,

${data.inviterName} vous invite à rejoindre ${data.organisationName} sur ConciergeOS.

Organisation : ${data.organisationName}
Rôle : ${data.role}

Accepter l'invitation : ${data.invitationUrl}

Cette invitation expire dans 7 jours.

--
ConciergeOS - Gestion de conciergerie
    `,
  };
}
