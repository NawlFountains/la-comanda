import { z } from "zod"
import { idSchema } from '../schemas/common'

export const restockItemSchema = z.object({
	item_id: idSchema,
	quantity: z.number().positive("Quantity must be greater than 0")
})

export const restockCreateSchema = z.object({
	restock_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
		message: "Invalid date"
	}),
	supplier: z.string().min(1, "Supplier name is required").max(100),
	notes: z.string().nullable().optional(),
	restock_items: z.array(restockItemSchema).min(1, "Must include at least one item")
})

export const restockUpdateSchema = restockCreateSchema.omit({ restock_items: true })

export type RestockCreateData = z.infer<typeof restockCreateSchema>
export type RestockItemCreateData = z.infer<typeof restockItemSchema>
export type RestockUpdateData= z.infer<typeof restockUpdateSchema>

export type RestockErrors = Partial<Record<keyof RestockCreateData, string>>
