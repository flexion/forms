import { App } from 'cdktf';

const app = new App();

const deployEnv = process.env.DEPLOY_ENV;

switch (deployEnv) {
  case 'cloud-gov-main':
    import('./spaces/cloud-gov/main');
    break;
  case 'cloud-gov-demo':
    import('./spaces/cloud-gov/demo');
    break;
  case 'aws-main':
    import('./spaces/aws/main');
    break;
  case 'aws-demo':
    import('./spaces/aws/demo');
    break;
  default:
    throw new Error(`Please specify a valid environment (got: "${deployEnv}")`);
}

app.synth();
