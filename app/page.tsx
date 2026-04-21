'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import PixelPanel from '@/components/PixelPanel'
import BuyModal from '@/components/BuyModal'
import AuctionModal from '@/components/AuctionModal'
import BidModal from '@/components/BidModal'
import StatsBar from '@/components/StatsBar'
import PixelTracker from '@/components/PixelTracker'
import RecentTicker from '@/components/RecentTicker'
import Minimap from '@/components/Minimap'

const GRID = 1000

export type Pixel = {
  x: number; y: number; company: string; url: string
  color: string; price: number; owner_email: string
  block_id?: number; block_size?: number
  auction?: {
    id: number; active: boolean; endTime: number
    currentBid: number; minNext: number
    bids: { bidder: string; amount: number }[]
    blockId?: number; blockSize?: number
    originX?: number; originY?: number
  }
}

const BLOCK_SIZES = [
  { label: '1×1',     size: 1,   price: 1,    color: '#4ECDC4' },
  { label: '10×10',   size: 10,  price: 50,   color: '#FFD700' },
  { label: '100×100', size: 100, price: 1000, color: '#FF3CAC' },
]

// Easter egg constants
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']
const MATRIX_WORD = 'matrix'
const SPECIAL_NAMES = ['claude', 'anthropic', 'milliondollarboard']

