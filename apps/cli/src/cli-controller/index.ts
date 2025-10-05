import { Command } from 'commander';

import { addE2eCommands } from './e2e.js';
import { addFormCommands } from './forms.js';
import { addSecretCommands } from './secrets.js';
import type { Context } from './types.js';

export const CliController = (ctx: Context) => {
  const cli = new Command().description(
    'CLI to interact with the Forms workspace'
  );

  cli
    .command('hello')
    .description('say hello')
    .action(() => {
      ctx.console.log('Hello!');
    });

  addFormCommands(ctx, cli);
  addSecretCommands(ctx, cli);
  addE2eCommands(ctx, cli);

  return cli;
};
