export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const raw = (req.query.phone || '').toString().trim();
  if (!raw) return res.status(400).json({ error: 'No phone provided' });

  const clean = raw.replace(/\D/g, '');
  if (clean.length < 8 || clean.length > 15) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  try {
    const url = `https://wa.me/${clean}`;
    const r = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (r.status >= 300 && r.status < 400) {
      return res.json({ phone: clean, status: 'registered' });
    }

    const html = await r.text();
    const invalidPatterns = [
      /phone number shared via url is invalid/i,
      /couldn't find/i,
      /not on whatsapp/i,
      /invalid number/i
    ];

    const isInvalid = invalidPatterns.some(p => p.test(html));
    return res.json({
      phone: clean,
      status: isInvalid ? 'not_registered' : 'registered'
    });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'fetch failed' });
  }
}
