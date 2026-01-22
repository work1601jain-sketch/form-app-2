import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DATABASE = process.env.MONGO_DATABASE || 'formsdb';

// Cache the client across lambda invocations
let cached = globalThis.__mongo || null;
if (!cached) {
  cached = { client: null, db: null };
  globalThis.__mongo = cached;
}

export async function getDb() {
  if (cached.db) return cached.db;
  if (!cached.client) {
    cached.client = new MongoClient(MONGO_URI);
    await cached.client.connect();
  }
  cached.db = cached.client.db(DATABASE);
  return cached.db;
}

export { ObjectId };
