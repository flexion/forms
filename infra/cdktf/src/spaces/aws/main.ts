import { execSync } from 'child_process';
import { App, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { AwsProvider } from '../../../.gen/providers/aws/provider';
import { withBackend } from '../../lib/backend';
import { SandboxStack } from '../../lib/aws/sandbox-stack';

const gitRef =
  process.env.DEPLOY_GIT_REF ||
  execSync('git rev-parse HEAD').toString().trim();

const stackName = 'flexion-forms-main';

class AwsMainStack extends TerraformStack {
  constructor(scope: Construct, id: string, gitRef: string) {
    super(scope, id);

    // Configure AWS provider
    new AwsProvider(this, 'AWS', {
      region: 'us-east-2',
    });

    // Create the sandbox infrastructure
    new SandboxStack(this, stackName, {
      environment: 'main-aws',
      gitRef,
    });
  }
}

const app = new App();
const stack = new AwsMainStack(app, stackName, gitRef);
withBackend(stack, stackName);
app.synth();
