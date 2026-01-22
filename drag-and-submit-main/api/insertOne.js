import { getDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const db = await getDb();
    const { collection, document } = req.body || {};
    if (!collection) return res.status(400).json({ error: 'Missing collection' });
    if (!document) return res.status(400).json({ error: 'Missing document' });
    const result = await db.collection(collection).insertOne(document);
    res.json({ insertedId: document.id || result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
