import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import type { LanguageModel } from 'ai';

/**
 * Configuration for AWS Bedrock provider.
 */
export type BedrockConfig = {
  modelId: string;
  region: string;
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
  const { modelId, region } = { ...DEFAULT_BEDROCK_CONFIG, ...config };
  const bedrock = createAmazonBedrock({ region });
  return bedrock(modelId);
};
