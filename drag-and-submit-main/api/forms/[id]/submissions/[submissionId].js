import { getDb, ObjectId } from '../../../_db.js';

export default async function handler(req, res) {
  const db = await getDb();
  const { submissionId } = req.query || {};
  try {
    if (req.method === 'GET') {
      let doc = await db.collection('form_submissions').findOne({ id: submissionId });
      if (!doc && ObjectId.isValid(submissionId)) {
        doc = await db.collection('form_submissions').findOne({ _id: new ObjectId(submissionId) });
      }
      if (!doc) return res.status(404).json({ error: 'Submission not found' });
      return res.json(doc);
    }
    if (req.method === 'PUT') {
      const updates = req.body;
      // Basic owner check: ensure form owner matches caller
      const callerId = (req.headers['x-user-id'] || req.headers['x-userid'] || req.body.user_id || req.body.userId || null);
      if (callerId) {
        const sub = await db.collection('form_submissions').findOne({ id: submissionId });
        if (sub && sub.form_id) {
          const form = await db.collection('forms').findOne({ id: sub.form_id });
          if (form && form.user_id && String(form.user_id) !== String(callerId)) {
            return res.status(401).json({ error: 'Unauthorized' });
          }
        }
      }
      let result = await db.collection('form_submissions').updateOne({ id: submissionId }, { $set: updates });
      if (result.matchedCount === 0 && ObjectId.isValid(submissionId)) {
        result = await db.collection('form_submissions').updateOne({ _id: new ObjectId(submissionId) }, { $set: updates });
      }
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Submission not found' });
      return res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
    }
    if (req.method === 'DELETE') {
      // Basic owner check
      const callerId = (req.headers['x-user-id'] || req.headers['x-userid'] || req.body.user_id || req.body.userId || null);
      if (callerId) {
        const sub = await db.collection('form_submissions').findOne({ id: submissionId });
        if (sub && sub.form_id) {
          const form = await db.collection('forms').findOne({ id: sub.form_id });
          if (form && form.user_id && String(form.user_id) !== String(callerId)) {
            return res.status(401).json({ error: 'Unauthorized' });
          }
        }
      }
      let result = await db.collection('form_submissions').deleteOne({ id: submissionId });
      if (result.deletedCount === 0 && ObjectId.isValid(submissionId)) {
        result = await db.collection('form_submissions').deleteOne({ _id: new ObjectId(submissionId) });
      }
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Submission not found' });
      return res.json({ deletedCount: result.deletedCount });
    }
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
