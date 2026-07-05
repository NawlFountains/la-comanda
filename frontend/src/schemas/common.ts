import { z } from "zod"

export const idSchema = z.uuid()
export const priceSchema = z.number().positive("Price must be greater than 0")
export const decimalStringSchema = z
	.string()
	.min(1, "This field is required")
	.refine((val) => !isNaN(Number(val)), { message: "Must be a valid number" })
	.refine((val) => Number(val) >= 0, { message: "Must be zero or greater" })

