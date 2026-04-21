'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Auction = {
  id: number
  block_id: number
  origin_x: number
  origin_y: number
  block_size: number
  seller_email: string
  min_bid: number
  current_bid: number
  winner_email: string | null
  status: string
  ends_at: string
  created_at: string
  bids: { bidder_name: string; bidder_email: string; amount: number; created_at: string }[]
  blocks?: { company: string; url: string; color?: string }
}

function fmtTime(ms: number) {
  if (ms <= 0) return 'Ended'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [ms, setMs] = useState(new Date(endsAt).getTime() - Date.now())
  useEffect(() => {
    const id = setInterval(() => setMs(new Date(endsAt).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  const urgent = ms < 300000 // < 5 min
  const ended = ms <= 0
  return (
    <span style={{
      color: ended ? '#555' : urgent ? '#FF6B6B' : '#4ECDC4',
      fontFamily: "'Space Mono', monospace",
      fontSize: '13px', fontWeight: 'bold',
      animation: urgent && !ended ? 'pulse 1s infinite' : 'none',
    }}>
      {ended ? '⏱ Ended' : `⏱ ${fmtTime(ms)}`}
    </span>
  )
}

export default function AuctionsPage() {
  const [active, setActive] = useState<Auction[]>([])
  const [ended, setEnded] = useState<Auction[]>([])
  const [tab, setTab] = useState<'active' | 'ended'>('active')
  const [bidForms, setBidForms] = useState<Record<number, { name: string; email: string; amount: string }>>({})
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [pixelColors, setPixelColors] = useState<Record<number, string>>({})

  async function load() {
    const { data } = await supabase
      .from('auctions')
      .select('*, bids(*), blocks(company, url)')
      .order('created_at', { ascending: false })

    if (!data) return

    const activeList = data.filter(a => a.status === 'active')
    const endedList  = data.filter(a => a.status === 'ended')

    setActive(activeList)
    setEnded(endedList)

    // Load pixel colors
    const colors: Record<number, string> = {}
    await Promise.all(data.map(async a => {
      const { data: px } = await supabase.from('pixels').select('color').eq('x', a.origin_x).eq('y', a.origin_y).single()
      if (px) colors[a.id] = px.color
    }))
    setPixelColors(colors)
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('auctions-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function placeBid(auction: Auction) {
    const form = bidForms[auction.id]
    if (!form?.name || !form?.email || !form?.amount) return alert('Fill in all fields')
    const amount = Number(form.amount)
    if (amount < auction.current_bid * 1.05) return alert(`Minimum bid is $${(auction.current_bid * 1.05).toFixed(2)}`)

    setLoading(l => ({ ...l, [auction.id]: true }))
    try {
      const res = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId: auction.id, bidderName: form.name, bidderEmail: form.email, amount }),
      })
      const data = await res.json()
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
      else { alert('Bid placed! You are now the highest bidder.'); load() }
    } catch { alert('Error placing bid') }
    setLoading(l => ({ ...l, [auction.id]: false }))
  }

  const inp = { background: '#0a0a14', border: '1px solid #1a1a2e', color: '#e0e0ff', padding: '7px 10px', fontFamily: "'Space Mono', monospace", fontSize: '11px', borderRadius: '2px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }
  const list = tab === 'active' ? active : ended

  return (
    <div style={{ background: '#08080f', minHeight: '100vh', fontFamily: "'Space Mono', monospace", color: '#e0e0ff' }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#050508', borderBottom: '1px solid #1a1a2e', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '18px' }}>
          <span style={{ color: '#784BA0' }}>LIVE</span>
          <span style={{ color: '#e0e0ff' }}> AUCTIONS</span>
        </div>
        <a href="/" style={{ color: '#999', fontSize: '11px', textDecoration: 'none' }}>← Back to Board</a>
      </div>

      {/* Tabs */}
      <div style={{ background: '#050508', borderBottom: '1px solid #1a1a2e', padding: '0 32px', display: 'flex', gap: '0' }}>
        {[
          { id: 'active', label: `⚡ Active (${active.length})` },
          { id: 'ended', label: `✓ Ended (${ended.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '12px 20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent', border: 'none', letterSpacing: '0.06em',
            color: tab === t.id ? '#e0e0ff' : '#555',
            borderBottom: tab === t.id ? '2px solid #784BA0' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
        {list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#444' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <div>{tab === 'active' ? 'No active auctions right now.' : 'No ended auctions yet.'}</div>
            <a href="/" style={{ color: '#784BA0', fontSize: '12px', marginTop: '12px', display: 'inline-block' }}>Go to board →</a>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {list.map(a => {
            const form = bidForms[a.id] ?? { name: '', email: '', amount: String(Math.ceil(a.current_bid * 1.05)) }
            const sortedBids = [...(a.bids ?? [])].sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime())
            const color = pixelColors[a.id] ?? '#784BA0'
            const ended = a.status === 'ended'

            return (
              <div key={a.id} style={{ background: '#0f0f1a', border: `1px solid ${ended ? '#1a1a2e' : '#FF6B6B33'}`, borderRadius: '2px', overflow: 'hidden' }}>
                {/* Auction header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', borderBottom: '1px solid #111118' }}>
                  <div style={{ width: '48px', height: '48px', background: color, borderRadius: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e0e0ff', marginBottom: '4px' }}>
                      {a.blocks?.company ?? 'Unknown'}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#555', flexWrap: 'wrap' }}>
                      <span>📍 [{a.origin_x}, {a.origin_y}]</span>
                      <span>📐 {a.block_size}×{a.block_size} ({(a.block_size*a.block_size).toLocaleString()} pixels)</span>
                      <span>🏁 Min bid: ${a.min_bid}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '24px', color: '#FFD700', fontWeight: 'bold', marginBottom: '4px' }}>
                      ${a.current_bid.toFixed(2)}
                    </div>
                    <Countdown endsAt={a.ends_at} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: ended ? '1fr' : '1fr 1fr', gap: '0' }}>
                  {/* Bid history */}
                  <div style={{ padding: '16px 24px', borderRight: ended ? 'none' : '1px solid #111118' }}>
                    <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>
                      Bid History ({sortedBids.length})
                    </div>
                    {sortedBids.length === 0 && <div style={{ color: '#999', fontSize: '11px' }}>No bids yet — be the first!</div>}
                    <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                      {sortedBids.map((b, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #0a0a14', fontSize: '11px' }}>
                          <div>
                            <span style={{ color: i === 0 ? '#FFD700' : '#e0e0ff' }}>{i === 0 ? '👑 ' : ''}{b.bidder_name}</span>
                            <span style={{ color: '#888', fontSize: '9px', marginLeft: '8px' }}>{new Date(b.created_at).toLocaleTimeString()}</span>
                          </div>
                          <span style={{ color: i === 0 ? '#FFD700' : '#92FE9D' }}>${Number(b.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Winner display for ended auctions */}
                    {ended && a.winner_email && (
                      <div style={{ marginTop: '12px', background: '#FFD70011', border: '1px solid #FFD70033', borderRadius: '2px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ color: '#FFD700', fontSize: '18px', marginBottom: '4px' }}>🏆 Auction Won!</div>
                        <div style={{ color: '#e0e0ff', fontSize: '11px' }}>Winner: {sortedBids[0]?.bidder_name ?? 'Unknown'}</div>
                        <div style={{ color: '#92FE9D', fontSize: '14px', marginTop: '4px' }}>${a.current_bid.toFixed(2)}</div>
                      </div>
                    )}
                  </div>

                  {/* Bid form (active auctions only) */}
                  {!ended && (
                    <div style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>
                        Place Your Bid (min ${(a.current_bid * 1.05).toFixed(2)})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input placeholder="Your name / company" value={form.name} onChange={e => setBidForms(f => ({ ...f, [a.id]: { ...form, name: e.target.value } }))} style={inp} />
                        <input placeholder="Your email" type="email" value={form.email} onChange={e => setBidForms(f => ({ ...f, [a.id]: { ...form, email: e.target.value } }))} style={inp} />
                        <input placeholder="Bid amount ($)" type="number" value={form.amount} min={Math.ceil(a.current_bid * 1.05)} onChange={e => setBidForms(f => ({ ...f, [a.id]: { ...form, amount: e.target.value } }))} style={inp} />
                        <button onClick={() => placeBid(a)} disabled={loading[a.id]} style={{ background: loading[a.id] ? '#444' : '#784BA0', color: '#fff', border: 'none', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', borderRadius: '2px', letterSpacing: '0.06em' }}>
                          {loading[a.id] ? 'Processing...' : `Bid $${form.amount} →`}
                        </button>
                        <div style={{ fontSize: '9px', color: '#444', textAlign: 'center' }}>10% platform fee • Bids are binding</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
