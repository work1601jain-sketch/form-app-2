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
      // Basic validation
      if (!doc || typeof doc !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid request body' });
      }
      try {
        const result = await db.collection('forms').insertOne(doc);
        return res.json({ insertedId: doc.id || result.insertedId });
      } catch (insertErr) {
        console.error('Error inserting form document:', insertErr);
        return res.status(500).json({ error: String(insertErr.message || insertErr), stack: insertErr.stack });
      }
    }
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('Unhandled error in /api/forms handler:', e);
    res.status(500).json({ error: String(e.message || e), stack: e.stack });
  }
}
