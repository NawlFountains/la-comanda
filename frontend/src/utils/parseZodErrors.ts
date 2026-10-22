import { ZodError } from 'zod';
import i18n from '../i18n'

export function parseZodErrors<T extends Record<string, string | undefined>>(error: ZodError): T {
  const formErrors = {} as T;

  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T;
    
    if (field && !formErrors[field]) {
      const length = 'minimum' in issue
        ? issue.minimum
        : 'maximum' in issue
          ? issue.maximum
          : undefined
      formErrors[field] = i18n.t(issue.message, { length }) as T[keyof T];
    }
  }

  return formErrors;
}
