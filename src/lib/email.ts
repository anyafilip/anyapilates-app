import { Resend } from 'resend'

// We will need to set this in .env. Fallback to dummy key during build time to prevent crashes.
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build_time')
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'Anya Pilates <hello@anyapilatesstudio.com>'

export async function sendVerificationEmail(email: string, token: string) {
  const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  return resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: 'Verify your Anya Pilates Account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Anya Pilates!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <p>
          <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #3C2A1E; color: white; text-decoration: none; border-radius: 4px;">
            Verify Email
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  return resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: 'Reset your Anya Pilates Password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3C2A1E; color: white; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  })
}

export async function sendClassReminderEmail(email: string, userName: string, className: string, dateStr: string, timeStr: string) {
  return resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: `Reminder: Upcoming Class - ${className}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${userName},</h2>
        <p>This is a reminder that you have an upcoming class at Anya Pilates.</p>
        <div style="background-color: #EDE8E2; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #3C2A1E;">${className}</h3>
          <p style="margin: 0;"><strong>Date:</strong> ${dateStr}</p>
          <p style="margin: 0;"><strong>Time:</strong> ${timeStr}</p>
        </div>
        <p>We look forward to seeing you in the studio!</p>
      </div>
    `
  })
}

export async function sendBookingConfirmationEmail(email: string, userName: string, className: string, dateStr: string, timeStr: string) {
  return resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: `Booking Confirmed: ${className}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${userName},</h2>
        <p>Your class has been successfully booked!</p>
        <div style="background-color: #EDE8E2; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #3C2A1E;">${className}</h3>
          <p style="margin: 0;"><strong>Date:</strong> ${dateStr}</p>
          <p style="margin: 0;"><strong>Time:</strong> ${timeStr}</p>
        </div>
        <p>If you need to cancel, please do so at least 12 hours in advance to keep your class pass.</p>
        <p>See you in the studio!</p>
      </div>
    `
  })
}

export async function sendClassCancellationEmail(email: string, userName: string, className: string, dateStr: string, timeStr: string) {
  return resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: `Class Cancelled: ${className}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${userName},</h2>
        <p>Unfortunately, we had to cancel the following class:</p>
        <div style="background-color: #EDE8E2; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #3C2A1E;">${className}</h3>
          <p style="margin: 0;"><strong>Date:</strong> ${dateStr}</p>
          <p style="margin: 0;"><strong>Time:</strong> ${timeStr}</p>
        </div>
        <p>If you used a pass to book this class, it has been automatically refunded to your account.</p>
        <p>We apologize for any inconvenience!</p>
      </div>
    `
  })
}

export async function sendReceiptEmail(email: string, userName: string, packageName: string, amount: number) {
  return resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: `Payment Confirmed: ${packageName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${userName},</h2>
        <p>Your payment has been successfully confirmed and your package is now active.</p>
        <div style="background-color: #EDE8E2; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #3C2A1E;">${packageName}</h3>
          <p style="margin: 0;"><strong>Amount Paid:</strong> ฿${(amount / 100).toLocaleString('en-US')}</p>
        </div>
        <p>Thank you for choosing Anya Pilates!</p>
      </div>
    `
  })
}
