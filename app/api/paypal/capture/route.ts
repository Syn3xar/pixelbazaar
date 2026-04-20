import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const orderId = searchParams.get('token')
  const x = Number(searchParams.get('x'))
  const y = Number(searchParams.get('y'))
  const company = searchParams.get('company') ?? ''
  const url = searchParams.get('url') ?? ''
  const color = searchParams.get('color') ?? '#784BA0'
  const email = searchParams.get('email') ?? ''

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!orderId) {
    return NextResponse.redirect(`${appUrl}/?error=missing_order`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)

    if (capture.status !== 'COMPLETED') {
      return NextResponse.redirect(`${appUrl}/?error=payment_failed`)
    }

    const db = supabaseAdmin()
    await db.from('pixels').upsert({
      x, y, company, url, color,
      price: 1.00,
      owner_email: email,
    })

    await db.from('transactions').insert({
      type: 'pixel_purchase',
      amount: 1.00,
      platform_fee: 0.10,
      stripe_session: orderId,
      pixel_x: x,
      pixel_y: y,
      buyer_email: email,
    })

    return NextResponse.redirect(`${appUrl}/success?order=${orderId}`)
  } catch (err) {
    console.error('PayPal capture error:', err)
    return NextResponse.redirect(`${appUrl}/?error=capture_failed`)
  }
}
