import type { generateObject } from 'ai';

/**
 * Computes a deterministic cache key for generateObject requests.
 * Hashes all relevant parameters including file contents.
 *
 * @param params - Parameters passed to AI SDK's generateObject
 * @returns SHA-256 hash string (64 hex characters)
 */
export const computeObjectCacheKey = async (
  params: Parameters<typeof generateObject>[0]
): Promise<string> => {
  const keyComponents = {
    model: extractModelId(params.model),
    system: 'system' in params ? params.system : undefined,
    messages:
      'messages' in params
        ? await hashMessages(params.messages ?? [])
        : undefined,
    schema: 'schema' in params ? await hashSchema(params.schema) : undefined,
    schemaName: 'schemaName' in params ? params.schemaName : undefined,
    schemaDescription:
      'schemaDescription' in params ? params.schemaDescription : undefined,
    temperature: 'temperature' in params ? params.temperature : undefined,
    topP: 'topP' in params ? params.topP : undefined,
    maxTokens: 'maxTokens' in params ? params.maxTokens : undefined,
  };

  return await sha256(JSON.stringify(keyComponents));
};

/**
 * Hashes messages, including file content hashes for determinism.
 */
const hashMessages = async (messages: any[]): Promise<string> => {
  const hashed = await Promise.all(
    messages.map(async msg => {
      if (Array.isArray(msg.content)) {
        return {
          role: msg.role,
          content: await Promise.all(
            msg.content.map(async (part: any) => {
              if (part.type === 'file') {
                return {
                  type: 'file',
                  hash: await sha256Buffer(part.data),
                  mimeType: part.mimeType,
                };
              }
              return part;
            })
          ),
        };
      }
      return msg;
    })
  );

  return await sha256(JSON.stringify(hashed));
};

/**
 * Computes SHA-256 hash of a string using Web Crypto API.
 */
const sha256 = async (data: string): Promise<string> => {
  const buffer = new TextEncoder().encode(data);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Computes SHA-256 hash of a buffer using Web Crypto API.
 */
const sha256Buffer = async (
  data: Uint8Array | ArrayBuffer | ArrayBufferLike
): Promise<string> => {
  // Create a new Uint8Array to ensure proper ArrayBuffer backing
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const normalizedData = new Uint8Array(bytes);
  const hashBuffer = await globalThis.crypto.subtle.digest(
    'SHA-256',
    normalizedData
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Extracts model ID from AI SDK model object.
 */
const extractModelId = (model: any): string => {
  // AI SDK model objects have modelId property
  return model.modelId || model.id || String(model);
};

/**
 * Hashes a Zod schema for cache key generation.
 * Uses JSON representation for determinism.
 */
const hashSchema = async (schema: any): Promise<string> => {
  // Zod schemas have a _def property that contains the schema definition
  // We use JSON.stringify on the entire schema object for simplicity
  return await sha256(JSON.stringify(schema));
};
