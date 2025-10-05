import { PDFDocument } from 'pdf-lib';

import { Result } from '@flexion/forms-common';
import { type FormOutput } from '../../index.js';
import { type PDFFieldType } from './index.js';
import { fillPdfField } from './patterns/index.js';

export const createFormOutputFieldData = (
  output: FormOutput,
  formData: Record<string, string>
): Record<string, { value: any; type: PDFFieldType }> => {
  const results = {} as Record<string, { value: any; type: PDFFieldType }>;
  Object.entries(output.fields).forEach(([patternId, docField]) => {
    if (docField.type === 'not-supported') {
      console.error(`unsupported field: ${patternId}: ${docField}`);
      return;
    }
    const outputFieldId = output.formFields[patternId];
    if (outputFieldId === '') {
      console.error(`empty outputFieldId for field: ${patternId}: ${docField}`);
      return;
    }
    results[outputFieldId] = {
      type: docField.type,
      value: formData[patternId],
    };
  });
  return results;
};

export const fillPDF = async (
  pdfBytes: Uint8Array,
  fieldData: Record<string, { value: any; type: PDFFieldType }>
): Promise<Result<Uint8Array>> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  try {
    Object.entries(fieldData).forEach(([name, value]) => {
      try {
        fillPdfField(form, value.type, name, value.value);
      } catch (error: any) {
        console.log('Error setting form field ', error.message);
      }
    });
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'error setting PDF field',
    };
  }
  return {
    success: true,
    data: await pdfDoc.save(),
  };
};
