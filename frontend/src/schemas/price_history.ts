import { z } from "zod"
import { decimalStringSchema } from './common'

export const priceHistoryCreateSchema = z.object({
	price: decimalStringSchema,
	valid_from: z.string().date('Enter a valid date') 
})

export type PriceHistoryCreateData = z.infer<typeof priceHistoryCreateSchema>

export type PriceHistoryErrors = Partial<Record<keyof PriceHistoryCreateData, string>>
