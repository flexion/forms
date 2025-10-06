export type DeployEnv = 'dev' | 'demo';

/**
 * Generates an object containing the paths for private/public keys pairs
 * associated with login.gov for an application in the specified
 * deployment environment.
 *
 * @param rootKey The root key for secrets (e.g., 'flexion-forms-demo', 'tts-10x-forms-dev')
 * @param appKey The application key (e.g., 'server-doj', 'server-kansas')
 */
export const getAppLoginGovKeys = (rootKey: string, appKey: string) => {
  return {
    privateKey: `/${rootKey}/${appKey}/login.gov/private-key`,
    publicKey: `/${rootKey}/${appKey}/login.gov/public-key`,
  };
};
