import { S3Backend, TerraformStack } from 'cdktf';

/**
 * Configures an S3 backend for a given Terraform stack to store the Terraform
 * state in an S3 bucket with a specific key and region.
 */
export const withBackend = (stack: TerraformStack, stackPrefix: string) =>
  new S3Backend(stack, {
    bucket: 'flexion-forms-demo-sandbox-tfstate',
    key: `${stackPrefix}.tfstate`,
    region: 'us-east-1',
  });
