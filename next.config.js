import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MillionDollarBoard — 1,000,000 Pixel Marketplace',
  description: 'Buy a pixel, advertise your company on a canvas of one million pixels. Auctions, bidding, and instant ownership.',
  openGraph: {
    title: 'MillionDollarBoard — 1,000,000 Pixel Marketplace',
    description: 'Buy a pixel on the worlds biggest ad board.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
