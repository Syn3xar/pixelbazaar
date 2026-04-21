type Props = { title: string; onClose: () => void; children: React.ReactNode }

export default function Modal({ title, onClose, children }: Props) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: '12px 12px 0 0', padding: 'clamp(20px,4vw,32px)', maxWidth: '520px', width: '100%', boxShadow: '0 0 60px rgba(120,75,160,0.3)', fontFamily: "'Space Mono', monospace", maxHeight: '88vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        {/* Drag handle */}
        <div style={{ width: '40px', height: '4px', background: '#2a2a3e', borderRadius: '2px', margin: '-8px auto 16px', flexShrink: 0 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', letterSpacing: '0.12em', color: '#e0e0ff', textTransform: 'uppercase' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #333', color: '#888', cursor: 'pointer', padding: '4px 10px', borderRadius: '2px', fontFamily: 'inherit', fontSize: '11px' }}>ESC</button>
        </div>
        {children}
      </div>
    </div>
  )
}
