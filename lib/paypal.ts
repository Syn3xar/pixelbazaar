function getPayPalBase() {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

export async function getPayPalToken(): Promise<string> {
  const base = getPayPalBase()
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !secret) throw new Error('PayPal credentials missing')

  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64')

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  const data = await res.json()
  if (!data.access_token) {
    console.error('PayPal token error:', JSON.stringify(data))
    throw new Error(`Failed to get PayPal token: ${data.error_description ?? data.error ?? 'unknown'}`)
  }
  return data.access_token
}

export async function createPayPalOrder(params: {
  amountUSD: string
  description: string
  returnUrl: string
  cancelUrl: string
}) {
  const base = getPayPalBase()
  const token = await getPayPalToken()
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: params.amountUSD },
        description: params.description,
      }],
      application_context: {
        brand_name: 'MillionDotBoard',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  })
  const data = await res.json()
  const approveLink = data.links?.find((l: any) => l.rel === 'approve')?.href
  if (!approveLink) {
    console.error('PayPal order error:', JSON.stringify(data))
    throw new Error('No approve link from PayPal')
  }
  return { orderId: data.id, approveUrl: approveLink }
}

export async function capturePayPalOrder(orderId: string) {
  const base = getPayPalBase()
  const token = await getPayPalToken()
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  return res.json()
}
