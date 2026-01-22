import { MongoClient, ObjectId } from 'mongodb';

// NOTE: For convenience the Atlas connection string is provided as a fallback
// If you plan to publish this repository or use a public remote, remove the
// hard-coded URI and set `MONGO_URI` and `MONGO_DATABASE` in your Vercel/production env.
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://app7nessco_db_user:h3OHhatsct2PibNN@cluster0.etqjn6t.mongodb.net/loginAuthDB?retryWrites=true&w=majority';
const DATABASE = process.env.MONGO_DATABASE || 'loginAuthDB';

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
