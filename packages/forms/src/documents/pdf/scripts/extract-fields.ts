#!/usr/bin/env node
import { readFileSync } from 'fs';
import { getDocumentFieldData } from '../extract.js';

async function main() {
  const pdfPath =
    process.argv[2] ||
    'packages/forms/sample-documents/doj-pardon-marijuana/demo-application_for_certificate_of_pardon_for_simple_marijuana_possession.pdf';
  const pdfBytes = readFileSync(pdfPath);
  const fields = await getDocumentFieldData(new Uint8Array(pdfBytes));

  // Print radio groups only
  const radioGroups = Object.entries(fields).filter(
    ([_, field]) => field.type === 'RadioGroup'
  );
  console.log('Radio Groups:', radioGroups.length);
  radioGroups.forEach(([name, field]) => {
    if (field.type === 'RadioGroup') {
      console.log(`\n${name}:`);
      console.log(`  type: ${field.type}`);
      console.log(`  label: ${field.label}`);
      console.log(`  name: ${field.name}`);
      console.log(`  options:`, JSON.stringify(field.options, null, 4));
    }
  });
}

main().catch(console.error);
