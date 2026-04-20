import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { x, y, company, url, email, blockSize, pixelColors, price } = await req.json()
  const db = supabaseAdmin()

  // Check no pixel in this block is already taken
  for (let dy = 0; dy < blockSize; dy++) {
    for (let dx = 0; dx < blockSize; dx++) {
      const { data } = await db.from('pixels').select('id').eq('x', x + dx).eq('y', y + dy).single()
      if (data) return NextResponse.json({ error: `Pixel [${x+dx}, ${y+dy}] is already taken. Choose a different location.` }, { status: 409 })
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const params = new URLSearchParams({
    x: String(x), y: String(y), company, url, email,
    blockSize: String(blockSize), price: String(price),
    pixelColors: JSON.stringify(pixelColors),
  })

  try {
    const { approveUrl } = await createPayPalOrder({
      amountUSD: price.toFixed(2),
      description: `MillionDollarBoard — ${blockSize}×${blockSize} block at [${x},${y}] for ${company}`,
      returnUrl: `${appUrl}/api/paypal/capture?${params}`,
      cancelUrl: `${appUrl}/?cancelled=1`,
    })
    return NextResponse.json({ url: approveUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
