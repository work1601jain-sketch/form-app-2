import { getDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const db = await getDb();
    const { collection, filter = {} } = req.body || {};
    if (!collection) return res.status(400).json({ error: 'Missing collection' });
    const result = await db.collection(collection).deleteOne(filter);
    res.json({ deletedCount: result.deletedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
