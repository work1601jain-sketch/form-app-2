import { getDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const db = await getDb();
    const { collection, filter = {}, update = {} } = req.body || {};
    if (!collection) return res.status(400).json({ error: 'Missing collection' });
    // Protect sensitive collections when running local backend: require admin key
    const sensitive = ['forms', 'form_submissions'];
    if (sensitive.includes(collection)) {
      const adminKey = process.env.LOCAL_ADMIN_KEY || null;
      const provided = req.headers['x-admin-key'] || req.body.admin_key || null;
      if (!adminKey || String(provided) !== String(adminKey)) {
        return res.status(401).json({ error: 'Unauthorized - admin key required for this collection' });
      }
    }
    const result = await db.collection(collection).updateOne(filter, update);
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
