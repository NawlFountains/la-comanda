import { useState } from 'react'
import { useNavigate, useRevalidator } from 'react-router-dom'
import { supabase } from '../supabase/supabaseClient'
import { loginSchema, type LoginErrors } from '../schemas/auth'
import {parseZodErrors} from '../utils/parseZodErrors'

export function useLogin() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [errors, setErrors] = useState<LoginErrors>({})
	const navigate = useNavigate()
	const revalidator = useRevalidator()

	function validate() {
		const result = loginSchema.safeParse({ email, password })
		if (!result.success) {
			const newErrors: LoginErrors = parseZodErrors<LoginErrors>(result.error)
			setErrors(newErrors)
			return false
		}
		setErrors({})
		return true
	}


	async function handleLogin() {
		if (!validate()) return

		setLoading(true)

		const { data, error } = await supabase.auth.signInWithPassword({ email, password })
		if (error) {
			setErrors({email: error.message})
		}

		if (data.session) {
			revalidator.revalidate()
			navigate('/dashboard', { replace: true } )
		}
		setLoading(false)
	}
	return {
		email,
		setEmail,
		password,
		setPassword,
		loading,
		errors,
		handleLogin
	}
}
