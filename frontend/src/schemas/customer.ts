import { z } from 'zod'

export const customerCreateSchema = z.object({
	name: z.string().min(1, "common.errors.required").max(100, "common.errors.maxLength"),
	phone: z.e164("customers.errors.invalidPhoneNumber"),
})

export const customerUpdateSchema = customerCreateSchema.partial()

export type CustomerCreateData = z.infer<typeof customerCreateSchema>
export type CustomerUpdateData= z.infer<typeof customerUpdateSchema>


export type CustomerErrors = Partial<Record<keyof CustomerCreateData, string>>