export default function Home() {
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null)
  const [pixelMap, setPixelMap]             = useState<Record<string, Pixel>>({})
  const [revenue, setRevenue]               = useState(0)
  const [totalSold, setTotalSold]           = useState(0)
  const [zoom, setZoom]                     = useState(1)
  const [offset, setOffset]                 = useState({ x: 0, y: 0 })
  const [dragging, setDragging]             = useState(false)
  const [dragStart, setDragStart]           = useState<{x:number;y:number}|null>(null)
  const [selectedCoord, setSelectedCoord]   = useState<[number,number]|null>(null)
  const [modal, setModal]                   = useState<null|'buy'|'auction'|'bid'>(null)
  const [auctionTarget, setAuctionTarget]   = useState<{pixel:Pixel;x:number;y:number}|null>(null)
  const [bidTarget, setBidTarget]           = useState<{pixel:Pixel;x:number;y:number}|null>(null)
  const [tooltip, setTooltip]               = useState<{x:number;y:number;pixel:Pixel}|null>(null)
  const [hoverCoord, setHoverCoord]         = useState<[number,number]|null>(null)
  const [selectedBlockSize, setSelectedBlockSize] = useState(BLOCK_SIZES[0])
  const [mode, setMode]                     = useState<'browse'|'buy'>('browse')
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const isDragged = useRef(false)

  // ── Easter egg state ───────────────────────────────────────────────────────
  const [easterMsg, setEasterMsg]   = useState<string|null>(null)  // toast message
  const [rainbowMode, setRainbowMode] = useState(false)            // EE1: Konami
  const [matrixMode, setMatrixMode]   = useState(false)            // EE12: Matrix
  const [clickCount, setClickCount]   = useState<Record<string,number>>({}) // EE5
  const konamiProgress = useRef<string[]>([])
  const typedBuffer    = useRef('')
  const matrixCols     = useRef<{x:number;y:number;speed:number;chars:string[]}[]>([])
  const matrixFrame    = useRef(0)
  const easterMsgTimer = useRef<any>(null)

  const showEasterMsg = (msg: string, duration = 4000) => {
    setEasterMsg(msg)
    if (easterMsgTimer.current) clearTimeout(easterMsgTimer.current)
    easterMsgTimer.current = setTimeout(() => setEasterMsg(null), duration)
  }

  // EE3: Midnight starfield
  const [starfield, setStarfield] = useState(false)
  useEffect(() => {
    const check = () => {
      const now = new Date()
      if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
        setStarfield(true)
        showEasterMsg('🌟 Midnight! The stars align over the board...')
        setTimeout(() => setStarfield(false), 60000)
      }
    }
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  // EE11: Pixel of the day
  const [pixelOfDay, setPixelOfDay] = useState<string|null>(null)
  useEffect(() => {
    // Pick a "pixel of the day" based on date seed
    const seed = new Date().toDateString()
    const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const keys = Object.keys(pixelMap)
    if (keys.length > 0) {
      const key = keys[hash % keys.length]
      const p = pixelMap[key]
      if (p) {
        setPixelOfDay(key)
        // Flash it after 2 seconds
        setTimeout(() => showEasterMsg(`⭐ Pixel of the Day: ${p.company} at [${p.x}, ${p.y}]!`, 5000), 2000)
      }
    }
  }, [pixelMap])

  // EE4: 100% sold fireworks
  const [fireworks, setFireworks]   = useState(false)
  const [confetti, setConfetti]     = useState(false)  // EE10: special name confetti
  const fireworksRef = useRef<{x:number;y:number;vx:number;vy:number;color:string;life:number}[]>([])

  // EE1: Konami code listener
  // EE12: Matrix mode listener
  // EE7: Zoom message
  // EE13/14/15: Seasonal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Konami
      konamiProgress.current.push(e.key)
      if (konamiProgress.current.length > KONAMI.length) konamiProgress.current.shift()
      if (JSON.stringify(konamiProgress.current) === JSON.stringify(KONAMI)) {
        setRainbowMode(true)
        showEasterMsg('🌈 KONAMI CODE ACTIVATED! Rainbow mode for 5 seconds!', 5500)
        setTimeout(() => setRainbowMode(false), 5000)
        konamiProgress.current = []
      }
      // Matrix word detection
      if (e.key.length === 1) {
        typedBuffer.current = (typedBuffer.current + e.key.toLowerCase()).slice(-MATRIX_WORD.length)
        if (typedBuffer.current === MATRIX_WORD) {
          setMatrixMode(m => {
            const next = !m
            showEasterMsg(next ? '💊 Red pill taken. Welcome to the Matrix.' : '💊 Blue pill. Back to reality.')
            return next
          })
          typedBuffer.current = ''
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // EE14: New Year countdown / EE13: Halloween / EE15: Friday 13th
  const [boardFlipped, setBoardFlipped] = useState(false)
  const [newYearCountdown, setNewYearCountdown] = useState<string|null>(null)
  useEffect(() => {
    const now = new Date()
    const month = now.getMonth() + 1 // 1-12
    const day   = now.getDate()
    const dow   = now.getDay() // 0=Sun

    // Halloween (October)
    if (month === 10) showEasterMsg('🎃 Happy Halloween! Watch for ghosts on the board...', 6000)

    // Friday the 13th
    if (dow === 5 && day === 13) {
      setBoardFlipped(true)
      showEasterMsg('😱 Friday the 13th — the board has been cursed!', 5000)
    }

    // New Year countdown (Jan 1)
    if (month === 1 && day === 1) {
      showEasterMsg('🎆 Happy New Year! 🎆', 8000)
      setFireworks(true)
      setTimeout(() => setFireworks(false), 10000)
    }
  }, [])

  // ── Load pixels ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadPixels() {
      const { data: pixels }   = await supabase.from('pixels').select('*, blocks(block_size)')
      const { data: auctions } = await supabase.from('auctions').select('*, bids(*)').eq('status', 'active')
      const { data: txns }     = await supabase.from('transactions').select('platform_fee')

      const map: Record<string, Pixel> = {}
      pixels?.forEach(p => {
        map[`${p.x},${p.y}`] = {
          x: p.x, y: p.y, company: p.company, url: p.url,
          color: p.color, price: p.price, owner_email: p.owner_email,
          block_id: p.block_id, block_size: p.blocks?.block_size ?? 1,
        }
      })

      auctions?.forEach(a => {
        const size = a.block_size ?? 1
        for (let dy = 0; dy < size; dy++) {
          for (let dx = 0; dx < size; dx++) {
            const key = `${a.origin_x + dx},${a.origin_y + dy}`
            if (map[key]) {
              map[key].auction = {
                id: a.id, active: true,
                endTime: new Date(a.ends_at).getTime(),
                currentBid: a.current_bid ?? a.min_bid,
                minNext: Math.ceil((a.current_bid ?? a.min_bid) * 1.05),
                bids: (a.bids ?? []).map((b: any) => ({ bidder: b.bidder_name, amount: b.amount })),
                blockId: a.block_id, blockSize: a.block_size,
                originX: a.origin_x, originY: a.origin_y,
              }
            }
          }
        }
      })

      setPixelMap(map)
      setTotalSold(Object.keys(map).length)
      const rev = txns?.reduce((s, t) => s + Number(t.platform_fee), 0) ?? 0
      setRevenue(rev)

      // EE4: 100% sold
      if (Object.keys(map).length >= 1_000_000) {
        setFireworks(true)
        showEasterMsg('🎆 ONE MILLION PIXELS SOLD! The board is complete! 🎆', 10000)
      }
    }
    loadPixels()
    const channel = supabase.channel('pixel-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pixels' },   () => loadPixels())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, () => loadPixels())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' },     () => loadPixels())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // EE2: Zoom void / zoom out messages
  useEffect(() => {
    if (zoom >= 79) showEasterMsg('👁 You found the void. Not many dare zoom this far...', 4000)
    if (zoom <= 0.32) showEasterMsg('✨ One million pixels. Infinite possibilities.', 3000)
  }, [zoom])

  // ── Check block free ───────────────────────────────────────────────────────
  const isBlockFree = useCallback((x: number, y: number, size: number) => {
    if (x + size > GRID || y + size > GRID || x < 0 || y < 0) return false
    for (let dy = 0; dy < size; dy++)
      for (let dx = 0; dx < size; dx++)
        if (pixelMap[`${x+dx},${y+dy}`]) return false
    return true
  }, [pixelMap])

  // ── Init matrix columns ────────────────────────────────────────────────────
  useEffect(() => {
    if (!matrixMode) return
    const canvas = matrixCanvasRef.current
    if (!canvas) return
    const cols = Math.floor(canvas.offsetWidth / 14)
    matrixCols.current = Array.from({ length: cols }, (_, i) => ({
      x: i * 14, y: Math.random() * -500,
      speed: 2 + Math.random() * 4,
      chars: Array.from({ length: 30 }, () => String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))),
    }))
  }, [matrixMode])

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
    const endX   = Math.min(GRID, startX + Math.ceil(W / pxSize) + 1)
    const endY   = Math.min(GRID, startY + Math.ceil(H / pxSize) + 1)

    // Board boundary
    const boardX = offset.x, boardY = offset.y
    const boardW = GRID * pxSize, boardH = GRID * pxSize
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    if (boardX > 0) ctx.fillRect(0, 0, boardX, H)
    if (boardX + boardW < W) ctx.fillRect(boardX + boardW, 0, W - boardX - boardW, H)
    if (boardY > 0) ctx.fillRect(boardX, 0, boardW, boardY)
    if (boardY + boardH < H) ctx.fillRect(boardX, boardY + boardH, boardW, H - boardY - boardH)
    ctx.strokeStyle = 'rgba(120,75,160,0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(boardX, boardY, boardW, boardH)

    // Grid lines
    const gridOpacity = pxSize >= 8 ? 0.2 : pxSize >= 2 ? 0.08 : pxSize >= 0.5 ? 0.04 : 0.02
    ctx.strokeStyle = `rgba(255,255,255,${gridOpacity})`
    ctx.lineWidth = 0.5
    const gridStep = pxSize < 0.3 ? Math.ceil(200/pxSize) : pxSize < 1 ? Math.ceil(30/pxSize) : pxSize < 3 ? Math.ceil(5/pxSize) : 1
    for (let gx = startX; gx <= endX; gx += gridStep) {
      const sx = offset.x + gx * pxSize
      ctx.beginPath(); ctx.moveTo(sx, Math.max(0, boardY)); ctx.lineTo(sx, Math.min(H, boardY + boardH)); ctx.stroke()
    }
    for (let gy = startY; gy <= endY; gy += gridStep) {
      const sy = offset.y + gy * pxSize
      ctx.beginPath(); ctx.moveTo(Math.max(0, boardX), sy); ctx.lineTo(Math.min(W, boardX + boardW), sy); ctx.stroke()
    }

    // EE13: Halloween ghost flicker
    const now = new Date()
    const isHalloween = now.getMonth() === 9
    const ghostTick = Math.floor(Date.now() / 3000)

    // Draw pixels
    for (let gy = startY; gy < endY; gy++) {
      for (let gx = startX; gx < endX; gx++) {
        const p = pixelMap[`${gx},${gy}`]
        if (!p) {
          // EE13: Halloween ghost on random empty pixels
          if (isHalloween && pxSize >= 8 && ((gx * 97 + gy * 31 + ghostTick) % 2000 === 0)) {
            ctx.font = `${Math.min(pxSize, 16)}px serif`
            ctx.fillText('👻', offset.x + gx * pxSize, offset.y + (gy + 1) * pxSize)
          }
          continue
        }
        const sx = offset.x + gx * pxSize
        const sy = offset.y + gy * pxSize

        // EE1: Rainbow mode
        if (rainbowMode) {
          const hue = (gx + gy + Date.now() / 10) % 360
          ctx.fillStyle = `hsl(${hue},100%,55%)`
        } else {
          ctx.fillStyle = p.color
        }
        ctx.fillRect(sx, sy, pxSize + 0.5, pxSize + 0.5)

        if (p.auction?.active) {
          const t = (Date.now() % 1200) / 1200
          ctx.fillStyle = `rgba(255,107,107,${0.15 + 0.15 * Math.sin(t * Math.PI * 2)})`
          ctx.fillRect(sx, sy, pxSize + 0.5, pxSize + 0.5)
        }
      }
    }

    // EE3: Starfield overlay
    if (starfield) {
      for (let i = 0; i < 200; i++) {
        const sx = (Math.sin(i * 127.1 + Date.now() / 2000) * 0.5 + 0.5) * W
        const sy = (Math.sin(i * 311.7 + Date.now() / 3000) * 0.5 + 0.5) * H
        const alpha = 0.4 + 0.6 * Math.sin(i + Date.now() / 500)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fillRect(sx, sy, 2, 2)
      }
    }

    // EE4/EE14: Fireworks
    if (fireworks) {
      if (Math.random() < 0.3) {
        const colors = ['#FF3CAC','#FFD700','#4ECDC4','#92FE9D','#FF6B6B','#784BA0']
        for (let i = 0; i < 20; i++) {
          fireworksRef.current.push({
            x: Math.random() * W, y: Math.random() * H * 0.6,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 60,
          })
        }
      }
      fireworksRef.current = fireworksRef.current.filter(p => p.life > 0)
      fireworksRef.current.forEach(p => {
        ctx.fillStyle = p.color.replace(')', `,${p.life / 60})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace(')', ',1)')
        ctx.globalAlpha = p.life / 60
        ctx.fillRect(p.x, p.y, 3, 3)
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--
      })
      ctx.globalAlpha = 1
    }

    // EE10: Confetti
    if (confetti) {
      for (let i = 0; i < 30; i++) {
        const cx = (Math.sin(i * 53.1 + Date.now() / 800) * 0.5 + 0.5) * W
        const cy = ((Date.now() / 1000 + i * 0.3) % 1) * H
        ctx.fillStyle = ['#FF3CAC','#FFD700','#4ECDC4','#92FE9D'][i % 4]
        ctx.fillRect(cx, cy, 6, 6)
      }
    }

    // EE1: Secret pixel art in corner (tiny smiley at 990,990)
    if (pxSize >= 4) {
      const smileys: [number, number, string][] = [
        [990,990,'#FFD700'],[991,990,'#FFD700'],[992,990,'#FFD700'],
        [990,991,'#FFD700'],[991,991,'#000'],[992,991,'#FFD700'],
        [990,992,'#FFD700'],[991,992,'#FFD700'],[992,992,'#FFD700'],
        [993,990,'#FFD700'],[993,991,'#FFD700'],[993,992,'#FFD700'],
        [994,990,'#FFD700'],[994,991,'#000'],[994,992,'#FFD700'],
      ]
      smileys.forEach(([sx, sy, color]) => {
        if (sx >= startX && sx < endX && sy >= startY && sy < endY && !pixelMap[`${sx},${sy}`]) {
          ctx.fillStyle = color
          ctx.fillRect(offset.x + sx * pxSize, offset.y + sy * pxSize, pxSize, pxSize)
        }
      })
    }

    // Block preview overlay (buy mode)
    if (mode === 'buy' && hoverCoord) {
      const [hx, hy] = hoverCoord
      const size = selectedBlockSize.size
      const outOfBounds = hx < 0 || hy < 0 || hx + size > GRID || hy + size > GRID
      const free = !outOfBounds && isBlockFree(hx, hy, size)
      const drawX = outOfBounds ? Math.max(0, Math.min(hx, GRID - size)) : hx
      const drawY = outOfBounds ? Math.max(0, Math.min(hy, GRID - size)) : hy
      const blockW = size * pxSize, blockH = size * pxSize
      const sx = offset.x + drawX * pxSize, sy = offset.y + drawY * pxSize

      ctx.fillStyle = outOfBounds ? 'rgba(255,165,0,0.2)' : free ? 'rgba(78,205,196,0.25)' : 'rgba(255,107,107,0.3)'
      ctx.fillRect(sx, sy, blockW, blockH)
      ctx.strokeStyle = outOfBounds ? '#FFA500' : free ? '#4ECDC4' : '#FF6B6B'
      ctx.lineWidth = Math.max(2, pxSize * 0.05)
      ctx.strokeRect(sx, sy, blockW, blockH)

      if (blockW > 50 && blockH > 22) {
        const label = outOfBounds ? 'Outside board boundary' : free ? `$${selectedBlockSize.price} — Click to buy` : 'Taken — move to find a free spot'
        const fontSize = Math.min(13, Math.max(8, pxSize))
        ctx.font = `bold ${fontSize}px monospace`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        const tw = ctx.measureText(label).width
        ctx.fillStyle = 'rgba(0,0,0,0.75)'
        ctx.fillRect(sx + blockW/2 - tw/2 - 6, sy + blockH/2 - fontSize/2 - 4, tw + 12, fontSize + 8)
        ctx.fillStyle = outOfBounds ? '#FFA500' : free ? '#4ECDC4' : '#FF6B6B'
        ctx.fillText(label, sx + blockW/2, sy + blockH/2)
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      }
    }

    // EE11: Pixel of the day highlight
    if (pixelOfDay && pxSize >= 2) {
      const [pdx, pdy] = pixelOfDay.split(',').map(Number)
      if (pdx >= startX && pdx < endX && pdy >= startY && pdy < endY) {
        const pdsx = offset.x + pdx * pxSize
        const pdsy = offset.y + pdy * pxSize
        const glow = 0.5 + 0.5 * Math.sin(Date.now() / 400)
        ctx.strokeStyle = `rgba(255,215,0,${glow})`
        ctx.lineWidth = Math.max(2, pxSize * 0.1)
        ctx.strokeRect(pdsx - 1, pdsy - 1, pxSize + 2, pxSize + 2)
      }
    }

    if (mode === 'browse' && selectedCoord) {
      const px = offset.x + selectedCoord[0] * pxSize
      const py = offset.y + selectedCoord[1] * pxSize
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, pxSize * 0.08)
      ctx.strokeRect(px, py, pxSize, pxSize)
    }

    // EE11: First buyer of day — gold shimmer on newest pixel
    // (handled via CSS overlay, no canvas needed)

  }, [pixelMap, zoom, offset, selectedCoord, hoverCoord, selectedBlockSize, mode, isBlockFree, rainbowMode, starfield, fireworks, confetti])

  // Matrix overlay render
  useEffect(() => {
    if (!matrixMode) return
    const canvas = matrixCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const id = setInterval(() => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#00ff41'
      ctx.font = '13px monospace'
      matrixCols.current.forEach(col => {
        const char = col.chars[Math.floor(Math.random() * col.chars.length)]
        ctx.fillText(char, col.x, col.y)
        col.y += col.speed
        if (col.y > canvas.height) col.y = -20
      })
      matrixFrame.current++
    }, 33)
    return () => clearInterval(id)
  }, [matrixMode])

  useEffect(() => {
    let raf: number
    const loop = () => { render(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [render])

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current
      const m = matrixCanvasRef.current
      if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; setCanvasSize({ w: c.offsetWidth, h: c.offsetHeight }) }
      if (m) { m.width = m.offsetWidth; m.height = m.offsetHeight }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const coordFromEvent = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [
      Math.floor((e.clientX - rect.left - offset.x) / zoom),
      Math.floor((e.clientY - rect.top  - offset.y) / zoom),
    ]
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
      setHoverCoord(null)
    } else {
      const [gx, gy] = coordFromEvent(e)
      setHoverCoord([gx, gy])
      if (mode === 'browse') {
        const p = pixelMap[`${gx},${gy}`]
        setTooltip(p ? { x: e.clientX, y: e.clientY, pixel: p } : null)
      } else {
        setTooltip(null)
      }
    }
  }

  const onMouseUp = (e: React.MouseEvent) => {
    setDragging(false)
    if (!isDragged.current) {
      const [gx, gy] = coordFromEvent(e)

      if (mode === 'buy') {
        const outOfBounds = gx < 0 || gy < 0 || gx + selectedBlockSize.size > GRID || gy + selectedBlockSize.size > GRID
        if (!outOfBounds && isBlockFree(gx, gy, selectedBlockSize.size)) {
          setSelectedCoord([gx, gy])
          setModal('buy')
        }
      } else {
        // Browse mode
        if (gx >= 0 && gx < GRID && gy >= 0 && gy < GRID) {
          const key = `${gx},${gy}`
          // EE5: Click same empty pixel 10 times
          if (!pixelMap[key]) {
            setClickCount(prev => {
              const next = { ...prev, [key]: (prev[key] ?? 0) + 1 }
              if (next[key] === 10) showEasterMsg('🎯 Persistent! Use code PERSISTENT10 for 10% off your next block!', 6000)
              return next
            })
          }
          // If empty pixel — open BuyModal directly (no block size selection needed first)
          // If owned pixel — open PixelPanel to inspect
          setSelectedCoord([gx, gy])
          setModal(null) // let the conditional rendering handle which modal to show
        }
      }
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

  // EE8: Triple click
  const clickTimes = useRef<number[]>([])
  const onMouseClick = () => {
    const now = Date.now()
    clickTimes.current.push(now)
    clickTimes.current = clickTimes.current.filter(t => now - t < 600)
    if (clickTimes.current.length >= 3) {
      // Play pop sound via AudioContext
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        osc.start(); osc.stop(ctx.currentTime + 0.1)
      } catch {}
      showEasterMsg('🎵 *pop*', 1500)
      clickTimes.current = []
    }
  }

  const selectedPixel = selectedCoord ? pixelMap[`${selectedCoord[0]},${selectedCoord[1]}`] : undefined

  // EE10: Check company name for special names
  const handleSpecialCompanyName = (name: string) => {
    if (SPECIAL_NAMES.some(n => name.toLowerCase().includes(n))) {
      setConfetti(true)
      showEasterMsg('🎉 Special name detected! Confetti for you!', 4000)
      setTimeout(() => setConfetti(false), 5000)
    }
  }

  const getCursor = () => {
    if (dragging) return 'grabbing'
    if (mode === 'buy') {
      if (!hoverCoord) return 'crosshair'
      const outOfBounds = hoverCoord[0] < 0 || hoverCoord[1] < 0 || hoverCoord[0] + selectedBlockSize.size > GRID || hoverCoord[1] + selectedBlockSize.size > GRID
      if (outOfBounds) return 'not-allowed'
      return isBlockFree(hoverCoord[0], hoverCoord[1], selectedBlockSize.size) ? 'pointer' : 'not-allowed'
    }
    return 'crosshair'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#08080f', overflow: 'hidden', transform: boardFlipped ? 'scaleY(-1)' : 'none', transition: 'transform 0.5s' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', background: '#050508', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '18px' }}>
            <span style={{ color: '#784BA0' }}>MILLION</span>
            <span style={{ color: '#e0e0ff' }}>DOTBOARD</span>
            <span style={{ color: '#FF6B6B', fontSize: '10px', verticalAlign: 'super', marginLeft: '2px' }}>×10⁶</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#1a1a2e' }} />
          <div style={{ fontSize: '10px', color: '#777', letterSpacing: '0.1em' }}>1,000,000 PIXEL MARKETPLACE</div>
          <div style={{ width: '1px', height: '24px', background: '#1a1a2e' }} />
          <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.06em' }}>
            Last update: <span style={{ color: '#555' }}>Update.11.260421</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#888' }}>ZOOM: {zoom.toFixed(1)}×</span>
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
      <RecentTicker />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: '200px', flexShrink: 0, background: '#050508', borderRight: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column', padding: '16px 12px', gap: '8px', overflowY: 'auto' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#777', marginBottom: '4px', textTransform: 'uppercase' }}>Mode</div>
          <button onClick={() => { setMode('browse'); setHoverCoord(null) }} style={{ padding: '8px', fontSize: '11px', cursor: 'pointer', borderRadius: '2px', fontFamily: 'inherit', textAlign: 'left', background: mode === 'browse' ? '#1a1a2e' : 'transparent', color: mode === 'browse' ? '#e0e0ff' : '#888', border: `1px solid ${mode === 'browse' ? '#784BA0' : '#1a1a2e'}` }}>
            🔍 Browse Board
          </button>
          <button onClick={() => { setMode('buy'); setSelectedCoord(null) }} style={{ padding: '8px', fontSize: '11px', cursor: 'pointer', borderRadius: '2px', fontFamily: 'inherit', textAlign: 'left', background: mode === 'buy' ? '#784BA0' : 'transparent', color: mode === 'buy' ? '#fff' : '#888', border: `1px solid ${mode === 'buy' ? '#784BA0' : '#1a1a2e'}` }}>
            🛒 Buy Pixels
          </button>

          {mode === 'buy' && (
            <>
              <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#777', marginTop: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>Block Size</div>
              {BLOCK_SIZES.map(bs => (
                <button key={bs.label} onClick={() => setSelectedBlockSize(bs)} style={{ padding: '10px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '2px', fontFamily: 'inherit', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px', background: selectedBlockSize.size === bs.size ? '#111118' : 'transparent', border: `1px solid ${selectedBlockSize.size === bs.size ? bs.color : '#1a1a2e'}` }}>
                  <span style={{ color: selectedBlockSize.size === bs.size ? bs.color : '#aaa', fontWeight: 'bold' }}>{bs.label}</span>
                  <span style={{ color: '#FFD700', fontSize: '12px' }}>${bs.price}</span>
                  <span style={{ color: '#444', fontSize: '9px' }}>{(bs.size * bs.size).toLocaleString()} pixels</span>
                </button>
              ))}
              <div style={{ marginTop: '12px', background: '#0a0a14', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '10px', fontSize: '10px', color: '#888', lineHeight: 1.7 }}>
                <div style={{ color: '#4ECDC4', marginBottom: '6px', fontWeight: 'bold' }}>How to buy:</div>
                <div>1. Pick block size above</div>
                <div>2. Hover board to preview</div>
                <div style={{ color: '#4ECDC4' }}>🟢 Green = available</div>
                <div style={{ color: '#FF6B6B' }}>🔴 Red = taken</div>
                <div style={{ color: '#FFA500' }}>🟠 Orange = out of bounds</div>
                <div>3. Click to purchase</div>
              </div>
            </>
          )}

          {mode === 'browse' && (
            <div style={{ marginTop: '12px', background: '#0a0a14', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '10px', fontSize: '10px', color: '#888', lineHeight: 1.7 }}>
              <div>🖱 Scroll to zoom</div>
              <div>✋ Drag to pan</div>
              <div>👆 Click pixel to inspect</div>
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#FF6B6B', borderRadius: '1px' }} />
                <span>Live auction</span>
              </div>
            </div>
          )}

          {/* Pixel Tracker */}
          <div style={{ marginTop: '16px', borderTop: '1px solid #1a1a2e', paddingTop: '14px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#777', marginBottom: '8px', textTransform: 'uppercase' }}>🎯 Pixel Tracker</div>
            <PixelTracker onJump={(x, y) => {
              const canvas = canvasRef.current
              if (!canvas) return
              const W = canvas.offsetWidth, H = canvas.offsetHeight
              const newZoom = 20
              setZoom(newZoom)
              setOffset({ x: W / 2 - x * newZoom, y: H / 2 - y * newZoom })
              setSelectedCoord([x, y])
              showEasterMsg('📍 Jumped to [' + x + ', ' + y + ']', 2000)
            }} pixelMap={pixelMap} />
          </div>

          {/* Footer links */}
          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: '⚡ Live Auctions', href: '/auctions' },
              { label: '📬 Contact Us', href: '/contact' },
              { label: '🏆 Rankings', href: '/rankings' },
              { label: '🖼 My Pixels', href: '/my-pixels' },
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Refund Policy', href: '/refund' },
            ].map(({ label, href }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '9px', color: '#aaa', textDecoration: 'none', letterSpacing: '0.08em' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#784BA0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}>
                {label}
              </a>
            ))}
            <div style={{ fontSize: '9px', color: '#555', marginTop: '4px' }}>© 2026 MillionDotBoard</div>
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: getCursor() }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onClick={onMouseClick}
            onMouseLeave={() => { setDragging(false); setTooltip(null); setHoverCoord(null) }}
            onWheel={onWheel} />

          {/* Matrix overlay canvas */}
          <canvas ref={matrixCanvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', opacity: matrixMode ? 0.85 : 0, transition: 'opacity 0.5s' }} />

          {/* Tooltip — pixel info on hover */}
          {tooltip && mode === 'browse' && (
            <div style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 10, background: '#050508', border: '1px solid #2a2a3e', borderRadius: '2px', padding: '8px 12px', fontSize: '11px', pointerEvents: 'none', zIndex: 500 }}>
              <div style={{ color: '#e0e0ff', fontWeight: 'bold' }}>{tooltip.pixel.company}</div>
              <div style={{ color: '#555', fontSize: '10px' }}>{tooltip.pixel.block_size && tooltip.pixel.block_size > 1 ? `${tooltip.pixel.block_size}×${tooltip.pixel.block_size} block` : '1×1 pixel'}</div>
              <div style={{ color: '#555' }}>${tooltip.pixel.price.toFixed(2)}</div>
              {tooltip.pixel.auction?.active && <div style={{ color: '#FF6B6B', fontSize: '9px' }}>⚡ AUCTION LIVE — ${tooltip.pixel.auction.currentBid.toFixed(2)}</div>}
            </div>
          )}

          {/* Coordinate display on hover — shown when zoomed in enough */}
          {hoverCoord && zoom >= 6 && !tooltip && mode === 'browse' && (
            <div style={{
              position: 'fixed',
              left: (hoverCoord[0] * zoom + offset.x) + zoom + 6,
              top: (hoverCoord[1] * zoom + offset.y) - 4,
              background: 'rgba(5,5,8,0.85)',
              border: '1px solid #2a2a3e',
              borderRadius: '2px',
              padding: '3px 7px',
              fontSize: '10px',
              color: '#aaa',
              pointerEvents: 'none',
              zIndex: 499,
              fontFamily: "'Space Mono', monospace",
              letterSpacing: '0.05em',
            }}>
              [{hoverCoord[0]}, {hoverCoord[1]}]
            </div>
          )}

          {/* Buy mode status bar */}
          {mode === 'buy' && hoverCoord && (() => {
            const hx = hoverCoord[0], hy = hoverCoord[1], sz = selectedBlockSize.size
            const outOfBounds = hx < 0 || hy < 0 || hx + sz > GRID || hy + sz > GRID
            const free = !outOfBounds && isBlockFree(hx, hy, sz)
            const borderColor = outOfBounds ? '#FFA500' : free ? '#4ECDC4' : '#FF6B6B'
            return (
              <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(5,5,8,0.92)', border: `1px solid ${borderColor}`, borderRadius: '2px', padding: '8px 20px', fontSize: '11px', pointerEvents: 'none', display: 'flex', gap: '16px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#aaa' }}>Position: [{hx}, {hy}]</span>
                <span style={{ color: '#aaa' }}>Block: {selectedBlockSize.label}</span>
                {outOfBounds
                  ? <span style={{ color: '#FFA500' }}>⚠ Outside board boundary — move inside</span>
                  : free
                    ? <span style={{ color: '#4ECDC4' }}>✓ Available — click to buy for ${selectedBlockSize.price}</span>
                    : <span style={{ color: '#FF6B6B' }}>✗ Taken — move to find a free spot</span>
                }
              </div>
            )
          })()}

          {/* Easter egg toast message */}
          {easterMsg && (
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(5,5,8,0.95)', border: '1px solid #784BA0', borderRadius: '2px', padding: '10px 24px', fontSize: '13px', color: '#e0e0ff', pointerEvents: 'none', zIndex: 900, textAlign: 'center', boxShadow: '0 0 30px rgba(120,75,160,0.4)', letterSpacing: '0.05em', maxWidth: '80%' }}>
              {easterMsg}
            </div>
          )}

          {/* EE9: Secret /void link hint when zoomed to max */}
          {zoom >= 79 && (
            <div style={{ position: 'absolute', bottom: '200px', right: '20px', fontSize: '10px', color: '#222', pointerEvents: 'none' }}>
              try /void
            </div>
          )}

          {/* Minimap */}
          <Minimap
            pixelMap={pixelMap}
            zoom={zoom}
            offset={offset}
            canvasSize={canvasSize}
            onNavigate={(x, y) => {
              const W = canvasSize.w, H = canvasSize.h
              setZoom(zoom)
              setOffset({ x: W / 2 - x * zoom, y: H / 2 - y * zoom })
            }}
          />

          {/* Share button — top right of canvas */}
          {selectedCoord && selectedPixel && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/?inspect=${selectedCoord[0]},${selectedCoord[1]}`
                navigator.clipboard.writeText(url).then(() => showEasterMsg('🔗 Link copied to clipboard!', 2500))
              }}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'rgba(5,5,8,0.9)', border: '1px solid #2a2a3e',
                color: '#888', padding: '6px 12px', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace", fontSize: '10px',
                borderRadius: '2px', letterSpacing: '0.06em',
              }}
            >
              🔗 Share Pixel
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedCoord && modal === null && mode === 'browse' && !selectedPixel && (
        <BuyModal x={selectedCoord[0]} y={selectedCoord[1]}
          onClose={() => setSelectedCoord(null)}
          onSpecialName={handleSpecialCompanyName} />
      )}
      {selectedCoord && modal === null && mode === 'browse' && selectedPixel && (
        <PixelPanel pixel={selectedPixel} coord={selectedCoord}
          onClose={() => setSelectedCoord(null)}
          onBuy={() => setModal('buy')}
          onStartAuction={(p) => { setAuctionTarget({ pixel: p, x: selectedCoord[0], y: selectedCoord[1] }); setSelectedCoord(null); setModal('auction') }}
          onBid={(p) => { setBidTarget({ pixel: p, x: selectedCoord[0], y: selectedCoord[1] }); setSelectedCoord(null); setModal('bid') }}
        />
      )}
      {modal === 'buy' && selectedCoord && (
        <BuyModal x={selectedCoord[0]} y={selectedCoord[1]}
          onClose={() => { setModal(null); setSelectedCoord(null) }}
          onSpecialName={handleSpecialCompanyName} />
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
