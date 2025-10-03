import { type Result } from '@flexion/forms-common';

/**
 * Domain Types for PDF Parsing
 *
 * These are generic types used across all PDF parsing implementations.
 * Parser-specific schemas (like BedrockExtractedObject) live in their own modules.
 */

// ============================================================================
// Error Types
// ============================================================================

export type ParseErrorCode =
  | 'INVALID_PDF'
  | 'FIELD_EXTRACTION_ERROR'
  | 'PARSER_ERROR'
  | 'SCHEMA_VALIDATION_ERROR'
  | 'PATTERN_MAPPING_ERROR';

export type ParseError = {
  code: ParseErrorCode;
  message: string;
  details?: unknown;
};

// ============================================================================
// Field Metadata
// ============================================================================

/**
 * Neutral representation of PDF field metadata.
 * This is extracted from pdf-lib and can be used by any parser.
 */
export type FieldMetadata = {
  id: string;
  type: string;
  label: string;
  instructions?: string;
  page: number;
};

// ============================================================================
// Domain Function Result Types
// ============================================================================

export type ExtractFieldMetadataResult = Result<FieldMetadata[], ParseError>;
