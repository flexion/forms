import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import type { LanguageModel } from 'ai';

/**
 * Configuration for AWS Bedrock provider.
 */
export type BedrockConfig = {
  modelId: string;
  region: string;
  /**
   * Optional credential provider for AWS authentication.
   * Defaults to fromNodeProviderChain() which automatically handles:
   * - Environment variables (local development)
   * - IAM roles (App Runner, ECS, EKS, EC2)
   * - Shared credentials file
   */
  credentialProvider?: AwsCredentialIdentityProvider;
};

/**
 * Default Bedrock configuration using Claude Sonnet 4.5.
 */
export const DEFAULT_BEDROCK_CONFIG: BedrockConfig = {
  modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  region: 'us-east-1',
};

/**
 * Creates a Bedrock language model configured for the specified model.
 *
 * @param config - Optional partial configuration (merged with defaults)
 * @returns AI SDK LanguageModel instance
 *
 * @example
 * ```typescript
 * const model = createBedrockModel();
 * const result = await generateObject({ model, ... });
 * ```
 */
export const createBedrockModel = (
  config: Partial<BedrockConfig> = {}
): LanguageModel => {
  const {
    modelId,
    region,
    credentialProvider = fromNodeProviderChain(),
  } = { ...DEFAULT_BEDROCK_CONFIG, ...config };
  const bedrock = createAmazonBedrock({ region, credentialProvider });
  return bedrock(modelId);
};
