import { BlueprintBuilder } from '../../builder';
import { type PatternValueMap } from '../../pattern';
import { defaultFormConfig } from '../../patterns';
import { addDocument } from '../document';
import { type Blueprint } from '../..';
import { loadSamplePDF } from './sample-data';
import { FakePdfParser } from '../pdf/infrastructure/parsers/fake-parser.js';
import type { ExtractedObject } from '../pdf/domain/types.js';

// Simple mock for testing
const MOCK_EXTRACTED: ExtractedObject = {
  form_summary: {
    title: 'Test Form',
    description: 'Test form for unit tests',
  },
  pages: [
    {
      title: 'Personal Information',
      elements: [
        {
          component_type: 'paragraph',
          text: 'Please provide your information',
        },
        {
          component_type: 'fieldset',
          legend: 'Name',
          fields: [
            {
              component_type: 'text_input',
              id: 'firstName',
              label: 'First Name',
              required: true,
            },
            {
              component_type: 'text_input',
              id: 'lastName',
              label: 'Last Name',
              required: true,
            },
          ],
        },
      ],
    },
  ],
};

export const createTestFormWithPDF = async () => {
  const pdfBytes = await loadSamplePDF(
    'doj-pardon-marijuana/demo-application_for_certificate_of_pardon_for_simple_marijuana_possession.pdf'
  );
  const builder = new BlueprintBuilder(defaultFormConfig);

  // Use fake parser for testing
  const fakeParser = new FakePdfParser(MOCK_EXTRACTED);

  const { updatedForm } = await addDocument(
    builder.form,
    {
      name: 'test.pdf',
      data: new Uint8Array(pdfBytes),
    },
    {
      parser: fakeParser,
    }
  );

  return updatedForm;
};

export const getMockFormData = (form: Blueprint): PatternValueMap => {
  return Object.keys(form.patterns).reduce((acc, key) => {
    if (form.patterns[key].type === 'checkbox') {
      acc[key] = true;
    } else {
      acc[key] = 'test value';
    }
    return acc;
  }, {} as PatternValueMap);
};

