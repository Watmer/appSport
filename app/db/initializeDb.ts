import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../../drizzle/migrations';
import { db } from './db';

export const useInitDb = () => {
  const { success, error } = useMigrations(db, migrations);
  return { success, error };
};