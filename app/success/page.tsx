'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const params = useSearchParams()
  const orderId = params.get('order') ?? params.get('session_id') ?? ''
  const [countdown, setCountdown] = useState(8)

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); window.location.href = '/' }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#08080f', fontFamily: "'Space Mono', monospace", textAlign: 'center', padding: '20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>✓</div>
      <h1 style={{ color: '#92FE9D', fontSize: '24px', marginBottom: '12px', letterSpacing: '0.05em', fontFamily: "'Orbitron', sans-serif" }}>Payment Successful!</h1>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Your pixel is now live on the board.</p>
      <p style={{ color: '#444', fontSize: '11px', marginBottom: '32px' }}>A confirmation email has been sent to you with your ownership certificate.</p>

      <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '24px', marginBottom: '24px', maxWidth: '400px', width: '100%' }}>
        <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px', letterSpacing: '0.1em' }}>ORDER ID</div>
        <div style={{ color: '#333', fontSize: '10px', wordBreak: 'break-all', marginBottom: '20px' }}>{orderId}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="/" style={{ display: 'block', background: '#784BA0', color: '#fff', padding: '12px', borderRadius: '2px', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.08em' }}>
            🎯 View Your Pixel on the Board
          </a>
          <a href="/my-pixels" style={{ display: 'block', background: '#111118', border: '1px solid #2a2a3e', color: '#888', padding: '12px', borderRadius: '2px', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.08em' }}>
            🖼 Manage My Pixels
          </a>
          <a href="/rankings" style={{ display: 'block', background: '#111118', border: '1px solid #2a2a3e', color: '#888', padding: '12px', borderRadius: '2px', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.08em' }}>
            🏆 View Rankings
          </a>
        </div>
      </div>

      <p style={{ color: '#555', fontSize: '12px' }}>Redirecting to board in {countdown}s...</p>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ color: '#e0e0ff', fontFamily: 'monospace', textAlign: 'center', marginTop: '40vh' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
