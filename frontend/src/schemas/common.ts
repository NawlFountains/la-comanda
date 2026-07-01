import { z } from "zod"

export const idSchema = z.string().uuid()
export const priceSchema = z.number().positive("Price must be greater than 0")
