import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const x         = searchParams.get('x') ?? '0'
  const y         = searchParams.get('y') ?? '0'
  const company   = searchParams.get('company') ?? 'Unknown'
  const blockSize = searchParams.get('blockSize') ?? '1'
  const price     = searchParams.get('price') ?? '1'
  const date      = searchParams.get('date') ? new Date(searchParams.get('date')!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString()
  const pixels    = Number(blockSize) * Number(blockSize)

  // Generate HTML that renders as a beautiful certificate
  // Using print-friendly HTML that browsers can save as PDF
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pixel Ownership Certificate — ${company}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #08080f;
      color: #e0e0ff;
      font-family: 'Space Mono', monospace;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 40px;
    }
    .cert {
      width: 800px;
      background: #0a0a14;
      border: 2px solid #784BA0;
      border-radius: 4px;
      padding: 60px;
      position: relative;
      box-shadow: 0 0 80px rgba(120,75,160,0.3), inset 0 0 80px rgba(120,75,160,0.05);
    }
    .corner {
      position: absolute; width: 30px; height: 30px;
      border-color: #FFD700; border-style: solid;
    }
    .tl { top: 16px; left: 16px; border-width: 2px 0 0 2px; }
    .tr { top: 16px; right: 16px; border-width: 2px 2px 0 0; }
    .bl { bottom: 16px; left: 16px; border-width: 0 0 2px 2px; }
    .br { bottom: 16px; right: 16px; border-width: 0 2px 2px 0; }
    .logo { font-family: 'Orbitron', sans-serif; font-weight: 900; font-size: 22px; text-align: center; margin-bottom: 8px; }
    .logo .m { color: #784BA0; } .logo .d { color: #e0e0ff; }
    .subtitle { text-align: center; font-size: 10px; letter-spacing: 0.3em; color: #444; margin-bottom: 40px; text-transform: uppercase; }
    .title { text-align: center; font-size: 28px; color: #FFD700; letter-spacing: 0.05em; margin-bottom: 8px; }
    .title-sub { text-align: center; font-size: 11px; color: #555; margin-bottom: 40px; letter-spacing: 0.1em; }
    .company { text-align: center; font-size: 36px; color: #e0e0ff; font-weight: bold; margin-bottom: 40px; padding: 20px; border-top: 1px solid #1a1a2e; border-bottom: 1px solid #1a1a2e; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 40px; }
    .field { padding: 16px 20px; border-bottom: 1px solid #111118; }
    .field:nth-child(odd) { border-right: 1px solid #111118; }
    .field-label { font-size: 9px; color: #444; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 6px; }
    .field-value { font-size: 15px; color: #e0e0ff; }
    .field-value.gold { color: #FFD700; }
    .field-value.green { color: #92FE9D; }
    .seal {
      display: flex; align-items: center; justify-content: center; gap: 20px;
      padding: 24px; background: #784BA011; border: 1px solid #784BA033; border-radius: 4px; margin-bottom: 32px;
    }
    .seal-icon { font-size: 40px; }
    .seal-text { font-size: 11px; color: #784BA0; line-height: 1.8; }
    .footer { text-align: center; font-size: 9px; color: #333; letter-spacing: 0.1em; }
    .url { text-align: center; font-size: 11px; color: #784BA0; margin-bottom: 24px; }
    @media print {
      body { background: white; }
      .cert { box-shadow: none; border-color: #784BA0; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>

    <div class="logo"><span class="m">MILLION</span><span class="d">DOTBOARD</span></div>
    <div class="subtitle">1,000,000 Pixel Marketplace · milliondotboard.com</div>

    <div class="title">Certificate of Ownership</div>
    <div class="title-sub">This certifies that the following entity owns pixel space on the MillionDotBoard</div>

    <div class="company">${company}</div>

    <div class="grid">
      <div class="field">
        <div class="field-label">Coordinates</div>
        <div class="field-value gold">[${x}, ${y}]</div>
      </div>
      <div class="field">
        <div class="field-label">Block Size</div>
        <div class="field-value">${blockSize}×${blockSize} pixels</div>
      </div>
      <div class="field">
        <div class="field-label">Total Pixels Owned</div>
        <div class="field-value green">${pixels.toLocaleString()} pixels</div>
      </div>
      <div class="field">
        <div class="field-label">Purchase Price</div>
        <div class="field-value gold">$${Number(price).toFixed(2)}</div>
      </div>
      <div class="field">
        <div class="field-label">Date of Purchase</div>
        <div class="field-value">${date}</div>
      </div>
      <div class="field">
        <div class="field-label">Ownership Type</div>
        <div class="field-value green">Permanent</div>
      </div>
    </div>

    <div class="seal">
      <div class="seal-icon">🔏</div>
      <div class="seal-text">
        This certificate confirms permanent ownership of the pixel block described above.<br>
        The owner has the right to display their brand, color, and clickable URL on the board.<br>
        Ownership may be transferred via the platform auction system.
      </div>
    </div>

    <div class="url">milliondotboard.com/?inspect=${x},${y}</div>
    <div class="footer">© 2026 MillionDotBoard · This is an official ownership certificate · Issued ${date}</div>
  </div>
  <script>
    // Auto-trigger print dialog for PDF save
    window.onload = () => {
      document.title = 'MillionDotBoard Certificate — ${company}'
    }
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
