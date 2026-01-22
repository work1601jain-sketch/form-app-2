import { getDb, ObjectId } from '../_db.js';

export default async function handler(req, res) {
  const db = await getDb();
  const { id } = req.query || {};
  try {
    if (req.method === 'GET') {
      const doc = await db.collection('forms').findOne({ id });
      return res.json(doc);
    }
    if (req.method === 'PUT') {
      const updates = req.body;
      const result = await db.collection('forms').updateOne({ id }, { $set: updates });
      return res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
    }
    if (req.method === 'DELETE') {
      const result = await db.collection('forms').deleteOne({ id });
      return res.json({ deletedCount: result.deletedCount });
    }
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
