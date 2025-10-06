import { createPostgresDatabaseContext } from '@flexion/forms-database/context';
import { getAWSSecretsManagerVault } from '@flexion/forms-infra-core';

import { createCustomServer } from './server.js';

const port = process.env.PORT || 4321;

const getAppRunnerSecrets = async () => {
  const dbSecretStr = process.env.DB_SECRET;
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT;
  const dbName = process.env.DB_NAME;

  if (!dbSecretStr || !dbHost || !dbPort || !dbName) {
    console.error(
      'Missing required environment variables: DB_SECRET, DB_HOST, DB_PORT, DB_NAME'
    );
    return;
  }

  const dbSecret = JSON.parse(dbSecretStr);
  if (!dbSecret.username || !dbSecret.password) {
    console.error(
      '`DB_SECRET` environment variable is missing username or password'
    );
    return;
  }

  return {
    dbUri: `postgresql://${dbSecret.username}:${dbSecret.password}@${dbHost}:${dbPort}/${dbName}`,
  };
};

const secrets = await getAppRunnerSecrets();
if (secrets === undefined) {
  console.error('Error getting secrets');
  process.exit(1);
}

const db = await createPostgresDatabaseContext(secrets.dbUri, true);
const server = await createCustomServer(db);
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
