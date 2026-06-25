import { useState } from 'react'
import { useNavigate, useRevalidator } from 'react-router-dom'
import { supabase } from '../supabase/supabaseClient'

export function useLogin() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [errors, setErrors] = useState<{ email?: string, password?: string }>({})
	const navigate = useNavigate()
	const revalidator = useRevalidator()

	function validate() {

		const newErrors: { email?: string, password?: string } = {}
		
		// TODO more validations required
		if (!email.trim()) {
		    newErrors.email = 'Email is required'
		} 

		if (!password.trim()) {
		    newErrors.password = 'Password is required'
		} 
		setErrors(newErrors)
		return Object.keys(newErrors).length == 0
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
