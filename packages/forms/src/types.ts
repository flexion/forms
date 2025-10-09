import { type DocumentFieldMap } from './documents/types.js';
import { type PatternId, type PatternMap } from './pattern.js';

export type Blueprint = {
  summary: FormSummary;
  root: PatternId;
  patterns: PatternMap;
  outputs: FormOutput[];
};

export type FormSummary = {
  title: string;
  description: string;
};

export type FormOutput = {
  id: string;
  path: string;
  fields: DocumentFieldMap;
  formFields: Record<string, string>;
};
