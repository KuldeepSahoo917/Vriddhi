import { Resend } from 'resend';

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback: no email service configured yet, so print the
    // link instead of failing. Lets the whole flow be tested locally
    // before setting up Resend.
    console.log(`\n[password reset] No RESEND_API_KEY set. Reset link for ${to}:`);
    console.log(resetUrl, '\n');
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Vriddhi <onboarding@resend.dev>',
    to,
    subject: 'Reset your Vriddhi password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Someone requested a password reset for your Vriddhi account. If this was you, click below — this link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="display:inline-block; background:#051F48; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none;">Reset password</a></p>
        <p style="color:#888; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
