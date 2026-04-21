'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Stats = {
  totalPixels: number
  totalBlocks: number
  totalRevenue: number
  activeAuctions: number
  recentTransactions: any[]
  topBuyers: any[]
  recentBlocks: any[]
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)

  async function login() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) setAuthed(true)
    else alert('Wrong password')
  }

  async function loadStats() {
    setLoading(true)
    const [pixels, blocks, txns, auctions] = await Promise.all([
      supabase.from('pixels').select('id', { count: 'exact', head: true }),
      supabase.from('blocks').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('auctions').select('*').eq('status', 'active'),
    ])
    const recentBlocks = await supabase.from('blocks').select('*').order('created_at', { ascending: false }).limit(10)
    const totalRevenue = txns.data?.reduce((s, t) => s + Number(t.platform_fee), 0) ?? 0
    const buyerMap: Record<string, number> = {}
    txns.data?.forEach(t => { if (t.buyer_email) buyerMap[t.buyer_email] = (buyerMap[t.buyer_email] ?? 0) + Number(t.amount) })
    const topBuyers = Object.entries(buyerMap).sort(([,a],[,b]) => b - a).slice(0, 5).map(([email, amount]) => ({ email, amount }))
    setStats({ totalPixels: pixels.count ?? 0, totalBlocks: blocks.count ?? 0, totalRevenue, activeAuctions: auctions.data?.length ?? 0, recentTransactions: txns.data ?? [], topBuyers, recentBlocks: recentBlocks.data ?? [] })
    setLoading(false)
  }

  useEffect(() => { if (authed) loadStats() }, [authed])

  if (!authed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#08080f', fontFamily: "'Space Mono', monospace" }}>
      <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '2px', padding: '40px', width: '320px' }}>
        <div style={{ color: '#784BA0', fontSize: '11px', letterSpacing: '0.2em', marginBottom: '24px', textTransform: 'uppercase' }}>Admin Access</div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Password"
          style={{ width: '100%', background: '#111118', border: '1px solid #2a2a3e', color: '#e0e0ff', padding: '10px 12px', fontFamily: 'inherit', fontSize: '13px', borderRadius: '2px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '12px' }} />
        <button onClick={login}
          style={{ width: '100%', background: '#784BA0', color: '#fff', border: 'none', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', borderRadius: '2px' }}>
          Enter →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#08080f', minHeight: '100vh', fontFamily: "'Space Mono', monospace", color: '#e0e0ff', padding: '24px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '20px' }}>
          <span style={{ color: '#784BA0' }}>ADMIN</span><span style={{ color: '#e0e0ff' }}> DASHBOARD</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={loadStats} style={{ background: '#111118', border: '1px solid #2a2a3e', color: '#888', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', borderRadius: '2px' }}>↻ Refresh</button>
          <a href="/" style={{ background: '#111118', border: '1px solid #2a2a3e', color: '#888', padding: '6px 14px', fontFamily: 'inherit', fontSize: '11px', borderRadius: '2px', textDecoration: 'none' }}>← Board</a>
        </div>
      </div>

      {loading && <div style={{ color: '#555', textAlign: 'center', padding: '40px' }}>Loading...</div>}

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              ['Total Pixels Sold', stats.totalPixels.toLocaleString(), '#784BA0'],
              ['Total Blocks', stats.totalBlocks.toLocaleString(), '#4ECDC4'],
              ['Platform Revenue', '$' + stats.totalRevenue.toFixed(2), '#92FE9D'],
              ['Live Auctions', stats.activeAuctions.toString(), '#FF6B6B'],
            ].map(([label, val, color]) => (
              <div key={label as string} style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '20px' }}>
                <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '24px', color: color as string, fontWeight: 'bold' }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '20px' }}>
              <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' }}>Recent Purchases</div>
              {stats.recentBlocks.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #111118', fontSize: '11px' }}>
                  <div>
                    <div style={{ color: '#e0e0ff' }}>{b.company}</div>
                    <div style={{ color: '#555', fontSize: '9px' }}>[{b.origin_x},{b.origin_y}] · {b.block_size}×{b.block_size}</div>
                  </div>
                  <div style={{ color: '#FFD700' }}>${b.price}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '20px' }}>
              <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' }}>Top Buyers</div>
              {stats.topBuyers.length === 0 && <div style={{ color: '#444', fontSize: '11px' }}>No purchases yet</div>}
              {stats.topBuyers.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #111118', fontSize: '11px' }}>
                  <div style={{ color: '#e0e0ff' }}>#{i+1} {b.email}</div>
                  <div style={{ color: '#92FE9D' }}>${b.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '20px' }}>
            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' }}>Recent Transactions</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a2e' }}>
                  {['Type', 'Amount', 'Platform Fee', 'Buyer', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#444', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #0a0a14' }}>
                    <td style={{ padding: '8px', color: t.type === 'pixel_purchase' ? '#4ECDC4' : t.type === 'auction_win' ? '#FFD700' : '#784BA0' }}>{t.type}</td>
                    <td style={{ padding: '8px', color: '#e0e0ff' }}>${Number(t.amount).toFixed(2)}</td>
                    <td style={{ padding: '8px', color: '#92FE9D' }}>${Number(t.platform_fee).toFixed(2)}</td>
                    <td style={{ padding: '8px', color: '#555' }}>{t.buyer_email}</td>
                    <td style={{ padding: '8px', color: '#444' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
