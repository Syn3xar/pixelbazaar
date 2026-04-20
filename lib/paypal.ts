const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export { PAYPAL_BASE }

export async function getPayPalToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to get PayPal token')
  return data.access_token
}

export async function createPayPalOrder(params: {
  amountUSD: string
  description: string
  returnUrl: string
  cancelUrl: string
}) {
  const token = await getPayPalToken()
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: params.amountUSD },
        description: params.description,
      }],
      application_context: {
        brand_name: 'PixelBazaar',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  })
  const data = await res.json()
  const approveLink = data.links?.find((l: any) => l.rel === 'approve')?.href
  if (!approveLink) throw new Error('No approve link from PayPal')
  return { orderId: data.id, approveUrl: approveLink }
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getPayPalToken()
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  return res.json()
}
