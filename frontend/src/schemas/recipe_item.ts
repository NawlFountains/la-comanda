import { z } from "zod"
import { decimalStringSchema, idSchema } from './common'

export const recipeItemCreateSchema = z.object({
	item_id: idSchema,
	quantity: decimalStringSchema,
	unit: z.string().min(1, 'Unit is required')
})

export const recipeItemUpdateSchema = recipeItemCreateSchema.partial()

export type RecipeItemCreateData = z.infer<typeof recipeItemCreateSchema>
export type RecipeItemUpdateData = z.infer<typeof recipeItemUpdateSchema>

export type RecipeItemErrors = Partial<Record<keyof RecipeItemCreateData, string>>
