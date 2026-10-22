import { z } from "zod"

export const businessCreateSchema = z.object({
	name: z.string().min(1, "common.errors.required").max(100, "common.errors.maxLength"),
	phone: z.string().optional()
})

export type BusinessCreateData = z.infer<typeof businessCreateSchema> 

export type BusinessErrors = Partial<Record<keyof BusinessCreateData, string>>
