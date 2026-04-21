'use client'
import { useEffect, useRef, useCallback } from 'react'
import { Pixel } from '@/app/page'

type Props = {
  pixelMap: Record<string, Pixel>
  zoom: number
  offset: { x: number; y: number }
  canvasSize: { w: number; h: number }
  onNavigate: (x: number, y: number) => void
}

const MINI = 150 // minimap size in px
const GRID = 1000

export default function Minimap({ pixelMap, zoom, offset, canvasSize, onNavigate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const scale = MINI / GRID

    ctx.fillStyle = '#08080f'
    ctx.fillRect(0, 0, MINI, MINI)

    // Draw pixels
    Object.values(pixelMap).forEach(p => {
      ctx.fillStyle = p.color
      ctx.fillRect(p.x * scale, p.y * scale, Math.max(1, scale), Math.max(1, scale))
    })

    // Draw viewport rectangle
    const vpX = -offset.x / zoom * scale
    const vpY = -offset.y / zoom * scale
    const vpW = canvasSize.w / zoom * scale
    const vpH = canvasSize.h / zoom * scale

    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1
    ctx.strokeRect(
      Math.max(0, vpX),
      Math.max(0, vpY),
      Math.min(MINI - Math.max(0, vpX), vpW),
      Math.min(MINI - Math.max(0, vpY), vpH)
    )

    // Viewport fill
    ctx.fillStyle = 'rgba(120,75,160,0.08)'
    ctx.fillRect(
      Math.max(0, vpX), Math.max(0, vpY),
      Math.min(MINI - Math.max(0, vpX), vpW),
      Math.min(MINI - Math.max(0, vpY), vpH)
    )
  }, [pixelMap, zoom, offset, canvasSize])

  useEffect(() => {
    draw()
  }, [draw])

  const navigate = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const gx = Math.floor(mx / MINI * GRID)
    const gy = Math.floor(my / MINI * GRID)
    onNavigate(gx, gy)
  }

  return (
    <div style={{
      position: 'absolute', bottom: '20px', right: '20px', zIndex: 400,
      background: '#050508', border: '1px solid #2a2a3e', borderRadius: '2px',
      overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    }}>
      <div style={{ fontSize: '8px', color: '#333', padding: '4px 8px', borderBottom: '1px solid #1a1a2e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Minimap
      </div>
      <canvas
        ref={canvasRef}
        width={MINI} height={MINI}
        style={{ display: 'block', cursor: 'crosshair' }}
        onMouseDown={() => isDragging.current = true}
        onMouseUp={() => isDragging.current = false}
        onClick={navigate}
        onMouseMove={e => { if (isDragging.current) navigate(e) }}
      />
    </div>
  )
}
