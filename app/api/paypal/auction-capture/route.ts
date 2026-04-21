import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const orderId   = searchParams.get('token')
  const auctionId = searchParams.get('auctionId')
  const bidderName  = searchParams.get('bidderName') ?? ''
  const bidderEmail = searchParams.get('bidderEmail') ?? ''
  const amount    = Number(searchParams.get('amount'))
  const blockId   = Number(searchParams.get('blockId'))
  const originX   = Number(searchParams.get('originX'))
  const originY   = Number(searchParams.get('originY'))
  const blockSize = Number(searchParams.get('blockSize'))

  if (!orderId || !auctionId) return NextResponse.redirect(`${appUrl}/?error=missing_params`)

  try {
    const capture = await capturePayPalOrder(orderId)
    if (capture.status !== 'COMPLETED') return NextResponse.redirect(`${appUrl}/?error=payment_failed`)

    const db = supabaseAdmin()

    // 1. Transfer block ownership
    await db.from('blocks').update({
      company:     bidderName,
      owner_email: bidderEmail,
      price:       amount,
    }).eq('id', blockId)

    // 2. Update ALL pixels in this block to new owner
    await db.from('pixels').update({
      company:     bidderName,
      owner_email: bidderEmail,
      price:       amount / (blockSize * blockSize),
    }).eq('block_id', blockId)

    // 3. Close the auction
    await db.from('auctions').update({
      status:       'ended',
      winner_email: bidderEmail,
      current_bid:  amount,
    }).eq('id', Number(auctionId))

    // 4. Record transaction
    await db.from('transactions').insert({
      type:         'auction_win',
      amount,
      platform_fee: amount * 0.1,
      paypal_order: orderId,
      block_id:     blockId,
      origin_x:     originX,
      origin_y:     originY,
      block_size:   blockSize,
      buyer_email:  bidderEmail,
    })

    return NextResponse.redirect(`${appUrl}/success?order=${orderId}`)
  } catch (err) {
    console.error('Auction capture error:', err)
    return NextResponse.redirect(`${appUrl}/?error=capture_failed`)
  }
}
