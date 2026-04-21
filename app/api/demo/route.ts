import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Demo companies with colorful pixel art patterns
const DEMO_COMPANIES = [
  { company: 'NeonLabs', url: 'https://milliondotboard.com', color: '#FF3CAC', size: 10, x: 50, y: 50 },
  { company: 'ByteForge', url: 'https://milliondotboard.com', color: '#784BA0', size: 10, x: 65, y: 50 },
  { company: 'PixelCraft', url: 'https://milliondotboard.com', color: '#2B86C5', size: 10, x: 80, y: 50 },
  { company: 'VoidCast', url: 'https://milliondotboard.com', color: '#00C9FF', size: 10, x: 50, y: 65 },
  { company: 'StarForge', url: 'https://milliondotboard.com', color: '#92FE9D', size: 10, x: 65, y: 65 },
  { company: 'DataFlux', url: 'https://milliondotboard.com', color: '#FFD700', size: 10, x: 80, y: 65 },
  { company: 'ArcLight', url: 'https://milliondotboard.com', color: '#FF6B6B', size: 10, x: 50, y: 80 },
  { company: 'GridCore', url: 'https://milliondotboard.com', color: '#4ECDC4', size: 10, x: 65, y: 80 },
  { company: 'PulseAds', url: 'https://milliondotboard.com', color: '#f7971e', size: 10, x: 80, y: 80 },
  // Larger 100x100 demo block in center
  { company: 'DEMO ZONE', url: 'https://milliondotboard.com', color: '#784BA0', size: 1, x: 200, y: 200 },
]

// Generate colorful gradient pixel patterns for a block
function generatePixelColors(size: number, baseColor: string): string[] {
  const colors = [
    '#FF3CAC', '#784BA0', '#2B86C5', '#00C9FF', '#92FE9D',
    '#FFD700', '#FF6B6B', '#4ECDC4', '#f7971e', '#A8FF78',
    '#FC5C7D', '#B721FF', '#08AEEA', '#FF6B6B', '#4ECDC4',
  ]
  const pixels: string[] = []
  for (let i = 0; i < size * size; i++) {
    // Create a colorful pattern based on position
    const row = Math.floor(i / size)
    const col = i % size
    const colorIdx = (row + col) % colors.length
    // Mix base color with pattern
    if ((row + col) % 3 === 0) pixels.push(baseColor)
    else if ((row * col) % 5 === 0) pixels.push('#ffffff')
    else pixels.push(colors[colorIdx])
  }
  return pixels
}

export async function POST(req: NextRequest) {
  // Security check - only allow with admin password
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const results = []

  for (const demo of DEMO_COMPANIES) {
    try {
      // Check if block already exists
      const { data: existing } = await db.from('blocks')
        .select('id').eq('origin_x', demo.x).eq('origin_y', demo.y).single()
      if (existing) { results.push({ company: demo.company, status: 'already exists' }); continue }

      // Create block
      const { data: block, error: blockErr } = await db.from('blocks').insert({
        origin_x: demo.x, origin_y: demo.y,
        block_size: demo.size,
        company: demo.company,
        url: demo.url,
        owner_email: 'demo@milliondotboard.com',
        price: demo.size === 1 ? 1 : demo.size === 10 ? 50 : 1000,
      }).select().single()

      if (blockErr || !block) { results.push({ company: demo.company, status: 'error', error: blockErr?.message }); continue }

      // Create pixels with colorful patterns
      const pixelColors = generatePixelColors(demo.size, demo.color)
      const pixelRows = []
      let colorIdx = 0
      for (let dy = 0; dy < demo.size; dy++) {
        for (let dx = 0; dx < demo.size; dx++) {
          pixelRows.push({
            x: demo.x + dx, y: demo.y + dy,
            block_id: block.id,
            company: demo.company,
            url: demo.url,
            color: pixelColors[colorIdx] ?? demo.color,
            price: demo.size === 1 ? 1 : demo.size === 10 ? 50 : 1000,
            owner_email: 'demo@milliondotboard.com',
          })
          colorIdx++
        }
      }
      await db.from('pixels').upsert(pixelRows)
      results.push({ company: demo.company, status: 'created', pixels: demo.size * demo.size })
    } catch (err: any) {
      results.push({ company: demo.company, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ ok: true, results })
}

// DELETE - removes all demo pixels
export async function DELETE(req: NextRequest) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { error } = await db.from('blocks')
    .delete()
    .eq('owner_email', 'demo@milliondotboard.com')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'All demo pixels removed' })
}
