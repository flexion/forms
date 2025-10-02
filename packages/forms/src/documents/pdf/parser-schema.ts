import { z } from 'zod';

const FormSummary = z.object({
  title: z.string().describe('Title of the form'),
  description: z.string().describe('Brief description of the form purpose'),
});

const TxInput = z.object({
  component_type: z.literal('text_input'),
  id: z.string().describe('Exact field ID from PDF metadata'),
  label: z.string().describe('User-friendly field label'),
  default_value: z.string().optional().describe('Default value if any'),
  required: z.boolean().default(false).describe('Whether field is required'),
});

const Checkbox = z.object({
  component_type: z.literal('checkbox'),
  id: z.string().describe('Exact field ID from PDF metadata'),
  label: z.string().describe('User-friendly checkbox label'),
  default_checked: z
    .boolean()
    .default(false)
    .describe('Whether checked by default'),
});

const RadioGroupOption = z.object({
  id: z.string().describe('Option identifier'),
  label: z.string().describe('Option label'),
  name: z.string().describe('Radio group name'),
  default_checked: z
    .boolean()
    .default(false)
    .describe('Whether selected by default'),
});

const RadioGroup = z.object({
  component_type: z.literal('radio_group'),
  id: z.string().describe('Group identifier'),
  legend: z.string().describe('Legend/label for the radio group'),
  options: z.array(RadioGroupOption).describe('Radio button options'),
});

const Paragraph = z.object({
  component_type: z.literal('paragraph'),
  text: z.string().describe('Plain text content for instructions or context'),
});

const RichText = z.object({
  component_type: z.literal('rich_text'),
  text: z.string().describe('Rich text content (markdown supported)'),
});

const FieldsetField = z.discriminatedUnion('component_type', [
  TxInput,
  Checkbox,
]);

const Fieldset = z.object({
  component_type: z.literal('fieldset'),
  legend: z.string().describe('Legend for the grouped fields'),
  fields: z.array(FieldsetField).describe('Fields within this fieldset'),
});

const Element = z.discriminatedUnion('component_type', [
  TxInput,
  Checkbox,
  RadioGroup,
  Paragraph,
  RichText,
  Fieldset,
]);

const Page = z.object({
  title: z
    .string()
    .describe('Short, descriptive page title for navigation (plain language)'),
  elements: z
    .array(Element)
    .describe('Elements on this page in display order'),
});

export const ExtractedObject = z.object({
  form_summary: FormSummary.describe('High-level form summary'),
  pages: z
    .array(Page)
    .describe('Pages in the guided interview, in order'),
});

export type ExtractedObject = z.infer<typeof ExtractedObject>;
