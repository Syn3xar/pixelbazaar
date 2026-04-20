'use client'
import { useEffect, useState } from 'react'
import Modal from './Modal'
import { Pixel } from '@/app/page'

type Props = {
  pixel?: Pixel; coord: [number, number]
  onClose: () => void; onBuy: () => void
  onStartAuction: (p: Pixel) => void; onBid: (p: Pixel) => void
}

function fmtTime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export default function PixelPanel({ pixel, coord, onClose, onBuy, onStartAuction, onBid }: Props) {
  const [timer, setTimer] = useState<number | null>(null)
  const [x, y] = coord

  useEffect(() => {
    if (!pixel?.auction?.active) return
    const tick = () => setTimer(Math.max(0, Math.floor((pixel.auction!.endTime - Date.now()) / 1000)))
    tick(); const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [pixel])

  if (!pixel) return (
    <Modal title={`Pixel [${x}, ${y}]`} onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>◻</div>
        <div style={{ color: '#666', fontSize: '12px', marginBottom: '24px' }}>This pixel is available for purchase</div>
        <div style={{ color: '#e0e0ff', fontSize: '22px', marginBottom: '4px' }}>$1.00</div>
        <div style={{ color: '#555', fontSize: '10px', marginBottom: '24px' }}>Platform keeps 10% fee</div>
        <button onClick={onBuy} style={btnStyle('#784BA0', '#fff', '100%')}>Buy This Pixel</button>
      </div>
    </Modal>
  )

  return (
    <Modal title={`Pixel [${x}, ${y}]`} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '32px', height: '32px', background: pixel.color, borderRadius: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ color: '#e0e0ff', fontWeight: 'bold', fontSize: '14px' }}>{pixel.company}</div>
          <a href={pixel.url} target="_blank" rel="noopener noreferrer" style={{ color: '#784BA0', fontSize: '11px' }}>{pixel.url}</a>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#555' }}>Current Value</span>
          <span style={{ color: '#e0e0ff' }}>${pixel.price.toFixed(2)}</span>
        </div>
      </div>

      {pixel.auction?.active ? (
        <div style={{ background: '#0f0f1a', border: '1px solid #FF6B6B33', borderRadius: '2px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#FF6B6B', fontSize: '11px' }}>⚡ Live Auction</span>
            <span style={{ color: '#FF6B6B', fontSize: '12px' }}>{timer !== null ? fmtTime(timer) : '…'}</span>
          </div>
          <div style={{ color: '#555', fontSize: '10px', marginBottom: '4px' }}>CURRENT BID</div>
          <div style={{ color: '#FFD700', fontSize: '20px', marginBottom: '12px' }}>${pixel.auction.currentBid.toFixed(2)}</div>
          <div style={{ maxHeight: '80px', overflowY: 'auto', marginBottom: '12px' }}>
            {[...pixel.auction.bids].reverse().map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                <span>{b.bidder}</span><span style={{ color: '#92FE9D' }}>${b.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <button onClick={() => onBid(pixel)} style={btnStyle('#1a5c35', '#92FE9D', '100%')}>
            Place Bid (min ${pixel.auction.minNext.toFixed(2)})
          </button>
        </div>
      ) : (
        <button onClick={() => onStartAuction(pixel)} style={btnStyle('#8B0000', '#fff', '100%')}>
          Start Auction for This Pixel
        </button>
      )}
    </Modal>
  )
}

function btnStyle(bg: string, color: string, width?: string) {
  return {
    background: bg, color, border: 'none', padding: '10px 20px', cursor: 'pointer',
    fontFamily: "'Space Mono', monospace", fontSize: '12px', letterSpacing: '0.08em',
    borderRadius: '2px', textTransform: 'uppercase' as const, width: width ?? 'auto',
  }
}
