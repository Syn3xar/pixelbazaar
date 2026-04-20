import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MillionDollarBoard — 1,000,000 Pixel Marketplace',
  description: 'Buy a pixel, advertise your company on a canvas of one million pixels. Auctions, bidding, and instant ownership.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
