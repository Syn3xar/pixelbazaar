'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const [countdown, setCountdown] = useState(5)

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
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>✓</div>
      <h1 style={{ color: '#92FE9D', fontSize: '24px', marginBottom: '12px', letterSpacing: '0.05em' }}>Payment Successful!</h1>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Your pixel is now live on the board.</p>
      <p style={{ color: '#444', fontSize: '11px', marginBottom: '32px' }}>It may take a few seconds to appear.</p>
      <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '2px', padding: '16px 24px', marginBottom: '24px' }}>
        <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px' }}>SESSION ID</div>
        <div style={{ color: '#333', fontSize: '10px', wordBreak: 'break-all' }}>{sessionId}</div>
      </div>
      <p style={{ color: '#555', fontSize: '12px' }}>Redirecting back to the board in {countdown}s...</p>
      <button onClick={() => window.location.href = '/'} style={{ marginTop: '16px', background: '#784BA0', color: '#fff', border: 'none', padding: '10px 24px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', letterSpacing: '0.08em', borderRadius: '2px' }}>
        Back to Board →
      </button>
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
