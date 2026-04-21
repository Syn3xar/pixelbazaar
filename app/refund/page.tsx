export default function RefundPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px', fontFamily: "'Space Mono', monospace", color: '#e0e0ff', background: '#08080f', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <a href="/" style={{ color: '#784BA0', fontSize: '12px', textDecoration: 'none', letterSpacing: '0.1em' }}>← Back to Board</a>

      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '32px 0 8px', color: '#fff', letterSpacing: '0.05em' }}>Refund Policy</h1>
      <p style={{ color: '#555', fontSize: '12px', marginBottom: '40px' }}>Last updated: April 2026</p>

      {[
        {
          title: '1. General Policy',
          content: 'All pixel purchases on MillionDotBoard are final and non-refundable. By completing a purchase, you acknowledge and agree that you will not be entitled to a refund for your pixel block purchase.'
        },
        {
          title: '2. Why Purchases Are Non-Refundable',
          content: 'Pixel blocks are digital advertising space that is immediately activated and displayed on the board upon purchase confirmation. Because the service is delivered instantly and the pixel is permanently reserved in your name, we are unable to offer refunds once a purchase is complete.'
        },
        {
          title: '3. Exceptions',
          content: 'Refunds may be considered only in the following exceptional circumstances: duplicate charges (you were charged twice for the same pixel), technical failure (payment was processed but pixel was not assigned), or unauthorized transaction (payment was made without your authorization). In these cases, please contact us within 7 days of the transaction.'
        },
        {
          title: '4. Auction Bids',
          content: 'All auction bids are binding and non-refundable once placed. Winning bidders who do not complete payment may be permanently banned from the platform. Auction results are final.'
        },
        {
          title: '5. How to Request a Refund',
          content: 'If you believe you qualify for a refund under Section 3, please contact us through milliondotboard.com within 7 days of your purchase. Include your email address, the pixel coordinates purchased, and the reason for your refund request. We will respond within 5 business days.'
        },
        {
          title: '6. Reselling Your Pixel',
          content: 'If you no longer want your pixel block, you can list it for auction on the platform. This allows you to potentially recover your investment by selling to another buyer. The platform retains 10% of the auction sale price as a fee.'
        },
        {
          title: '7. Platform Downtime',
          content: 'We do not offer refunds for temporary platform downtime or maintenance. Your pixel block remains yours regardless of any temporary service interruptions.'
        },
        {
          title: '8. Changes to This Policy',
          content: 'We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting to milliondotboard.com/refund. Your continued use of the Service constitutes acceptance of the updated policy.'
        },
        {
          title: '9. Contact',
          content: 'For refund requests or questions about this policy, contact us through milliondotboard.com. We aim to respond to all inquiries within 5 business days.'
        },
      ].map(({ title, content }) => (
        <div key={title} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#784BA0', marginBottom: '10px', letterSpacing: '0.05em' }}>{title}</h2>
          <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.8', margin: 0 }}>{content}</p>
        </div>
      ))}

      <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: '24px', marginTop: '40px', fontSize: '11px', color: '#444', textAlign: 'center' }}>
        © 2026 MillionDotBoard. All rights reserved.
      </div>
    </div>
  )
}
