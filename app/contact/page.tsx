'use client'
import { useState } from 'react'

type FormType = 'refund' | 'support' | 'general' | 'auction'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', type: 'general' as FormType, pixelCoords: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setSent(true)
      else setError('Failed to send message. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const inp = {
    width: '100%', background: '#0f0f1a', border: '1px solid #2a2a3e',
    color: '#e0e0ff', padding: '12px 14px', fontFamily: "'Space Mono', monospace",
    fontSize: '13px', borderRadius: '2px', outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontSize: '10px', letterSpacing: '0.1em',
    color: '#888', marginBottom: '6px', textTransform: 'uppercase' as const,
  }

  return (
    <div style={{ background: '#08080f', minHeight: '100vh', fontFamily: "'Space Mono', monospace", color: '#e0e0ff' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#050508', borderBottom: '1px solid #1a1a2e', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '18px' }}>
          <span style={{ color: '#784BA0' }}>MILLION</span>
          <span style={{ color: '#e0e0ff' }}>DOTBOARD</span>
        </div>
        <a href="/" style={{ color: '#888', fontSize: '11px', textDecoration: 'none' }}>← Back to Board</a>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '60px 24px' }}>

        {sent ? (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>✓</div>
            <h1 style={{ color: '#92FE9D', fontSize: '22px', marginBottom: '12px', letterSpacing: '0.05em' }}>Message Sent!</h1>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px', lineHeight: 1.8 }}>
              Thank you for reaching out. We will respond to your email within <strong style={{ color: '#e0e0ff' }}>5 business days</strong>.
            </p>
            <p style={{ color: '#555', fontSize: '12px', marginBottom: '32px' }}>
              A copy of your message has been sent to {form.email}
            </p>
            <a href="/" style={{ background: '#784BA0', color: '#fff', padding: '12px 24px', borderRadius: '2px', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.08em' }}>
              Back to Board →
            </a>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '40px' }}>
              <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '24px', marginBottom: '8px' }}>
                <span style={{ color: '#784BA0' }}>CONTACT</span>
                <span style={{ color: '#e0e0ff' }}> US</span>
              </h1>
              <p style={{ color: '#888', fontSize: '13px', lineHeight: 1.8 }}>
                Have a question, refund request, or need support? Fill in the form below and we'll get back to you within 5 business days.
              </p>
            </div>

            {/* Quick contact options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px' }}>
              {[
                { icon: '💰', label: 'Refund Request', desc: 'Request a refund for a purchase', type: 'refund' },
                { icon: '⚡', label: 'Auction Support', desc: 'Issues with auctions or bids', type: 'auction' },
                { icon: '🛠', label: 'Technical Support', desc: 'Pixel not showing, payment issues', type: 'support' },
                { icon: '💬', label: 'General Inquiry', desc: 'Anything else', type: 'general' },
              ].map(opt => (
                <div key={opt.type} onClick={() => setForm(f => ({ ...f, type: opt.type as FormType }))}
                  style={{ background: '#0f0f1a', border: `1px solid ${form.type === opt.type ? '#784BA0' : '#1a1a2e'}`, borderRadius: '2px', padding: '14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#784BA0')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = form.type === opt.type ? '#784BA0' : '#1a1a2e')}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{opt.icon}</div>
                  <div style={{ color: '#e0e0ff', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>{opt.label}</div>
                  <div style={{ color: '#666', fontSize: '10px' }}>{opt.desc}</div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Your Name *</label>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="John Smith" style={inp} />
                </div>
                <div>
                  <label style={labelStyle}>Your Email *</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" style={inp} />
                </div>
              </div>

              {(form.type === 'refund' || form.type === 'support') && (
                <div>
                  <label style={labelStyle}>Pixel Coordinates (optional)</label>
                  <input type="text" value={form.pixelCoords} onChange={set('pixelCoords')} placeholder="e.g. [450, 320]" style={inp} />
                </div>
              )}

              <div>
                <label style={labelStyle}>Message *</label>
                <textarea value={form.message} onChange={set('message')}
                  placeholder={
                    form.type === 'refund' ? 'Please describe why you are requesting a refund and include your order details...' :
                    form.type === 'support' ? 'Please describe your issue in detail...' :
                    form.type === 'auction' ? 'Please describe your auction issue...' :
                    'How can we help you?'
                  }
                  rows={6}
                  style={{ ...inp, resize: 'vertical' as const }} />
              </div>

              {error && (
                <div style={{ background: '#FF6B6B11', border: '1px solid #FF6B6B44', borderRadius: '2px', padding: '10px 14px', color: '#FF6B6B', fontSize: '12px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '10px', color: '#555' }}>We respond within 5 business days</div>
                <button onClick={handleSubmit} disabled={loading} style={{
                  background: loading ? '#444' : '#784BA0', color: '#fff', border: 'none',
                  padding: '12px 28px', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '12px', letterSpacing: '0.08em', borderRadius: '2px',
                }}>
                  {loading ? 'Sending...' : 'Send Message →'}
                </button>
              </div>
            </div>

            {/* Response time notice */}
            <div style={{ marginTop: '40px', borderTop: '1px solid #1a1a2e', paddingTop: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {[
                { icon: '⏱', label: 'Response Time', value: '5 business days' },
                { icon: '🔒', label: 'Privacy', value: 'Your data is protected' },
                { icon: '📧', label: 'Email', value: 'contact@milliondotboard.com' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ flex: 1, minWidth: '140px' }}>
                  <div style={{ fontSize: '16px', marginBottom: '4px' }}>{icon}</div>
                  <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{value}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: '24px', marginTop: '40px', fontSize: '10px', color: '#444', textAlign: 'center' }}>
          <a href="/terms" style={{ color: '#444', marginRight: '16px', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#444', marginRight: '16px', textDecoration: 'none' }}>Privacy</a>
          <a href="/refund" style={{ color: '#444', textDecoration: 'none' }}>Refund Policy</a>
          <div style={{ marginTop: '8px' }}>© 2026 MillionDotBoard</div>
        </div>
      </div>
    </div>
  )
}
