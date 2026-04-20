'use client'
import { useState } from 'react'
import Modal from './Modal'

type Props = { x: number; y: number; onClose: () => void }

function randColor() {
  return ['#FF3CAC','#784BA0','#2B86C5','#00C9FF','#92FE9D','#FC5C7D','#FFD700','#FF6B6B','#4ECDC4'][Math.floor(Math.random() * 9)]
}

export default function BuyModal({ x, y, onClose }: Props) {
  const [form, setForm] = useState({ company: '', url: '', color: randColor(), email: '' })
  const [loading, setLoading] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit() {
    if (!form.company.trim() || !form.url.trim() || !form.email.trim()) return alert('Please fill in all fields')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, ...form }),
      })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      alert('Payment error — please try again')
      setLoading(false)
    }
  }

  return (
    <Modal title="Purchase Pixel" onClose={onClose}>
      {[
        { label: 'Your Email', key: 'email', placeholder: 'you@company.com', type: 'email' },
        { label: 'Company Name', key: 'company', placeholder: 'Acme Corp' },
        { label: 'Website URL', key: 'url', placeholder: 'https://yoursite.com' },
      ].map(({ label, key, placeholder, type }) => (
        <div key={key} style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.1em', color: '#666', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</label>
          <input type={type ?? 'text'} value={(form as any)[key]} onChange={set(key)} placeholder={placeholder}
            style={{ width: '100%', background: '#111118', border: '1px solid #2a2a3e', color: '#e0e0ff', padding: '10px 12px', fontFamily: "'Space Mono', monospace", fontSize: '13px', borderRadius: '2px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      ))}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.1em', color: '#666', marginBottom: '6px', textTransform: 'uppercase' }}>Pixel Color</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="color" value={form.color} onChange={set('color')} style={{ width: '48px', height: '36px', cursor: 'pointer', border: '1px solid #2a2a3e', borderRadius: '2px', background: 'none' }} />
          <span style={{ color: '#555', fontSize: '11px' }}>Pick your brand color</span>
        </div>
      </div>
      <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', marginBottom: '6px' }}>
          <span>Pixel Price</span><span style={{ color: '#e0e0ff' }}>$1.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', marginBottom: '6px' }}>
          <span>Platform Fee (10%)</span><span style={{ color: '#FF6B6B' }}>included</span>
        </div>
        <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#e0e0ff' }}>Total Due</span><span style={{ color: '#FFD700' }}>$1.00</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid #333', color: '#888', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', borderRadius: '2px' }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, background: loading ? '#444' : '#784BA0', color: '#fff', border: 'none', padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', letterSpacing: '0.08em', borderRadius: '2px' }}>
          {loading ? 'Redirecting...' : 'Pay with Card →'}
        </button>
      </div>
    </Modal>
  )
}
