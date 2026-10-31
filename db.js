import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('serveTogetherDB'); // Database Name
    console.log('MongoDB Connected Successfully!');
  }
  return db;
}