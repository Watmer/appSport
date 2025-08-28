// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_old_tyger_tiger.sql';
import m0001 from './0001_high_preak.sql';
import m0002 from './0002_powerful_forge.sql';
import m0003 from './0003_loud_nova.sql';
import m0004 from './0004_freezing_jocasta.sql';
import m0005 from './0005_dapper_sally_floyd.sql';
import m0006 from './0006_secret_havok.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006
    }
  }
  