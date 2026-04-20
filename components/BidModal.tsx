'use client'
import { useState } from 'react'
import Modal from './Modal'
import { Pixel } from '@/app/page'

type Props = { pixel: Pixel; x: number; y: number; onClose: () => void }

export default function BidModal({ pixel, x, y, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState(pixel.auction!.minNext)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) return alert('Please fill in all fields')
    if (amount < pixel.auction!.minNext) return alert(`Minimum bid is $${pixel.auction!.minNext.toFixed(2)}`)
    setLoading(true)
    try {
      const res = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId: pixel.auction!.id, bidderName: name, bidderEmail: email, amount }),
      })
      const data = await res.json()
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
      else { alert('Bid placed!'); onClose() }
    } catch {
      alert('Error placing bid. Try again.')
      setLoading(false)
    }
  }

  return (
    <Modal title="Place Bid" onClose={onClose}>
      <div style={{ color: '#666', fontSize: '11px', marginBottom: '20px' }}>
        Current bid: <span style={{ color: '#FFD700' }}>${pixel.auction!.currentBid.toFixed(2)}</span> — minimum: <span style={{ color: '#92FE9D' }}>${pixel.auction!.minNext.toFixed(2)}</span>
      </div>
      {[{ label: 'Your Name', val: name, set: setName, ph: 'Your Company Name' }, { label: 'Your Email', val: email, set: setEmail, ph: 'you@company.com', type: 'email' }].map(({ label, val, set, ph, type }) => (
        <div key={label} style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.1em', color: '#666', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</label>
          <input type={type ?? 'text'} value={val} onChange={e => set(e.target.value)} placeholder={ph}
            style={{ width: '100%', background: '#111118', border: '1px solid #2a2a3e', color: '#e0e0ff', padding: '10px 12px', fontFamily: "'Space Mono', monospace", fontSize: '13px', borderRadius: '2px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      ))}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.1em', color: '#666', marginBottom: '6px', textTransform: 'uppercase' }}>Your Bid ($)</label>
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={pixel.auction!.minNext}
          style={{ width: '100%', background: '#111118', border: '1px solid #2a2a3e', color: '#e0e0ff', padding: '10px 12px', fontFamily: "'Space Mono', monospace", fontSize: '13px', borderRadius: '2px', outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '14px', marginBottom: '20px', fontSize: '11px', color: '#666' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Bid Amount</span><span style={{ color: '#e0e0ff' }}>${amount.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Charged if you win</span><span style={{ color: '#FFD700' }}>${amount.toFixed(2)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid #333', color: '#888', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', borderRadius: '2px' }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, background: loading ? '#444' : '#1a5c35', color: '#92FE9D', border: 'none', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', letterSpacing: '0.08em', borderRadius: '2px' }}>
          {loading ? 'Processing...' : 'Place Bid →'}
        </button>
      </div>
    </Modal>
  )
}
