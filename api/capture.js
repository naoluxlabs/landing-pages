export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const { name, email, source } = typeof body === 'string' ? JSON.parse(body) : body;

  if (!email) return res.status(400).json({ error: 'Email required' });

  const notionKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_LEADS_DB_ID;
  const resendKey = process.env.RESEND_API_KEY;

  // Save to Notion
  if (notionKey && dbId) {
    const r = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Name: { title: [{ text: { content: name || email } }] },
          Email: { email: email },
          Source: { rich_text: [{ text: { content: source || 'unknown' } }] },
          'Signed Up': { date: { start: new Date().toISOString() } },
        },
      }),
    });
    const data = await r.json();
    if (!r.ok) console.error('Notion error:', data.message);
  }

  // Send welcome email via Resend
  if (resendKey) {
    const firstName = name ? name.split(' ')[0] : 'there';
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Naolux Labs <hello@naoluxlabs.com>',
        to: email,
        subject: 'Your Apex Peptide Guide is here 🧬',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px 32px; border-radius: 12px;">
            <h1 style="color: #c9a84c; font-size: 24px; margin-bottom: 8px;">Hey ${firstName},</h1>
            <p style="color: #cccccc; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">
              Thanks for downloading the <strong style="color: #ffffff;">Apex Part 1 — Foundations Guide</strong>.
              You're one step closer to optimizing your performance with proven peptide protocols.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://drive.google.com/uc?export=download&id=1MXFkza1n2cZTHyRBVgZvkeE0J6YXqKwo"
                 style="background: #c9a84c; color: #000000; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
                Download Your Guide →
              </a>
            </div>
            <p style="color: #aaaaaa; font-size: 14px; line-height: 1.7;">
              Inside you'll find the foundational peptide stack for recovery, fat loss, and longevity —
              the same protocols used by elite athletes who refuse to slow down.
            </p>
            <hr style="border: none; border-top: 1px solid #333; margin: 32px 0;" />
            <p style="color: #555; font-size: 13px;">
              — The Naolux Labs Team<br/>
              <a href="https://naoluxlabs.com" style="color: #c9a84c;">naoluxlabs.com</a>
            </p>
          </div>
        `,
      }),
    });
  }

  res.status(200).json({ ok: true });
}
