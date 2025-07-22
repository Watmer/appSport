import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseAsync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import migrations from '../../drizzle/migrations'; 

async function setupDatabase() {
  const sqliteDb = await openDatabaseAsync('sportapp.db');

  const db = drizzle(sqliteDb);

  await migrate(db, migrations);

  return db;
}

export default setupDatabase;