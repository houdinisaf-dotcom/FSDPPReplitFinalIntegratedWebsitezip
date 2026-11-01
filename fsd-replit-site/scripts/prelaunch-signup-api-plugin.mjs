import { createDatabasePool } from '../src/server/db-pool.js';
import { createPrelaunchSignupMiddleware } from '../src/server/prelaunch-signups.js';

export function prelaunchSignupApiPlugin() {
  return {
    name: 'fsd-prelaunch-signup-api',
    configureServer(server) {
      const pool = createDatabasePool();
      server.middlewares.use(createPrelaunchSignupMiddleware({
        query: (sql, params) => pool.query(sql, params),
      }));
      server.httpServer?.once('close', () => { void pool.end(); });
    },
  };
}
