import { z } from "zod"

export const loginSchema = z.object({
	email: z.email("common.errors.invalidEmail"),
	password: z.string().min(6, "common.errors.minLength")
})

export const registerSchema = z.object({
	email: z.email("common.errors.invalidEmail"),
	password: z.string().min(6, "common.errors.minLength"),
	confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
	    message: "common.errors.passwordsDontMatch",
    path: ["confirmPassword"]
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>

export type LoginErrors = Partial<Record<keyof LoginFormData, string>>
export type RegisterErrors = Partial<Record<keyof RegisterFormData, string>>
