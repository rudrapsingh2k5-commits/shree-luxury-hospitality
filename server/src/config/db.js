import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_URI_FILE = path.resolve(__dirname, '../../.local_mongo_uri');

let mongoMemoryServer = null;
let isInstanceOwner = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[Database] Attempting connection to configured MONGODB_URI...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] Successfully connected to remote MongoDB.`);
      return mongoose.connection;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        console.error(`[Database Fatal] Failed to connect to MongoDB in production: ${err.message}`);
        throw err;
      }
      console.warn(`[Database] Failed to connect to configured MONGODB_URI: ${err.message}`);
      console.warn(`[Database] Falling back to embedded local MongoDB engine for offline/evaluation mode...`);
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Fatal] MONGODB_URI must be provided in production environments.');
    }
  }

  // Check if a shared local Mongo instance is already running
  if (process.env.NODE_ENV !== 'production' && fs.existsSync(LOCAL_URI_FILE)) {
    try {
      const activeUri = fs.readFileSync(LOCAL_URI_FILE, 'utf-8').trim();
      if (activeUri) {
        await mongoose.connect(activeUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`[Database] Connected to running local MongoDB instance at: ${activeUri}`);
        return mongoose.connection;
      }
    } catch {
      // Stale file or uncontactable, remove it and spin up fresh instance below
      try {
        fs.unlinkSync(LOCAL_URI_FILE);
      } catch {}
    }
  }

  // Embedded MongoMemoryServer fallback
  try {
    console.log(`[Database] No active instance found. Starting embedded local MongoDB engine...`);
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'hotelpro',
      },
    });
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    isInstanceOwner = true;

    // Save URI for local sibling processes (e.g. createAdmin CLI)
    try {
      fs.writeFileSync(LOCAL_URI_FILE, memoryUri, 'utf-8');
    } catch {}

    console.log(`[Database] Connected to embedded MongoDB at: ${memoryUri}`);
    return mongoose.connection;
  } catch (err) {
    console.error(`[Database] Fatal: Failed to initialize embedded MongoDB: ${err.message}`);
    throw err;
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer && isInstanceOwner) {
    await mongoMemoryServer.stop();
    try {
      if (fs.existsSync(LOCAL_URI_FILE)) {
        fs.unlinkSync(LOCAL_URI_FILE);
      }
    } catch {}
  }
};
