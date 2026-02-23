// Email sender using Resend
// Documentation: https://resend.com/docs/send-with-nextjs

import type { EmailTemplate } from "./templates";

interface SendEmailParams {
  to: string;
  template: EmailTemplate;
  from?: string;
}

/**
 * Send an email using Resend
 *
 * SETUP REQUIRED:
 * 1. Sign up at https://resend.com
 * 2. Get your API key
 * 3. Add RESEND_API_KEY to your .env.local:
 *    RESEND_API_KEY=re_xxxxxxxxxxxx
 * 4. Install Resend SDK: npm install resend
 * 5. Verify your domain in Resend dashboard
 *
 * @param params - Email parameters
 * @returns Promise<void>
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      return;
    }
    throw new Error("RESEND_API_KEY is not configured");
  }

  try {
    // Dynamic import to avoid requiring resend if not configured
    let Resend;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Resend = require("resend").Resend;
    } catch {
      return;
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: params.from || process.env.EMAIL_FROM || "ConciergeOS <noreply@classazur.fr>",
      to: params.to,
      subject: params.template.subject,
      html: params.template.html,
      text: params.template.text,
    });

    if (error) {
      console.error("Email send error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  } catch (error) {
    console.error("Email sending failed:", error);
    // Don't throw in production to avoid breaking the app
    if (process.env.NODE_ENV !== "production") {
      throw error;
    }
  }
}

/**
 * Send email to multiple recipients (used for admin notifications)
 */
export async function sendBulkEmail(
  recipients: string[],
  template: EmailTemplate
): Promise<void> {
  const promises = recipients.map((to) =>
    sendEmail({ to, template })
  );

  await Promise.allSettled(promises);
}
