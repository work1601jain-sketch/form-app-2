require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// Serve built frontend when available
const path = require('path');
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..', 'dist');
try {
  app.use(express.static(STATIC_DIR));
  // SPA fallback to index.html for client-side routing
  app.get('*', (req, res, next) => {
    // Only handle non-API routes
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(STATIC_DIR, 'index.html'), (err) => {
      if (err) next();
    });
  });
} catch (e) {
  console.warn('Static assets not served, build may be missing:', STATIC_DIR);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DATABASE = process.env.MONGO_DATABASE || 'formsdb';

let client;
let db;

async function connect() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DATABASE);
    console.log('Connected to MongoDB', MONGO_URI, 'db', DATABASE);
  }
}

// Generic helper endpoints used by the frontend fallback
app.post('/api/find', async (req, res) => {
  try {
    await connect();
    const { collection, filter = {}, sort = {}, limit } = req.body;
    const cursor = db.collection(collection).find(filter).sort(sort);
    if (limit) cursor.limit(limit);
    const docs = await cursor.toArray();
    res.json({ documents: docs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/findOne', async (req, res) => {
  try {
    await connect();
    const { collection, filter = {} } = req.body;
    const doc = await db.collection(collection).findOne(filter);
    res.json({ document: doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/insertOne', async (req, res) => {
  try {
    await connect();
    const { collection, document } = req.body;
    if (!collection) {
      console.error('insertOne missing collection', req.body);
      return res.status(400).json({ error: 'Missing collection in request body' });
    }
    if (!document) {
      console.error('insertOne missing document', req.body);
      return res.status(400).json({ error: 'Missing document in request body' });
    }
    const result = await db.collection(collection).insertOne(document);
    console.log('insertOne result', { collection, insertedId: result.insertedId });
    res.json({ insertedId: document.id || result.insertedId });
  } catch (e) {
    console.error('insertOne error', e, 'body=', req.body);
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

app.post('/api/updateOne', async (req, res) => {
  try {
    await connect();
    const { collection, filter = {}, update = {} } = req.body;
    const result = await db.collection(collection).updateOne(filter, update);
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/deleteOne', async (req, res) => {
  try {
    await connect();
    const { collection, filter = {} } = req.body;
    const result = await db.collection(collection).deleteOne(filter);
    res.json({ deletedCount: result.deletedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Convenience endpoints for the forms app
app.get('/api/forms', async (req, res) => {
  try {
    await connect();
    const docs = await db.collection('forms').find({}).sort({ updated_at: -1 }).toArray();
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/forms/:id', async (req, res) => {
  try {
    await connect();
    const doc = await db.collection('forms').findOne({ id: req.params.id });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/forms', async (req, res) => {
  try {
    await connect();
    const doc = req.body;
    const result = await db.collection('forms').insertOne(doc);
    res.json({ insertedId: doc.id || result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/forms/:id', async (req, res) => {
  try {
    await connect();
    const updates = req.body;
    const result = await db.collection('forms').updateOne({ id: req.params.id }, { $set: updates });
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/forms/:id', async (req, res) => {
  try {
    await connect();
    const result = await db.collection('forms').deleteOne({ id: req.params.id });
    res.json({ deletedCount: result.deletedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/forms/:id/submissions', async (req, res) => {
  try {
    await connect();
    const docs = await db.collection('form_submissions').find({ form_id: req.params.id }).sort({ submitted_at: -1 }).toArray();
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/forms/:id/submissions/:submissionId', async (req, res) => {
  try {
    await connect();
    const sid = req.params.submissionId;
    let doc = await db.collection('form_submissions').findOne({ id: sid });
    if (!doc) {
      // try looking up by ObjectId if possible
      try {
        if (ObjectId.isValid(sid)) {
          doc = await db.collection('form_submissions').findOne({ _id: new ObjectId(sid) });
        }
      } catch (e) {
        console.error('Error parsing submissionId as ObjectId', sid, e);
      }
    }
    if (!doc) {
      console.warn('Submission not found', { submissionId: sid });
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/forms/:id/submissions', async (req, res) => {
  try {
    await connect();
    const doc = req.body;
    console.log('POST /api/forms/:id/submissions', { paramsId: req.params.id, body: doc });
    if (!doc) {
      console.error('No body provided to submissions endpoint');
      return res.status(400).json({ error: 'Missing submission body' });
    }
    // Ensure form_id matches URL param
    if (!doc.form_id) doc.form_id = req.params.id;
    const result = await db.collection('form_submissions').insertOne(doc);
    console.log('Inserted submission', { insertedId: result.insertedId });
    res.json({ insertedId: doc.id || result.insertedId });
  } catch (e) {
    console.error('/api/forms/:id/submissions error', e, 'body=', req.body);
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

app.put('/api/forms/:id/submissions/:submissionId', async (req, res) => {
  try {
    await connect();
    const sid = req.params.submissionId;
    const updates = req.body;
    // try update by id first, then by ObjectId
    let result = await db.collection('form_submissions').updateOne({ id: sid }, { $set: updates });
    if (result.matchedCount === 0 && ObjectId.isValid(sid)) {
      try {
        result = await db.collection('form_submissions').updateOne({ _id: new ObjectId(sid) }, { $set: updates });
      } catch (e) {
        console.error('Error updating by ObjectId', e);
      }
    }
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (e) {
    console.error('/api/forms/:id/submissions/:submissionId error', e, 'body=', req.body);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/forms/:id/submissions/:submissionId', async (req, res) => {
  try {
    await connect();
    const sid = req.params.submissionId;
    // try delete by id first, then by ObjectId
    let result = await db.collection('form_submissions').deleteOne({ id: sid });
    if (result.deletedCount === 0 && ObjectId.isValid(sid)) {
      try {
        result = await db.collection('form_submissions').deleteOne({ _id: new ObjectId(sid) });
      } catch (e) {
        console.error('Error deleting by ObjectId', e);
      }
    }
    if (result.deletedCount === 0) {
      console.warn('Submission delete not found', { submissionId: sid });
      return res.status(404).json({ error: 'Submission not found' });
    }
    console.log('Deleted submission', { submissionId: sid });
    res.json({ deletedCount: result.deletedCount });
  } catch (e) {
    console.error('/api/forms/:id/submissions/:submissionId DELETE error', e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = parseInt(process.env.PORT, 10) || 3001;
const server = app.listen(PORT, () => console.log(`Server listening on ${PORT}, serving static from ${STATIC_DIR}`));

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    console.error('Resolve: stop the process using the port or set a different PORT env var.');
    console.error('Windows: run `netstat -ano | findstr :' + PORT + '` then `taskkill /PID <pid> /F`.');
    console.error('Unix: run `lsof -i :' + PORT + '` or `fuser -k ' + PORT + '/tcp`');
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
