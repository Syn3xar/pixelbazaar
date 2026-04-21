import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.text()
  let event: any
  try { event = JSON.parse(body) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (event.event_type !== 'transaction.completed') return NextResponse.json({ ok: true })

  const txn    = event.data
  const custom = txn.custom_data ?? {}
  const x          = Number(custom.x)
  const y          = Number(custom.y)
  const company    = custom.company ?? ''
  const url        = custom.url ?? ''
  const email      = custom.email ?? ''
  const blockSize  = Number(custom.blockSize ?? 1)
  const price      = Number(custom.price ?? 1)
  const pixelColors: string[] = JSON.parse(custom.pixelColors ?? '[]')

  const db = supabaseAdmin()

  const { data: block, error: blockErr } = await db.from('blocks').insert({
    origin_x: x, origin_y: y, block_size: blockSize,
    company, url, owner_email: email, price,
  }).select().single()

  if (blockErr || !block) return NextResponse.json({ error: 'block_save_failed' }, { status: 500 })

  const pixelRows = []
  let colorIdx = 0
  for (let dy = 0; dy < blockSize; dy++) {
    for (let dx = 0; dx < blockSize; dx++) {
      pixelRows.push({
        x: x + dx, y: y + dy, block_id: block.id,
        company, url, color: pixelColors[colorIdx] ?? '#784BA0',
        price: price / (blockSize * blockSize), owner_email: email,
      })
      colorIdx++
    }
  }
  await db.from('pixels').upsert(pixelRows)

  await db.from('transactions').insert({
    type: 'pixel_purchase', amount: price, platform_fee: price * 0.1,
    paypal_order: txn.id, block_id: block.id,
    origin_x: x, origin_y: y, block_size: blockSize, buyer_email: email,
  })

  return NextResponse.json({ ok: true })
}
