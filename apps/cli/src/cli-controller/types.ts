import type { FormService } from "@flexion/forms-core";
import type { DatabaseContext } from "@flexion/forms-database";

export type Context = {
  console: Console;
  workspaceRoot: string;
  file?: string;
  db?: DatabaseContext;
  forms?: FormService;
};
