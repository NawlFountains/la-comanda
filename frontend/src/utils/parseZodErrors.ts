import { ZodError } from 'zod';

export function parseZodErrors<T extends Record<string, string>>(error: ZodError): T {
  const formErrors = {} as T;

  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T;
    
    if (field && !formErrors[field]) {
      formErrors[field] = issue.message as T[keyof T];
    }
  }

  return formErrors;
}
