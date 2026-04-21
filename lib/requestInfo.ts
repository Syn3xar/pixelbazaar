import { NextRequest } from 'next/server'

export type RequestInfo = {
  ip_address: string
  country: string
  country_code: string
  city: string
  region: string
  timezone: string
  user_agent: string
  device_type: 'mobile' | 'desktop' | 'tablet'
  browser: string
  os: string
  referrer: string
}

export function getRequestInfo(req: NextRequest): RequestInfo {
  // ── IP Address ─────────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    req.headers.get('cf-connecting-ip') ?? // Cloudflare
    'unknown'

  // ── Geo info (provided by Vercel edge network) ─────────────────────────────
  const country      = req.headers.get('x-vercel-ip-country-region') ?? req.headers.get('x-country') ?? 'Unknown'
  const country_code = req.headers.get('x-vercel-ip-country') ?? req.headers.get('cf-ipcountry') ?? 'XX'
  const city         = req.headers.get('x-vercel-ip-city') ?? 'Unknown'
  const region       = req.headers.get('x-vercel-ip-country-region') ?? 'Unknown'
  const timezone     = req.headers.get('x-vercel-ip-timezone') ?? 'Unknown'

  // ── User Agent ─────────────────────────────────────────────────────────────
  const ua = req.headers.get('user-agent') ?? ''

  // ── Device type ────────────────────────────────────────────────────────────
  let device_type: 'mobile' | 'desktop' | 'tablet' = 'desktop'
  if (/tablet|ipad|playbook|silk/i.test(ua)) device_type = 'tablet'
  else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) device_type = 'mobile'

  // ── Browser ────────────────────────────────────────────────────────────────
  let browser = 'Unknown'
  if (/edg/i.test(ua)) browser = 'Edge'
  else if (/chrome/i.test(ua)) browser = 'Chrome'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/safari/i.test(ua)) browser = 'Safari'
  else if (/opera|opr/i.test(ua)) browser = 'Opera'
  else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer'

  // ── OS ─────────────────────────────────────────────────────────────────────
  let os = 'Unknown'
  if (/windows/i.test(ua)) os = 'Windows'
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS'
  else if (/linux/i.test(ua)) os = 'Linux'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'

  // ── Referrer ───────────────────────────────────────────────────────────────
  const referrer = req.headers.get('referer') ?? req.headers.get('referrer') ?? 'direct'

  return {
    ip_address: ip,
    country,
    country_code,
    city,
    region,
    timezone,
    user_agent: ua,
    device_type,
    browser,
    os,
    referrer,
  }
}

export async function logActivity(
  db: any,
  eventType: string,
  req: NextRequest,
  extra: {
    actor_email?: string
    actor_name?: string
    block_id?: number
    auction_id?: number
    amount?: number
    platform_fee?: number
    metadata?: Record<string, any>
  }
) {
  const reqInfo = getRequestInfo(req)
  await db.from('activity_log').insert({
    event_type:   eventType,
    actor_email:  extra.actor_email,
    actor_name:   extra.actor_name,
    block_id:     extra.block_id,
    auction_id:   extra.auction_id,
    amount:       extra.amount,
    platform_fee: extra.platform_fee,
    metadata:     extra.metadata ?? {},
    ...reqInfo,
  }).catch((e: any) => console.error('Activity log error:', e))
}
