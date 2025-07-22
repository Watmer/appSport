import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './db';
import migrations from '../../drizzle/migrations';

export const useInitDb = () => {
  const { success, error } = useMigrations(db, migrations);
  return { success, error };
};