import { z } from "zod"
import { decimalStringSchema } from "./common"

export const itemCreateSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	unit: z.string().min(1, "Unit is required"),
	current_stock: decimalStringSchema,
	low_stock_threshold: decimalStringSchema,
	notes: z.string().nullable().optional()
})

export const itemUpdateSchema = itemCreateSchema.partial()

export type ItemCreateData = z.infer<typeof itemCreateSchema>
export type ItemUpdateData= z.infer<typeof itemUpdateSchema>


export type ItemErrors = Partial<Record<keyof ItemCreateData, string>>
