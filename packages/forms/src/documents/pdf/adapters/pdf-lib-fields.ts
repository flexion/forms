import {
  PDFField,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFForm,
  PDFName,
  createPDFAcroFields,
} from 'pdf-lib';

import type { DocumentFieldValue } from '../../types.js';
import type { PDFFieldType } from '../index.js';

/**
 * Handler for a specific PDF field type.
 * Groups extraction and filling logic together for related field types.
 */
interface FieldHandler<T extends PDFField> {
  type: PDFFieldType;
  isInstance(field: PDFField): field is T;
  extract(field: T): DocumentFieldValue;
  fill(form: PDFForm, name: string, value: any): void;
}

const textFieldHandler: FieldHandler<PDFTextField> = {
  type: 'TextField',

  isInstance(field: PDFField): field is PDFTextField {
    return field instanceof PDFTextField;
  },

  extract(field: PDFTextField): DocumentFieldValue {
    return {
      type: 'TextField',
      name: field.getName(),
      label: field.getName(),
      value: field.getText() || '',
      maxLength: field.getMaxLength(),
      required: field.isRequired(),
    };
  },

  fill(form: PDFForm, name: string, value: string) {
    const field = form.getTextField(name);
    field.setText(value);
  },
};

const checkBoxHandler: FieldHandler<PDFCheckBox> = {
  type: 'CheckBox',

  isInstance(field: PDFField): field is PDFCheckBox {
    return field instanceof PDFCheckBox;
  },

  extract(field: PDFCheckBox): DocumentFieldValue {
    return {
      type: 'CheckBox',
      name: field.getName(),
      label: field.getName(),
      value: field.isChecked(),
      required: field.isRequired(),
    };
  },

  fill(form: PDFForm, name: string, value: boolean) {
    const field = form.getCheckBox(name);
    if (value) {
      field.check();
    } else {
      field.uncheck();
    }
  },
};

const dropdownHandler: FieldHandler<PDFDropdown> = {
  type: 'Dropdown',

  isInstance(field: PDFField): field is PDFDropdown {
    return field instanceof PDFDropdown;
  },

  extract(field: PDFDropdown): DocumentFieldValue {
    return {
      type: 'Dropdown',
      name: field.getName(),
      label: field.getName(),
      value: field.getSelected(),
      required: field.isRequired(),
    };
  },

  fill(form: PDFForm, name: string, value: string) {
    const field = form.getDropdown(name);
    field.select(value);
  },
};

const optionListHandler: FieldHandler<PDFOptionList> = {
  type: 'OptionList',

  isInstance(field: PDFField): field is PDFOptionList {
    return field instanceof PDFOptionList;
  },

  extract(field: PDFOptionList): DocumentFieldValue {
    return {
      type: 'OptionList',
      name: field.getName(),
      label: field.getName(),
      value: field.getSelected(),
      required: field.isRequired(),
    };
  },

  fill(form: PDFForm, name: string, value: string) {
    const field = form.getDropdown(name);
    field.select(value);
  },
};

const radioGroupHandler: FieldHandler<PDFRadioGroup> = {
  type: 'RadioGroup',

  isInstance(field: PDFField): field is PDFRadioGroup {
    return field instanceof PDFRadioGroup;
  },

  extract(field: PDFRadioGroup): DocumentFieldValue {
    return {
      type: 'RadioGroup',
      name: field.getName(),
      options: field.getOptions(),
      label: field.getName(),
      value: field.getSelected() || '', // pdfLib allows this to be undefined
      required: field.isRequired(),
    };
  },

  fill(form: PDFForm, name: string, value: string) {
    // TODO: harmonize the option ids between pdf-lib and the API at ingestion time
    try {
      const field = form.getRadioGroup(name);
      field.select(value);
    } catch (error: any) {
      // This logic should work even if pdf-lib misidentifies the field type
      // TODO: radioParent should contain the name, not the id
      const [radioParent, radioChild] = value.split('.');
      if (radioChild) {
        // TODO: resolve import failure when spaces are present in name, id
        const radioChildWithSpace = radioChild.replace('_', ' ');
        const field = form.getField(name);
        const acroField = field.acroField;
        acroField.dict.set(PDFName.of('V'), PDFName.of(radioChildWithSpace));
        const kids = createPDFAcroFields(acroField.Kids()).map(_ => _[0]);
        kids.forEach(kid => {
          kid.dict.set(PDFName.of('AS'), PDFName.of(radioChildWithSpace));
        });
      }
    }
  },
};

const FIELD_HANDLERS: ReadonlyArray<FieldHandler<any>> = [
  textFieldHandler,
  checkBoxHandler,
  dropdownHandler,
  optionListHandler,
  radioGroupHandler,
] as const;

/**
 * Extracts field data from a PDF field.
 * Adapts pdf-lib fields to our internal DocumentFieldValue type.
 */
export const extractField = (field: PDFField): DocumentFieldValue => {
  const handler = FIELD_HANDLERS.find(h => h.isInstance(field));
  return handler
    ? handler.extract(field)
    : {
        type: 'not-supported',
        name: field.getName(),
        error: `unsupported type: ${field.constructor.name}`,
      };
};

/**
 * Fills a PDF form field with a value.
 * Adapts our internal values to pdf-lib form operations.
 */
export const fillField = (
  form: PDFForm,
  fieldType: PDFFieldType,
  name: string,
  value: any
) => {
  // Handle special cases that don't have handlers
  if (fieldType === 'Paragraph' || fieldType === 'RichText') {
    return; // do nothing
  }

  if (fieldType === 'Attachment') {
    // Attachment uses dropdown logic
    const field = form.getDropdown(name);
    field.select(value);
    return;
  }

  const handler = FIELD_HANDLERS.find(h => h.type === fieldType);
  if (!handler) {
    throw new Error(`Unknown field type: ${fieldType}`);
  }
  handler.fill(form, name, value);
};
