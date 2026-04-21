const PADDLE_BASE = process.env.PADDLE_ENV === 'production'
  ? 'https://api.paddle.com'
  : 'https://sandbox-api.paddle.com'

export async function createPaddleTransaction(params: {
  priceId: string
  quantity: number
  customData: Record<string, string>
  returnUrl: string
}) {
  const res = await fetch(`${PADDLE_BASE}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ price_id: params.priceId, quantity: params.quantity }],
      custom_data: params.customData,
      checkout: { url: params.returnUrl },
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.detail ?? 'Paddle error')
  return data.data
}
