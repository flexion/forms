import * as z from 'zod';

import * as r from '@flexion/forms-common';

import { type FormError, type FormErrors, type Pattern } from '../index.js';

/**
 * Safely parses an unknown object using the provided Zod schema.
 */
export const safeZodParse = <T extends Pattern>(
  schema: z.Schema,
  obj: unknown
): r.Result<T['data'], z.ZodError> => {
  const result = schema.safeParse(obj);
  if (result.success) {
    return r.success(result.data);
  } else {
    return r.failure(result.error);
  }
};

/**
 * Safely parses an object against a given Zod schema and converts potential parsing errors into a FormError.
 */
export const safeZodParseToFormError = <T extends Pattern>(
  schema: z.Schema,
  obj: unknown
): r.Result<T['data'], FormError> => {
  const result = schema.safeParse(obj);
  if (result.success) {
    return r.success(result.data);
  } else {
    const error = convertZodErrorToFormError(result.error);
    return r.failure(error);
  }
};

/**
 * Parses and validates an object against a given Zod schema, ensuring safe handling of errors,
 * and converts validation errors into a form-friendly error structure.
 */
export const safeZodParseFormErrors = <Schema extends z.Schema>(
  schema: Schema,
  obj: unknown
): r.Result<z.infer<Schema>, FormErrors> => {
  const result = safeZodParse(schema, obj);
  if (result.success) {
    return r.success(result.data);
  } else {
    const formErrors = convertZodErrorToFormErrors(result.error);
    return r.failure(formErrors);
  }
};

/**
 * Converts a ZodError into a structured set of form errors.
 */
export const convertZodErrorToFormErrors = (
  zodError: z.ZodError
): FormErrors => {
  const formErrors: FormErrors = {};
  zodError.issues.forEach((error: z.ZodIssue) => {
    const path = error.path.join('.');
    if (error.code === 'too_small' && error.minimum === 1) {
      // Replace default Zod message with consistent custom message
      const message =
        error.message === 'String must contain at least 1 character(s)' ||
        error.message.startsWith('Too small')
          ? 'String must contain at least 1 character(s)'
          : error.message;
      formErrors[path] = {
        type: 'required',
        message,
      };
    } else {
      formErrors[path] = {
        type: 'custom',
        message: error.message,
      };
    }
  });
  return formErrors;
};

/**
 * Converts a ZodError into a FormError object.
 */
const convertZodErrorToFormError = (zodError: z.ZodError): FormError => {
  return {
    type: 'custom',
    message: zodError.issues
      .map((error: z.ZodIssue) => error.message)
      .join(', '),
  };
};
