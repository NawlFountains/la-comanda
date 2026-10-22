import { z } from "zod"
import { idSchema } from '../schemas/common'

const ORDER_STATUSES = ['pending', 'delivered', 'confirmed', 'cancelled'] as const

export const orderItemSchema = z.object({
	product_id: idSchema,
	quantity: z.number("common.errors.mustBeNumber").int("common.errors.mustBeInteger").positive("common.errors.mustBePositive")
})

export const orderCreateSchema = z.object({
	customer_id: idSchema,
	status: z.enum(ORDER_STATUSES, { error: "common.errors.invalidStatus" }),
	order_items: z.array(orderItemSchema).min(1, "common.errors.mustIncludeItem")
})

export const orderUpdateSchema = z.object({
	status: z.enum(ORDER_STATUSES, { error: "common.errors.invalidStatus" })
})

export type OrderCreateData = z.infer<typeof orderCreateSchema>
export type OrderItemCreateData = z.infer<typeof orderItemSchema>
export type OrderUpdateData = z.infer<typeof orderUpdateSchema>

export type OrderErrors = Partial<Record<keyof OrderCreateData, string>>
