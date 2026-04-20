# PixelBazaar — 1,000,000 Pixel Marketplace

A million-pixel ad board where companies buy pixels, advertise their brand, and bid in auctions.

---

## Quick Setup (for your developer)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in:
- **Supabase**: Go to supabase.com → your project → Settings → API
- **Stripe**: Go to dashboard.stripe.com → Developers → API keys

```bash
cp .env.local.example .env.local
```

### 3. Set up the database
- Go to Supabase dashboard → SQL Editor → New Query
- Paste the entire contents of `supabase-schema.sql`
- Click Run

### 4. Run locally
```bash
npm run dev
```
Visit http://localhost:3000

### 5. Deploy to Vercel
- Push this code to GitHub
- Connect the GitHub repo in Vercel
- Add all environment variables from `.env.local` into Vercel → Project Settings → Environment Variables
- Deploy!

### 6. Set up Stripe Webhook
After deploying, go to:
- Stripe Dashboard → Developers → Webhooks → Add endpoint
- URL: `https://your-vercel-domain.vercel.app/api/webhook`
- Events to listen for: `checkout.session.completed`
- Copy the webhook signing secret into Vercel env vars as `STRIPE_WEBHOOK_SECRET`

---

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Canvas API
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe Checkout
- **Hosting**: Vercel
- **Styling**: Inline styles + Tailwind CSS

## Revenue Model
- $1 per pixel (platform keeps 100% of initial sales)
- 10% platform fee on all auction bids
- Stripe fee: 2.9% + $0.30 per transaction (deducted automatically)
