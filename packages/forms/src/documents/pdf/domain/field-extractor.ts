import { success, failure } from '@flexion/forms-common';
import { getDocumentFieldData } from '../extract.js';
import type {
  FieldMetadata,
  ExtractFieldMetadataResult,
  ParseError,
} from './types.js';

/**
 * Extracts field metadata from PDF bytes.
 * This is a domain function that transforms raw PDF field data into
 * a format suitable for the parsing workflow.
 *
 * @param pdfBytes - Raw PDF file bytes
 * @returns Result containing array of field metadata or error
 */
export const extractFieldMetadata = async (
  pdfBytes: Uint8Array
): Promise<ExtractFieldMetadataResult> => {
  try {
    const documentFields = await getDocumentFieldData(pdfBytes);

    const metadata: FieldMetadata[] = [];
    for (const field of Object.values(documentFields)) {
      // Skip unsupported field types
      if (field.type !== 'not-supported') {
        metadata.push({
          id: field.name,
          type: field.type,
          label: field.label,
          instructions: '',
          page: 0,
        });
      }
    }

    return success(metadata);
  } catch (error) {
    const parseError: ParseError = {
      code: 'FIELD_EXTRACTION_ERROR',
      message: 'Failed to extract field metadata from PDF',
      details: error,
    };
    return failure(parseError);
  }
};
