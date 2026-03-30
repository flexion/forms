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

        // GSA/TTS people
        'amber.vanamburg@gsa.gov',
        'bret.mogilefsky@gsa.gov',
        'chris.bisom@gsa.gov',
        'daniel.naab@gsa.gov',
        'daniela.aburto@gsa.gov',
        'elizabeth.ayer@gsa.gov',
        'john.jediny@gsa.gov',
        'nicholas.papafil@gsa.gov',
        'samantha.noor@gsa.gov',
        'tyler.burton@gsa.gov',

        // CEQ
        'david.y.yi@ceq.eop.gov',
        'Jordan.K.Eccles@ceq.eop.gov',
        'michael.r.drummond@ceq.eop.gov',
        'sophie.r.godfrey-mckee@ceq.eop.gov'
      ].includes(email.toLowerCase());
    },
  });
};
