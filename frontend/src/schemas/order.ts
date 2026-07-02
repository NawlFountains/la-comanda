import { z } from "zod"
import { idSchema } from '../schemas/common'

const ORDER_STATUSES = ['pending', 'delivered', 'confirmed', 'cancelled'] as const

export const orderItemSchema = z.object({
	product_id: idSchema,
	quantity: z.number().int("Must be a integer").positive("Quantity must be greater than 0")
})

export const orderCreateSchema = z.object({
	customer_id: idSchema,
	status: z.enum(ORDER_STATUSES),
	order_items: z.array(orderItemSchema).min(1, "Must include at least one item")
})

export const orderUpdateSchema = z.object({
	status: z.enum(ORDER_STATUSES)
})

export type OrderCreateData = z.infer<typeof orderCreateSchema>
export type OrderUpdateData = z.infer<typeof orderUpdateSchema>

export type OrderErrors = Partial<Record<keyof OrderCreateData, string>>
