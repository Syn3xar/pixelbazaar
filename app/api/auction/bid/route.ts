import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  const { auctionId, bidderName, bidderEmail, amount } = await req.json()
  const db = supabaseAdmin()

  // Fetch active auction
  const { data: auction } = await db
    .from('auctions')
    .select('*')
    .eq('id', auctionId)
    .eq('status', 'active')
    .single()

  if (!auction) return NextResponse.json({ error: 'Auction not found or ended' }, { status: 404 })

  const minNext = Math.ceil((auction.current_bid ?? auction.min_bid) * 1.05)
  if (amount < minNext) return NextResponse.json({ error: `Minimum bid is $${minNext}` }, { status: 400 })

  // Save bid to database
  await db.from('bids').insert({
    auction_id: auctionId,
    bidder_name: bidderName,
    bidder_email: bidderEmail,
    amount,
  })

  // Update current bid on auction
  await db.from('auctions').update({ current_bid: amount }).eq('id', auctionId)

  // Record platform fee (10% of bid amount)
  await db.from('transactions').insert({
    type: 'auction_bid',
    amount,
    platform_fee: amount * 0.1,
    pixel_x: auction.pixel_x,
    pixel_y: auction.pixel_y,
    buyer_email: bidderEmail,
  })

  // If auction ends within 5 minutes, redirect winner to PayPal to pay
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const endsAt = new Date(auction.ends_at).getTime()
  let checkoutUrl = null

  if (endsAt - Date.now() < 5 * 60 * 1000) {
    const params = new URLSearchParams({
      auctionId: String(auctionId),
      bidderName, bidderEmail,
      amount: String(amount),
      pixelX: String(auction.pixel_x),
      pixelY: String(auction.pixel_y),
    })
    try {
      const { approveUrl } = await createPayPalOrder({
        amountUSD: amount.toFixed(2),
        description: `PixelBazaar auction win — Pixel [${auction.pixel_x},${auction.pixel_y}]`,
        returnUrl: `${appUrl}/api/paypal/auction-capture?${params}`,
        cancelUrl: `${appUrl}/`,
      })
      checkoutUrl = approveUrl
    } catch (e) {
      console.error('PayPal auction order error:', e)
    }
  }

  return NextResponse.json({ ok: true, checkoutUrl })
}
