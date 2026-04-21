import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const orderId    = searchParams.get('token')
  const x          = Number(searchParams.get('x'))
  const y          = Number(searchParams.get('y'))
  const company    = searchParams.get('company') ?? ''
  const url        = searchParams.get('url') ?? ''
  const email      = searchParams.get('email') ?? ''
  const blockSize  = Number(searchParams.get('blockSize') ?? '1')
  const price      = Number(searchParams.get('price') ?? '1')
  const pixelColorsRaw = searchParams.get('pixelColors') ?? '[]'

  if (!orderId) return NextResponse.redirect(`${appUrl}/?error=missing_order`)

  let pixelColors: string[] = []
  try { pixelColors = JSON.parse(decodeURIComponent(pixelColorsRaw)) } catch { pixelColors = [] }

  try {
    const capture = await capturePayPalOrder(orderId)
    if (capture.status !== 'COMPLETED') return NextResponse.redirect(`${appUrl}/?error=payment_failed`)

    const db = supabaseAdmin()

    // 1. Create the block record
    const { data: block, error: blockErr } = await db.from('blocks').insert({
      origin_x: x, origin_y: y,
      block_size: blockSize,
      company, url,
      owner_email: email,
      price,
    }).select().single()

    if (blockErr || !block) {
      console.error('Block insert error:', blockErr)
      return NextResponse.redirect(`${appUrl}/?error=block_save_failed`)
    }

    // 2. Create all individual pixels linked to this block
    const pixelRows = []
    let colorIdx = 0
    for (let dy = 0; dy < blockSize; dy++) {
      for (let dx = 0; dx < blockSize; dx++) {
        pixelRows.push({
          x: x + dx, y: y + dy,
          block_id: block.id,
          company, url,
          color: pixelColors[colorIdx] ?? '#784BA0',
          price: price / (blockSize * blockSize),
          owner_email: email,
        })
        colorIdx++
      }
    }

    await db.from('pixels').upsert(pixelRows)

    // 3. Record transaction
    await db.from('transactions').insert({
      type: 'pixel_purchase',
      amount: price,
      platform_fee: price * 0.1,
      paypal_order: orderId,
      block_id: block.id,
      origin_x: x, origin_y: y,
      block_size: blockSize,
      buyer_email: email,
    })

    // Log the activity
    await db.from('activity_log').insert({
      event_type: 'pixel_purchase',
      block_id: block.id,
      actor_email: email,
      actor_name: company,
      amount: price,
      metadata: { x, y, blockSize, url, pixelCount: blockSize * blockSize, orderId },
    })

    // Send confirmation email
    try {
      await fetch(`${appUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company, url, x, y, blockSize, price, orderId }),
      })
    } catch (e) { console.error('Email send error:', e) }

    return NextResponse.redirect(`${appUrl}/success?order=${orderId}`)
  } catch (err) {
    console.error('Capture error:', err)
    return NextResponse.redirect(`${appUrl}/?error=capture_failed`)
  }
}
