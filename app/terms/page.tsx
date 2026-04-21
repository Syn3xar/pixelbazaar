export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px', fontFamily: "'Space Mono', monospace", color: '#e0e0ff', background: '#08080f', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <a href="/" style={{ color: '#784BA0', fontSize: '12px', textDecoration: 'none', letterSpacing: '0.1em' }}>← Back to Board</a>

      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '32px 0 8px', color: '#fff', letterSpacing: '0.05em' }}>Terms & Conditions</h1>
      <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '40px' }}>Last updated: April 2026</p>

      {[
        {
          title: '1. Acceptance of Terms',
          content: 'By accessing and using MillionDotBoard ("the Service") at milliondotboard.com, you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service.'
        },
        {
          title: '2. Description of Service',
          content: 'MillionDotBoard is an online pixel advertising marketplace where users can purchase pixel blocks on a 1,000,000 pixel board. Each pixel block displays a company name, color, and clickable link. Pixel ownership is permanent and non-refundable once purchased.'
        },
        {
          title: '3. Purchases and Payments',
          content: 'All purchases are final and non-refundable. Prices are as listed on the website: $1 for a 1×1 pixel, $50 for a 10×10 block, and $1,000 for a 100×100 block. Payments are processed securely through our payment providers. The platform retains a 10% fee on all transactions including auction sales.'
        },
        {
          title: '4. Pixel Ownership',
          content: 'Upon successful payment, you receive permanent display rights for your purchased pixel block. You may display your company name, brand color, and a URL link. Pixel blocks may be auctioned to other buyers through the platform\'s auction system. The platform retains 10% of all auction proceeds.'
        },
        {
          title: '5. Prohibited Content',
          content: 'You may not use your pixel block to display or link to: illegal content, adult or explicit material, malware or phishing sites, hate speech or discriminatory content, content that infringes on intellectual property rights, or any content that violates applicable laws.'
        },
        {
          title: '6. Auctions',
          content: 'Pixel owners may list their blocks for auction. All bids are binding. The winning bidder must complete payment within the specified timeframe. The platform reserves the right to cancel auctions that violate these terms.'
        },
        {
          title: '7. Disclaimer of Warranties',
          content: 'The Service is provided "as is" without any warranties. MillionDotBoard does not guarantee uninterrupted service, and we reserve the right to modify, suspend, or discontinue the Service at any time.'
        },
        {
          title: '8. Limitation of Liability',
          content: 'MillionDotBoard shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid for your pixel purchase.'
        },
        {
          title: '9. Privacy',
          content: 'Your email address is collected for ownership verification purposes and is never displayed publicly on the board. Your company name and website URL are displayed publicly as part of your pixel advertisement. We do not sell your personal data to third parties.'
        },
        {
          title: '10. Changes to Terms',
          content: 'We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.'
        },
        {
          title: '11. Contact',
          content: 'For any questions about these Terms & Conditions, please contact us through the website at milliondotboard.com.'
        },
      ].map(({ title, content }) => (
        <div key={title} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#784BA0', marginBottom: '10px', letterSpacing: '0.05em' }}>{title}</h2>
          <p style={{ fontSize: '13px', color: '#bbb', lineHeight: '1.8', margin: 0 }}>{content}</p>
        </div>
      ))}

      <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: '24px', marginTop: '40px', fontSize: '11px', color: '#444', textAlign: 'center' }}>
        © 2026 MillionDotBoard. All rights reserved.
      </div>
    </div>
  )
}
