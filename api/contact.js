// Sends the contact-form submission to esg444@gmail.com via Resend.
// RESEND_API_KEY is provisioned by the Vercel Resend integration.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { name, email, message } = req.body || {};
  if (!name || !email || !message || typeof message !== 'string' || message.length > 5000) {
    res.status(400).json({ error: 'missing or invalid fields' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'invalid email' });
    return;
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'site contact <onboarding@resend.dev>',
        to: ['esg444@gmail.com'],
        reply_to: email,
        subject: `site contact: ${name}`,
        html: `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      throw new Error(`resend ${r.status}: ${detail}`);
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'send failed' });
  }
};
