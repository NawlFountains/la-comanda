import { useState } from 'react'
import { useNavigate, useRevalidator } from 'react-router-dom'
import { supabase } from '../supabase/supabaseClient'
import { registerSchema , type RegisterErrors} from '../schemas/auth'
import { businessCreateSchema, type BusinessErrors } from '../schemas/business'
import {parseZodErrors} from '../utils/parseZodErrors'
import { createBusiness } from '../api/business'
import type {CreateBusinessPayload} from '../types'

export function useRegister() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [name, setName] = useState('')
	const [phone, setPhone] = useState('')
	const [loading, setLoading] = useState(false)
	const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({})
	const [businessErrors, setBusinessErrors] = useState<BusinessErrors>({})
	const navigate = useNavigate()
	const revalidator = useRevalidator()

	function validate() {
		const resultRegister = registerSchema.safeParse({ email, password, confirmPassword })
		const resultBusiness = businessCreateSchema.safeParse({ name, phone })
		if (!resultRegister.success) {

			const newLoginErrors: RegisterErrors = parseZodErrors<RegisterErrors>(resultRegister.error)
			setRegisterErrors(newLoginErrors)
			return false
		}
		if (!resultBusiness.success) {
			const newBusinessErrors: BusinessErrors = parseZodErrors<BusinessErrors>(resultBusiness.error)
			
			setBusinessErrors(newBusinessErrors)
			return false
		}

		setRegisterErrors({})
		setBusinessErrors({})
		return true
	}


	async function handleRegister() {
		if (!validate()) return

		setLoading(true)

		const { data, error } = await supabase.auth.signUp({ email, password })
		if (error) {
			setRegisterErrors({email: error.message})
		}

		if (data.session) {
			revalidator.revalidate()
			const businessData: CreateBusinessPayload = {name, phone}
			try {
				await createBusiness(data.session.access_token, businessData)
				navigate('/dashboard', { replace: true } )
			} catch (err){
				setBusinessErrors({ name: err instanceof Error ? err.message : 'Unknown error' })
			}
		}
		setLoading(false)
	}
	return {
		email,
		setEmail,
		password,
		setPassword,
		confirmPassword,
		setConfirmPassword,
		name,
		setName,
		phone,
		setPhone,
		loading,
		registerErrors,
		businessErrors,
		handleRegister
	}
}
