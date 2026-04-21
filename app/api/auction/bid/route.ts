import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  const { auctionId, bidderName, bidderEmail, amount } = await req.json()
  const db = supabaseAdmin()

  // Fetch active auction with its block
  const { data: auction } = await db
    .from('auctions')
    .select('*, blocks(*)')
    .eq('id', auctionId)
    .eq('status', 'active')
    .single()

  if (!auction) return NextResponse.json({ error: 'Auction not found or has ended' }, { status: 404 })

  const minNext = Math.ceil((auction.current_bid ?? auction.min_bid) * 1.05)
  if (amount < minNext) return NextResponse.json({ error: `Minimum bid is $${minNext}` }, { status: 400 })

  // Record bid
  await db.from('bids').insert({
    auction_id:   auctionId,
    bidder_name:  bidderName,
    bidder_email: bidderEmail,
    amount,
  })

  // Update auction current bid
  await db.from('auctions').update({ current_bid: amount }).eq('id', auctionId)

  // Record platform fee (10% of bid)
  await db.from('transactions').insert({
    type:         'auction_bid',
    amount,
    platform_fee: amount * 0.1,
    block_id:     auction.block_id,
    origin_x:     auction.origin_x,
    origin_y:     auction.origin_y,
    block_size:   auction.block_size,
    buyer_email:  bidderEmail,
  })

  // If auction ending within 5 min, create PayPal checkout for winner
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const endsAt = new Date(auction.ends_at).getTime()
  let checkoutUrl = null

  if (endsAt - Date.now() < 5 * 60 * 1000) {
    const params = new URLSearchParams({
      auctionId:    String(auctionId),
      bidderName, bidderEmail,
      amount:       String(amount),
      blockId:      String(auction.block_id),
      originX:      String(auction.origin_x),
      originY:      String(auction.origin_y),
      blockSize:    String(auction.block_size),
    })
    try {
      const { approveUrl } = await createPayPalOrder({
        amountUSD:   amount.toFixed(2),
        description: `MillionDollarBoard auction win — ${auction.block_size}×${auction.block_size} block at [${auction.origin_x},${auction.origin_y}]`,
        returnUrl:   `${appUrl}/api/paypal/auction-capture?${params}`,
        cancelUrl:   `${appUrl}/`,
      })
      checkoutUrl = approveUrl
    } catch (e) {
      console.error('PayPal auction order error:', e)
    }
  }

  return NextResponse.json({ ok: true, checkoutUrl })
}
