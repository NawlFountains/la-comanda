import { z } from 'zod'

export const customerCreateSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	phone: z.e164("Enter a valid phone number"),
})

export const customerUpdateSchema = customerCreateSchema.partial()

export type CustomerCreateData = z.infer<typeof customerCreateSchema>
export type CustomerUpdateData= z.infer<typeof customerUpdateSchema>


export type CustomerErrors = Partial<Record<keyof CustomerCreateData, string>>
