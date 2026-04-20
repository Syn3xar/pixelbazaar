import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const orderId = searchParams.get('token')
  const auctionId = searchParams.get('auctionId')
  const bidderName = searchParams.get('bidderName') ?? ''
  const bidderEmail = searchParams.get('bidderEmail') ?? ''
  const amount = Number(searchParams.get('amount'))
  const pixelX = Number(searchParams.get('pixelX'))
  const pixelY = Number(searchParams.get('pixelY'))

  if (!orderId || !auctionId) return NextResponse.redirect(`${appUrl}/?error=missing_params`)

  try {
    const capture = await capturePayPalOrder(orderId)
    if (capture.status !== 'COMPLETED') return NextResponse.redirect(`${appUrl}/?error=payment_failed`)

    const db = supabaseAdmin()

    await db.from('pixels').update({
      company: bidderName,
      owner_email: bidderEmail,
      price: amount,
    }).eq('x', pixelX).eq('y', pixelY)

    await db.from('auctions').update({
      status: 'ended',
      winner_email: bidderEmail,
      current_bid: amount,
    }).eq('id', Number(auctionId))

    await db.from('transactions').insert({
      type: 'auction_win',
      amount,
      platform_fee: amount * 0.1,
      stripe_session: orderId,
      pixel_x: pixelX,
      pixel_y: pixelY,
      buyer_email: bidderEmail,
    })

    return NextResponse.redirect(`${appUrl}/success?order=${orderId}`)
  } catch (err) {
    console.error('Auction capture error:', err)
    return NextResponse.redirect(`${appUrl}/?error=capture_failed`)
  }
}
