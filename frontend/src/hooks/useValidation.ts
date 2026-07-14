import { useState, useCallback } from 'react'
import { ZodError } from 'zod';
import { ZodType } from 'zod';

function parseZodErrors<T extends Record<string, string| undefined>>(error: ZodError): T {
  const formErrors = {} as T;

  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T;
    
    if (field && !formErrors[field]) {
      formErrors[field] = issue.message as T[keyof T];
    }
  }
  return formErrors;
}

export function useValidation<TErrors extends Record<string, string | undefined>>() {
	const [errors, setErrors] = useState<TErrors>({} as TErrors)

	const validate = useCallback(<T,>(schema: ZodType<T>, data: T): boolean => {
		const result = schema.safeParse(data)
		if (!result.success) {
			setErrors(parseZodErrors<TErrors>(result.error))
			return false
		}
		setErrors({} as TErrors)
		return true
	}, [])

	const clearErrors = useCallback(() => setErrors({} as TErrors), [])
	return { errors, validate, clearErrors }
}
