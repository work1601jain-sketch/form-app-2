import { getDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const db = await getDb();
    const { collection, filter = {}, sort = {}, limit } = req.body || {};
    if (!collection) return res.status(400).json({ error: 'Missing collection' });
    const cursor = db.collection(collection).find(filter).sort(sort);
    if (limit) cursor.limit(limit);
    const docs = await cursor.toArray();
    res.json({ documents: docs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
