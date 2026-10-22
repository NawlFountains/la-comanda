import { z } from "zod"

export const idSchema = z.uuid("common.errors.invalidId")
export const priceSchema = z.number("common.errors.mustBeNumber").positive("common.errors.mustBePositive")
export const decimalStringSchema = z
	.string()
	.min(1, "common.errors.required")
	.refine((val) => !isNaN(Number(val)), { message: "common.errors.mustBeNumber" })
	.refine((val) => Number(val) >= 0, { message: "common.errors.mustBeNonNegative" })

