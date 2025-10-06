import { createPostgresDatabaseContext } from '@flexion/forms-database/context';
import { getAWSSecretsManagerVault } from '@flexion/forms-infra-core';

import { createCustomServer } from './server.js';

const port = process.env.PORT || 4321;

const getAppRunnerSecrets = async () => {
  const dbSecretEnv = process.env.DB_SECRET;
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT;
  const dbName = process.env.DB_NAME;

  if (!dbSecretEnv || !dbHost || !dbPort || !dbName) {
    console.error(
      'Missing required environment variables: DB_SECRET, DB_HOST, DB_PORT, DB_NAME'
    );
    return;
  }

  let dbSecretStr: string;

  // Check if DB_SECRET is already JSON (injected by App Runner) or an ARN
  if (dbSecretEnv.startsWith('{')) {
    // Already JSON - App Runner injected the secret value directly
    console.log('Using secret value from environment variable');
    dbSecretStr = dbSecretEnv;
  } else {
    // It's an ARN - fetch from Secrets Manager
    console.log('Fetching secret from Secrets Manager using ARN');
    const vault = getAWSSecretsManagerVault();
    const fetchedSecret = await vault.getSecret(dbSecretEnv);

    if (!fetchedSecret) {
      console.error('Failed to retrieve secret from Secrets Manager');
      return;
    }
    dbSecretStr = fetchedSecret;
  }

  const dbSecret = JSON.parse(dbSecretStr);
  if (!dbSecret.username || !dbSecret.password) {
    console.error(
      'Secret from Secrets Manager is missing username or password'
    );
    return;
  }

  // URL-encode credentials to handle special characters
  const encodedUsername = encodeURIComponent(dbSecret.username);
  const encodedPassword = encodeURIComponent(dbSecret.password);

  return {
    dbUri: `postgresql://${encodedUsername}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}`,
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
