import { getDb } from '../../../_db.js';

export default async function handler(req, res) {
  const db = await getDb();
  const { id } = req.query || {};
  try {
    if (req.method === 'GET') {
      const docs = await db.collection('form_submissions').find({ form_id: id }).sort({ submitted_at: -1 }).toArray();
      return res.json(docs);
    }
    if (req.method === 'POST') {
      const doc = req.body;
      if (!doc) return res.status(400).json({ error: 'Missing submission body' });
      if (!doc.form_id) doc.form_id = id;
      const result = await db.collection('form_submissions').insertOne(doc);
      return res.json({ insertedId: doc.id || result.insertedId });
    }
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
