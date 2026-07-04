import { z } from "zod"

export const productCreateSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductCreateData = z.infer<typeof productCreateSchema>
export type ProductUpdateData= z.infer<typeof productUpdateSchema>


export type ProductErrors = Partial<Record<keyof ProductCreateData, string>>
