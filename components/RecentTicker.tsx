'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Purchase = {
  company: string
  x: number
  y: number
  block_size: number
  price: number
  color: string
  created_at: string
}

export default function RecentTicker() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('blocks')
        .select('company, origin_x, origin_y, block_size, price, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) {
        // Get a color for each block from the first pixel
        const withColors = await Promise.all(data.map(async (b) => {
          const { data: px } = await supabase
            .from('pixels')
            .select('color')
            .eq('x', b.origin_x)
            .eq('y', b.origin_y)
            .single()
          return { ...b, x: b.origin_x, y: b.origin_y, color: px?.color ?? '#784BA0' }
        }))
        setPurchases(withColors)
      }
    }
    load()

    const channel = supabase.channel('ticker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blocks' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (purchases.length === 0) return null

  const items = [...purchases, ...purchases] // duplicate for seamless loop

  return (
    <div style={{
      background: '#050508',
      borderBottom: '1px solid #1a1a2e',
      height: '28px',
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to right, #050508, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to left, #050508, transparent)', zIndex: 2, pointerEvents: 'none' }} />

      <div ref={tickerRef} style={{
        display: 'flex', alignItems: 'center', height: '100%',
        animation: 'ticker-scroll 40s linear infinite',
        whiteSpace: 'nowrap',
        gap: '0',
      }}>
        <style>{`
          @keyframes ticker-scroll {
            0% { transform: translateX(0) }
            100% { transform: translateX(-50%) }
          }
        `}</style>
        {items.map((p, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 24px', fontSize: '10px', color: '#aaa', flexShrink: 0 }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: p.color, borderRadius: '1px', flexShrink: 0 }} />
            <span style={{ color: '#e0e0ff' }}>{p.company}</span>
            <span>bought</span>
            <span style={{ color: '#784BA0' }}>{p.block_size}×{p.block_size}</span>
            <span>at</span>
            <span style={{ color: '#4ECDC4' }}>[{p.x},{p.y}]</span>
            <span>for</span>
            <span style={{ color: '#FFD700' }}>${p.price}</span>
            <span style={{ color: '#444', margin: '0 8px' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
