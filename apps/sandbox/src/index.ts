import { createPostgresDatabaseContext } from '@flexion/forms-database/context';
import { getAWSSecretsManagerVault } from '@flexion/forms-infra-core';

import { createCustomServer } from './server.js';

const port = process.env.PORT || 4321;

const getAppRunnerSecrets = async () => {
  const dbSecretArn = process.env.DB_SECRET_ARN;
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT;
  const dbName = process.env.DB_NAME;

  if (!dbSecretArn || !dbHost || !dbPort || !dbName) {
    console.error(
      'Missing required environment variables: DB_SECRET_ARN, DB_HOST, DB_PORT, DB_NAME'
    );
    return;
  }

  const vault = getAWSSecretsManagerVault();
  const dbSecretString = await vault.getSecret(dbSecretArn);
  if (dbSecretString === undefined) {
    console.error('Error getting secret:', dbSecretArn);
    return;
  }

  const dbSecret = JSON.parse(dbSecretString);
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
