import * as z from 'zod';
import { type PhoneNumberProps } from '../../components.js';
import { type Pattern, type PatternConfig } from '../../pattern.js';
import { getFormSessionError, getFormSessionValue } from '../../session.js';
import {
  safeZodParseFormErrors,
  safeZodParseToFormError,
} from '../../util/zod.js';

const configSchema = z.object({
  label: z.string().min(1),
  required: z.boolean(),
  hint: z.string().optional(),
});

export type PhoneNumberPattern = Pattern<z.infer<typeof configSchema>>;

export type PhoneNumberPatternOutput = z.infer<
  ReturnType<typeof createPhoneSchema>
>;

export const createPhoneSchema = (data: PhoneNumberPattern['data']) => {
  const phoneSchema = z
    .string()
    .superRefine((value, ctx) => {
      // Allow empty string if not required
      if (value === '' && !data.required) {
        return;
      }

      // Validate format
      if (!/^(\d{3}-\d{3}-\d{4}|\d{10})$/.test(value)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid phone number format',
        });
        return;
      }

      // Validate length
      const digits = value.replace(/[^\d]/g, '');
      if (digits.length !== 10) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid phone number format',
        });
      }
    })
    .transform(value => {
      if (value === '') {
        return value;
      }
      const digits = value.replace(/[^\d]/g, '');
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    });

  return phoneSchema;
};

export const phoneNumberConfig: PatternConfig<
  PhoneNumberPattern,
  PhoneNumberPatternOutput
> = {
  displayName: 'Phone number',
  iconPath: 'phone-icon.svg',
  initial: {
    label: 'Phone number',
    required: false,
    hint: 'Enter a 10-digit U.S. phone number, e.g., 999-999-9999',
  },

  parseUserInput: (pattern, inputValue) => {
    return safeZodParseToFormError(createPhoneSchema(pattern.data), inputValue);
  },

  parseConfigData: obj => {
    return safeZodParseFormErrors(configSchema, obj);
  },
  getChildren() {
    return [];
  },

  createPrompt(_, session, pattern) {
    const sessionValue = getFormSessionValue(session, pattern.id);
    const sessionError = getFormSessionError(session, pattern.id);

    return {
      props: {
        _patternId: pattern.id,
        type: 'phone-number',
        label: pattern.data.label,
        phoneId: pattern.id,
        required: pattern.data.required,
        hint: pattern.data.hint,
        value: sessionValue,
        error: sessionError,
      } as PhoneNumberProps,
      children: [],
    };
  },
};
