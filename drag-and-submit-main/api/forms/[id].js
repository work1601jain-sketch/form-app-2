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
      // Basic owner check
      const callerId = (req.headers['x-user-id'] || req.headers['x-userid'] || req.body.user_id || req.body.userId || null);
      if (callerId) {
        const form = await db.collection('forms').findOne({ id });
        if (form && form.user_id && String(form.user_id) !== String(callerId)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }
      const result = await db.collection('forms').updateOne({ id }, { $set: updates });
      return res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
    }
    if (req.method === 'DELETE') {
      // Basic owner check
      const callerId = (req.headers['x-user-id'] || req.headers['x-userid'] || req.body.user_id || req.body.userId || null);
      if (callerId) {
        const form = await db.collection('forms').findOne({ id });
        if (form && form.user_id && String(form.user_id) !== String(callerId)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }
      const result = await db.collection('forms').deleteOne({ id });
      return res.json({ deletedCount: result.deletedCount });
    }
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
