import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, company, url, x, y, blockSize, price, orderId } = await req.json()

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.log('Resend not configured — skipping email')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const boardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?inspect=${x},${y}`
  const certUrl  = `${process.env.NEXT_PUBLIC_APP_URL}/api/certificate?x=${x}&y=${y}&company=${encodeURIComponent(company)}&blockSize=${blockSize}&price=${price}&date=${new Date().toISOString()}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="background:#08080f;margin:0;padding:0;font-family:'Courier New',monospace;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;letter-spacing:0.05em;">
        <span style="color:#784BA0;">MILLION</span><span style="color:#e0e0ff;">DOTBOARD</span>
      </span>
    </div>

    <div style="background:#0f0f1a;border:1px solid #2a2a3e;border-radius:4px;padding:32px;margin-bottom:24px;">
      <h1 style="color:#92FE9D;font-size:20px;margin:0 0 8px;letter-spacing:0.05em;">✓ Your pixel is live!</h1>
      <p style="color:#666;font-size:13px;margin:0 0 24px;">Your advertisement is now visible to everyone on the board.</p>

      <div style="display:flex;gap:16px;align-items:center;margin-bottom:24px;">
        <div style="background:#784BA0;width:48px;height:48px;border-radius:4px;flex-shrink:0;"></div>
        <div>
          <div style="color:#e0e0ff;font-size:16px;font-weight:bold;margin-bottom:4px;">${company}</div>
          <div style="color:#784BA0;font-size:12px;">${url}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${[
          ['Block location', `[${x}, ${y}]`],
          ['Block size', `${blockSize}×${blockSize} (${blockSize*blockSize} pixels)`],
          ['Amount paid', `$${price}`],
          ['Order ID', orderId],
          ['Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
        ].map(([label, val]) => `
          <tr>
            <td style="padding:8px 0;color:#555;font-size:11px;border-bottom:1px solid #1a1a2e;">${label}</td>
            <td style="padding:8px 0;color:#e0e0ff;font-size:11px;border-bottom:1px solid #1a1a2e;text-align:right;">${val}</td>
          </tr>
        `).join('')}
      </table>

      <a href="${boardUrl}" style="display:block;background:#784BA0;color:#fff;text-align:center;padding:14px;border-radius:4px;text-decoration:none;font-size:13px;letter-spacing:0.08em;margin-bottom:12px;">
        🎯 View Your Pixel on the Board
      </a>

      <a href="${certUrl}" style="display:block;background:#1a1a2e;color:#e0e0ff;text-align:center;padding:14px;border-radius:4px;text-decoration:none;font-size:13px;letter-spacing:0.08em;">
        📜 Download Ownership Certificate (PDF)
      </a>
    </div>

    <div style="background:#0f0f1a;border:1px solid #1a1a2e;border-radius:4px;padding:20px;margin-bottom:24px;">
      <p style="color:#555;font-size:12px;margin:0 0 8px;">💡 <strong style="color:#e0e0ff;">Did you know?</strong></p>
      <p style="color:#555;font-size:11px;margin:0;">You can auction your pixel block to other buyers at any time. Visit your pixel on the board and click "Start Auction" to potentially sell it for more than you paid!</p>
    </div>

    <p style="color:#333;font-size:10px;text-align:center;margin:0;">
      © 2026 MillionDotBoard · <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color:#333;">Terms</a> · <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#333;">Privacy</a> · <a href="${process.env.NEXT_PUBLIC_APP_URL}/refund" style="color:#333;">Refund Policy</a>
    </p>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MillionDotBoard <noreply@milliondotboard.com>',
        to: [email],
        subject: `✓ Your pixel [${x},${y}] is live on MillionDotBoard!`,
        html,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return NextResponse.json({ ok: true, emailId: data.id })
  } catch (err: any) {
    console.error('Email error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
