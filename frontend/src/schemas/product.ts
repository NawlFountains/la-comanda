import { z } from "zod"

export const productCreateSchema = z.object({
	name: z.string().min(1, "common.errors.required").max(100, "common.errors.maxLength"),
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductCreateData = z.infer<typeof productCreateSchema>
export type ProductUpdateData= z.infer<typeof productUpdateSchema>


export type ProductErrors = Partial<Record<keyof ProductCreateData, string>>
