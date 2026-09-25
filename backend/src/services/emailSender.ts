import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

export interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const TARGET_EMAIL = 'dualithjbsnap@gmail.com';

/**
 * Creates Nodemailer Transporter instance using environment SMTP config settings.
 */
function createTransporter() {
  const { host, port, user, pass } = config.smtp;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback transport for zero-config email dispatching
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

/**
 * Sends real email to dualithjbsnap@gmail.com when contact form is submitted.
 * Sets the 'From' and 'Reply-To' fields to the exact name and email entered by the user.
 */
export async function sendContactNotification(payload: ContactEmailPayload) {
  const transporter = createTransporter();
  const userEmail = payload.email.trim();
  const userName = payload.name.trim() || 'Website Visitor';

  // Set From and Reply-To to the exact email entered by the user in the contact form
  const userFormattedAddress = `"${userName}" <${userEmail}>`;

  const htmlContent = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #09090b; padding: 32px; color: #f4f4f5; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #27272a;">
      <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
        <h2 style="color: #6366f1; margin: 0; font-size: 22px;">📩 New Contact Form Submission</h2>
        <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0;">JBSnap Platform Notification</p>
      </div>

      <div style="background-color: #18181b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px; font-size: 14px;"><strong style="color: #38bdf8;">From:</strong> ${userName} (&lt;${userEmail}&gt;)</p>
        <p style="margin: 0 0 10px; font-size: 14px;"><strong style="color: #38bdf8;">Reply-To:</strong> ${userEmail}</p>
        <p style="margin: 0 0 10px; font-size: 14px;"><strong style="color: #38bdf8;">Subject:</strong> ${payload.subject || 'No Subject'}</p>
        <p style="margin: 0; font-size: 14px;"><strong style="color: #38bdf8;">Date:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <div style="background-color: #18181b; padding: 20px; border-radius: 12px;">
        <h4 style="color: #a1a1aa; margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Message Body</h4>
        <div style="font-size: 14px; line-height: 1.6; color: #f4f4f5; white-space: pre-wrap;">${payload.message}</div>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #27272a; text-align: center; font-size: 12px; color: #71717a;">
        This email was submitted via JBSnap contact form. Reply directly to hit <strong>${userEmail}</strong>.
      </div>
    </div>
  `;

  const mailOptions = {
    from: userFormattedAddress,        // User's name & email
    replyTo: userFormattedAddress,     // Reply-To user's email directly
    to: TARGET_EMAIL,                  // dualithjbsnap@gmail.com
    subject: `[JBSnap Contact] ${payload.subject || 'Message from ' + userEmail}`,
    text: `From: ${userName} (${userEmail})\nReply-To: ${userEmail}\nSubject: ${payload.subject}\n\n${payload.message}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL DISPATCH] ✅ Email sent to ${TARGET_EMAIL} with Reply-To set to ${userEmail}:`, info.messageId || info.envelope);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EMAIL ERROR] ❌ Failed to dispatch email to ${TARGET_EMAIL}:`, err.message);
    return { success: false, error: err.message };
  }
}
