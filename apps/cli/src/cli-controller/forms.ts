import { promises as fs } from 'fs';
import { Command } from 'commander';

import { type Context } from './types.js';
import { createFormService, defaultFormConfig, parsePdf as parsePdfCore } from '@flexion/forms-core';
import { createFormsRepository } from '@flexion/forms-core/repository';
import { createTestPdfParser } from '@flexion/forms-core/documents/pdf/context';
import { createFilesystemDatabaseContext } from '@flexion/forms-database/context';

export const addFormCommands = (ctx: Context, cli: Command) => {
  const cmd = cli
    .command('forms')
    .description('form management commands')
    .option('-d, --database <string>', 'Path to the dev sqlite3 database file. (Postgres currently not wired up.)', async databasePath => {
      ctx.db = await createFilesystemDatabaseContext(databasePath);
      const repository = createFormsRepository({ db: ctx.db, formConfig: defaultFormConfig });
      ctx.forms = createFormService({
        repository,
        isUserLoggedIn: () => true,
        config: defaultFormConfig,
        parser: createTestPdfParser(), // Use test parser with filesystem cache for CLI
      });
    });

  cmd
    .command('import-pdf')
    .description('Intialize a new form by importing a PDF file')
    .argument('<string>', 'Source PDF file for form.')
    .action(async inputFile => {
      // For standalone import-pdf command, use test parser with caching
      const parser = createTestPdfParser();
      const pdfBytes = await fs.readFile(inputFile);
      const maybeForm = await parsePdfCore({ parser, formConfig: defaultFormConfig }, pdfBytes);
      if (maybeForm === undefined) {
        console.error('Error parsing PDF file:', inputFile);
        return;
      }
      console.log(JSON.stringify(maybeForm, null, 2));
    });

  cmd
    .command('add')
    .description('add a form')
    .argument('<string>', 'Source JSON file for form.')
    .action(async inputFile => {
      const fileContents = await fs.readFile(inputFile);
      const fileName = inputFile.split(/[\\/]/).pop() ?? inputFile;
      const result = await ctx.forms?.initializeForm({
        summary: {
          title: `Imported Form: ${fileName}`,
          description: 'Form imported from PDF',
        },
        document: {
          fileName: inputFile,
          data: fileContents.toString('base64')
        },
      });
      console.log(result);
    });
};
