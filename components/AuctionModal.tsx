'use client'
import { useState } from 'react'
import Modal from './Modal'
import { Pixel } from '@/app/page'

type Props = { pixel: Pixel; x: number; y: number; onClose: () => void }

export default function AuctionModal({ pixel, x, y, onClose }: Props) {
  const [minBid, setMinBid] = useState(Math.ceil(pixel.price * 1.1))
  const [hours, setHours] = useState(24)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch('/api/auction/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, minBid, hours, sellerEmail: pixel.owner_email }),
      })
      alert('Auction started! Refresh to see it live.')
      onClose()
    } catch {
      alert('Error starting auction. Try again.')
      setLoading(false)
    }
  }

  return (
    <Modal title="Start Auction" onClose={onClose}>
      <div style={{ color: '#666', fontSize: '11px', marginBottom: '20px', lineHeight: '1.6' }}>
        Put your pixel up for auction. You receive 90% of the winning bid. Platform keeps 10%.
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.1em', color: '#666', marginBottom: '6px', textTransform: 'uppercase' }}>Minimum Bid ($)</label>
        <input type="number" value={minBid} onChange={e => setMinBid(Number(e.target.value))} min={1}
          style={{ width: '100%', background: '#111118', border: '1px solid #2a2a3e', color: '#e0e0ff', padding: '10px 12px', fontFamily: "'Space Mono', monospace", fontSize: '13px', borderRadius: '2px', outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.1em', color: '#666', marginBottom: '6px', textTransform: 'uppercase' }}>Duration</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[1, 6, 24, 48, 168].map(h => (
            <button key={h} onClick={() => setHours(h)} style={{ flex: 1, padding: '8px 4px', fontSize: '10px', cursor: 'pointer', background: hours === h ? '#784BA0' : '#111118', color: hours === h ? '#fff' : '#666', border: `1px solid ${hours === h ? '#784BA0' : '#2a2a3e'}`, borderRadius: '2px', fontFamily: "'Space Mono', monospace" }}>
              {h < 24 ? h + 'h' : (h / 24) + 'd'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '14px', marginBottom: '20px', fontSize: '11px', color: '#666' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>If sold at minimum bid</span><span style={{ color: '#e0e0ff' }}>${minBid.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>You receive (90%)</span><span style={{ color: '#92FE9D' }}>${(minBid * 0.9).toFixed(2)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid #333', color: '#888', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', borderRadius: '2px' }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, background: loading ? '#444' : '#8B0000', color: '#fff', border: 'none', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', letterSpacing: '0.08em', borderRadius: '2px' }}>
          {loading ? 'Starting...' : 'Start Auction'}
        </button>
      </div>
    </Modal>
  )
}
