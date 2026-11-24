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

export async function sendPassExpirationEmail({
  email,
  userName,
  packageName,
  remainingCount,
  expirationDateStrTh,
  expirationDateStrEn,
}: {
  email: string
  userName?: string | null
  packageName?: string
  remainingCount: number
  expirationDateStrTh: string
  expirationDateStrEn: string
}) {
  const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://anyapilatesstudio.com'}/account/schedule`
  const greetingTh = userName ? `สวัสดีค่ะ คุณ${userName}` : 'สวัสดีค่ะ คุณลูกค้า'
  const greetingEn = userName ? `Hello ${userName},` : 'Hello,'

  return resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: 'Package Expiration Reminder / แจ้งเตือนแพ็กเกจ Pilates ใกล้หมดอายุ',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2C2523; line-height: 1.6; padding: 24px; background-color: #FAF8F5;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 20px; font-weight: 500; color: #3C2A1E; letter-spacing: 0.12em; margin: 0;">ANYA PILATES</h1>
          <p style="font-size: 10px; text-transform: uppercase; color: #8C7A6B; letter-spacing: 0.25em; margin: 4px 0 0 0;">Studio Bangkok</p>
        </div>

        <div style="background-color: #EDE8E2; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
          <p style="font-size: 15px; margin-top: 0; font-weight: 500; color: #3C2A1E;">${greetingTh}</p>
          <p style="font-size: 14px; margin: 12px 0;">ทาง ANYA Pilates ขอแจ้งให้คุณลูกค้าทราบว่า แพ็กเกจ Pilates ของคุณลูกค้าจะหมดอายุในวันที่ <strong>${expirationDateStrTh}</strong></p>
          ${packageName ? `<p style="font-size: 13px; color: #5C4A3E; margin: 8px 0;"><strong>แพ็กเกจ:</strong> ${packageName} (คงเหลือ ${remainingCount} คลาส)</p>` : ''}
          <p style="font-size: 14px; margin: 12px 0;">หากคุณลูกค้ายังมีคลาสคงเหลือ สามารถวางแผนจองคลาสเพื่อใช้สิทธิ์ที่เหลือให้ครบก่อนวันหมดอายุนะคะ</p>
          <p style="font-size: 14px; margin: 12px 0;">คุณลูกค้าสามารถตรวจสอบจำนวนคลาสคงเหลือและจองคลาสได้ผ่านระบบจองของเรา</p>
          <p style="font-size: 14px; margin: 12px 0 0 0;">ขอบคุณที่เลือกใช้บริการ ANYA Pilates ค่ะ</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${bookingLink}" style="display: inline-block; padding: 12px 32px; background-color: #3C2A1E; color: #FAF8F5; text-decoration: none; border-radius: 9999px; font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase;">
            Book Class / จองคลาส
          </a>
        </div>

        <div style="border-top: 1px dashed #D6CCC2; margin: 24px 0;"></div>

        <div style="padding: 4px 8px; color: #4A3E39;">
          <p style="font-size: 15px; margin-top: 0; font-weight: 500; color: #3C2A1E;">${greetingEn}</p>
          <p style="font-size: 14px; margin: 12px 0;">This is a friendly reminder that your Pilates package at ANYA Pilates will expire on <strong>${expirationDateStrEn}</strong>.</p>
          ${packageName ? `<p style="font-size: 13px; color: #5C4A3E; margin: 8px 0;"><strong>Package:</strong> ${packageName} (${remainingCount} class${remainingCount === 1 ? '' : 'es'} remaining)</p>` : ''}
          <p style="font-size: 14px; margin: 12px 0;">If you have any remaining sessions, we encourage you to book your classes and enjoy your remaining sessions before the expiration date.</p>
          <p style="font-size: 14px; margin: 12px 0;">You can check your remaining sessions and book your next class through our booking system.</p>
          <p style="font-size: 14px; margin: 12px 0 0 0;">Thank you for being a part of ANYA Pilates,</p>
          <p style="font-size: 14px; font-weight: 500; color: #3C2A1E; margin-top: 4px;">ANYA Pilates Studio</p>
        </div>
      </div>
    `
  })
}
