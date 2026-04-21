'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Block = {
  id: number
  origin_x: number
  origin_y: number
  block_size: number
  company: string
  url: string
  price: number
  owner_email: string
  created_at: string
  color?: string
}

export default function RankingsPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [tab, setTab] = useState<'expensive' | 'recent' | 'largest'>('expensive')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('blocks').select('*').order('price', { ascending: false }).limit(100)
      if (!data) return

      const withColors = await Promise.all(data.map(async b => {
        const { data: px } = await supabase.from('pixels').select('color').eq('x', b.origin_x).eq('y', b.origin_y).single()
        return { ...b, color: px?.color ?? '#784BA0' }
      }))
      setBlocks(withColors)
      setLoading(false)
    }
    load()
  }, [])

  const sorted = [...blocks].sort((a, b) => {
    if (tab === 'expensive') return b.price - a.price
    if (tab === 'largest') return (b.block_size * b.block_size) - (a.block_size * a.block_size)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ background: '#08080f', minHeight: '100vh', fontFamily: "'Space Mono', monospace", color: '#e0e0ff' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#050508', borderBottom: '1px solid #1a1a2e', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '18px' }}>
          <span style={{ color: '#FFD700' }}>PIXEL</span>
          <span style={{ color: '#e0e0ff' }}> RANKINGS</span>
        </div>
        <a href="/" style={{ color: '#999', fontSize: '11px', textDecoration: 'none' }}>← Back to Board</a>
      </div>

      {/* Tabs */}
      <div style={{ background: '#050508', borderBottom: '1px solid #1a1a2e', padding: '0 32px', display: 'flex' }}>
        {[
          { id: 'expensive', label: '💰 Most Expensive' },
          { id: 'largest', label: '📐 Largest Blocks' },
          { id: 'recent', label: '🕐 Most Recent' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '12px 20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent', border: 'none', letterSpacing: '0.06em',
            color: tab === t.id ? '#e0e0ff' : '#555',
            borderBottom: tab === t.id ? '2px solid #FFD700' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>Loading rankings...</div>}

        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: '#444' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <div>No pixels sold yet. Be the first!</div>
            <a href="/" style={{ color: '#784BA0', marginTop: '12px', display: 'inline-block', fontSize: '12px' }}>Buy a pixel →</a>
          </div>
        )}

        {/* Top 3 podium */}
        {!loading && sorted.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            {[sorted[1], sorted[0], sorted[2]].map((b, i) => {
              if (!b) return null
              const rank = i === 1 ? 0 : i === 0 ? 1 : 2
              const heights = ['180px', '220px', '160px']
              return (
                <div key={b.id} style={{ background: '#0f0f1a', border: `1px solid ${rank === 0 ? '#FFD700' : rank === 1 ? '#C0C0C0' : '#CD7F32'}33`, borderRadius: '2px', padding: '20px', textAlign: 'center', alignSelf: 'flex-end', minHeight: heights[i] }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{medals[rank]}</div>
                  <div style={{ width: '40px', height: '40px', background: b.color, borderRadius: '2px', margin: '0 auto 10px' }} />
                  <div style={{ color: '#e0e0ff', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>{b.company}</div>
                  <div style={{ color: '#FFD700', fontSize: rank === 0 ? '20px' : '16px', fontWeight: 'bold' }}>${b.price.toFixed(2)}</div>
                  <div style={{ color: '#888', fontSize: '9px', marginTop: '4px' }}>{b.block_size}×{b.block_size} block</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full list */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sorted.map((b, i) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '14px 20px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2a3e')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1a2e')}>
                <div style={{ width: '32px', textAlign: 'center', fontSize: '14px', color: i < 3 ? '#FFD700' : '#555', flexShrink: 0 }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>
                <div style={{ width: '32px', height: '32px', background: b.color, borderRadius: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e0e0ff', fontWeight: 'bold', fontSize: '13px', marginBottom: '3px' }}>{b.company}</div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '9px', color: '#555' }}>
                    <span>📍 [{b.origin_x}, {b.origin_y}]</span>
                    <span>📐 {b.block_size}×{b.block_size}</span>
                    <span>📅 {new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: '#999', fontSize: '10px', textDecoration: 'none', marginRight: '12px' }}>
                  {b.url.replace('https://', '').replace('http://', '').slice(0, 20)}
                </a>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#FFD700', fontSize: '16px', fontWeight: 'bold' }}>${b.price.toFixed(2)}</div>
                  <div style={{ color: '#888', fontSize: '9px' }}>{(b.block_size*b.block_size).toLocaleString()} pixels</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
