import { z } from "zod"
import { idSchema } from '../schemas/common'

export const restockItemSchema = z.object({
	item_id: idSchema,
	quantity: z.number().positive("Quantity must be greater than 0")
})

export const restockCreateSchema = z.object({
	restock_date: z.coerce.date({ message: "Please select a valid date" }),
	supplier: z.string().min(1, "Supplier name is required").max(100),
	notes: z.string().nullable().optional(),
	restock_items: z.array(restockItemSchema).min(1, "Must include at least one item")
})

export const restockUpdateSchema = restockCreateSchema.partial()

export type RestockCreateData = z.infer<typeof restockCreateSchema>
export type RestockUpdateData= z.infer<typeof restockUpdateSchema>

export type RestockErrors = Partial<Record<keyof RestockCreateData, string>>
