import { getDb } from '../_db.js';

export default async function handler(req, res) {
  const db = await getDb();
  try {
    if (req.method === 'GET') {
      const docs = await db.collection('forms').find({}).sort({ updated_at: -1 }).toArray();
      return res.json(docs);
    }
    if (req.method === 'POST') {
      const doc = req.body;
      const result = await db.collection('forms').insertOne(doc);
      return res.json({ insertedId: doc.id || result.insertedId });
    }
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
