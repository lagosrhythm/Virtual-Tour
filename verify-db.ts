import 'dotenv/config';
import { initializeFirebase } from './src/server/db/firestore';

async function verify() {
  console.log('--- RTDB Data Verification ---');
  try {
    const { rtdb } = initializeFirebase();

    const snapshot = await rtdb.ref('/').get();
    const data = snapshot.val();

    if (!data) {
      console.log('Database is empty.');
    } else {
      for (const key of Object.keys(data)) {
        const count = typeof data[key] === 'object' ? Object.keys(data[key]).length : 1;
        console.log(`✓ ${key}: ${count} items`);
      }
    }

    console.log('----------------------------------');
    console.log('✓ Verification complete');
    process.exit(0);
  } catch (error) {
    console.error('✗ Verification failed:', error);
    process.exit(1);
  }
}

verify();
