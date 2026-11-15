import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fleet-pulse-dev-secret-change-in-production';

function appOrigin() {
  return (process.env.APP_ORIGIN || process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org').replace(/\/$/, '');
}

/** Portal login email for a customer record (linked user wins over contact email). */
export function resolvePortalLoginEmailForCustomer(customer) {
  if (!customer) return null;
  if (customer.user_id) {
    const linked = findUserById(customer.user_id);
    if (linked?.email) return linked.email.trim().toLowerCase();
  }
  if (customer.portal_login_email) {
    return String(customer.portal_login_email).trim().toLowerCase();
  }
  if (customer.email) {
    return String(customer.email).trim().toLowerCase();
  }
  return null;
}

/**
 * Create reset token and send email. Returns details for staff UI; public routes should not expose this.
 */
export async function deliverPasswordReset(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email) {
    return {
      ok: false,
      email: null,
      userFound: false,
      emailSent: false,
      message: 'Email is required.',
    };
  }

  const user = findUserByEmail(email);
  if (!user) {
    return {
      ok: true,
      email,
      userFound: false,
      emailSent: false,
      message: `No portal login exists for ${email}. Create a portal login or send a welcome email first.`,
    };
  }

  const token = jwt.sign({ email: user.email, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
  const resetUrl = `${appOrigin()}/reset-password?token=${encodeURIComponent(token)}`;
  console.log(`[password reset for ${user.email}]: ${resetUrl}`);

  try {
    const { sendPasswordResetEmail } = await import('./passwordResetEmails.js');
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      fullName: user.full_name,
      resetUrl,
    });

    if (emailResult.skipped) {
      console.warn('[password reset] Email not sent — RESEND_API_KEY not configured. Use the link above manually.');
      return {
        ok: true,
        email: user.email,
        userFound: true,
        emailSent: false,
        skipped: true,
        message:
          `Reset link generated for ${user.email}, but email was not sent (RESEND_API_KEY not configured on the server). Copy the link from server logs.`,
      };
    }
    if (!emailResult.success) {
      console.error('[password reset email failed]', emailResult.error, emailResult.hint || '');
      return {
        ok: false,
        email: user.email,
        userFound: true,
        emailSent: false,
        error: emailResult.error,
        hint: emailResult.hint,
        message: `Could not send reset email to ${user.email}: ${emailResult.error || 'unknown error'}${emailResult.hint ? ` — ${emailResult.hint}` : ''}`,
      };
    }

    return {
      ok: true,
      email: user.email,
      userFound: true,
      emailSent: true,
      message: `Password reset email sent to ${user.email}. The link expires in 1 hour.`,
    };
  } catch (err) {
    console.error('[password reset email error]', err.message);
    return {
      ok: false,
      email: user.email,
      userFound: true,
      emailSent: false,
      error: err.message,
      message: `Could not send reset email to ${user.email}: ${err.message}`,
    };
  }
}
