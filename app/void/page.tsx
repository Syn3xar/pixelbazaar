'use client'
import { useState, useEffect } from 'react'

export default function VoidPage() {
  const [clicked, setClicked] = useState(false)
  const [chars, setChars] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    const messages = [
      'Nothing to see here...',
      '...or is there?',
      'You found the void.',
      'Most people never zoom this far.',
      'You are not most people.',
    ]
    let i = 0
    const id = setInterval(() => {
      if (i < messages.length) {
        setChars(messages[i])
        i++
      } else {
        clearInterval(id)
      }
    }, 1200)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#000', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Space Mono', monospace", cursor: 'default',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div style={{ color: '#111', fontSize: '13px', letterSpacing: '0.2em', marginBottom: '60px', transition: 'color 2s', userSelect: 'none' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#333')}>
        {chars}
      </div>

      {/* The one white pixel — clicking it reveals the secret */}
      <div
        onClick={() => { setClicked(true); setTimeout(() => setShowSecret(true), 800) }}
        style={{
          width: '1px', height: '1px', background: '#fff',
          cursor: 'pointer', position: 'relative',
          boxShadow: clicked ? '0 0 20px 4px rgba(120,75,160,0.8)' : 'none',
          transition: 'box-shadow 0.5s',
        }}
        title="..."
      />

      {showSecret && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.97)',
          animation: 'fadeIn 1s ease',
        }}>
          <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
          <div style={{ color: '#784BA0', fontSize: '11px', letterSpacing: '0.3em', marginBottom: '24px' }}>
            YOU FOUND THE SECRET
          </div>
          <div style={{ color: '#e0e0ff', fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>
            🎁 VOID10
          </div>
          <div style={{ color: '#555', fontSize: '11px', marginBottom: '40px', textAlign: 'center', lineHeight: 2 }}>
            Use this code for 10% off any pixel block.<br />
            You earned it by finding what others miss.
          </div>
          <a href="/" style={{ color: '#784BA0', fontSize: '11px', letterSpacing: '0.1em', textDecoration: 'none' }}>
            ← Return to the board
          </a>
        </div>
      )}

      <a href="/" style={{
        position: 'fixed', bottom: '24px',
        color: '#111', fontSize: '10px',
        textDecoration: 'none', letterSpacing: '0.1em',
        transition: 'color 0.3s',
      }}
        onMouseEnter={e => (e.currentTarget.style.color = '#333')}
        onMouseLeave={e => (e.currentTarget.style.color = '#111')}
      >
        ← back to reality
      </a>
    </div>
  )
}
