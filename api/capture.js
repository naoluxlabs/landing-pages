export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let body = {};
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString());
  } catch {}

  const { name, email, source } = body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const notionKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_LEADS_DB_ID;

  if (notionKey && dbId) {
    try {
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
      if (!r.ok) console.error('Notion error:', JSON.stringify(data));
    } catch (err) {
      console.error('Notion error:', err);
    }
  }

  res.status(200).json({ ok: true });
}
