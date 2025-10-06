export const getSecretKeys = (rootKey: string) => [
  `/${rootKey}/cloudfoundry/password`,
  `/${rootKey}/cloudfoundry/username`,
  `/${rootKey}/server-doj/leidos-intranet-quorum/password`,
  `/${rootKey}/server-doj/leidos-intranet-quorum/username`,
  `/${rootKey}/server-doj/login.gov/private-key`,
  `/${rootKey}/server-doj/login.gov/public-key`,
  `/${rootKey}/server-kansas/login.gov/private-key`,
  `/${rootKey}/server-kansas/login.gov/public-key`,
  `/${rootKey}/database`,
];

export const getDatabaseSecretKey = (rootKey: string) => `/${rootKey}/database`;
