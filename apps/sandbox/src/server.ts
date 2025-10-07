import { type DatabaseContext } from '@flexion/forms-database';
import { createServer } from '@flexion/forms-server';

export const createCustomServer = async (db: DatabaseContext): Promise<any> => {
  return createServer({
    agencyBranding: false,
    title: 'Form Service Sandbox',
    db,
    loginGovOptions: {
      loginGovUrl: 'https://idp.int.identitysandbox.gov',
      clientId:
        'urn:gov:gsa:openidconnect.profiles:sp:sso:gsa:tts-10x-atj-dev-server-doj',
      //clientSecret: '', // secrets.loginGovClientSecret,
    },
    isUserAuthorized: async (email: string) => {
      // Flexion addresses
      if (email.endsWith('@flexion.us')) {
        return true;
      }

      // Other authorized users
      return [
        // Digital Public Ventures
        'jim@digitalpublic.ventures',
        'mike@digitalpublic.ventures',

        // Maryland Digital Service
        'syed.azeem@maryland.gov',
        'lauren.george@maryland.gov',
        'emil.leong@maryland.gov',
        'paul.roberts@maryland.gov',
      ].includes(email.toLowerCase());
    },
  });
};
