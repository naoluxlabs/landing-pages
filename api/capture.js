export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const { name, email, source } = typeof body === 'string' ? JSON.parse(body) : body;

  if (!email) return res.status(400).json({ error: 'Email required' });

  const notionKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_LEADS_DB_ID;

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
    if (!r.ok) return res.status(500).json({ error: data.message });
  }

  res.status(200).json({ ok: true });
}
