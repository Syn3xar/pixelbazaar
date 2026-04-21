'use client'
import { useState } from 'react'
import { Pixel } from '@/app/page'

type Props = {
  onJump: (x: number, y: number) => void
  pixelMap: Record<string, Pixel>
}

export default function PixelTracker({ onJump, pixelMap }: Props) {
  const [xVal, setXVal] = useState('')
  const [yVal, setYVal] = useState('')
  const [result, setResult] = useState<Pixel | null | 'empty' | 'invalid'>(null)

  const inp = {
    width: '100%', background: '#0a0a14', border: '1px solid #1a1a2e',
    color: '#e0e0ff', padding: '6px 8px', fontFamily: "'Space Mono', monospace",
    fontSize: '11px', borderRadius: '2px', outline: 'none', boxSizing: 'border-box' as const,
  }

  function handleSearch() {
    const x = parseInt(xVal), y = parseInt(yVal)
    if (isNaN(x) || isNaN(y) || x < 0 || x >= 1000 || y < 0 || y >= 1000) {
      setResult('invalid')
      return
    }
    const pixel = pixelMap[`${x},${y}`]
    setResult(pixel ?? 'empty')
    onJump(x, y)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        <input
          type="number" placeholder="X" value={xVal}
          onChange={e => setXVal(e.target.value)}
          onKeyDown={handleKey}
          min={0} max={999}
          style={{ ...inp, width: '50%' }}
        />
        <input
          type="number" placeholder="Y" value={yVal}
          onChange={e => setYVal(e.target.value)}
          onKeyDown={handleKey}
          min={0} max={999}
          style={{ ...inp, width: '50%' }}
        />
      </div>
      <button onClick={handleSearch} style={{
        width: '100%', padding: '6px', fontSize: '10px', cursor: 'pointer',
        background: '#784BA0', color: '#fff', border: 'none',
        borderRadius: '2px', fontFamily: "'Space Mono', monospace",
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        Jump →
      </button>

      {/* Result */}
      {result && (
        <div style={{ marginTop: '8px', padding: '8px', background: '#0a0a14', border: `1px solid ${result === 'invalid' ? '#FF6B6B' : result === 'empty' ? '#4ECDC4' : '#784BA0'}`, borderRadius: '2px', fontSize: '10px' }}>
          {result === 'invalid' && (
            <div style={{ color: '#FF6B6B' }}>⚠ Invalid — enter 0-999 for both X and Y</div>
          )}
          {result === 'empty' && (
            <div style={{ color: '#4ECDC4' }}>
              <div style={{ marginBottom: '4px' }}>◻ Pixel [{xVal}, {yVal}]</div>
              <div style={{ color: '#aaa' }}>Available for purchase</div>
            </div>
          )}
          {result !== 'invalid' && result !== 'empty' && result && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: result.color, borderRadius: '2px', flexShrink: 0 }} />
                <span style={{ color: '#e0e0ff', fontWeight: 'bold', fontSize: '11px' }}>{result.company}</span>
              </div>
              <a href={result.url} target="_blank" rel="noopener noreferrer"
                style={{ color: '#784BA0', fontSize: '9px', wordBreak: 'break-all' }}>
                {result.url}
              </a>
              {result.block_size && result.block_size > 1 && (
                <div style={{ color: '#555', fontSize: '9px', marginTop: '3px' }}>
                  {result.block_size}×{result.block_size} block
                </div>
              )}
              {result.auction?.active && (
                <div style={{ color: '#FF6B6B', fontSize: '9px', marginTop: '3px' }}>
                  ⚡ Auction live — ${result.auction.currentBid.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
