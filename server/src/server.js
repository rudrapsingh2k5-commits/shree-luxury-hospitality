import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { populateStaysCatalog } from './utils/populateStays.js';
import { ensureDemoAccounts } from './utils/ensureDemoAccounts.js';

import { validateEnv } from './config/validateEnv.js';

const PORT = process.env.PORT || process.env.SERVER_PORT || 5001;

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();
    await populateStaysCatalog();
    await ensureDemoAccounts();

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  SHREE श्री API SERVER RUNNING ON PORT ${PORT} `);
      console.log(`  URL: http://localhost:${PORT}               `);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
