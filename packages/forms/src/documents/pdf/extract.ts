import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

import { stringToBase64 } from '../../util/base64.js';
import type { DocumentFieldMap } from '../types.js';
import { extractField } from './adapters/pdf-lib-fields.js';

export const getDocumentFieldData = async (
  pdfBytes: Uint8Array
): Promise<DocumentFieldMap> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const widgets = await getWidgets(pdfDoc);

  pdfDoc.catalog.set(
    PDFName.of('AcroForm'),
    pdfDoc.context.obj({
      Fields: widgets.map(widget => pdfDoc.context.getObjectRef(widget)), // array of widget refs
    })
  );

  const form = pdfDoc.getForm();
  const fields = form.getFields();

  return Object.fromEntries(
    fields.map(field => {
      return [stringToBase64(field.getName()), extractField(field)];
    })
  );
};

// TODO: copied from pdf-lib acrofield internals, check if it's already exposed outside of acroform somewhere
const getWidgets = async (pdfDoc: PDFDocument): Promise<PDFDict[]> => {
  return pdfDoc.context
    .enumerateIndirectObjects()
    .map(([, obj]) => obj)
    .filter(
      obj =>
        obj instanceof PDFDict &&
        obj.get(PDFName.of('Type')) === PDFName.of('Annot') &&
        obj.get(PDFName.of('Subtype')) === PDFName.of('Widget')
    )
    .map(obj => obj as PDFDict);
};
