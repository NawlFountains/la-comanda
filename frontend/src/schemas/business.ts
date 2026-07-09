import { z } from "zod"

export const businessCreateSchema = z.object({
	name: z.string().min(1, "Business name is required").max(100),
	phone: z.string().optional()
})

export type BusinessCreateData = z.infer<typeof businessCreateSchema> 

export type BusinessErrors = Partial<Record<keyof BusinessCreateData, string>>
