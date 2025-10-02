import { promises as fs } from 'fs';
import { Command } from 'commander';

import { commands } from '@flexion/forms-infra-core';
import { type Context } from './types.js';
import { createFormService, createFormsRepository, defaultFormConfig, parsePdf } from '@flexion/forms-core';
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
        parsePdf,
      });
    });

  cmd
    .command('import-pdf')
    .description('Intialize a new form by importing a PDF file')
    .argument('<string>', 'Source PDF file for form.')
    .action(async inputFile => {
      const maybeForm = await parsePdf(inputFile);
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
