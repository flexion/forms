#!/usr/bin/env node
/**
 * Script to parse a PDF using AWS Bedrock and save the response to a JSON file.
 *
 * Usage:
 *   tsx packages/forms/src/documents/pdf/scripts/parse-pdf-with-bedrock.ts <pdf-path> <output-json-path>
 *
 * Example:
 *   tsx packages/forms/src/documents/pdf/scripts/parse-pdf-with-bedrock.ts \
 *     packages/forms/src/documents/__tests__/sample-data/doj-pardon-marijuana/demo-application_for_certificate_of_pardon_for_simple_marijuana_possession.pdf \
 *     output.json
 */

import { readFile, writeFile } from 'fs/promises';
import { createBedrockParser } from '../adapters/bedrock-parser.js';
import { extractFieldMetadata } from '../domain/field-extractor.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      'Usage: tsx parse-pdf-with-bedrock.ts <pdf-path> <output-json-path>'
    );
    process.exit(1);
  }

  const [pdfPath, outputPath] = args;

  console.log(`Reading PDF from: ${pdfPath}`);
  const pdfBytes = await readFile(pdfPath);

  console.log('Extracting field metadata...');
  const metadataResult = await extractFieldMetadata(new Uint8Array(pdfBytes));

  if (!metadataResult.success) {
    console.error('Failed to extract metadata:', metadataResult.error);
    process.exit(1);
  }

  console.log(`Found ${metadataResult.data.length} fields`);
  console.log('Invoking Bedrock...');
  const startTime = Date.now();

  const parser = createBedrockParser();
  const result = await parser.parse(
    new Uint8Array(pdfBytes),
    metadataResult.data
  );

  const duration = Date.now() - startTime;
  console.log(`Bedrock invocation completed in ${duration}ms`);

  if (!result.success) {
    console.error('Parsing failed:', result.error);
    process.exit(1);
  }

  console.log(`Writing output to: ${outputPath}`);
  await writeFile(outputPath, JSON.stringify(result.data, null, 2), 'utf-8');

  console.log('✓ Success!');
  console.log(`\nOutput saved to: ${outputPath}`);
  console.log(`Duration: ${duration}ms`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
