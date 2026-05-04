import { App, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { AwsProvider } from '../../../.gen/providers/aws/provider';
import { withBackend } from '../../lib/backend';
import { SandboxStack } from '../../lib/aws/sandbox-stack';

const stackName = 'flexion-forms-sandbox-demo';

class AwsDemoStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS provider
    new AwsProvider(this, 'AWS', {
      region: 'us-east-1',
    });

    // Create the sandbox infrastructure
    new SandboxStack(this, stackName, {
      environment: 'flexion-forms-demo',
      customDomain: '10x-forms.labs.flexion.us',
    });
  }
}

const app = new App();
const stack = new AwsDemoStack(app, stackName);
withBackend(stack, stackName);
app.synth();
