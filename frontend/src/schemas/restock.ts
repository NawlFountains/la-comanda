import { z } from "zod"
import { idSchema } from '../schemas/common'

export const restockItemSchema = z.object({
	item_id: idSchema,
	quantity: z.number("common.errors.mustBeNumber").positive("common.errors.mustBePositive")
})

export const restockCreateSchema = z.object({
	restock_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
		message: "common.errors.invalidDate"
	}),
	supplier: z.string().min(1, "common.errors.required").max(100, "common.errors.maxLength"),
	notes: z.string().nullable().optional(),
	restock_items: z.array(restockItemSchema).min(1, "common.errors.mustIncludeItem")
})

export const restockUpdateSchema = restockCreateSchema.omit({ restock_items: true })

export type RestockCreateData = z.infer<typeof restockCreateSchema>
export type RestockItemCreateData = z.infer<typeof restockItemSchema>
export type RestockUpdateData= z.infer<typeof restockUpdateSchema>

export type RestockErrors = Partial<Record<keyof RestockCreateData, string>>
