import { useState, useCallback } from 'react'
import type { ZodType } from 'zod'
import { parseZodErrors } from '../utils/parseZodErrors'

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
