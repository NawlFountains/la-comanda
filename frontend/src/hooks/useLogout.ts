import { useState } from 'react'
import { supabase } from '../supabase/supabaseClient'
import { useRevalidator } from 'react-router-dom'

export default function useLogout() {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const revalidator = useRevalidator()

	async function handleLogout () {
		setLoading(true)
		const { error } = await supabase.auth.signOut()

		if (error) {
			setError(error.message)
		}
		revalidator.revalidate()
		setLoading(false)
	}

	return {
		loading,
		error,
		handleLogout
	}
}
