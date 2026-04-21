import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const PADDLE_BASE = process.env.PADDLE_ENV === 'production'
  ? 'https://api.paddle.com'
  : 'https://sandbox-api.paddle.com'

const PRICE_IDS: Record<number, string> = {
  1:    process.env.PADDLE_PRICE_1x1     ?? '',
  50:   process.env.PADDLE_PRICE_10x10   ?? '',
  1000: process.env.PADDLE_PRICE_100x100 ?? '',
}

export async function POST(req: NextRequest) {
  try {
    const { x, y, company, url, email, blockSize, pixelColors, price } = await req.json()
    const db = supabaseAdmin()

    for (let dy = 0; dy < blockSize; dy++) {
      for (let dx = 0; dx < blockSize; dx++) {
        const { data } = await db.from('pixels').select('id').eq('x', x + dx).eq('y', y + dy).single()
        if (data) return NextResponse.json({ error: `Pixel [${x+dx}, ${y+dy}] is already taken.` }, { status: 409 })
      }
    }

    const priceId = PRICE_IDS[price]
    if (!priceId) return NextResponse.json({ error: 'Price ID not configured for $' + price }, { status: 400 })

    const res = await fetch(`${PADDLE_BASE}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: {
          x: String(x), y: String(y), company, url, email,
          blockSize: String(blockSize), price: String(price),
          pixelColors: JSON.stringify(pixelColors),
        },
        checkout: { url: `${process.env.NEXT_PUBLIC_APP_URL}/success` },
      }),
    })

    const data = await res.json()
    if (data.error) return NextResponse.json({ error: data.error.detail ?? 'Paddle error' }, { status: 500 })

    const checkoutUrl = data.data?.checkout?.url
    if (!checkoutUrl) return NextResponse.json({ error: 'No checkout URL from Paddle' }, { status: 500 })

    return NextResponse.json({ url: checkoutUrl })
  } catch (err: any) {
    console.error('Paddle checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
