import { PDFDocument } from 'pdf-lib';

import { Result } from '@flexion/forms-common';
import { type FormOutput } from '../../index.js';
import { type PDFFieldType } from './index.js';
import { fillField } from './adapters/pdf-lib-fields.js';

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
        fillField(form, value.type, name, value.value);
      } catch (error: any) {
        console.log('Error setting form field ', error.message);
      }
    });
  } catch (error: any) {
    const fieldDataNames = Object.keys(fieldData); // names we got from API
    const fields = form.getFields();
    const fieldNames = fields.map(field => field.getName()); // fieldnames we ripped from the PDF

    // Combine the two arrays with an indication of their source
    const combinedNames = [
      ...fieldDataNames.map(name => ({ name, source: 'API' })),
      ...fieldNames.map(name => ({ name, source: 'pdf-lib' })),
    ];

    // Use a Map to keep track of unique names and their sources
    const uniqueNamesMap = new Map();

    combinedNames.forEach(({ name, source }) => {
      if (!uniqueNamesMap.has(name)) {
        uniqueNamesMap.set(name, []);
      }
      uniqueNamesMap.get(name).push(source);
    });

    // Convert the Map to an array of objects and sort it alphabetically by name
    const uniqueNamesArray = Array.from(uniqueNamesMap.entries())
      .map(([name, sources]) => ({ name, sources }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (error?.message) {
      return {
        success: false,
        error: error?.message || 'error setting PDF field',
      };
    }

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
