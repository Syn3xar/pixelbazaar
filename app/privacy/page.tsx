export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px', fontFamily: "'Space Mono', monospace", color: '#e0e0ff', background: '#08080f', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <a href="/" style={{ color: '#784BA0', fontSize: '12px', textDecoration: 'none', letterSpacing: '0.1em' }}>← Back to Board</a>

      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '32px 0 8px', color: '#fff', letterSpacing: '0.05em' }}>Privacy Policy</h1>
      <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '40px' }}>Last updated: April 2026</p>

      {[
        {
          title: '1. Introduction',
          content: 'MillionDotBoard ("we", "us", or "our") operates milliondotboard.com. This Privacy Policy explains how we collect, use, and protect your personal information when you use our Service.'
        },
        {
          title: '2. Information We Collect',
          content: 'We collect the following information when you make a purchase: your email address (for ownership verification), your company name (displayed publicly on the board), your website URL (displayed publicly as a clickable link), and your pixel block design and colors (displayed publicly on the board). We do not collect payment card details — these are handled securely by our payment processors.'
        },
        {
          title: '3. How We Use Your Information',
          content: 'We use your information to: process and verify your pixel purchase, display your advertisement on the board, verify ownership for auction purposes, send purchase confirmation emails, and maintain records of transactions. We do not use your information for marketing without your consent.'
        },
        {
          title: '4. What Is Publicly Visible',
          content: 'The following information is visible to all visitors on the board: your company name, your website URL, your pixel colors and design. Your email address is NEVER displayed publicly and is stored privately in our secure database.'
        },
        {
          title: '5. Data Storage',
          content: 'Your data is stored securely using Supabase, a PostgreSQL database provider with enterprise-grade security. Data is stored in the EU (Frankfurt) region. We retain your data for as long as your pixel block exists on the board.'
        },
        {
          title: '6. Third-Party Services',
          content: 'We use the following third-party services: Supabase (database storage), Paddle or PayPal (payment processing), Vercel (website hosting). Each of these services has their own privacy policy and data handling practices.'
        },
        {
          title: '7. Cookies',
          content: 'We use minimal cookies necessary for the operation of the website. We do not use tracking cookies or advertising cookies. We do not use Google Analytics or any third-party tracking services.'
        },
        {
          title: '8. Your Rights',
          content: 'You have the right to: request access to your personal data, request correction of inaccurate data, request deletion of your data (note: this may affect your pixel ownership), and withdraw consent where applicable. To exercise these rights, contact us at milliondotboard.com/contact.'
        },
        {
          title: '9. Data Security',
          content: 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All data transmissions are encrypted using SSL/TLS.'
        },
        {
          title: '10. Children\'s Privacy',
          content: 'Our Service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.'
        },
        {
          title: '11. Changes to This Policy',
          content: 'We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date at the top of this page. Continued use of the Service constitutes acceptance of the updated policy.'
        },
        {
          title: '12. Contact Us',
          content: 'If you have any questions about this Privacy Policy or how we handle your data, please contact us at milliondotboard.com/contact.'
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
