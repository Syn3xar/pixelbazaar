'use client'
import { useState } from 'react'
import Modal from './Modal'
import { Pixel } from '@/app/page'

type Props = { pixel: Pixel; x: number; y: number; onClose: () => void }

export default function AuctionModal({ pixel, x, y, onClose }: Props) {
  const [minBid, setMinBid] = useState(Math.ceil(pixel.price * 1.1))
  const [hours, setHours] = useState(24)
  const [loading, setLoading] = useState(false)

  const blockSize = pixel.block_size ?? 1
  const blockId = pixel.block_id

  async function handleSubmit() {
    if (!blockId) return alert('Block ID not found. Please refresh and try again.')
    setLoading(true)
    try {
      const res = await fetch('/api/auction/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId, minBid, hours, sellerEmail: pixel.owner_email }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); setLoading(false); return }
      alert(`Auction started for your ${blockSize}×${blockSize} block! Refresh to see it live.`)
      onClose()
    } catch {
      alert('Error starting auction. Try again.')
      setLoading(false)
    }
  }

  return (
    <Modal title={`Auction your ${blockSize}×${blockSize} block`} onClose={onClose}>
      <div style={{ color: '#666', fontSize: '11px', marginBottom: '16px', lineHeight: 1.6 }}>
        Your entire <strong style={{ color: '#e0e0ff' }}>{blockSize}×{blockSize} block</strong> ({(blockSize*blockSize).toLocaleString()} pixels) will be auctioned as one unit. The winner takes full ownership of all pixels in the block. You receive 90% of the winning bid.
      </div>

      {/* Block info */}
      <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '12px', marginBottom: '16px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#555' }}>Block origin</span>
          <span style={{ color: '#e0e0ff' }}>[{x}, {y}]</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#555' }}>Block size</span>
          <span style={{ color: '#e0e0ff' }}>{blockSize}×{blockSize} ({(blockSize*blockSize).toLocaleString()} pixels)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#555' }}>Current owner</span>
          <span style={{ color: '#e0e0ff' }}>{pixel.company}</span>
        </div>
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
            <button key={h} onClick={() => setHours(h)} style={{
              flex: 1, padding: '8px 4px', fontSize: '10px', cursor: 'pointer',
              background: hours === h ? '#784BA0' : '#111118',
              color: hours === h ? '#fff' : '#666',
              border: `1px solid ${hours === h ? '#784BA0' : '#2a2a3e'}`,
              borderRadius: '2px', fontFamily: "'Space Mono', monospace",
            }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>Platform keeps (10%)</span><span style={{ color: '#FF6B6B' }}>${(minBid * 0.1).toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid #333', color: '#888', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', borderRadius: '2px' }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, background: loading ? '#444' : '#8B0000', color: '#fff', border: 'none', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', letterSpacing: '0.08em', borderRadius: '2px' }}>
          {loading ? 'Starting...' : 'Start Block Auction'}
        </button>
      </div>
    </Modal>
  )
}
