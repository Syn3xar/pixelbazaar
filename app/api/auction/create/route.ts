import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logActivity } from '@/lib/requestInfo'

export async function POST(req: NextRequest) {
  const { blockId, minBid, hours, sellerEmail } = await req.json()
  const db = supabaseAdmin()

  // Fetch the block — verify ownership
  const { data: block, error } = await db
    .from('blocks')
    .select('*')
    .eq('id', blockId)
    .single()

  if (error || !block) return NextResponse.json({ error: 'Block not found' }, { status: 404 })
  if (block.owner_email !== sellerEmail) return NextResponse.json({ error: 'Unauthorized — you do not own this block' }, { status: 403 })

  // Check no active auction already exists for this block
  const { data: existing } = await db
    .from('auctions')
    .select('id')
    .eq('block_id', blockId)
    .eq('status', 'active')
    .single()

  if (existing) return NextResponse.json({ error: 'This block already has an active auction' }, { status: 409 })

  const endsAt = new Date(Date.now() + hours * 3600 * 1000).toISOString()

  const { data: auction, error: auctionErr } = await db.from('auctions').insert({
    block_id:     block.id,
    origin_x:     block.origin_x,
    origin_y:     block.origin_y,
    block_size:   block.block_size,
    seller_email: sellerEmail,
    min_bid:      minBid,
    current_bid:  minBid,
    status:       'active',
    ends_at:      endsAt,
  }).select().single()

  if (auctionErr) return NextResponse.json({ error: auctionErr.message }, { status: 500 })

  // Log activity
  await logActivity(db, 'auction_created', req, {
    actor_email: sellerEmail,
    block_id:    block.id,
    auction_id:  auction.id,
    amount:      minBid,
    metadata:    { origin_x: block.origin_x, origin_y: block.origin_y, block_size: block.block_size, hours },
  })

  return NextResponse.json({ auction })
}
