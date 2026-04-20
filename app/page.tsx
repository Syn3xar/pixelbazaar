'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import PixelPanel from '@/components/PixelPanel'
import BuyModal from '@/components/BuyModal'
import AuctionModal from '@/components/AuctionModal'
import BidModal from '@/components/BidModal'
import StatsBar from '@/components/StatsBar'

const GRID = 1000
const PLATFORM_FEE = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE ?? 0.1)

export type Pixel = {
  x: number; y: number; company: string; url: string
  color: string; price: number; owner_email: string
  auction?: {
    id: number; active: boolean; endTime: number
    currentBid: number; minNext: number
    bids: { bidder: string; amount: number }[]
  }
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pixelMap, setPixelMap] = useState<Record<string, Pixel>>({})
  const [revenue, setRevenue] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [selectedCoord, setSelectedCoord] = useState<[number, number] | null>(null)
  const [modal, setModal] = useState<null | 'buy' | 'auction' | 'bid'>(null)
  const [auctionTarget, setAuctionTarget] = useState<{ pixel: Pixel; x: number; y: number } | null>(null)
  const [bidTarget, setBidTarget] = useState<{ pixel: Pixel; x: number; y: number } | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; pixel: Pixel } | null>(null)
  const isDragged = useRef(false)

  // ── Load pixels from Supabase ──────────────────────────────────────────────
  useEffect(() => {
    async function loadPixels() {
      const { data: pixels } = await supabase.from('pixels').select('*')
      const { data: auctions } = await supabase.from('auctions').select('*, bids(*)').eq('status', 'active')
      const { data: txns } = await supabase.from('transactions').select('platform_fee')

      const map: Record<string, Pixel> = {}
      pixels?.forEach((p) => {
        map[`${p.x},${p.y}`] = { x: p.x, y: p.y, company: p.company, url: p.url, color: p.color, price: p.price, owner_email: p.owner_email }
      })
      auctions?.forEach((a) => {
        const key = `${a.pixel_x},${a.pixel_y}`
        if (map[key]) {
          map[key].auction = {
            id: a.id, active: true, endTime: new Date(a.ends_at).getTime(),
            currentBid: a.current_bid ?? a.min_bid,
            minNext: Math.ceil((a.current_bid ?? a.min_bid) * 1.05),
            bids: (a.bids ?? []).map((b: any) => ({ bidder: b.bidder_name, amount: b.amount })),
          }
        }
      })
      setPixelMap(map)
      const totalRevenue = txns?.reduce((s, t) => s + Number(t.platform_fee), 0) ?? 0
      setRevenue(totalRevenue)
    }
    loadPixels()

    // Real-time updates from Supabase
    const channel = supabase.channel('pixel-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pixels' }, () => loadPixels())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, () => loadPixels())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => loadPixels())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── Canvas render ──────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#08080f'
    ctx.fillRect(0, 0, W, H)

    const pxSize = zoom
    const startX = Math.max(0, Math.floor(-offset.x / pxSize))
    const startY = Math.max(0, Math.floor(-offset.y / pxSize))
    const endX = Math.min(GRID, startX + Math.ceil(W / pxSize) + 1)
    const endY = Math.min(GRID, startY + Math.ceil(H / pxSize) + 1)

    // Draw grid at all zoom levels — faint at low zoom, more visible when zoomed in
    if (pxSize >= 2) {
      const gridOpacity = pxSize >= 8 ? 0.25 : pxSize >= 4 ? 0.12 : 0.06
      ctx.strokeStyle = `rgba(255,255,255,${gridOpacity})`
      ctx.lineWidth = 0.5

      // At low zoom, draw every Nth line to avoid overdrawing millions of lines
      const step = pxSize < 1 ? Math.ceil(10 / pxSize) : 1

      for (let gx = startX; gx <= endX; gx += step) {
        ctx.beginPath(); ctx.moveTo(offset.x + gx * pxSize, 0); ctx.lineTo(offset.x + gx * pxSize, H); ctx.stroke()
      }
      for (let gy = startY; gy <= endY; gy += step) {
        ctx.beginPath(); ctx.moveTo(0, offset.y + gy * pxSize); ctx.lineTo(W, offset.y + gy * pxSize); ctx.stroke()
      }
    } else {
      // At extreme zoom out, draw a subtle dot grid pattern instead
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      const step = Math.ceil(50 / Math.max(pxSize, 0.1))
      for (let gx = startX; gx <= endX; gx += step) {
        for (let gy = startY; gy <= endY; gy += step) {
          ctx.fillRect(offset.x + gx * pxSize, offset.y + gy * pxSize, 1, 1)
        }
      }
    }

    for (let gy = startY; gy < endY; gy++) {
      for (let gx = startX; gx < endX; gx++) {
        const p = pixelMap[`${gx},${gy}`]
        if (!p) continue
        const sx = offset.x + gx * pxSize
        const sy = offset.y + gy * pxSize
        ctx.fillStyle = p.color
        ctx.fillRect(sx, sy, pxSize + 0.5, pxSize + 0.5)
        if (p.auction?.active) {
          const t = (Date.now() % 1200) / 1200
          ctx.fillStyle = `rgba(255,107,107,${0.15 + 0.15 * Math.sin(t * Math.PI * 2)})`
          ctx.fillRect(sx, sy, pxSize + 0.5, pxSize + 0.5)
        }
      }
    }

    if (selectedCoord) {
      const px = offset.x + selectedCoord[0] * pxSize
      const py = offset.y + selectedCoord[1] * pxSize
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, pxSize * 0.08)
      ctx.strokeRect(px, py, pxSize, pxSize)
    }
  }, [pixelMap, zoom, offset, selectedCoord])

  useEffect(() => {
    let raf: number
    const loop = () => { render(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [render])

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current
      if (!c) return
      c.width = c.offsetWidth; c.height = c.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const coordFromEvent = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [Math.floor((e.clientX - rect.left - offset.x) / zoom), Math.floor((e.clientY - rect.top - offset.y) / zoom)]
  }

  const onMouseDown = (e: React.MouseEvent) => {
    isDragged.current = false
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragging && dragStart) {
      isDragged.current = true
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    } else {
      const [gx, gy] = coordFromEvent(e)
      const p = pixelMap[`${gx},${gy}`]
      setTooltip(p ? { x: e.clientX, y: e.clientY, pixel: p } : null)
    }
  }

  const onMouseUp = (e: React.MouseEvent) => {
    setDragging(false)
    if (!isDragged.current) {
      const [gx, gy] = coordFromEvent(e)
      if (gx >= 0 && gx < GRID && gy >= 0 && gy < GRID) setSelectedCoord([gx, gy])
    }
    setDragStart(null)
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    const newZoom = Math.min(80, Math.max(0.3, zoom * factor))
    const scale = newZoom / zoom
    setOffset(o => ({ x: mx - (mx - o.x) * scale, y: my - (my - o.y) * scale }))
    setZoom(newZoom)
  }

  const selectedPixel = selectedCoord ? pixelMap[`${selectedCoord[0]},${selectedCoord[1]}`] : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#08080f', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', background: '#050508', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '18px' }}>
            <span style={{ color: '#784BA0' }}>MILLION</span>
            <span style={{ color: '#e0e0ff' }}>DOLLARBOARD</span>
            <span style={{ color: '#FF6B6B', fontSize: '10px', verticalAlign: 'super', marginLeft: '2px' }}>×10⁶</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#1a1a2e' }} />
          <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.1em' }}>1,000,000 PIXEL MARKETPLACE</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#444' }}>ZOOM: {zoom.toFixed(1)}×</span>
          {[['＋', 1.5], ['－', 1/1.5]].map(([label, f]) => (
            <button key={label as string} onClick={() => setZoom(z => Math.min(80, Math.max(0.3, z * (f as number))))}
              style={{ background: '#111118', border: '1px solid #2a2a3e', color: '#888', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', borderRadius: '2px' }}>
              {label as string}
            </button>
          ))}
          <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}
            style={{ background: '#111118', border: '1px solid #2a2a3e', color: '#888', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px', borderRadius: '2px' }}>
            RESET
          </button>
        </div>
      </div>

      <StatsBar pixelMap={pixelMap} revenue={revenue} />

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'crosshair' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
          onMouseLeave={() => { setDragging(false); setTooltip(null) }}
          onWheel={onWheel} />

        {/* Instructions */}
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(5,5,8,0.85)', border: '1px solid #1a1a2e', padding: '12px 16px', borderRadius: '2px', fontSize: '10px', color: '#444', lineHeight: '1.8', pointerEvents: 'none' }}>
          <div>🖱 Scroll to zoom</div>
          <div>✋ Drag to pan</div>
          <div>👆 Click a pixel to buy / inspect</div>
          <div style={{ marginTop: '6px', borderTop: '1px solid #1a1a2e', paddingTop: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#FF6B6B', marginRight: '6px', borderRadius: '1px' }} />
            <span>Live auction</span>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 10, background: '#050508', border: '1px solid #2a2a3e', borderRadius: '2px', padding: '8px 12px', fontSize: '11px', pointerEvents: 'none', zIndex: 500 }}>
            <div style={{ color: '#e0e0ff', fontWeight: 'bold' }}>{tooltip.pixel.company}</div>
            <div style={{ color: '#555' }}>${tooltip.pixel.price.toFixed(2)}</div>
            {tooltip.pixel.auction?.active && <div style={{ color: '#FF6B6B', fontSize: '9px' }}>⚡ AUCTION LIVE</div>}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCoord && modal === null && (
        <PixelPanel pixel={selectedPixel} coord={selectedCoord}
          onClose={() => setSelectedCoord(null)}
          onBuy={() => setModal('buy')}
          onStartAuction={(p) => { setAuctionTarget({ pixel: p, x: selectedCoord[0], y: selectedCoord[1] }); setSelectedCoord(null); setModal('auction') }}
          onBid={(p) => { setBidTarget({ pixel: p, x: selectedCoord[0], y: selectedCoord[1] }); setSelectedCoord(null); setModal('bid') }}
        />
      )}
      {modal === 'buy' && selectedCoord && (
        <BuyModal x={selectedCoord[0]} y={selectedCoord[1]}
          onClose={() => { setModal(null); setSelectedCoord(null) }} />
      )}
      {modal === 'auction' && auctionTarget && (
        <AuctionModal pixel={auctionTarget.pixel} x={auctionTarget.x} y={auctionTarget.y}
          onClose={() => { setModal(null); setAuctionTarget(null) }} />
      )}
      {modal === 'bid' && bidTarget && (
        <BidModal pixel={bidTarget.pixel} x={bidTarget.x} y={bidTarget.y}
          onClose={() => { setModal(null); setBidTarget(null) }} />
      )}
    </div>
  )
}
