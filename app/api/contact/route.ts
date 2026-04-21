import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logActivity } from '@/lib/requestInfo'

export async function POST(req: NextRequest) {
  const { name, email, type, pixelCoords, message } = await req.json()

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Log contact with full request info
  await logActivity(db, 'contact_form', req, {
    actor_email: email,
    actor_name:  name,
    metadata:    { type, pixelCoords, message },
  }).catch(() => {})

  // Send email via Resend if configured
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL ?? 'contact@milliondotboard.com'

  const typeLabels: Record<string, string> = {
    refund: '💰 Refund Request',
    support: '🛠 Technical Support',
    auction: '⚡ Auction Support',
    general: '💬 General Inquiry',
  }

  if (RESEND_API_KEY) {
    // Send notification to admin
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'MillionDotBoard <noreply@milliondotboard.com>',
        to: [adminEmail],
        subject: `[Contact] ${typeLabels[type] ?? type} from ${name}`,
        html: `
          <h2>${typeLabels[type] ?? type}</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          ${pixelCoords ? `<p><strong>Pixel:</strong> ${pixelCoords}</p>` : ''}
          <p><strong>Message:</strong></p>
          <blockquote>${message.replace(/\n/g, '<br>')}</blockquote>
          <hr>
          <p style="color:#999;font-size:12px">Sent from milliondotboard.com/contact</p>
        `,
      }),
    }).catch(e => console.error('Admin email error:', e))

    // Send confirmation to user
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'MillionDotBoard <noreply@milliondotboard.com>',
        to: [email],
        subject: 'We received your message — MillionDotBoard',
        html: `
          <div style="font-family:monospace;background:#08080f;color:#e0e0ff;padding:40px;max-width:500px;margin:0 auto;">
            <h2 style="color:#92FE9D;">✓ Message Received</h2>
            <p style="color:#888;">Hi ${name},</p>
            <p style="color:#888;">We've received your ${typeLabels[type] ?? 'message'} and will get back to you within <strong style="color:#e0e0ff;">5 business days</strong>.</p>
            <div style="background:#0f0f1a;border:1px solid #2a2a3e;padding:16px;margin:20px 0;border-radius:4px;">
              <p style="color:#555;font-size:12px;margin:0 0 8px;">Your message:</p>
              <p style="color:#888;font-size:12px;margin:0;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p style="color:#555;font-size:11px;">© 2026 MillionDotBoard · milliondotboard.com</p>
          </div>
        `,
      }),
    }).catch(e => console.error('Confirmation email error:', e))
  } else {
    console.log('Resend not configured — contact form submission:', { name, email, type, message })
  }

  return NextResponse.json({ ok: true })
}
