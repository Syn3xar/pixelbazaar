'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Block = {
  id: number
  origin_x: number
  origin_y: number
  block_size: number
  company: string
  url: string
  price: number
  created_at: string
  color?: string
  auction?: { status: string; current_bid: number; ends_at: string } | null
}

export default function MyPixelsPage() {
  const [email, setEmail] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function search() {
    if (!email.trim()) return
    setLoading(true)
    setSearched(false)

    const { data: blockData } = await supabase
      .from('blocks')
      .select('*, auctions(status, current_bid, ends_at)')
      .eq('owner_email', email.trim().toLowerCase())
      .order('created_at', { ascending: false })

    if (blockData) {
      const withColors = await Promise.all(blockData.map(async (b) => {
        const { data: px } = await supabase
          .from('pixels').select('color').eq('x', b.origin_x).eq('y', b.origin_y).single()
        const activeAuction = (b.auctions as any[])?.find((a: any) => a.status === 'active') ?? null
        return { ...b, color: px?.color ?? '#784BA0', auction: activeAuction }
      }))
      setBlocks(withColors)
    }
    setLoading(false)
    setSearched(true)
  }

  const totalValue = blocks.reduce((s, b) => s + b.price, 0)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px', fontFamily: "'Space Mono', monospace", color: '#e0e0ff', background: '#08080f', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />

      <a href="/" style={{ color: '#784BA0', fontSize: '12px', textDecoration: 'none', letterSpacing: '0.1em' }}>← Back to Board</a>

      <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '22px', margin: '24px 0 4px' }}>
        <span style={{ color: '#784BA0' }}>MY</span>
        <span style={{ color: '#e0e0ff' }}> PIXELS</span>
      </div>
      <p style={{ color: '#555', fontSize: '12px', marginBottom: '32px' }}>Enter your email to see all your pixel blocks</p>

      {/* Search */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="you@company.com"
          style={{ flex: 1, background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#e0e0ff', padding: '12px 16px', fontFamily: 'inherit', fontSize: '13px', borderRadius: '2px', outline: 'none' }}
        />
        <button onClick={search} disabled={loading} style={{ background: '#784BA0', color: '#fff', border: 'none', padding: '12px 24px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', letterSpacing: '0.08em', borderRadius: '2px' }}>
          {loading ? 'Searching...' : 'Search →'}
        </button>
      </div>

      {/* Results */}
      {searched && blocks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#444' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>◻</div>
          <div>No pixels found for this email.</div>
          <a href="/" style={{ color: '#784BA0', fontSize: '12px', marginTop: '16px', display: 'inline-block' }}>Buy your first pixel →</a>
        </div>
      )}

      {blocks.length > 0 && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
            {[
              ['Total Blocks', blocks.length, '#784BA0'],
              ['Total Pixels', blocks.reduce((s, b) => s + b.block_size * b.block_size, 0).toLocaleString(), '#4ECDC4'],
              ['Total Spent', '$' + totalValue.toFixed(2), '#FFD700'],
            ].map(([label, val, color]) => (
              <div key={label as string} style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '16px' }}>
                <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '20px', color: color as string }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Block list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {blocks.map(b => (
              <div key={b.id} style={{ background: '#0f0f1a', border: `1px solid ${b.auction ? '#FF6B6B33' : '#1a1a2e'}`, borderRadius: '2px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Color swatch */}
                <div style={{ width: '40px', height: '40px', background: b.color, borderRadius: '2px', flexShrink: 0 }} />

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e0e0ff', fontWeight: 'bold', marginBottom: '4px' }}>{b.company}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#555', flexWrap: 'wrap' }}>
                    <span>📍 [{b.origin_x}, {b.origin_y}]</span>
                    <span>📐 {b.block_size}×{b.block_size} ({(b.block_size*b.block_size).toLocaleString()} px)</span>
                    <span>💰 ${b.price}</span>
                    <span>📅 {new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: '#784BA0', fontSize: '10px' }}>{b.url}</a>
                </div>

                {/* Auction badge / actions */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {b.auction ? (
                    <div style={{ background: '#FF6B6B22', border: '1px solid #FF6B6B44', borderRadius: '2px', padding: '6px 10px' }}>
                      <div style={{ color: '#FF6B6B', fontSize: '10px', marginBottom: '2px' }}>⚡ Auction Live</div>
                      <div style={{ color: '#FFD700', fontSize: '12px' }}>${b.auction.current_bid}</div>
                    </div>
                  ) : (
                    <a href={`/?inspect=${b.origin_x},${b.origin_y}`} style={{ background: '#784BA020', border: '1px solid #784BA044', borderRadius: '2px', padding: '6px 10px', color: '#784BA0', fontSize: '10px', textDecoration: 'none', display: 'block' }}>
                      View on board →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: '24px', marginTop: '40px', fontSize: '10px', color: '#333', textAlign: 'center' }}>
        <div style={{ marginBottom: '8px' }}>
          <a href="/terms" style={{ color: '#333', marginRight: '16px', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#333', marginRight: '16px', textDecoration: 'none' }}>Privacy</a>
          <a href="/refund" style={{ color: '#333', textDecoration: 'none' }}>Refund Policy</a>
        </div>
        © 2026 MillionDotBoard
      </div>
    </div>
  )
}
