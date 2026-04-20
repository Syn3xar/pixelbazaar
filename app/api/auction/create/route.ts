import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { x, y, minBid, hours, sellerEmail } = await req.json()
  const db = supabaseAdmin()

  // Verify pixel belongs to this seller
  const { data: pixel } = await db.from('pixels').select('owner_email').eq('x', x).eq('y', y).single()
  if (!pixel || pixel.owner_email !== sellerEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check no active auction already exists
  const { data: existing } = await db.from('auctions').select('id').eq('pixel_x', x).eq('pixel_y', y).eq('status', 'active').single()
  if (existing) return NextResponse.json({ error: 'Auction already active' }, { status: 409 })

  const endsAt = new Date(Date.now() + hours * 3600 * 1000).toISOString()

  const { data, error } = await db.from('auctions').insert({
    pixel_x: x, pixel_y: y,
    seller_email: sellerEmail,
    min_bid: minBid,
    current_bid: minBid,
    status: 'active',
    ends_at: endsAt,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ auction: data })
}
