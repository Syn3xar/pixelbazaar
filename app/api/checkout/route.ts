import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { x, y, company, url, color, email } = await req.json()

  // Make sure pixel isn't already taken
  const db = supabaseAdmin()
  const { data: existing } = await db.from('pixels').select('id').eq('x', x).eq('y', y).single()
  if (existing) return NextResponse.json({ error: 'Pixel already taken' }, { status: 409 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Encode pixel info into the return URL so we can save it after payment
  const params = new URLSearchParams({ x, y, company, url, color, email })
  const returnUrl = `${appUrl}/api/paypal/capture?${params}`
  const cancelUrl = `${appUrl}/?cancelled=1`

  try {
    const { approveUrl } = await createPayPalOrder({
      amountUSD: '1.00',
      description: `PixelBazaar — Pixel [${x},${y}] for ${company}`,
      returnUrl,
      cancelUrl,
    })
    return NextResponse.json({ url: approveUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
