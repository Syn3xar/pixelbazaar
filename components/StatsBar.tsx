import { Pixel } from '@/app/page'

type Props = { pixelMap: Record<string, Pixel>; revenue: number }

export default function StatsBar({ pixelMap, revenue }: Props) {
  const sold = Object.keys(pixelMap).length
  const available = 1_000_000 - sold
  const pct = (sold / 1_000_000 * 100).toFixed(2)
  const auctions = Object.values(pixelMap).filter(p => p.auction?.active).length

  const stats = [
    ['PIXELS SOLD', sold.toLocaleString(), '#784BA0'],
    ['AVAILABLE', available.toLocaleString(), '#4ECDC4'],
    ['FILLED', pct + '%', '#FFD700'],
    ['LIVE AUCTIONS', auctions.toString(), '#FF6B6B'],
    ['PLATFORM REVENUE', '$' + revenue.toFixed(2), '#92FE9D'],
  ]

  return (
    <div style={{ display: 'flex', background: '#050508', borderBottom: '1px solid #1a1a2e', flexWrap: 'wrap' }}>
      {stats.map(([label, val, color]) => (
        <div key={label} style={{ flex: 1, minWidth: '140px', padding: '14px 20px', borderRight: '1px solid #1a1a2e' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#444', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '16px', color, fontFamily: "'Space Mono', monospace" }}>{val}</div>
        </div>
      ))}
    </div>
  )
}
